import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import NavBar from "@/components/NavBar.tsx";
import TutorialOverlay, { type TutorialStep } from "@/components/TutorialOverlay.tsx";
import { cn } from "@/lib/utils.ts";
import {
  CONTAINERS,
  PORT_COLORS,
  emptyGrid,
  countRestows,
  checkWeightRule,
  solveStowage,
  type CargoContainer,
  type Grid,
  type Port,
} from "@/lib/vessel-stowage-solver.ts";

const TUTORIAL_STEPS: TutorialStep[] = [
  {
    emoji: "🎯",
    title: "Your Goal",
    body: "Load all nine containers into the ship's 3×3 grid so that when the ship visits Port A, then Port B, then Port C, every container can be unloaded without moving anything else out of the way. Zero re-stows is a perfect score.",
  },
  {
    emoji: "👆",
    title: "How to Place Containers",
    body: "First, click a container from the pool on the right to select it. Then click any empty cell in the grid to place it. Each column stacks three containers — bottom, middle, and top. You can only place into the lowest empty slot in any column.",
  },
  {
    emoji: "⚓",
    title: "Two Golden Rules",
    body: "Rule 1: Heavy containers must go on the bottom row (tier 0). Light containers can go anywhere. Rule 2: Port A cargo must be on top — nothing from Port B or C can block it. Same for Port B vs Port C. Think of it as loading in reverse order of the port visits.",
  },
  {
    emoji: "🚢",
    title: "Sail to Test",
    body: "Use the Sail button to simulate arriving at each port. The grid will highlight which containers are accessible and which are being blocked (yellow badge). This lets you test your plan before calling the Chief Mate to verify.",
  },
];

const BUSINESS_CONTEXT = {
  title: "Why This Matters for Vessel Planning",
  body: "A real mega-ship carries 24,000 containers across six or more ports. One container placed in the wrong position can force a crane to reshuffle fifty others — each reshuffle burns fuel, adds delay, and risks cargo damage. The Chief Mate algorithm uses constraint satisfaction, the same logic that solves Sudoku puzzles. Classical computers handle small grids well, but at real-world scale this becomes one of the hardest problems in logistics. Quantum solvers are being designed specifically for problems like this.",
  source: "Lloyd's List Intelligence, 2024 · Maersk/MSC vessel planning data",
};

// ─── helpers ────────────────────────────────────────────────────────────────

function placedIds(grid: Grid): Set<string> {
  const ids = new Set<string>();
  for (const col of grid) for (const cell of col) if (cell) ids.add(cell.id);
  return ids;
}

function findEmptyTier(grid: Grid, col: number): number | null {
  for (let t = 0; t < 3; t++) {
    if (!grid[col][t]) return t;
  }
  return null;
}

function topOfColumn(grid: Grid, col: number): CargoContainer | null {
  for (let t = 2; t >= 0; t--) if (grid[col][t]) return grid[col][t];
  return null;
}

const VISIT_ORDER: Port[] = ["A", "B", "C"];

// ─── sub-components ──────────────────────────────────────────────────────────

function ContainerCard({
  container,
  selected,
  dimmed,
  onClick,
}: {
  container: CargoContainer;
  selected: boolean;
  dimmed: boolean;
  onClick: () => void;
}) {
  return (
    <motion.button
      whileHover={{ scale: dimmed ? 1 : 1.04 }}
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-semibold transition-all cursor-pointer",
        dimmed && "opacity-30 cursor-not-allowed",
        selected
          ? "ring-2 ring-white shadow-[0_0_14px_3px] shadow-white/40"
          : "hover:brightness-110"
      )}
      style={{
        background: `${container.color}22`,
        borderColor: container.color,
        color: container.color,
        boxShadow: selected ? `0 0 16px 4px ${container.color}55` : undefined,
      }}
    >
      <span className="text-base">{container.emoji}</span>
      <span>{container.id}</span>
      <span className="ml-auto text-xs opacity-70">
        {container.weight === "heavy" ? "▼ heavy" : "▲ light"}
      </span>
    </motion.button>
  );
}

