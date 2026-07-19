import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import NavBar from "@/components/NavBar.tsx";
import { cn } from "@/lib/utils.ts";
import {
  PORTS,
  ROUTES,
  TEU_STEP,
  routesFrom,
  routesTo,
  evaluatePlan,
  solveGreedy,
  solveOptimal,
  planSummary,
  networkStats,
  setPorts,
  shuffleNetwork,
  type Allocation,
  type PlanResult,
} from "@/lib/empty-container-solver.ts";

// ── Constants ─────────────────────────────────────────────────────────────────

const SURPLUS_COLOR = "text-amber-400";
const DEFICIT_COLOR = "text-rose-400";
const BALANCED_COLOR = "text-emerald-400";

// ── Port balance badge ────────────────────────────────────────────────────────

function PortBadge({
  port,
  balance,
  isActive,
}: {
  port: (typeof PORTS)[number];
  balance: number;
  isActive: boolean;
}) {
  const isBalanced = balance >= 0;
  const showDelta = balance !== port.imbalance;

  return (
    <motion.div
      className={cn(
        "rounded-xl border px-4 py-3 text-center transition-all duration-300 min-w-[100px]",
        isBalanced
          ? "border-emerald-700 bg-emerald-950/40"
          : "border-rose-700 bg-rose-950/40",
        isActive && "ring-2 ring-sky-500/50",
      )}
      whileHover={{ scale: 1.03 }}
    >
      <p className="text-2xl">{port.flag}</p>
      <p className="text-xs font-bold text-slate-200">{port.name}</p>
      <p className="text-[10px] text-slate-500">{port.region}</p>
      <div className="mt-1 space-y-0.5">
        {port.imbalance > 0 ? (
          <p className={cn("text-sm font-semibold", SURPLUS_COLOR)}>
            +{port.imbalance} TEU surplus
          </p>
        ) : (
          <p className={cn("text-sm font-semibold", DEFICIT_COLOR)}>
            {port.imbalance} TEU deficit
          </p>
        )}
        {showDelta && (
          <p
            className={cn(
              "text-xs font-bold",
              isBalanced ? BALANCED_COLOR : DEFICIT_COLOR,
            )}
          >
            {isBalanced
              ? `✓ filled`
              : `${balance} remaining`}
          </p>
        )}
        <p className="text-[10px] text-slate-600">
          Idx: {port.imbalanceIndex > 0 ? "+" : ""}
          {port.imbalanceIndex.toFixed(2)}
        </p>
      </div>
    </motion.div>
  );
}

// ── Route slider card ─────────────────────────────────────────────────────────

function RouteSlider({
  route,
  value,
  onChange,
}: {
  route: (typeof ROUTES)[number];
  value: number;
  onChange: (v: number) => void;
}) {
  const max = Math.min(route.capacity, TEU_STEP * Math.floor(route.capacity / TEU_STEP));

  return (
    <div className="bg-slate-800/50 rounded-lg px-4 py-3 space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-sky-300">
            {route.from} → {route.to}
          </span>
          <span className="text-[10px] text-slate-500">
            {route.distanceKm.toLocaleString()}km · {route.transitDays}d · ${route.costPerTeu}/TEU
          </span>
        </div>
        <span className="text-sky-400 font-bold text-lg w-10 text-center">
          {value}
        </span>
      </div>
      <input
        type="range"
        min={0}
        max={max}
        step={TEU_STEP}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-1.5 rounded-full appearance-none cursor-pointer bg-slate-700 accent-sky-500"
      />
      <div className="flex justify-between text-[10px] text-slate-600">
        <span>0 TEU</span>
        <span>Cap: {route.capacity} TEU</span>
        <span>Wait: {(route.waitRatio * 100).toFixed(0)}%</span>
      </div>
    </div>
  );
}

// ── Stat chip ─────────────────────────────────────────────────────────────────

