import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import NavBar from "@/components/NavBar.tsx";
import { solveSchedule, type Truck, type DoorAssignment, type ScheduleResult } from "@/lib/scheduling.ts";
import { cn } from "@/lib/utils.ts";

// ── Trucks data ────────────────────────────────────────────────────────────────
const TRUCKS: Truck[] = [
  { id: "red",    name: "Big Red",      emoji: "🔴", color: "#ef4444", minutes: 30 },
  { id: "blue",   name: "Big Blue",     emoji: "🔵", color: "#3b82f6", minutes: 20 },
  { id: "green",  name: "Speedy Green", emoji: "🟢", color: "#22c55e", minutes: 15 },
  { id: "yellow", name: "Tiny Yellow",  emoji: "🟡", color: "#eab308", minutes: 10 },
];

const DOORS = ["Door 1", "Door 2", "Door 3"];
const BG = "oklch(0.06 0.02 260)";

// ── Timer bar ─────────────────────────────────────────────────────────────────
function TimerBar({
  truck,
  startTime,
  endTime,
  maxTime,
  animate: doAnim,
  delay = 0,
}: {
  truck: Truck;
  startTime: number;
  endTime: number;
  maxTime: number;
  animate: boolean;
  delay?: number;
}) {
  const leftPct = (startTime / maxTime) * 100;
  const widthPct = ((endTime - startTime) / maxTime) * 100;

  return (
    <div className="relative h-9 w-full">
      <motion.div
        initial={doAnim ? { scaleX: 0, opacity: 0 } : false}
        animate={{ scaleX: 1, opacity: 1 }}
        transition={{ duration: 0.6, delay, ease: "easeOut" }}
        style={{
          left: `${leftPct}%`,
          width: `${widthPct}%`,
          background: truck.color,
          originX: 0,
        }}
        className="absolute top-0 h-full rounded-lg flex items-center gap-1.5 px-2 overflow-hidden"
      >
        <span className="text-base shrink-0">{truck.emoji}</span>
        <div className="min-w-0">
          <p className="text-xs font-bold text-white truncate">{truck.name}</p>
          <p className="text-[9px] text-white/80 font-mono">
            {startTime}–{endTime} min
          </p>
        </div>
      </motion.div>
    </div>
  );
}