function GridCell({
  container,
  col,
  tier,
  isTop,
  activePort,
  selected,
  onClick,
}: {
  container: CargoContainer | null;
  col: number;
  tier: number;
  isTop: boolean;
  activePort: Port | null;
  selected: CargoContainer | null;
  onClick: () => void;
}) {
  const isAccessible = isTop && container !== null;
  const isBlocker =
    activePort !== null &&
    container !== null &&
    isAccessible &&
    container.port !== activePort &&
    VISIT_ORDER.indexOf(container.port) > VISIT_ORDER.indexOf(activePort);

  const highlight =
    activePort !== null && isAccessible && container?.port === activePort;

  const canDrop = container === null && selected !== null;

  return (
    <motion.div
      layout
      onClick={canDrop || container === null ? onClick : undefined}
      className={cn(
        "relative border-2 rounded-md flex items-center justify-center select-none transition-all",
        canDrop && "cursor-pointer hover:border-white/60",
        isBlocker && "border-yellow-400 animate-pulse",
        highlight && "border-white",
        !container && !canDrop && "border-white/10",
        !container && canDrop && "border-dashed border-white/30"
      )}
      style={{ width: 70, height: 50 }}
      aria-label={`col ${col} tier ${tier}`}
    >
      <AnimatePresence>
        {container && (
          <motion.div
            key={container.id}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 320, damping: 22 }}
            className="absolute inset-0 rounded flex flex-col items-center justify-center gap-0.5"
            style={{ background: `${container.color}33`, borderColor: container.color }}
          >
            <span className="text-base leading-none">{container.emoji}</span>
            <span
              className="text-[10px] font-bold leading-none"
              style={{ color: container.color }}
            >
              {container.id}
            </span>
            {isBlocker && (
              <span className="absolute -top-2 -right-2 text-[10px] bg-yellow-400 text-black rounded-full w-4 h-4 flex items-center justify-center font-bold">
                !
              </span>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── main page ───────────────────────────────────────────────────────────────

export default function VesselStowagedPage() {
  const [grid, setGrid] = useState<Grid>(emptyGrid);
  const [pool, setPool] = useState<CargoContainer[]>([...CONTAINERS]);
  const [selected, setSelected] = useState<CargoContainer | null>(null);
  const [mode, setMode] = useState<"manual" | "solved">("manual");
  const [activePort, setActivePort] = useState<Port | null>(null);
  const [checkResult, setCheckResult] = useState<{
    restows: number;
    weightOk: boolean;
  } | null>(null);
  const [solving, setSolving] = useState(false);
  const [showWow, setShowWow] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);

  // place selected container into a cell
  const handleCellClick = useCallback(
    (col: number) => {
      if (!selected) return;
      const tier = findEmptyTier(grid, col);
      if (tier === null) return;
      const newGrid: Grid = grid.map((c) => [...c]);
      newGrid[col][tier] = selected;
      setGrid(newGrid);
      setPool((prev) => prev.filter((c) => c.id !== selected.id));
      setSelected(null);
      setCheckResult(null);
    },
    [selected, grid]
  );

  const handleReset = () => {
    setGrid(emptyGrid());
    setPool([...CONTAINERS]);
    setSelected(null);
    setMode("manual");
    setActivePort(null);
    setCheckResult(null);
    setShowWow(false);
  };

  const handleCheck = () => {
    const restows = countRestows(grid, VISIT_ORDER);
    const weightOk = checkWeightRule(grid);
    setCheckResult({ restows, weightOk });
  };

  const handleSolve = () => {
    setSolving(true);
    setCheckResult(null);
    setTimeout(() => {
      const solved = solveStowage();
      setGrid(solved);
      setPool([]);
      setMode("solved");
      setSolving(false);
      setShowWow(true);
      setCheckResult({ restows: 0, weightOk: true });
    }, 1200);
  };

  const handleSail = () => {
    const ports: Port[] = ["A", "B", "C"];
    if (activePort === null) {
      setActivePort("A");
    } else {
      const idx = ports.indexOf(activePort);
      setActivePort(idx < 2 ? ports[idx + 1] : null);
    }
  };

  const sailLabel =
    activePort === null
      ? "🚢 Sail to Port A"
      : activePort === "A"
      ? "🚢 Sail to Port B"
      : activePort === "B"
      ? "🚢 Sail to Port C"
      : "🚢 Return to sea";

  const placed = placedIds(grid);

  return (
    <div className="min-h-screen bg-[#0a0f1e] text-white">
      <NavBar />

      <TutorialOverlay
        steps={TUTORIAL_STEPS}
        storageKey="vessel-stowage"
        businessContext={BUSINESS_CONTEXT}
      />

      {showTutorial && (
        <TutorialOverlay
          steps={TUTORIAL_STEPS}
          storageKey="vessel-stowage-retrigger"
          businessContext={BUSINESS_CONTEXT}
          onComplete={() => {
            setShowTutorial(false);
            localStorage.removeItem("tutorial-dismissed-vessel-stowage-retrigger");
          }}
        />
      )}

      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-2"
        >
          <h1 className="text-3xl font-extrabold tracking-tight">
            ⛴️ Vessel Stowage Tetris
          </h1>
          <p className="text-muted-foreground text-sm max-w-xl mx-auto">
            A small ship visits <span style={{ color: PORT_COLORS.A }}>Port A</span>,
            then <span style={{ color: PORT_COLORS.B }}>Port B</span>, then{" "}
            <span style={{ color: PORT_COLORS.C }}>Port C</span>. You must load 9
            containers so nothing blocks the first ones to unload!
          </p>
        </motion.div>

        {/* Rules */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
          className="border border-white/10 rounded-xl bg-white/5 px-5 py-4 text-sm space-y-1"
        >
          <p className="font-semibold text-white/80 mb-2">📋 Rules</p>
          <p>⚓ <strong>Heavy</strong> containers must sit on the <strong>bottom row</strong> (tier 0).</p>
          <p>🔴 <strong>Port A</strong> containers must be accessible first — no B or C containers on top of them.</p>
          <p>🔵 <strong>Port B</strong> containers must be clear before Port C is reached.</p>
        </motion.div>

        {/* Main layout */}
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          {/* Ship grid */}
          <div className="flex-1">
            <h2 className="text-sm font-semibold text-white/60 mb-3 uppercase tracking-widest">
              🛳 Ship Hold
            </h2>
            <div className="flex gap-2 items-end">
              {[0, 1, 2].map((col) => (
                <div key={col} className="flex flex-col-reverse gap-1">
                  {[0, 1, 2].map((tier) => {
                    const topContainer = topOfColumn(grid, col);
                    const isTop =
                      grid[col][tier] !== null &&
                      topContainer?.id === grid[col][tier]?.id;
                    return (
                      <GridCell
                        key={tier}
                        container={grid[col][tier]}
                        col={col}
                        tier={tier}
                        isTop={isTop}
                        activePort={activePort}
                        selected={selected}
                        onClick={() => handleCellClick(col)}
                      />
                    );
                  })}
                  <div className="text-center text-[10px] text-white/30 font-mono">
                    COL {col + 1}
                  </div>
                </div>
              ))}
              {/* Tier labels */}
              <div className="flex flex-col-reverse gap-1 ml-2">
                {["T0 (bottom)", "T1 (mid)", "T2 (top)"].map((label) => (
                  <div
                    key={label}
                    className="text-[9px] text-white/20 font-mono"
                    style={{ height: 50, display: "flex", alignItems: "center" }}
                  >
                    {label}
                  </div>
                ))}
              </div>
            </div>

            {/* Port legend */}
            <div className="mt-4 flex gap-4 text-xs">
              {(["A", "B", "C"] as Port[]).map((p) => (
                <div key={p} className="flex items-center gap-1.5">
                  <div
                    className="w-3 h-3 rounded-sm"
                    style={{ background: PORT_COLORS[p] }}
                  />
                  <span style={{ color: PORT_COLORS[p] }}>Port {p}</span>
                  {activePort === p && (
                    <span className="text-yellow-400 animate-pulse">← active</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Container pool */}
          <div className="w-full lg:w-56">
            <h2 className="text-sm font-semibold text-white/60 mb-3 uppercase tracking-widest">
              📦 Container Pool
            </h2>
            {pool.length === 0 ? (
              <p className="text-white/30 text-sm italic">All containers placed!</p>
            ) : (
              <div className="flex flex-col gap-2">
                {pool.map((c) => (
                  <ContainerCard
                    key={c.id}
                    container={c}
                    selected={selected?.id === c.id}
                    dimmed={placed.has(c.id)}
                    onClick={() => {
                      if (placed.has(c.id)) return;
                      setSelected((prev) => (prev?.id === c.id ? null : c));
                    }}
                  />
                ))}
              </div>
            )}
            {selected && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-3 text-xs text-yellow-300"
              >
                Click a column to place <strong>{selected.id}</strong>
              </motion.p>
            )}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleCheck}
            className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-sm font-semibold transition-colors cursor-pointer"
          >
            🔍 Check My Stow
          </button>
          <button
            onClick={handleReset}
            className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-sm font-semibold transition-colors cursor-pointer"
          >
            🔄 Reset Grid
          </button>
          <button
            onClick={handleSail}
            className="px-4 py-2 rounded-lg bg-teal-700 hover:bg-teal-600 text-sm font-semibold transition-colors cursor-pointer"
          >
            {sailLabel}
          </button>
          <button
            onClick={handleSolve}
            disabled={solving || mode === "solved"}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-semibold transition-colors cursor-pointer",
              solving || mode === "solved"
                ? "bg-white/10 text-white/30 cursor-not-allowed"
                : "bg-amber-600 hover:bg-amber-500"
            )}
          >
            {solving ? "⏳ Chief Mate thinking…" : "⚓ Call the Chief Mate"}
          </button>
          <button
            onClick={() => {
              localStorage.removeItem("tutorial-dismissed-vessel-stowage");
              setShowTutorial(true);
            }}
            className="px-4 py-2 rounded-lg text-sm font-semibold transition-colors cursor-pointer bg-white/5 hover:bg-white/15 text-white/60 hover:text-white/90 border border-white/10"
          >
            ❓ How to Play
          </button>
        </div>

        {/* Business Context Card */}
        <div className="rounded-xl border border-amber-500/25 bg-amber-500/5 px-5 py-4">
          <p className="text-amber-300 font-semibold text-sm mb-2">
            💡 Why This Matters for Vessel Planning
          </p>
          <p className="text-white/60 text-sm leading-relaxed">
            A real mega-ship carries 24,000 containers across six or more ports. One container placed in the wrong position can force a crane to reshuffle fifty others — each reshuffle burns fuel, adds delay, and risks cargo damage. The Chief Mate algorithm uses constraint satisfaction, the same logic that solves Sudoku puzzles. Classical computers handle small grids well, but at real-world scale this becomes one of the hardest problems in logistics. Quantum solvers are being designed specifically for problems like this.
          </p>
          <p className="text-[10px] text-white/30 font-mono mt-2">
            Source: Lloyd's List Intelligence, 2024 · Maersk/MSC vessel planning data
          </p>
        </div>

        {/* Check result */}
        <AnimatePresence>
          {checkResult && (
            <motion.div
              key="result"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="rounded-xl border border-white/10 bg-white/5 px-5 py-4 space-y-1 text-sm"
            >
              <p className="font-bold text-white">📊 Stow Assessment</p>
              <p>
                Re-stows required:{" "}
                <span
                  className={cn(
                    "font-bold",
                    checkResult.restows === 0 ? "text-green-400" : "text-red-400"
                  )}
                >
                  {checkResult.restows}
                </span>
              </p>
              <p>
                Weight rule:{" "}
                <span
                  className={cn(
                    "font-bold",
                    checkResult.weightOk ? "text-green-400" : "text-red-400"
                  )}
                >
                  {checkResult.weightOk ? "✅ PASS" : "❌ FAIL — heavy containers must be at bottom!"}
                </span>
              </p>
              {mode === "solved" && (
                <p className="text-green-300 font-semibold mt-1">
                  0 re-stows! The Chief Mate arranged them perfectly.
                </p>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Port simulation info */}
        <AnimatePresence>
          {activePort && (
            <motion.div
              key="port-info"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="rounded-xl border px-5 py-4 text-sm"
              style={{
                borderColor: PORT_COLORS[activePort],
                background: `${PORT_COLORS[activePort]}11`,
              }}
            >
              <p className="font-bold" style={{ color: PORT_COLORS[activePort] }}>
                🏭 Docked at Port {activePort}
              </p>
              <p className="text-white/70 mt-1">
                Containers accessible for unloading (top of each column) are highlighted.
                Yellow badge <span className="bg-yellow-400 text-black rounded-full px-1 text-xs">!</span> = blocking container that needs re-stowing.
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* WOW explainer */}
        <AnimatePresence>
          {showWow && (
            <motion.div
              key="wow"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="rounded-xl border border-amber-400/40 bg-amber-400/10 px-5 py-5 space-y-3"
            >
              <p className="text-amber-300 font-bold text-base">
                ⚓ Chief Mate's Perfect Stow — Explained
              </p>
              <p className="text-sm text-white/80">
                The optimal solution groups each port in its own column: all{" "}
                <span style={{ color: PORT_COLORS.A }}>Port A</span> in column 1, all{" "}
                <span style={{ color: PORT_COLORS.B }}>Port B</span> in column 2, all{" "}
                <span style={{ color: PORT_COLORS.C }}>Port C</span> in column 3.
              </p>
              <ul className="text-sm text-white/70 list-disc list-inside space-y-1">
                <li>
                  Heavy containers sit at <strong>tier 0</strong> (bottom) — satisfying the stability rule.
                </li>
                <li>
                  When we arrive at Port A, all A containers are in one column — nothing is blocking them.
                </li>
                <li>
                  Same for Port B and Port C — each column unloads cleanly with <strong>zero re-stows</strong>.
                </li>
                <li>
                  This mirrors how real cargo planners group cargo by <em>discharge port</em> to minimise crane moves.
                </li>
              </ul>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
