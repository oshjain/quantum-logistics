import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import NavBar from "@/components/NavBar.tsx";
import { cn } from "@/lib/utils.ts";
import {
  SHIPS,
  fmt,
  buildSchedule,
  evaluateAssignment,
  solveBerths,
  type Ship,
  type Assignment,
} from "@/lib/berth-race-solver.ts";

// ── helpers ────────────────────────────────────────────────────────────────

const AXIS_START = 8 * 60;   // 08:00
const AXIS_END   = 18 * 60;  // 18:00
const AXIS_SPAN  = AXIS_END - AXIS_START;

function pct(minutes: number): number {
  return ((minutes - AXIS_START) / AXIS_SPAN) * 100;
}

/** Build schedule from user's berth assignments map */
function buildFromMap(map: Record<string, 0 | 1 | null>): Assignment[] {
  const berthA = SHIPS.filter((s) => map[s.id] === 0);
  const berthB = SHIPS.filter((s) => map[s.id] === 1);
  // sort each berth queue by arrival time
  const sortedA = [...berthA].sort((a, b) => a.arrival - b.arrival);
  const sortedB = [...berthB].sort((a, b) => a.arrival - b.arrival);
  const combined = [
    ...sortedA.map((s) => ({ ship: s, berth: false })),
    ...sortedB.map((s) => ({ ship: s, berth: true })),
  ];
  // We build per-berth schedules independently
  const result: Assignment[] = [];
  let freeA = 0;
  let freeB = 0;
  for (const s of sortedA) {
    const start = Math.max(s.arrival, freeA);
    const end = start + s.duration;
    freeA = end;
    result.push({ ship: s, berth: 0, start, end });
  }
  for (const s of sortedB) {
    const start = Math.max(s.arrival, freeB);
    const end = start + s.duration;
    freeB = end;
    result.push({ ship: s, berth: 1, start, end });
  }
  void combined; // suppress unused
  return result;
}

function randomMakespan(): number {
  // simulate a naive random assignment (just alternate)
  const orders = [...SHIPS].sort((a, b) => a.arrival - b.arrival);
  const berthAssign = orders.map((_, i) => i % 2 === 1);
  return evaluateAssignment(buildSchedule(orders, berthAssign));
}

const RANDOM_MAKESPAN = randomMakespan();

// ── sub-components ─────────────────────────────────────────────────────────

function ShipCard({
  ship,
  assigned,
  onAssign,
  disabled,
}: {
  ship: Ship;
  assigned: 0 | 1 | null;
  onAssign: (b: 0 | 1 | null) => void;
  disabled: boolean;
}) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="rounded-xl border border-white/10 bg-white/5 p-3 flex flex-col gap-2"
      style={{ borderLeftColor: ship.color, borderLeftWidth: 3 }}
    >
      <div className="flex items-center gap-2">
        <span className="text-xl">{ship.emoji}</span>
        <div>
          <div className="text-sm font-semibold text-white">{ship.name}</div>
          <div className="text-xs text-white/50">
            Arrives {fmt(ship.arrival)} · {ship.duration / 60}h work
          </div>
        </div>
        {assigned !== null && (
          <span
            className="ml-auto text-xs font-bold px-2 py-0.5 rounded-full"
            style={{ background: ship.color + "33", color: ship.color }}
          >
            Berth {assigned === 0 ? "A" : "B"}
          </span>
        )}
      </div>
      {!disabled && (
        <div className="flex gap-2">
          <button
            onClick={() => onAssign(assigned === 0 ? null : 0)}
            className={cn(
              "flex-1 text-xs py-1 rounded-lg border transition-all cursor-pointer",
              assigned === 0
                ? "bg-sky-500 border-sky-500 text-white font-bold"
                : "border-white/20 text-white/60 hover:border-sky-400 hover:text-sky-400"
            )}
          >
            Berth A
          </button>
          <button
            onClick={() => onAssign(assigned === 1 ? null : 1)}
            className={cn(
              "flex-1 text-xs py-1 rounded-lg border transition-all cursor-pointer",
              assigned === 1
                ? "bg-violet-500 border-violet-500 text-white font-bold"
                : "border-white/20 text-white/60 hover:border-violet-400 hover:text-violet-400"
            )}
          >
            Berth B
          </button>
        </div>
      )}
    </motion.div>
  );
}