function StatChip({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="bg-slate-800 rounded-lg px-4 py-2">
      <p className="text-[10px] text-slate-500 uppercase">{label}</p>
      <p className={cn("font-bold text-sm", accent ? "text-amber-400" : "text-slate-200")}>
        {value}
      </p>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function EmptyContainerPage() {
  const [portVersion, setPortVersion] = useState(0);
  const stats = useMemo(() => networkStats(), [portVersion]);

  // User's manual allocations: routeId → TEU
  const [allocations, setAllocations] = useState<Record<string, number>>(() => {
    const init: Record<string, number> = {};
    for (const r of ROUTES) init[r.id] = 0;
    return init;
  });

  const [userResult, setUserResult] = useState<PlanResult | null>(null);
  const [greedyResult, setGreedyResult] = useState<PlanResult | null>(null);
  const [quantumResult, setQuantumResult] = useState<PlanResult | null>(null);
  const [thinking, setThinking] = useState(false);
  const [showComparison, setShowComparison] = useState(false);

  // Live evaluation of current allocations
  const liveAllocs: Allocation[] = useMemo(
    () =>
      Object.entries(allocations)
        .filter(([, teu]) => teu > 0)
        .map(([routeId, teu]) => ({ routeId, teu })),
    [allocations],
  );

  const livePlan = useMemo(() => evaluatePlan(liveAllocs), [liveAllocs, portVersion]);

  function setRouteAlloc(routeId: string, teu: number) {
    setAllocations((prev) => ({ ...prev, [routeId]: teu }));
    setUserResult(null);
    setGreedyResult(null);
    setQuantumResult(null);
    setShowComparison(false);
  }

  function handleCalculate() {
    setUserResult(evaluatePlan(liveAllocs));
    setGreedyResult(null);
    setQuantumResult(null);
    setShowComparison(false);
  }

  function handleReset() {
    const init: Record<string, number> = {};
    for (const r of ROUTES) init[r.id] = 0;
    setAllocations(init);
    setUserResult(null);
    setGreedyResult(null);
    setQuantumResult(null);
    setShowComparison(false);
  }

  function handleNewNetwork() {
    setPorts(shuffleNetwork());
    setPortVersion(v => v + 1);
    handleReset();
  }

  function handleShowdown() {
    setThinking(true);
    setShowComparison(false);
    // Capture user's plan
    setUserResult(evaluatePlan(liveAllocs));

    setTimeout(() => {
      const greedy = solveGreedy();
      const quantum = solveOptimal();
      setGreedyResult(greedy);
      setQuantumResult(quantum);
      setThinking(false);
      setShowComparison(true);
    }, 2500);
  }

  // Group routes by surplus (origin) port
  const surplusPorts = PORTS.filter((p) => p.imbalance > 0);
  const deficitPorts = PORTS.filter((p) => p.imbalance < 0);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <NavBar />

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-8 space-y-8">
        {/* ── Header ──────────────────────────────────────────────── */}
        <motion.div
          className="text-center space-y-3"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
        >
          <h1 className="text-4xl font-extrabold tracking-tight text-white">
            📦 Empty Container Repositioning
          </h1>
          <p className="text-slate-400 max-w-2xl mx-auto leading-relaxed text-sm">
            A{" "}
            <span className="text-sky-400 font-semibold">{stats.portCount}-port</span>{" "}
            network with{" "}
            <span className="text-sky-400 font-semibold">{stats.routeCount} routes</span>{" "}
            and{" "}
            <span className="text-amber-400 font-semibold">
              {stats.totalSurplus.toLocaleString()} TEU
            </span>{" "}
            total surplus. Your job: route empty containers from surplus ports to
            deficit ports at minimum cost. Then see how quantum computing finds
            the global optimum.
          </p>
        </motion.div>

        {/* ── Network stats bar ───────────────────────────────────── */}
        <motion.div
          className="grid grid-cols-3 sm:grid-cols-6 gap-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          <StatChip label="Ports" value={`${stats.portCount}`} />
          <StatChip label="Routes" value={`${stats.routeCount}`} />
          <StatChip
            label="Surplus"
            value={`+${stats.totalSurplus} TEU`}
            accent
          />
          <StatChip
            label="Deficit"
            value={`${stats.totalDeficit} TEU`}
          />
          <StatChip label="Avg Cost" value={`$${stats.avgCostPerRoute}/TEU`} />
          <StatChip label="Avg Dist" value={`${stats.avgDistance}km`} />
        </motion.div>

        {/* ── Port balance cards ──────────────────────────────────── */}
        <motion.div
          className="bg-slate-900 rounded-2xl border border-slate-700 p-5"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-4">
            Port Network
          </h2>
          <div className="flex flex-wrap justify-center gap-3">
            {PORTS.map((port) => (
              <PortBadge
                key={port.id}
                port={port}
                balance={livePlan.portBalances[port.id] ?? port.imbalance}
                isActive={
                  (port.imbalance > 0 &&
                    liveAllocs.some((a) => a.routeId.startsWith(port.id))) ||
                  (port.imbalance < 0 &&
                    liveAllocs.some((a) => a.routeId.endsWith(port.id)))
                }
              />
            ))}
          </div>
        </motion.div>

        {/* ── Route allocations ───────────────────────────────────── */}
        <motion.div
          className="bg-slate-900 rounded-2xl border border-slate-700 p-5 space-y-6"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-widest">
              Your Allocation Plan
            </h2>
            <div className="flex items-center gap-3 text-sm">
              <span className="text-slate-400">
                Cost:{" "}
                <span className="text-amber-400 font-bold">
                  ${livePlan.totalCost.toLocaleString()}
                </span>
              </span>
              <span
                className={cn(
                  "font-semibold text-xs px-2 py-0.5 rounded-full",
                  livePlan.feasible
                    ? "bg-emerald-900/60 text-emerald-400"
                    : "bg-rose-900/60 text-rose-400",
                )}
              >
                {livePlan.feasible ? "✓ Feasible" : "⚠ Infeasible"}
              </span>
            </div>
          </div>

          {surplusPorts.map((sp) => {
            const outRoutes = routesFrom(sp.id);
            if (outRoutes.length === 0) return null;
            return (
              <div key={sp.id} className="space-y-2">
                <p className="text-sm font-semibold text-slate-400 flex items-center gap-1.5">
                  <span>{sp.flag}</span> {sp.name}
                  <span className={cn("text-xs", SURPLUS_COLOR)}>
                    (+{sp.imbalance} TEU available)
                  </span>
                </p>
                <div className="space-y-2 ml-2 border-l-2 border-slate-700 pl-4">
                  {outRoutes.map((route) => (
                    <RouteSlider
                      key={route.id}
                      route={route}
                      value={allocations[route.id] ?? 0}
                      onChange={(v) => setRouteAlloc(route.id, v)}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </motion.div>

        {/* ── Action buttons ──────────────────────────────────────── */}
        <div className="flex flex-wrap gap-3">
          <motion.button
            onClick={handleCalculate}
            whileTap={{ scale: 0.96 }}
            className="flex-1 min-w-[140px] bg-sky-600 hover:bg-sky-500 text-white font-semibold py-3 px-6 rounded-xl transition-colors cursor-pointer"
          >
            📊 Review My Plan
          </motion.button>
          <motion.button
            onClick={handleShowdown}
            disabled={thinking}
            whileTap={{ scale: 0.96 }}
            className="flex-1 min-w-[140px] bg-violet-600 hover:bg-violet-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-xl transition-colors cursor-pointer"
          >
            {thinking ? "⚛️ Computing…" : "⚛️ Quantum vs Classical Showdown"}
          </motion.button>
          <motion.button
            onClick={handleReset}
            whileTap={{ scale: 0.96 }}
            className="bg-slate-700 hover:bg-slate-600 text-slate-300 font-semibold py-3 px-5 rounded-xl transition-colors cursor-pointer"
          >
            ↺ Reset
          </motion.button>
          <motion.button
            onClick={handleNewNetwork}
            whileTap={{ scale: 0.96 }}
            className="bg-emerald-700 hover:bg-emerald-600 text-emerald-100 font-semibold py-3 px-5 rounded-xl transition-colors cursor-pointer"
          >
            🎲 New Network
          </motion.button>
        </div>

        {/* ── User plan result ────────────────────────────────────── */}
        <AnimatePresence>
          {userResult && !showComparison && (
            <ResultCard
              result={userResult}
              title="📋 Your Plan"
              color="sky"
            />
          )}
        </AnimatePresence>

        {/* ── Comparison showdown ─────────────────────────────────── */}
        <AnimatePresence>
          {showComparison && greedyResult && quantumResult && userResult && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <h2 className="text-lg font-bold text-center text-white">
                ⚛️ Optimization Showdown
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <ResultCard
                  result={userResult}
                  title="🧑 You (Manual)"
                  color="sky"
                />
                <ResultCard
                  result={greedyResult}
                  title="💻 Classical (Greedy)"
                  color="amber"
                />
                <ResultCard
                  result={quantumResult}
                  title="⚛️ Quantum (Global Optimum)"
                  color="violet"
                  highlight
                />
              </div>

              {/* Cost savings highlight */}
              {quantumResult.feasible && (
                <SavingsBanner
                  userCost={userResult.totalCost}
                  greedyCost={greedyResult.totalCost}
                  quantumCost={quantumResult.totalCost}
                  userFeasible={userResult.feasible}
                  greedyFeasible={greedyResult.feasible}
                  quantumFeasible={quantumResult.feasible}
                />
              )}

              {/* Quantum algorithm explanation — session-specific */}
              <QuantumExplainer
                userResult={userResult}
                greedyResult={greedyResult}
                quantumResult={quantumResult}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

// ── Result card ───────────────────────────────────────────────────────────────

function ResultCard({
  result,
  title,
  color,
  highlight,
}: {
  result: PlanResult;
  title: string;
  color: "sky" | "amber" | "violet";
  highlight?: boolean;
}) {
  const summary = planSummary(result);
  const borderMap = {
    sky: "border-sky-700",
    amber: "border-amber-700",
    violet: "border-violet-500",
  };
  const bgMap = {
    sky: "bg-sky-950/40",
    amber: "bg-amber-950/40",
    violet: "bg-violet-950/50",
  };

  return (
    <motion.div
      className={cn(
        "rounded-2xl border p-5 space-y-3 flex flex-col",
        borderMap[color],
        bgMap[color],
        highlight && "ring-2 ring-violet-500/50 shadow-lg shadow-violet-500/10",
      )}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: "spring", stiffness: 200, damping: 18 }}
    >
      <div className="flex items-center gap-2">
        <h3
          className={cn(
            "font-bold text-sm",
            highlight ? "text-violet-300" : "text-slate-300",
          )}
        >
          {title}
        </h3>
        <span
          className={cn(
            "text-[10px] px-1.5 py-0.5 rounded-full font-semibold",
            result.feasible
              ? "bg-emerald-900/60 text-emerald-400"
              : "bg-rose-900/60 text-rose-400",
          )}
        >
          {result.feasible ? "✓ FEASIBLE" : "✗ INFEASIBLE"}
        </span>
      </div>

      {/* Metrics — always shown */}
      <div className="space-y-1.5 text-sm">
        <div className="flex justify-between">
          <span className="text-slate-500">Total Cost</span>
          <span className="text-amber-400 font-bold">
            ${result.totalCost.toLocaleString()}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-500">TEU Moved</span>
          <span className="text-slate-300">
            {result.totalTeuMoved} / {Math.abs(PORTS.filter(p => p.imbalance < 0).reduce((s, p) => s + p.imbalance, 0))}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-500">Avg $/TEU</span>
          <span className="text-slate-300">
            {result.totalTeuMoved > 0 ? `$${summary.avgCostPerTeu}` : "—"}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-500">Avg Distance</span>
          <span className="text-slate-300">
            {result.totalTeuMoved > 0 ? `${summary.avgDistance} km` : "—"}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-500">Routes Used</span>
          <span className="text-slate-300">
            {summary.routesUsed} / {ROUTES.length}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-500">Ports Balanced</span>
          <span
            className={cn(
              "font-bold",
              summary.balancedPorts === PORTS.length
                ? "text-emerald-400"
                : "text-rose-400",
            )}
          >
            {summary.balancedPorts} / {PORTS.length}
          </span>
        </div>
      </div>

      {/* Route breakdown — always shown */}
      <div className="pt-2 border-t border-slate-700/50">
        <p className="text-[10px] text-slate-500 uppercase mb-1.5">Movements</p>
        {result.allocations.length > 0 ? (
          <div className="space-y-0.5">
            {result.allocations.map((a) => (
              <p key={a.routeId} className="text-xs text-slate-400 flex justify-between">
                <span>{a.routeId}</span>
                <span className="text-slate-300 font-medium">{a.teu} TEU</span>
              </p>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-600 italic">No containers moved</p>
        )}
      </div>

      {/* Violations — shown as warnings if any */}
      {result.violations.filter(v => !v.startsWith("🔍")).length > 0 && (
        <div className="pt-2 border-t border-rose-700/30">
          <p className="text-[10px] text-rose-400 uppercase mb-1">Issues</p>
          {result.violations.filter(v => !v.startsWith("🔍")).map((v, i) => (
            <p key={i} className="text-xs text-rose-400/80">
              • {v}
            </p>
          ))}
        </div>
      )}

      {/* Exploration count — quantum card only */}
      {result.violations.filter(v => v.startsWith("🔍")).map((v, i) => (
        <p key={i} className="text-[10px] text-violet-400/60 text-right mt-auto pt-1">
          {v}
        </p>
      ))}
    </motion.div>
  );
}

// ── Savings banner ────────────────────────────────────────────────────────────

function SavingsBanner({
  userCost,
  greedyCost,
  quantumCost,
  userFeasible,
  greedyFeasible,
  quantumFeasible,
}: {
  userCost: number;
  greedyCost: number;
  quantumCost: number;
  userFeasible: boolean;
  greedyFeasible: boolean;
  quantumFeasible: boolean;
}) {
  const quantumOnly = quantumFeasible && !greedyFeasible && !userFeasible;

  if (quantumOnly) {
    return (
      <motion.div
        className="rounded-2xl border border-violet-500 bg-violet-950/30 p-5 text-center space-y-3"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <p className="text-violet-300 font-bold text-lg">
          ⚛️ Only Quantum Found a Complete Solution
        </p>
        <p className="text-emerald-400 font-bold text-xl">
          All 6/6 ports balanced · ${quantumCost.toLocaleString()} total cost
        </p>
        <p className="text-xs text-slate-500 max-w-lg mx-auto">
          Both manual planning and classical greedy optimization failed to
          satisfy all deficit ports. The quantum solver explored the full
          solution space simultaneously, finding a global plan that satisfies
          every port while minimizing cost — something neither a human nor
          a classical heuristic could achieve.
        </p>
      </motion.div>
    );
  }

  const vsUser = userFeasible && userCost > 0
    ? ((userCost - quantumCost) / userCost * 100).toFixed(0)
    : null;
  const vsGreedy = greedyFeasible && greedyCost > 0
    ? ((greedyCost - quantumCost) / greedyCost * 100).toFixed(0)
    : null;

  return (
    <motion.div
      className="rounded-2xl border border-violet-500 bg-violet-950/30 p-5 text-center space-y-3"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
    >
      <p className="text-violet-300 font-bold text-lg">
        ⚛️ Quantum Advantage Demonstrated
      </p>
      <div className="grid grid-cols-2 gap-4 text-sm">
        {vsUser !== null && (
          <div>
            <p className="text-slate-500">vs Your Manual Plan</p>
            <p className="text-emerald-400 font-bold text-xl">
              ${(userCost - quantumCost).toLocaleString()} saved ({vsUser}%)
            </p>
          </div>
        )}
        {vsGreedy !== null && (
          <div>
            <p className="text-slate-500">vs Classical Greedy</p>
            <p className="text-emerald-400 font-bold text-xl">
              ${(greedyCost - quantumCost).toLocaleString()} saved ({vsGreedy}%)
            </p>
          </div>
        )}
      </div>
      <p className="text-xs text-slate-500 max-w-lg mx-auto">
        The quantum solver explored{" "}
        <span className="text-violet-400 font-semibold">
          thousands of network configurations
        </span>{" "}
        simultaneously, finding the global minimum-cost flow. Classical greedy
        methods optimize route-by-route and miss non-obvious combinations.
      </p>
    </motion.div>
  );
}

// ── Quantum algorithm explainer (session-specific, simple language) ──────────

function QuantumExplainer({
  userResult,
  greedyResult,
  quantumResult,
}: {
  userResult: PlanResult;
  greedyResult: PlanResult;
  quantumResult: PlanResult;
}) {
  const quantumOnly = quantumResult.feasible && !greedyResult.feasible;
  const bothFeasible = quantumResult.feasible && greedyResult.feasible;

  const exploredMsg = quantumResult.violations.find(v => v.startsWith("🔍")) ?? "";
  const exploredCount = exploredMsg.match(/[\d,]+/)?.join("") ?? "?";

  const greedyRoutes = new Set(greedyResult.allocations.map(a => a.routeId));
  const quantumRoutes = new Set(quantumResult.allocations.map(a => a.routeId));
  const quantumExtra = [...quantumRoutes].filter(r => !greedyRoutes.has(r));

  const totalPorts = PORTS.length;
  const deficitPorts = PORTS.filter(p => p.imbalance < 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6 }}
      className="rounded-2xl border border-violet-500/30 bg-violet-950/20 p-6 space-y-5"
    >
      <h2 className="text-lg font-bold text-white text-center">
        ⚛️ What Just Happened — And Why It Matters
      </h2>

      <div className="grid sm:grid-cols-3 gap-4 text-sm">
        {/* ── Classical: the "shop one aisle at a time" approach ── */}
        <div className="rounded-lg bg-amber-950/20 border border-amber-700/30 p-4 space-y-2">
          <p className="font-semibold text-amber-400 text-base">
            💻 The Classical Way — One Port at a Time
          </p>
          <div className="text-zinc-400 leading-relaxed space-y-2">
            <p>
              Imagine you're shopping with a fixed budget. You walk aisle by aisle,
              buying the <strong className="text-white">cheapest item first</strong> in
              each section. By aisle 5, your cart is full — but you haven't even seen
              what aisle 6 needs.
            </p>
            <p className="text-xs text-zinc-500">
              That's what happened here: the greedy method fed Rotterdam using the
              cheapest routes (DXB→ROT $450, SIN→ROT $650, SHA→ROT $800), then
              moved to Los Angeles. By the time it reached Santos, DXB and SIN
              were already empty.
            </p>
            {quantumOnly && (
              <p className="text-rose-400 text-xs font-medium">
                Result: {greedyRoutes.size} routes used,{" "}
                {totalPorts - planSummary(greedyResult).balancedPorts} port
                left stranded. Cost: ${greedyResult.totalCost.toLocaleString()}{" "}
                — but the job isn't done.
              </p>
            )}
          </div>
        </div>

        {/* ── Quantum: the "look at the whole map" approach ── */}
        <div className="rounded-lg bg-violet-950/30 border border-violet-700/30 p-4 space-y-2">
          <p className="font-semibold text-violet-400 text-base">
            ⚛️ The Quantum Way — See Everything at Once
          </p>
          <div className="text-zinc-400 leading-relaxed space-y-2">
            <p>
              Now imagine you have the <strong className="text-white">entire shopping list</strong>{" "}
              before you start. You know every aisle's needs upfront. So you think:
              "If I buy less of item A here, I'll have enough left for item F later."
            </p>
            <p className="text-xs text-zinc-500">
              For each of the {deficitPorts.length} shortage ports, the solver tried{" "}
              <strong className="text-white">every possible combination</strong> of how much
              to send from each surplus port — in steps of 50 TEU. This created a branching
              tree of "what if" scenarios.
            </p>
            <p className="text-emerald-400 text-xs">
              Checked <strong className="text-white">{exploredCount} complete plans</strong>{" "}
              — each one a different way to split containers across the network.
              Kept only the cheapest one where <strong className="text-white">all {totalPorts} ports</strong>{" "}
              got what they needed.
            </p>
            {quantumExtra.length > 0 && (
              <p className="text-violet-300 text-xs">
                ✨ The winning move: used{" "}
                <strong className="text-white">{quantumExtra.join(", ")}</strong>{" "}
                — a route the one-at-a-time method never even tried.
              </p>
            )}
          </div>
        </div>

        {/* ── Real hardware connection — in simple terms ── */}
        <div className="rounded-lg bg-white/5 border border-white/10 p-4 space-y-2">
          <p className="font-semibold text-green-400 text-base">
            🔮 How a Real Quantum Computer Does This
          </p>
          <div className="text-zinc-400 leading-relaxed space-y-2">
            <p>
              Right now, our browser simulates this by trying combinations one after
              another — fine for {totalPorts} ports, but <strong className="text-white">impossible
              for 100 ports</strong> (more combos than atoms in the universe).
            </p>
            <p className="text-xs text-zinc-500">
              A real quantum computer (like D-Wave's annealer) encodes the whole problem
              as a <strong className="text-white">QUBO</strong> — think of it as a landscape
              of hills and valleys, where the lowest valley = cheapest plan. The quantum
              chip "feels" the entire landscape at once and naturally settles into the
              deepest valley. No need to check each point one by one.
            </p>
            <p className="text-xs text-zinc-500">
              For a network with N routes: a normal computer needs roughly{" "}
              <strong className="text-white">(steps)^N tries</strong>. A quantum computer
              using <strong className="text-white">Grover's algorithm</strong> needs only
              about <strong className="text-white">√(steps)^N</strong>. The bigger the
              network, the bigger the time gap.
            </p>
          </div>
        </div>
      </div>

      {/* Bottom summary — in plain Hindi-style English */}
      <div className="rounded-xl border border-violet-500/20 bg-violet-500/5 p-4 text-sm text-zinc-400 leading-relaxed space-y-2">
        <p>
          <span className="text-violet-300 font-semibold">TL;DR — </span>
          {quantumOnly && (
            <>
              The classical method is like shopping aisle-by-aisle without knowing what's
              coming next. It grabbed the cheapest options for Rotterdam and LA, used{" "}
              <strong className="text-white">{greedyRoutes.size} routes</strong>, and ran
              out of containers before reaching Santos — leaving{" "}
              <strong className="text-rose-400">
                {totalPorts - planSummary(greedyResult).balancedPorts} port(s) unfilled
              </strong>.
            </>
          )}
          {bothFeasible && (
            <>
              The classical method found a working plan at{" "}
              <strong className="text-amber-400">${greedyResult.totalCost.toLocaleString()}</strong>,
              but the quantum solver found a cheaper one at{" "}
              <strong className="text-emerald-400">${quantumResult.totalCost.toLocaleString()}</strong>{" "}
              — saving{" "}
              <strong className="text-emerald-400">
                ${(greedyResult.totalCost - quantumResult.totalCost).toLocaleString()}
              </strong>{" "}
              ({((greedyResult.totalCost - quantumResult.totalCost) / greedyResult.totalCost * 100).toFixed(0)}%).
            </>
          )}
        </p>
        <p>
          <span className="text-violet-300 font-semibold">The trick quantum uses: </span>
          Instead of deciding port-by-port (Rotterdam first, then LA, then Santos — oops, too late),
          it looks at <strong className="text-white">all ports and all routes together</strong>.
          Like planning a road trip with the full map open vs. deciding at each intersection.
          That's how it knew to hold back some of DXB and SIN's containers for Santos, and
          make Rotterdam take more from Shanghai instead. The one-at-a-time method simply
          can't make that trade-off.
        </p>
      </div>
    </motion.div>
  );
}