// ── Gantt chart ────────────────────────────────────────────────────────────────
function GanttChart({ assignments, makespan }: { assignments: DoorAssignment[]; makespan: number }) {
  const ticks = Array.from({ length: makespan / 5 + 1 }, (_, i) => i * 5);

  return (
    <div className="space-y-2">
      {DOORS.map((doorLabel, doorIdx) => {
        const doorAssignments = assignments
          .filter((a) => a.door === doorIdx)
          .sort((a, b) => a.startTime - b.startTime);

        return (
          <div key={doorIdx} className="flex items-center gap-3">
            <div className="w-14 shrink-0 text-xs font-mono text-muted-foreground text-right">
              {doorLabel}
            </div>
            <div className="flex-1 relative h-9 bg-secondary/30 rounded-lg overflow-hidden">
              {doorAssignments.map((a, i) => (
                <TimerBar
                  key={a.truck.id}
                  truck={a.truck}
                  startTime={a.startTime}
                  endTime={a.endTime}
                  maxTime={makespan}
                  animate
                  delay={0.2 + i * 0.1}
                />
              ))}
            </div>
          </div>
        );
      })}

      {/* Time axis */}
      <div className="flex items-center gap-3">
        <div className="w-14 shrink-0" />
        <div className="flex-1 flex justify-between text-[9px] font-mono text-muted-foreground px-0.5">
          {ticks.map((t) => (
            <span key={t}>{t}m</span>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Manual assignment row ──────────────────────────────────────────────────────
function TruckCard({
  truck,
  assignedDoor,
  onAssign,
  isWaiting,
  disabled,
}: {
  truck: Truck;
  assignedDoor: number | null;
  onAssign: (door: number | null) => void;
  isWaiting?: boolean;
  disabled?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border p-4 flex items-center gap-3 transition-all",
        isWaiting
          ? "border-amber-500/40 bg-amber-500/10"
          : assignedDoor !== null
          ? "border-border/60 bg-card"
          : "border-border/40 bg-card/60"
      )}
    >
      <div className="text-3xl">{truck.emoji}</div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm">{truck.name}</p>
        <p className="text-xs text-muted-foreground font-mono">{truck.minutes} min to unload</p>
        {isWaiting && <p className="text-xs text-amber-400 mt-0.5">⏳ Waiting for a free door…</p>}
      </div>

      <div className="flex gap-1">
        {DOORS.map((d, i) => (
          <button
            key={i}
            disabled={disabled}
            onClick={() => onAssign(assignedDoor === i ? null : i)}
            className={cn(
              "w-9 h-9 rounded-lg text-xs font-bold border transition-all disabled:opacity-40",
              assignedDoor === i
                ? "border-transparent text-white"
                : "border-border text-muted-foreground hover:border-border/80 hover:text-foreground"
            )}
            style={assignedDoor === i ? { background: truck.color } : {}}
          >
            {i + 1}
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Conflict warning ──────────────────────────────────────────────────────────
function getConflicts(assignments: Record<string, number | null>): number[] {
  const doorCounts: Record<number, number> = {};
  Object.values(assignments).forEach((d) => {
    if (d !== null) doorCounts[d] = (doorCounts[d] ?? 0) + 1;
  });
  return Object.entries(doorCounts)
    .filter(([, count]) => count > 1)
    .map(([door]) => Number(door));
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function DockPage() {
  // Manual: assign 3 of the 4 trucks to doors (one waits)
  const [manualAssign, setManualAssign] = useState<Record<string, number | null>>(
    Object.fromEntries(TRUCKS.map((t) => [t.id, null]))
  );
  const [solved, setSolved] = useState<ScheduleResult | null>(null);
  const [mode, setMode] = useState<"manual" | "solved">("manual");
  const [thinking, setThinking] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [manualMakespan, setManualMakespan] = useState<number | null>(null);

  const assignedCount = Object.values(manualAssign).filter((v) => v !== null).length;
  const conflicts = getConflicts(manualAssign);
  const readyToRun = assignedCount === 3 && conflicts.length === 0;

  const unassignedTruck = TRUCKS.find((t) => manualAssign[t.id] === null);

  const handleAssign = (truckId: string, door: number | null) => {
    if (mode === "solved") return;
    setManualAssign((prev) => ({ ...prev, [truckId]: door }));
    setShowResult(false);
    setManualMakespan(null);
  };

  const runManual = useCallback(() => {
    if (!readyToRun || !unassignedTruck) return;

    // Build manual schedule: 3 trucks in wave 1, 1 waits for the first free door
    const wave1: DoorAssignment[] = TRUCKS.filter((t) => manualAssign[t.id] !== null).map((t) => ({
      door: manualAssign[t.id]!,
      truck: t,
      startTime: 0,
      endTime: t.minutes,
    }));

    const firstFree = [...wave1].sort((a, b) => a.endTime - b.endTime)[0];
    const wave2: DoorAssignment = {
      door: firstFree.door,
      truck: unassignedTruck,
      startTime: firstFree.endTime,
      endTime: firstFree.endTime + unassignedTruck.minutes,
    };

    const makespan = Math.max(...wave1.map((a) => a.endTime), wave2.endTime);
    setManualMakespan(makespan);
    setShowResult(true);
  }, [readyToRun, unassignedTruck, manualAssign]);

  const runSolver = () => {
    setThinking(true);
    setSolved(null);
    setTimeout(() => {
      const result = solveSchedule(TRUCKS);
      setSolved(result);
      setMode("solved");
      setThinking(false);
    }, 1200);
  };

  const reset = () => {
    setManualAssign(Object.fromEntries(TRUCKS.map((t) => [t.id, null])));
    setSolved(null);
    setMode("manual");
    setThinking(false);
    setShowResult(false);
    setManualMakespan(null);
  };

  // Build assignment list for gantt from manual result
  const manualGanttAssignments: DoorAssignment[] = showResult && unassignedTruck
    ? TRUCKS.filter((t) => manualAssign[t.id] !== null).map((t) => ({
        door: manualAssign[t.id]!,
        truck: t,
        startTime: 0,
        endTime: t.minutes,
      })).concat((() => {
        const wave1 = TRUCKS.filter((t) => manualAssign[t.id] !== null).map((t) => ({
          door: manualAssign[t.id]!,
          truck: t,
          startTime: 0,
          endTime: t.minutes,
        }));
        const firstFree = [...wave1].sort((a, b) => a.endTime - b.endTime)[0];
        return [{
          door: firstFree.door,
          truck: unassignedTruck,
          startTime: firstFree.endTime,
          endTime: firstFree.endTime + unassignedTruck.minutes,
        }];
      })())
    : [];

  return (
    <div className="min-h-screen flex flex-col" style={{ background: BG }}>
      <NavBar />

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 py-8 space-y-6">
        {/* Title */}
        <div className="text-center">
          <div className="text-4xl mb-2">🏭🚛</div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">Dock Door Dilemma</h1>
          <p className="text-muted-foreground mt-2 max-w-xl mx-auto text-sm sm:text-base">
            4 trucks just arrived at a warehouse with only 3 dock doors. One truck must wait!
            Can you finish unloading all trucks as fast as possible? 🏆
          </p>
        </div>

        {/* Story cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {TRUCKS.map((t) => (
            <div
              key={t.id}
              className="rounded-xl border p-3 text-center"
              style={{ borderColor: `${t.color}40`, background: `${t.color}10` }}
            >
              <p className="text-3xl mb-1">{t.emoji}</p>
              <p className="font-bold text-sm">{t.name}</p>
              <p className="text-xs font-mono mt-1" style={{ color: t.color }}>
                {t.minutes} min
              </p>
              <p className="text-[10px] text-muted-foreground mt-0.5">to unload</p>
            </div>
          ))}
        </div>

        <div className="rounded-xl border border-border p-4 text-sm bg-card">
          <p className="font-semibold mb-2">📋 The Challenge</p>
          <ul className="space-y-1 text-muted-foreground list-disc list-inside">
            <li>You have <strong className="text-foreground">3 dock doors</strong>. All three can unload trucks <em>at the same time</em>.</li>
            <li>There are <strong className="text-foreground">4 trucks</strong> — so one must wait outside until a door opens up.</li>
            <li>Assign 3 trucks to the 3 doors. The 4th truck will automatically take the first door that becomes free.</li>
            <li>Goal: all 4 trucks done as <strong className="text-foreground">fast as possible</strong>!</li>
          </ul>
        </div>

        {/* Manual assignment */}
        {mode === "manual" && (
          <div className="space-y-4">
            <h2 className="font-bold text-lg">🎮 Your Turn — Assign Trucks to Doors</h2>
            <p className="text-xs text-muted-foreground">
              Click a door number (1, 2, 3) next to each truck to assign it. Pick 3 trucks for the first wave
              — the remaining one will wait.
            </p>

            <div className="space-y-3">
              {TRUCKS.map((t) => (
                <TruckCard
                  key={t.id}
                  truck={t}
                  assignedDoor={manualAssign[t.id]}
                  onAssign={(door) => handleAssign(t.id, door)}
                  isWaiting={assignedCount === 3 && manualAssign[t.id] === null}
                />
              ))}
            </div>

            {conflicts.length > 0 && (
              <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
                ⚠ Two trucks can't share the same door at the same time! Please change an assignment.
              </div>
            )}

            <div className="flex flex-wrap gap-3">
              <button
                onClick={runManual}
                disabled={!readyToRun}
                className="px-5 py-2.5 rounded-xl text-sm font-bold transition-all disabled:opacity-40"
                style={{ background: "oklch(0.72 0.22 200)", color: "oklch(0.06 0.02 260)" }}
              >
                {readyToRun ? "▶ Run My Schedule!" : `Assign exactly 3 trucks first (${assignedCount}/3)`}
              </button>

              <button
                onClick={reset}
                className="px-5 py-2.5 rounded-xl text-sm font-medium border border-border hover:bg-secondary transition-colors text-muted-foreground"
              >
                🔄 Reset
              </button>
            </div>

            {/* Manual result */}
            <AnimatePresence>
              {showResult && manualMakespan !== null && (
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4"
                >
                  <div className="rounded-xl border border-primary/30 bg-primary/10 p-4">
                    <p className="font-bold text-lg">
                      ⏱ Your schedule finishes in{" "}
                      <span className="text-primary font-mono">{manualMakespan} minutes</span>
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {manualMakespan === 30
                        ? "🏆 That's already optimal! Great thinking!"
                        : `Can you do better? The Smart Scheduler might find a faster way!`}
                    </p>
                  </div>

                  <div className="rounded-xl border border-border bg-card p-5">
                    <p className="font-semibold text-sm mb-4">📊 Your Schedule — Timeline</p>
                    <GanttChart assignments={manualGanttAssignments} makespan={Math.max(manualMakespan, 35)} />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Solved result */}
        <AnimatePresence>
          {mode === "solved" && solved && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-5"
            >
              <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-5">
                <p className="text-2xl font-bold mb-1">
                  🏆 Optimal Schedule:{" "}
                  <span className="text-amber-400 font-mono">{solved.makespan} minutes</span>
                </p>
                <p className="text-sm text-muted-foreground">
                  The Smart Scheduler checked every possible arrangement and found the fastest one.
                </p>
              </div>

              <div className="rounded-xl border border-border bg-card p-5">
                <p className="font-semibold text-sm mb-4">📊 Optimal Schedule — Timeline</p>
                <GanttChart assignments={solved.assignments} makespan={35} />
              </div>

              <div className="rounded-xl border border-border bg-card p-5">
                <p className="font-semibold text-sm mb-3">🔍 Step-by-step plan</p>
                <div className="space-y-2">
                  {solved.wave1.map((t, i) => (
                    <div
                      key={t.id}
                      className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm"
                      style={{ background: `${t.color}15`, borderLeft: `3px solid ${t.color}` }}
                    >
                      <span className="text-xl">{t.emoji}</span>
                      <span>
                        <strong>{t.name}</strong> starts unloading at <strong>Door {i + 1}</strong> — takes {t.minutes} min
                      </span>
                    </div>
                  ))}
                  {(() => {
                    const wave2Assign = solved.assignments.find((a) => a.truck.id === solved.wave2.id)!;
                    return (
                      <div
                        className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm"
                        style={{
                          background: `${solved.wave2.color}15`,
                          borderLeft: `3px solid ${solved.wave2.color}`,
                        }}
                      >
                        <span className="text-xl">{solved.wave2.emoji}</span>
                        <span>
                          <strong>{solved.wave2.name}</strong> waits outside, then starts at{" "}
                          <strong>Door {wave2Assign.door + 1}</strong> at minute {wave2Assign.startTime} — finishes at {wave2Assign.endTime} min
                        </span>
                      </div>
                    );
                  })()}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Smart Scheduler CTA */}
        <div className="flex flex-wrap gap-3">
          <button
            onClick={runSolver}
            disabled={thinking || mode === "solved"}
            className="px-6 py-3 rounded-xl text-sm font-bold transition-all disabled:opacity-50"
            style={{ background: "#f59e0b", color: "#1a0a00" }}
          >
            {thinking ? (
              <span className="flex items-center gap-2">
                <motion.span
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 0.7, ease: "linear" }}
                  className="inline-block"
                >
                  ⚙️
                </motion.span>
                Checking all arrangements…
              </span>
            ) : mode === "solved" ? (
              "✓ Best schedule shown!"
            ) : (
              "🤖 Smart Scheduler — Find Fastest Plan!"
            )}
          </button>

          {mode === "solved" && (
            <button
              onClick={reset}
              className="px-6 py-3 rounded-xl text-sm font-medium border border-border hover:bg-secondary transition-colors text-muted-foreground"
            >
              🔄 Try Again
            </button>
          )}
        </div>

        {/* Explainer */}
        <AnimatePresence>
          {mode === "solved" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-6"
            >
              <p className="text-xl font-bold mb-3">🧠 What just happened?</p>
              <div className="grid sm:grid-cols-3 gap-4 text-sm text-muted-foreground">
                <div>
                  <p className="font-semibold text-foreground flex items-center gap-2">
                    <span className="text-2xl">😰</span> The Problem
                  </p>
                  <p className="mt-1">
                    4 trucks, 3 doors — there are <strong className="text-foreground">24 different ways</strong> to
                    arrange the trucks. Some finish in 35 minutes. Some in 30. Without help, it's easy to pick a slow one.
                  </p>
                </div>
                <div>
                  <p className="font-semibold text-foreground flex items-center gap-2">
                    <span className="text-2xl">🤖</span> The Smart Scheduler
                  </p>
                  <p className="mt-1">
                    It tried all 24 arrangements in under a second. It knew that starting the <em>longest</em> truck
                    right away, and letting the fastest one wait, means no time is wasted.
                  </p>
                </div>
                <div>
                  <p className="font-semibold text-foreground flex items-center gap-2">
                    <span className="text-2xl">🌍</span> The Real World
                  </p>
                  <p className="mt-1">
                    Real warehouses handle <strong className="text-foreground">hundreds of trucks a day</strong> across
                    dozens of doors. With that scale, smart scheduling saves hours — and millions of dollars.
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
