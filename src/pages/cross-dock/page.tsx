import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import NavBar from "@/components/NavBar.tsx";
import {
  getConfig,
  simulate,
  solveCrossDockExhaustive,
  fmt,
  fmtDuration,
  fmtDist,
  type CrossDockResult,
  type CrossDockConfig,
  type DoorAssign,
  type Difficulty,
} from "@/lib/cross-dock-solver.ts";
import { cn } from "@/lib/utils.ts";

const DIFFICULTIES: Difficulty[] = ["easy", "medium", "hard"];

// ── Yard layout mini-map ─────────────────────────────────────────────────────

function YardMap({ config }: { config: CrossDockConfig }) {
  const YARD_W = 200; // meters
  const YARD_H = 60;

  return (
    <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-4">
      <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3 text-center">
        🗺️ Yard Layout — Doors (top) → Outbound Lanes (bottom)
      </h3>
      <div className="relative mx-auto" style={{ width: 280, height: 120 }}>
        {/* Dock wall */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-zinc-600 rounded" />

        {/* Doors */}
        {config.doors.map((d) => (
          <div
            key={d.index}
            className="absolute -top-1 flex flex-col items-center"
            style={{ left: `${(d.x / YARD_W) * 100}%`, transform: "translateX(-50%)" }}
          >
            <div className="w-3 h-3 rounded bg-zinc-500 border border-zinc-400" />
            <span className="text-[9px] text-zinc-500 mt-0.5 whitespace-nowrap">{d.label}</span>
          </div>
        ))}

        {/* Outbound lanes */}
        {config.outbound.map((ob) => (
          <div
            key={ob.id}
            className="absolute bottom-0 flex flex-col items-center"
            style={{ left: `${(ob.x / YARD_W) * 100}%`, transform: "translateX(-50%)" }}
          >
            <span className="text-[9px] text-zinc-400 mb-0.5 whitespace-nowrap">{ob.name}</span>
            <div
              className="w-4 h-4 rounded-sm flex items-center justify-center text-[8px] font-bold"
              style={{ background: `${ob.color}44`, border: `1px solid ${ob.color}`, color: ob.color }}
            >
              {ob.destination}
            </div>
          </div>
        ))}

        {/* Distance example lines (show from middle door to each lane) */}
        {config.doors.length > 0 && config.outbound.length > 0 && (() => {
          const midDoor = config.doors[Math.floor(config.doors.length / 2)];
          return config.outbound.map((ob) => {
            const dist = Math.abs(midDoor.x - ob.x) + YARD_H;
            const midX = 50; // percentage
            const obX = (ob.x / YARD_W) * 100;
            return (
              <svg key={`line-${ob.id}`} className="absolute inset-0 pointer-events-none" style={{ overflow: "visible" }}>
                <line
                  x1={`${midX}%`} y1={8} x2={`${obX}%`} y2={108}
                  stroke={ob.color} strokeWidth={0.5} strokeDasharray="2,2" opacity={0.3}
                />
                <text
                  x={`${(midX + obX) / 2}%`} y={60}
                  fill={ob.color} fontSize={7} textAnchor="middle" opacity={0.5}
                >
                  {Math.round(dist)}m
                </text>
              </svg>
            );
          });
        })()}

        {/* Legend */}
        <div className="absolute bottom-0 right-0 text-[8px] text-zinc-600">
          {YARD_W}m × {YARD_H}m yard
        </div>
      </div>
    </div>
  );
}

// ── main page ────────────────────────────────────────────────────────────────
type Phase = "configuring" | "user-ran" | "solving" | "solved";

export default function CrossDockPage() {
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const config = useMemo(() => getConfig(difficulty), [difficulty]);

  const initDoorMap = (cfg: CrossDockConfig): Record<string, number | null> => {
    const m: Record<string, number | null> = {};
    for (const t of cfg.trucks) m[t.id] = null;
    return m;
  };

  const [doorMap, setDoorMap] = useState<Record<string, number | null>>(() => initDoorMap(getConfig("medium")));
  const [userResult, setUserResult] = useState<CrossDockResult | null>(null);
  const [optimalResult, setOptimalResult] = useState<CrossDockResult | null>(null);
  const [phase, setPhase] = useState<Phase>("configuring");
  const [solving, setSolving] = useState(false);
  const [permutationsChecked, setPermutationsChecked] = useState(0);

  const allAssigned = config.trucks.every((t) => doorMap[t.id] !== null);
  const hasCollision = (() => {
    const used = new Set<number>();
    for (const t of config.trucks) {
      const d = doorMap[t.id];
      if (d !== null) {
        if (used.has(d)) return true;
        used.add(d);
      }
    }
    return false;
  })();

  const locked = phase === "solving";

  const handleDifficulty = (d: Difficulty) => {
    setDifficulty(d);
    const cfg = getConfig(d);
    setDoorMap(initDoorMap(cfg));
    setUserResult(null);
    setOptimalResult(null);
    setPhase("configuring");
  };

  const assign = (id: string, door: number) => {
    if (locked) return;
    setDoorMap((p) => ({ ...p, [id]: door }));
    setUserResult(null);
    setOptimalResult(null);
    setPhase("configuring");
  };

  const handleRun = () => {
    if (!allAssigned || hasCollision) return;
    const das: DoorAssign[] = config.trucks.map((t) => ({
      inbound: t,
      door: doorMap[t.id] as number,
    }));
    const r = simulate(das, config.outbound, config.doors);
    setUserResult(r);
    setOptimalResult(null);
    setPhase("user-ran");
  };

  const handleSmartSolve = () => {
    setSolving(true);
    setPhase("solving");
    setTimeout(() => {
      const { result, totalChecked } = solveCrossDockExhaustive(config);
      setOptimalResult(result);
      setPermutationsChecked(totalChecked);
      setPhase("solved");
      setSolving(false);
    }, 1000);
  };

  const handleReset = () => {
    setDoorMap(initDoorMap(config));
    setUserResult(null);
    setOptimalResult(null);
    setPhase("configuring");
  };

  const displayResult = phase === "solved" && optimalResult ? optimalResult : userResult;

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <NavBar />
      <main className="max-w-5xl mx-auto px-4 py-8 space-y-8">

        {/* ── Title ── */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="text-center space-y-3">
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight">🏭 Cross-Dock Sprint</h1>
          <p className="text-zinc-400 max-w-2xl mx-auto text-sm leading-relaxed">
            Inbound trucks arrive with mixed pallets. Outbound trucks have hard departure deadlines.
            <strong className="text-white"> Door position matters —</strong> forklift travel time depends on
            the distance between the assigned door and each outbound lane. Assign strategically!
          </p>
        </motion.div>

        {/* ── Difficulty ── */}
        <div className="flex justify-center gap-2">
          {DIFFICULTIES.map((d) => {
            const cfg = getConfig(d);
            return (
              <button
                key={d}
                onClick={() => handleDifficulty(d)}
                disabled={solving}
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer border",
                  difficulty === d
                    ? "bg-white/15 border-white/30 text-white shadow-lg"
                    : "bg-white/5 border-white/10 text-white/50 hover:text-white/80 hover:border-white/20",
                )}
              >
                {cfg.label}
              </button>
            );
          })}
        </div>
        <p className="text-center text-zinc-500 text-xs -mt-6">
          {config.desc} · {config.totalPermutations} possible door arrangements · doors spaced 20m apart
        </p>

        {/* ── Yard Map ── */}
        <YardMap config={config} />

        {/* ── Inbound trucks ── */}
        <section>
          <h2 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4">
            🚛 Inbound Trucks — Assign to Doors (strategic!)
          </h2>
          <div className={cn(
            "grid gap-4",
            config.trucks.length <= 3 ? "grid-cols-1 sm:grid-cols-3" : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-5",
          )}>
            {config.trucks.map((t) => (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-zinc-900 border border-zinc-700 rounded-xl p-4 space-y-3"
              >
                <div className="flex items-center gap-2">
                  <span className="text-xl">{t.emoji}</span>
                  <div>
                    <p className="font-bold text-white">{t.name}</p>
                    <p className="text-xs text-zinc-400">Arrives {fmt(t.arrival)}</p>
                  </div>
                </div>
                <div className="space-y-1">
                  {t.pallets.map((pg) => (
                    <div key={pg.destination} className="flex items-center gap-2 text-xs">
                      <span className="w-5 h-5 rounded bg-zinc-700 flex items-center justify-center text-xs font-bold text-zinc-200">
                        {pg.destination}
                      </span>
                      <div className="flex gap-0.5">
                        {Array.from({ length: Math.min(pg.count, 8) }).map((_, i) => (
                          <div key={i} className="w-2.5 h-2.5 rounded-sm opacity-60" style={{ background: t.color }} />
                        ))}
                        {pg.count > 8 && <span className="text-zinc-500 text-[10px]">+{pg.count - 8}</span>}
                      </div>
                      <span className="text-zinc-500 ml-auto">{pg.count}</span>
                    </div>
                  ))}
                </div>
                <div>
                  <p className="text-xs text-zinc-500 mb-1.5">Door (check yard map ↑):</p>
                  <div className="flex gap-1.5 flex-wrap">
                    {config.doors.map((d) => (
                      <button
                        key={d.index}
                        onClick={() => assign(t.id, d.index)}
                        disabled={locked}
                        className={cn(
                          "w-9 h-9 rounded-lg text-xs font-bold border transition-all cursor-pointer",
                          doorMap[t.id] === d.index
                            ? "bg-primary border-primary text-white scale-110"
                            : "bg-zinc-800 border-zinc-600 text-zinc-300 hover:border-zinc-400",
                          locked && "opacity-50 cursor-not-allowed",
                        )}
                      >
                        {d.index + 1}
                      </button>
                    ))}
                  </div>
                  {doorMap[t.id] !== null && (
                    <p className="text-xs mt-1" style={{ color: t.color }}>
                      → Door {doorMap[t.id]! + 1} (x={config.doors[doorMap[t.id]!].x}m)
                    </p>
                  )}
                </div>
              </motion.div>
            ))}
          </div>

          {hasCollision && (
            <p className="text-amber-400 text-xs mt-3 text-center">
              ⚠ Two trucks on the same door — each needs a unique door.
            </p>
          )}

          <div className="flex gap-3 mt-5 justify-center flex-wrap">
            <button
              onClick={handleRun}
              disabled={!allAssigned || hasCollision || solving}
              className={cn(
                "px-6 py-2.5 rounded-lg font-bold text-sm transition-all cursor-pointer",
                allAssigned && !hasCollision && !solving
                  ? "bg-primary text-white hover:brightness-110"
                  : "bg-zinc-700 text-zinc-500 cursor-not-allowed",
              )}
            >
              ▶ Run My Schedule
            </button>
            <button
              onClick={handleSmartSolve}
              disabled={solving}
              className={cn(
                "px-6 py-2.5 rounded-lg font-bold text-sm transition-all cursor-pointer",
                "bg-gradient-to-r from-violet-600 to-indigo-600 border border-violet-400/40 text-white",
                solving && "opacity-60 cursor-not-allowed",
              )}
            >
              {solving ? "🤔 Analyzing…" : "🤖 Smart Terminal Manager"}
            </button>
            <button
              onClick={handleReset}
              className="px-5 py-2.5 rounded-lg font-bold text-sm bg-zinc-800 text-zinc-300 hover:bg-zinc-700 cursor-pointer"
            >
              Reset
            </button>
          </div>
        </section>

        {/* ── Comparison banner ── */}
        <AnimatePresence>
          {phase === "solved" && userResult && optimalResult && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-5"
            >
              <p className="text-lg font-extrabold text-amber-400 text-center mb-4">
                🤖 Smart Terminal Manager — Results Compared
              </p>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-blue-400">Your Assignment</p>
                  <p className="mt-1 text-xl font-black text-blue-400">{fmt(userResult.totalTime)}</p>
                  <p className="text-xs text-zinc-400">{fmtDist(userResult.totalTravel)} traveled</p>
                  <p className="text-xs text-zinc-400">{userResult.onTimeCount}/{userResult.totalOutbound} on time</p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-green-400">Optimal</p>
                  <p className="mt-1 text-xl font-black text-green-400">{fmt(optimalResult.totalTime)}</p>
                  <p className="text-xs text-zinc-400">{fmtDist(optimalResult.totalTravel)} traveled</p>
                  <p className="text-xs text-zinc-400">{optimalResult.onTimeCount}/{optimalResult.totalOutbound} on time</p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-amber-400">
                    {userResult.totalTravel > optimalResult.totalTravel ? "Distance Saved" : "Delta"}
                  </p>
                  <p className={cn(
                    "mt-1 text-xl font-black",
                    userResult.totalTravel > optimalResult.totalTravel ? "text-green-400"
                      : userResult.totalTravel === optimalResult.totalTravel ? "text-green-400"
                        : "text-zinc-400",
                  )}>
                    {userResult.totalTravel > optimalResult.totalTravel
                      ? `−${fmtDist(userResult.totalTravel - optimalResult.totalTravel)}`
                      : userResult.totalTravel === optimalResult.totalTravel
                        ? "Optimal!"
                        : "—"}
                  </p>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    {optimalResult.onTimeCount > userResult.onTimeCount
                      ? `+${optimalResult.onTimeCount - userResult.onTimeCount} more on-time`
                      : optimalResult.onTimeCount === userResult.onTimeCount
                        ? "Same on-time"
                        : ""}
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Forklift Schedule ── */}
        <AnimatePresence>
          {displayResult && (
            <motion.section
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0 }}
              className="overflow-hidden"
            >
              <h2 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4">
                🚜 Forklift Schedule {phase === "solved" ? "(Optimal)" : "(Your Run)"}
              </h2>
              <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-5 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-zinc-400 text-xs border-b border-zinc-700">
                      {["FL", "From", "To", "Pallets", "Distance", "Travel", "Start", "End"].map((h) => (
                        <th key={h} className="text-left pb-2 pr-3">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {displayResult.forkMoves.map((m, i) => {
                      const ob = config.outbound.find((o) => o.id === m.to);
                      return (
                        <motion.tr
                          key={i}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.04 }}
                          className="border-b border-zinc-800 last:border-0"
                        >
                          <td className="py-2 pr-3">
                            <span className={cn(
                              "px-1.5 py-0.5 rounded text-xs font-bold",
                              m.forklift === 0 ? "bg-blue-900/50 text-blue-300" : "bg-amber-900/50 text-amber-300",
                            )}>
                              F{m.forklift + 1}
                            </span>
                          </td>
                          <td className="py-2 pr-3 text-zinc-300 text-xs">{m.from}</td>
                          <td className="py-2 pr-3">
                            <span
                              className="px-2 py-0.5 rounded text-xs font-bold"
                              style={{ background: `${ob?.color ?? "#fff"}22`, color: ob?.color ?? "#fff" }}
                            >
                              {ob?.name ?? m.to}
                            </span>
                          </td>
                          <td className="py-2 pr-3 text-zinc-300">{m.pallets}</td>
                          <td className="py-2 pr-3 text-zinc-400 text-xs">{m.travelDist}m</td>
                          <td className="py-2 pr-3 text-zinc-400 text-xs">{m.travelTime.toFixed(1)}m</td>
                          <td className="py-2 pr-3 text-zinc-300 text-xs">{fmt(m.startTime)}</td>
                          <td className="py-2 text-zinc-300 text-xs">{fmt(m.endTime)}</td>
                        </motion.tr>
                      );
                    })}
                  </tbody>
                </table>
                <div className="mt-3 pt-3 border-t border-zinc-700 flex justify-between text-xs text-zinc-500">
                  <span>Total: {displayResult.forkMoves.length} moves</span>
                  <span>Total travel: <strong className="text-zinc-300">{fmtDist(displayResult.totalTravel)}</strong></span>
                </div>
              </div>
            </motion.section>
          )}
        </AnimatePresence>

        {/* ── Outbound status ── */}
        <section>
          <h2 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4">
            📦 Outbound Trucks
          </h2>
          <div className={cn(
            "grid gap-3",
            config.outbound.length <= 4 ? "grid-cols-2 sm:grid-cols-4"
              : "grid-cols-2 sm:grid-cols-3 lg:grid-cols-6",
          )}>
            {config.outbound.map((t) => {
              const late = displayResult ? displayResult.lateOutbound.includes(t.name) : null;
              const onTime = displayResult ? !late : null;
              return (
                <motion.div
                  key={t.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn(
                    "bg-zinc-900 border rounded-xl p-3 space-y-1 transition-colors",
                    onTime === true && "border-green-500/60",
                    onTime === false && "border-red-500/60",
                    onTime === null && "border-zinc-700",
                  )}
                >
                  <div className="flex items-center justify-between">
                    <p className="font-bold text-white text-sm">{t.name}</p>
                    <AnimatePresence>
                      {displayResult && (
                        <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }}
                          className={cn("text-sm font-bold", onTime ? "text-green-400" : "text-red-400")}>
                          {onTime ? "✓" : "✗"}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </div>
                  <p className="text-xs text-zinc-400">
                    Departs <span className="text-zinc-200">{fmt(t.departure)}</span>
                  </p>
                  <p className="text-xs text-zinc-400">
                    <span className="font-bold" style={{ color: t.color }}>{t.destination}</span>
                    {" · "}{t.neededPallets} plts · x={t.x}m
                  </p>
                  {displayResult && (
                    <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      className={cn("text-xs font-medium", onTime ? "text-green-400" : "text-red-400")}>
                      {onTime ? "On time ✓" : "Late ✗"}
                    </motion.p>
                  )}
                </motion.div>
              );
            })}
          </div>
        </section>

        {/* ── Result badge ── */}
        <AnimatePresence>
          {displayResult && (
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
              className={cn("text-center py-4 rounded-2xl border font-black text-lg",
                displayResult.allOnTime
                  ? "bg-green-900/30 border-green-500/50 text-green-400"
                  : "bg-red-900/30 border-red-500/50 text-red-400")}>
              {displayResult.allOnTime
                ? `✅ All ${displayResult.totalOutbound} on time! ${fmtDist(displayResult.totalTravel)} traveled · Finish ${fmt(displayResult.totalTime)}`
                : `⚠ ${displayResult.lateOutbound.length}/${displayResult.totalOutbound} late — ${displayResult.lateOutbound.join(", ")}`}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Quantum Explanation ── */}
        <AnimatePresence>
          {phase === "solved" && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ delay: 0.3, duration: 0.4 }}
              className="rounded-xl border border-white/10 bg-white/5 p-6"
            >
              <h2 className="text-lg font-bold text-white text-center mb-5">
                ⚛️ How the Smart Terminal Manager Optimizes the Yard
              </h2>
              <div className="grid sm:grid-cols-3 gap-4 text-sm">
                <div className="rounded-lg bg-white/5 border border-white/10 p-4 space-y-2">
                  <p className="font-semibold text-violet-400 text-base">🔢 Distance-Based Search</p>
                  <p className="text-zinc-400">
                    Every door→lane pair has a different travel distance. A truck full of <strong className="text-white">destination A</strong>{" "}
                    pallets should park near lane A. The Manager checked{" "}
                    <strong className="text-white">all {permutationsChecked} permutations</strong> to minimize total
                    forklift travel distance while keeping every truck on time.
                  </p>
                </div>
                <div className="rounded-lg bg-white/5 border border-white/10 p-4 space-y-2">
                  <p className="font-semibold text-indigo-400 text-base">⚡ Grover's Quantum Speedup</p>
                  <p className="text-zinc-400">
                    Classical: check each of the <strong className="text-white">{config.totalPermutations} arrangements</strong> one-by-one —{" "}
                    <strong className="text-white">O(N!)</strong>. Quantum (Grover's search): find the optimal
                    in <strong className="text-white">O(√N!)</strong> — a quadratic speedup.
                    For {config.totalPermutations} options, that's ~{Math.ceil(Math.sqrt(config.totalPermutations))} quantum
                    evaluations vs {config.totalPermutations} classical.
                  </p>
                </div>
                <div className="rounded-lg bg-white/5 border border-white/10 p-4 space-y-2">
                  <p className="font-semibold text-green-400 text-base">🏭 Real Impact</p>
                  <p className="text-zinc-400">
                    A real cross-dock handles <strong className="text-white">50+ trucks and 100+ doors</strong>{" "}
                    with complex distance matrices. The permutations explode to 10⁶⁰+.{" "}
                    Quantum optimization finds near-optimal yard layouts in seconds vs millennia — saving
                    millions in fuel, labor, and demurrage fees.
                  </p>
                </div>
              </div>
              <div className="mt-5 pt-4 border-t border-white/10 text-center">
                <p className="text-xs text-zinc-500">
                  Checked <strong className="text-zinc-300">{permutationsChecked}</strong> of{" "}
                  <strong className="text-zinc-300">{config.totalPermutations}</strong> arrangements
                  {" · "}Optimal:{" "}
                  <strong className="text-zinc-300">{fmtDist(optimalResult?.totalTravel ?? 0)}</strong> traveled,{" "}
                  <strong className="text-zinc-300">{fmt(optimalResult?.totalTime ?? 0)}</strong> finish,{" "}
                  <strong className="text-zinc-300">{optimalResult?.onTimeCount}/{optimalResult?.totalOutbound}</strong> on time
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </main>
    </div>
  );
}