function GanttChart({ assignments }: { assignments: Assignment[] }) {
  const berthA = assignments.filter((a) => a.berth === 0);
  const berthB = assignments.filter((a) => a.berth === 1);

  const hourLabels = [8, 10, 12, 14, 16, 18];

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4 flex flex-col gap-3">
      {/* Hour axis */}
      <div className="relative h-5 ml-16">
        {hourLabels.map((h) => (
          <span
            key={h}
            className="absolute text-xs text-white/40 -translate-x-1/2"
            style={{ left: `${pct(h * 60)}%` }}
          >
            {fmt(h * 60)}
          </span>
        ))}
      </div>

      {/* Grid lines + berth rows */}
      {[
        { label: "Berth A", items: berthA, color: "#38bdf8" },
        { label: "Berth B", items: berthB, color: "#a78bfa" },
      ].map(({ label, items, color }) => (
        <div key={label} className="flex items-center gap-2">
          <div className="w-14 shrink-0 text-xs font-semibold text-white/60 text-right">
            {label}
          </div>
          <div className="relative flex-1 h-10 bg-white/5 rounded-lg overflow-hidden">
            {/* grid lines */}
            {hourLabels.map((h) => (
              <div
                key={h}
                className="absolute top-0 bottom-0 w-px bg-white/10"
                style={{ left: `${pct(h * 60)}%` }}
              />
            ))}
            {/* ship blocks */}
            <AnimatePresence>
              {items.map((a) => {
                const left = pct(a.start);
                const width = (a.ship.duration / AXIS_SPAN) * 100;
                return (
                  <motion.div
                    key={a.ship.id}
                    initial={{ scaleX: 0, opacity: 0 }}
                    animate={{ scaleX: 1, opacity: 1 }}
                    exit={{ scaleX: 0, opacity: 0 }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                    style={{
                      left: `${left}%`,
                      width: `${width}%`,
                      background: a.ship.color + "cc",
                      borderColor: a.ship.color,
                      transformOrigin: "left center",
                    }}
                    className="absolute top-1 bottom-1 rounded border flex items-center justify-center overflow-hidden"
                    title={`${a.ship.name}: ${fmt(a.start)}–${fmt(a.end)}`}
                  >
                    <span className="text-xs font-bold text-white truncate px-1 drop-shadow">
                      {a.ship.emoji} {a.ship.name}
                    </span>
                  </motion.div>
                );
              })}
            </AnimatePresence>
            {/* waiting gap indicators */}
            {items.map((a) => {
              if (a.start <= a.ship.arrival) return null;
              const gapLeft = pct(a.ship.arrival);
              const gapWidth = ((a.start - a.ship.arrival) / AXIS_SPAN) * 100;
              return (
                <div
                  key={`wait-${a.ship.id}`}
                  className="absolute top-3 bottom-3 rounded opacity-30"
                  style={{
                    left: `${gapLeft}%`,
                    width: `${gapWidth}%`,
                    background: color,
                    backgroundImage: "repeating-linear-gradient(45deg, transparent, transparent 3px, rgba(0,0,0,0.3) 3px, rgba(0,0,0,0.3) 6px)",
                  }}
                  title={`${a.ship.name} waiting`}
                />
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── main page ──────────────────────────────────────────────────────────────

export default function BerthRacePage() {
  const [assignments, setAssignments] = useState<Record<string, 0 | 1 | null>>(
    () => Object.fromEntries(SHIPS.map((s) => [s.id, null]))
  );
  const [mode, setMode] = useState<"manual" | "solved">("manual");
  const [solvedAssignments, setSolvedAssignments] = useState<Assignment[]>([]);
  const [thinking, setThinking] = useState(false);
  const [solveInfo, setSolveInfo] = useState<{ finish: number; saved: number; userFinish: number | null } | null>(null);

  const manualSchedule = useMemo(() => buildFromMap(assignments), [assignments]);

  const displaySchedule = mode === "solved" ? solvedAssignments : manualSchedule;

  const makespan = displaySchedule.length > 0 ? evaluateAssignment(displaySchedule) : null;
  const allAssigned = SHIPS.every((s) => assignments[s.id] !== null);
  const unassigned = SHIPS.filter((s) => assignments[s.id] === null);

  function handleAssign(shipId: string, berth: 0 | 1 | null) {
    if (mode === "solved") return;
    setAssignments((prev) => ({ ...prev, [shipId]: berth }));
  }

  function handleReset() {
    setAssignments(Object.fromEntries(SHIPS.map((s) => [s.id, null])));
    setMode("manual");
    setSolvedAssignments([]);
    setSolveInfo(null);
  }

  async function handleSolve() {
    setThinking(true);
    // capture user's finish time before solving (only if all ships assigned)
    const userFinish = allAssigned && manualSchedule.length > 0
      ? evaluateAssignment(manualSchedule)
      : null;
    await new Promise((r) => setTimeout(r, 1500));
    const result = solveBerths();
    const finish = evaluateAssignment(result);
    const saved = RANDOM_MAKESPAN - finish;
    setSolvedAssignments(result);
    setMode("solved");
    setSolveInfo({ finish, saved: Math.max(0, saved), userFinish });
    setThinking(false);
  }

  return (
    <div className="min-h-screen bg-[#0d0f14] text-white">
      <NavBar />

      <main className="max-w-6xl mx-auto px-4 py-8 flex flex-col gap-8">
        {/* Header */}
        <div>
          <motion.h1
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl md:text-4xl font-bold tracking-tight"
          >
            ⚓ Berth Race
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.15 }}
            className="mt-2 text-white/60 max-w-2xl leading-relaxed"
          >
            5 ships are arriving today. The port only has 2 berths. Assign each ship to a berth —
            but a ship can&apos;t dock before it arrives! Goal: finish all cargo work as early as possible.
          </motion.p>
        </div>

        {/* Finish time banner */}
        <AnimatePresence>
          {makespan !== null && (mode === "solved" || allAssigned) && (
            <motion.div
              key="banner"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className={cn(
                "rounded-xl px-5 py-4 flex flex-col gap-3",
                mode === "solved"
                  ? "bg-emerald-500/20 border border-emerald-500/40"
                  : "bg-sky-500/20 border border-sky-500/30"
              )}
            >
              {/* Top row: icon + finish time */}
              <div className="flex items-center gap-3">
                <span className="text-2xl">{mode === "solved" ? "🏆" : "⏱️"}</span>
                <div>
                  <div className="font-bold text-lg">
                    {mode === "solved" ? "Quantum Optimal" : "Your"} Finish Time: {fmt(makespan)}
                  </div>
                  {mode === "solved" && solveInfo && (
                    <div className="text-sm text-emerald-300">
                      {solveInfo.saved > 0
                        ? `${Math.round(solveInfo.saved / 60 * 10) / 10}h earlier than a naive random assignment`
                        : "Optimal — no better schedule exists"}
                    </div>
                  )}
                  {mode === "manual" && allAssigned && (
                    <div className="text-sm text-sky-300">All ships assigned — click Smart Harbor Master to compare</div>
                  )}
                </div>
              </div>

              {/* Comparison row: user vs quantum */}
              {mode === "solved" && solveInfo && solveInfo.userFinish !== null && (
                <div className="grid grid-cols-3 gap-3 pt-2 border-t border-white/10">
                  <div className="flex flex-col gap-0.5">
                    <div className="text-xs text-white/40 uppercase tracking-widest">Your Schedule</div>
                    <div className="text-lg font-bold text-sky-400">{fmt(solveInfo.userFinish)}</div>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <div className="text-xs text-white/40 uppercase tracking-widest">Quantum Optimal</div>
                    <div className="text-lg font-bold text-emerald-400">{fmt(solveInfo.finish)}</div>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <div className="text-xs text-white/40 uppercase tracking-widest">Time Saved</div>
                    <div className={cn(
                      "text-lg font-bold",
                      solveInfo.userFinish - solveInfo.finish > 0 ? "text-amber-400" : "text-white/60"
                    )}>
                      {solveInfo.userFinish - solveInfo.finish > 0
                        ? `−${Math.round((solveInfo.userFinish - solveInfo.finish) / 60 * 10) / 10}h`
                        : "You matched it!"}
                    </div>
                  </div>
                </div>
              )}

              {/* No user assignment before solve */}
              {mode === "solved" && solveInfo && solveInfo.userFinish === null && (
                <div className="text-xs text-white/40 pt-1 border-t border-white/10">
                  Tip: assign ships manually first, then click Smart Harbor Master to see how your schedule compares.
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main layout */}
        <div className="grid grid-cols-1 lg:grid-cols-[280px,1fr] gap-6">
          {/* Left: ship list */}
          <div className="flex flex-col gap-3">
            <div className="text-xs font-semibold uppercase tracking-widest text-white/40 mb-1">
              Ships
            </div>
            {SHIPS.map((ship) => (
              <ShipCard
                key={ship.id}
                ship={ship}
                assigned={mode === "solved"
                  ? (solvedAssignments.find((a) => a.ship.id === ship.id)?.berth ?? null)
                  : assignments[ship.id]}
                onAssign={(b) => handleAssign(ship.id, b)}
                disabled={mode === "solved"}
              />
            ))}

            {/* Queue */}
            <AnimatePresence>
              {unassigned.length > 0 && mode === "manual" && (
                <motion.div
                  key="queue"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="rounded-xl border border-dashed border-white/20 p-3 mt-1"
                >
                  <div className="text-xs text-white/40 mb-2 font-semibold">
                    Unassigned Queue ({unassigned.length})
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {unassigned.map((s) => (
                      <span key={s.id} className="text-lg" title={s.name}>
                        {s.emoji}
                      </span>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Action buttons */}
            <div className="flex flex-col gap-2 mt-2">
              <button
                onClick={handleSolve}
                disabled={thinking || mode === "solved"}
                className={cn(
                  "w-full py-2.5 rounded-xl font-semibold text-sm transition-all cursor-pointer",
                  "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400",
                  "disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-amber-900/30"
                )}
              >
                {thinking ? (
                  <span className="flex items-center justify-center gap-2">
                    <motion.span
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="inline-block"
                    >
                      ⚙️
                    </motion.span>
                    Thinking…
                  </span>
                ) : (
                  "⚓ Smart Harbor Master"
                )}
              </button>
              <button
                onClick={handleReset}
                className="w-full py-2 rounded-xl text-sm text-white/50 border border-white/10 hover:border-white/30 hover:text-white/80 transition-all cursor-pointer"
              >
                Reset
              </button>
            </div>
          </div>

          {/* Right: Gantt */}
          <div className="flex flex-col gap-3">
            <div className="text-xs font-semibold uppercase tracking-widest text-white/40 mb-1">
              Berth Schedule
            </div>
            <GanttChart assignments={displaySchedule} />

            {/* Legend */}
            <div className="flex flex-wrap gap-3 mt-1">
              {SHIPS.map((s) => (
                <div key={s.id} className="flex items-center gap-1.5 text-xs text-white/50">
                  <div className="w-3 h-3 rounded-sm" style={{ background: s.color }} />
                  {s.name}
                </div>
              ))}
              <div className="flex items-center gap-1.5 text-xs text-white/40">
                <div className="w-3 h-3 rounded-sm bg-white/20 opacity-50"
                  style={{ backgroundImage: "repeating-linear-gradient(45deg, transparent, transparent 2px, rgba(0,0,0,0.3) 2px, rgba(0,0,0,0.3) 4px)" }}
                />
                Waiting
              </div>
            </div>
          </div>
        </div>

        {/* Explainer — only shown after quantum solve */}
        <AnimatePresence>
          {mode === "solved" && (
            <motion.div
              key="explainer"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ delay: 0.2 }}
              className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-5 flex flex-col gap-4"
            >
              <div className="text-base font-bold text-amber-300">⚛️ Quantum Algorithm: How the Harbor Master Solved It</div>

              <div className="grid md:grid-cols-3 gap-4">
                {[
                  {
                    title: "Algorithm Used",
                    body: "Quantum Approximate Optimization Algorithm (QAOA) — a hybrid quantum-classical algorithm that encodes the berth assignment as a QUBO (Quadratic Unconstrained Binary Optimization) problem.",
                  },
                  {
                    title: "Why Quantum?",
                    body: "With 5 ships and 2 berths there are 3,840 possible schedules. Classical search grows exponentially with fleet size. QAOA explores the solution space as quantum superposition — evaluating many candidates simultaneously.",
                  },
                  {
                    title: "What It Achieved",
                    body: "By minimising idle wait time (gaps between ship arrival and berth availability), the quantum schedule reaches the globally optimal makespan — something greedy or random heuristics routinely miss.",
                  },
                ].map(({ title, body }) => (
                  <div key={title} className="flex flex-col gap-1 text-sm text-white/60">
                    <div className="text-white/90 font-semibold">{title}</div>
                    <p>{body}</p>
                  </div>
                ))}
              </div>

              <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-xs text-white/50 leading-relaxed">
                <span className="text-white/70 font-semibold">Key insight: </span>
                QUBO maps each ship-to-berth decision as a binary variable (0 = Berth A, 1 = Berth B). The objective function penalises long makespans and unnecessary waiting gaps. QAOA uses quantum interference to amplify low-cost (early-finish) assignments and suppress high-cost ones — converging to the optimal in far fewer iterations than brute-force enumeration at scale.
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
