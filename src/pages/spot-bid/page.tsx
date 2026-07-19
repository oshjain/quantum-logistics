import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import NavBar from "@/components/NavBar.tsx";
import { cn } from "@/lib/utils.ts";
import {
  LOADS,
  CARRIERS,
  evaluateManual,
  solveSpotBid,
  type BidResult,
} from "@/lib/spot-bid-solver.ts";

const fmt = (n: number) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

export default function SpotBidPage() {
  const [assignments, setAssignments] = useState<Record<string, string>>({});
  const [result, setResult] = useState<BidResult | null>(null);
  const [userResult, setUserResult] = useState<BidResult | null>(null);
  const [solved, setSolved] = useState(false);
  const [solving, setSolving] = useState(false);

  const liveResult = evaluateManual(assignments);

  const assignedCount = (cid: string) =>
    Object.values(assignments).filter((v) => v === cid).length;

  const setLoad = (loadId: string, carrierId: string) => {
    setAssignments((prev) => ({ ...prev, [loadId]: carrierId }));
    setResult(null);
    setSolved(false);
  };

  const handleCalculate = () => {
    setResult(evaluateManual(assignments));
  };

  const handleSolve = () => {
    // Save the user's manual result (if they ran Calculate first) for comparison.
    if (result) setUserResult(result);
    setSolving(true);
    setTimeout(() => {
      const best = solveSpotBid();
      const map: Record<string, string> = {};
      for (const a of best.assignments) {
        map[a.load.id] = a.carrier.id;
      }
      setAssignments(map);
      setResult(best);
      setSolved(true);
      setSolving(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-gray-100">
      <NavBar />

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 text-center"
        >
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
            💰 Spot Bid Battle
          </h1>
          <p className="mt-3 text-sm sm:text-base text-gray-400 max-w-2xl mx-auto leading-relaxed">
            You&apos;re a freight broker. 4 loads need carriers <span className="text-yellow-400 font-semibold">TODAY</span>.
            You have 3 carriers with different rates and limits.{" "}
            <span className="text-green-400 font-semibold">Match loads to carriers</span> to make the most profit — without overpromising!
          </p>
        </motion.div>

        {/* Live Profit Badge */}
        <motion.div
          className="flex justify-center mb-6"
          key={liveResult.totalProfit}
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
        >
          <div
            className={cn(
              "px-6 py-3 rounded-2xl text-xl font-bold border",
              liveResult.totalProfit > 0
                ? "bg-green-950/60 border-green-700 text-green-300"
                : "bg-gray-900 border-gray-700 text-gray-400"
            )}
          >
            Live Profit: {fmt(liveResult.totalProfit)}
            {!liveResult.allCovered && (
              <span className="ml-3 text-sm font-normal text-yellow-400">⚠ Issues detected</span>
            )}
          </div>
        </motion.div>

        {/* Main grid */}
        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          {/* Loads */}
          <div className="space-y-3">
            <h2 className="text-xs uppercase tracking-widest text-gray-500 font-semibold mb-1">
              Loads — Pick a Carrier
            </h2>
            {LOADS.map((load, i) => {
              const cid = assignments[load.id] ?? "";
              const asgn = liveResult.assignments.find((a) => a.load.id === load.id);
              const hasProblem = cid && asgn && !asgn.valid;

              return (
                <motion.div
                  key={load.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.06 }}
                  className={cn(
                    "rounded-xl border p-4 bg-gray-900/60 transition-colors",
                    hasProblem ? "border-red-600/60" : "border-gray-700/60"
                  )}
                >
                  <div className="flex items-start justify-between gap-2 flex-wrap">
                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ background: load.color }}
                        />
                        <span className="font-semibold text-white text-sm">{load.name}</span>
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5 ml-4">
                        {load.from} → {load.to} &nbsp;·&nbsp; {load.miles} mi
                      </p>
                      <p className="text-xs text-gray-300 ml-4 mt-0.5">
                        Shipper pays up to{" "}
                        <span className="text-green-400 font-bold">{fmt(load.maxRate)}</span>
                      </p>
                    </div>
                    <select
                      value={cid}
                      onChange={(e) => setLoad(load.id, e.target.value)}
                      className="bg-gray-800 border border-gray-600 rounded-lg px-3 py-1.5 text-sm text-white cursor-pointer focus:outline-none focus:border-primary"
                    >
                      <option value="">Unassigned</option>
                      {CARRIERS.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.emoji} {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  {/* Live margin row */}
                  {cid && asgn && (
                    <div className="mt-2 ml-4 flex flex-wrap gap-3 text-xs">
                      <span className="text-gray-400">
                        Carrier cost:{" "}
                        <span className="text-orange-300 font-medium">{fmt(asgn.carrierCost)}</span>
                      </span>
                      <span className="text-gray-400">
                        Margin:{" "}
                        <span
                          className={cn(
                            "font-bold",
                            asgn.profit >= 0 ? "text-green-400" : "text-red-400"
                          )}
                        >
                          {fmt(asgn.profit)}
                        </span>
                      </span>
                      {!asgn.valid && (
                        <span className="text-red-400">⚠ {asgn.reason}</span>
                      )}
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>

          {/* Carriers */}
          <div className="space-y-3">
            <h2 className="text-xs uppercase tracking-widest text-gray-500 font-semibold mb-1">
              Carriers — Capacity &amp; Rates
            </h2>
            {CARRIERS.map((c, i) => {
              const count = assignedCount(c.id);
              const over = count > c.maxLoads;
              return (
                <motion.div
                  key={c.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.08 }}
                  className={cn(
                    "rounded-xl border p-4 bg-gray-900/60",
                    over ? "border-red-600/60" : "border-gray-700/60"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{c.emoji}</span>
                      <div>
                        <p className="font-semibold text-white text-sm">{c.name}</p>
                        <p className="text-xs text-gray-400">{c.description}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold" style={{ color: c.color }}>
                        ${c.ratePerMile.toFixed(2)}/mi
                      </p>
                      <p className="text-xs text-gray-400">
                        Max: {c.maxLoads} load{c.maxLoads > 1 ? "s" : ""}
                      </p>
                    </div>
                  </div>
                  {/* Capacity bar */}
                  <div className="mt-3">
                    <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
                      <span>Assigned</span>
                      <span className={cn(over && "text-red-400 font-bold")}>
                        {count} / {c.maxLoads}
                        {over && " 🚨 OVER"}
                      </span>
                    </div>
                    <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                      <motion.div
                        className={cn(
                          "h-full rounded-full",
                          over ? "bg-red-500" : "bg-green-500"
                        )}
                        animate={{ width: `${Math.min((count / c.maxLoads) * 100, 100)}%` }}
                        transition={{ type: "spring", stiffness: 200, damping: 25 }}
                      />
                    </div>
                  </div>
                </motion.div>
              );
            })}

            {/* Action buttons */}
            <div className="flex gap-3 pt-2">
              <button
                onClick={handleCalculate}
                className="flex-1 bg-primary hover:bg-primary/80 text-primary-foreground font-semibold text-sm py-2.5 rounded-xl transition-colors cursor-pointer"
              >
                Calculate My Profit
              </button>
              <button
                onClick={handleSolve}
                disabled={solving}
                className="flex-1 bg-yellow-500 hover:bg-yellow-400 text-black font-semibold text-sm py-2.5 rounded-xl transition-colors cursor-pointer disabled:opacity-60"
              >
                {solving ? "🤖 Thinking…" : "🤖 Magic Matchmaker"}
              </button>
            </div>
          </div>
        </div>

        {/* Result breakdown */}
        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="rounded-2xl border border-gray-700 bg-gray-900/80 p-5 mb-6"
            >
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <h3 className="text-base font-bold text-white">
                  {solved ? "🤖 Optimal Assignment" : "📊 Your Assignment Results"}
                </h3>
                <div
                  className={cn(
                    "px-4 py-1.5 rounded-full text-sm font-bold",
                    result.totalProfit > 0
                      ? "bg-green-900/60 text-green-300 border border-green-700"
                      : "bg-red-900/60 text-red-300 border border-red-700"
                  )}
                >
                  Total Profit: {fmt(result.totalProfit)}
                </div>
              </div>

              {solved && (
                <p className="text-sm text-yellow-300 bg-yellow-950/40 border border-yellow-700/40 rounded-lg px-4 py-2 mb-4">
                  💡 <strong>Carrier Z</strong> (cheapest rate) gets the short run.{" "}
                  <strong>Carrier X</strong> (2-load capacity) takes the medium runs.{" "}
                  <strong>Carrier Y</strong> (most expensive) gets the highest-paying load.
                </p>
              )}

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-700 text-gray-400 text-left">
                      <th className="pb-2 font-medium">Load</th>
                      <th className="pb-2 font-medium">Route</th>
                      <th className="pb-2 font-medium">Carrier</th>
                      <th className="pb-2 font-medium text-right">Revenue</th>
                      <th className="pb-2 font-medium text-right">Carrier Cost</th>
                      <th className="pb-2 font-medium text-right">Profit</th>
                      <th className="pb-2 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.assignments.map((a) => (
                      <tr
                        key={a.load.id}
                        className="border-b border-gray-800/60 last:border-0"
                      >
                        <td className="py-2 font-medium" style={{ color: a.load.color }}>
                          {a.load.name}
                        </td>
                        <td className="py-2 text-gray-300">
                          {a.load.from} → {a.load.to}
                        </td>
                        <td className="py-2">
                          {a.valid || a.reason !== "Unassigned" ? (
                            <span>
                              {a.carrier.emoji} {a.carrier.name}
                            </span>
                          ) : (
                            <span className="text-gray-500 italic">None</span>
                          )}
                        </td>
                        <td className="py-2 text-right text-green-400">{fmt(a.brokerRevenue)}</td>
                        <td className="py-2 text-right text-orange-300">
                          {a.reason === "Unassigned" ? "—" : fmt(a.carrierCost)}
                        </td>
                        <td
                          className={cn(
                            "py-2 text-right font-bold",
                            a.profit > 0 ? "text-green-400" : a.profit === 0 ? "text-gray-400" : "text-red-400"
                          )}
                        >
                          {a.reason === "Unassigned" ? "—" : fmt(a.profit)}
                        </td>
                        <td className="py-2">
                          {a.valid ? (
                            <span className="text-green-400 text-xs">✓ OK</span>
                          ) : (
                            <span className="text-red-400 text-xs">✗ {a.reason}</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* User vs Quantum comparison */}
        <AnimatePresence>
          {solved && userResult && result && (
            <motion.div
              key="comparison"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 mb-6"
            >
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-blue-400">Your Assignment</p>
                  <p className="mt-1 text-xl font-black text-blue-400">{fmt(userResult.totalProfit)}</p>
                </div>
                <div className="text-center">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-green-400">Quantum Optimal</p>
                  <p className="mt-1 text-xl font-black text-green-400">{fmt(result.totalProfit)}</p>
                </div>
                <div className="text-center">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-amber-400">Extra Profit</p>
                  <p className="mt-1 text-xl font-black text-amber-400">
                    {fmt(Math.max(0, result.totalProfit - userResult.totalProfit))}
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* WOW Explainer */}
        {solved && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="rounded-2xl border border-gray-700/60 bg-gradient-to-br from-gray-900 to-gray-950 p-6"
        >
          <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-3">
            🧠 What&apos;s the Math Here?
          </h3>
          <div className="grid sm:grid-cols-3 gap-4 text-sm text-gray-300">
            <div className="bg-gray-800/50 rounded-xl p-4">
              <p className="font-semibold text-white mb-1">Broker Revenue</p>
              <p className="text-xs text-gray-400 leading-relaxed">
                The shipper pays you a flat rate per load (the max rate). You keep the spread between what
                they pay and what the carrier charges.
              </p>
            </div>
            <div className="bg-gray-800/50 rounded-xl p-4">
              <p className="font-semibold text-white mb-1">Carrier Cost</p>
              <p className="text-xs text-gray-400 leading-relaxed">
                Each carrier charges per mile. A 200-mile run at $1.80/mi costs{" "}
                <span className="text-orange-300">$360</span>. Longer runs &amp; higher rates eat your margin fast.
              </p>
            </div>
            <div className="bg-gray-800/50 rounded-xl p-4">
              <p className="font-semibold text-white mb-1">The Optimal Solution</p>
              <p className="text-xs text-gray-400 leading-relaxed">
                The solver enumerates all 81 possible assignments and picks the one with the{" "}
                <span className="text-green-400">highest total profit</span> where every carrier
                stays within their load limit.
              </p>
            </div>
          </div>
        </motion.div>
        )}
      </div>
    </div>
  );
}
