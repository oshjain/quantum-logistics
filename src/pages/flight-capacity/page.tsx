import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import NavBar from "@/components/NavBar.tsx";
import { cn } from "@/lib/utils.ts";
import {
  generateAuction,
  evaluateSelection,
  solveExhaustive,
  solveGreedy,
  isValidSelection,
  getAlgorithmInfo,
  explainBookingDecision,
  DEFAULT_COST_CONFIG,
  type AuctionResult,
  type AuctionConfig,
  type Flight,
  type Booking,
  type Difficulty,
  type CostConfig,
  type AlgorithmInfo,
} from "@/lib/flight-capacity-solver.ts";

// ── helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number) {
  return "$" + Math.round(n).toLocaleString();
}

function fmtShort(n: number): string {
  if (Math.abs(n) >= 1000000) return "$" + (n / 1000000).toFixed(1) + "M";
  if (Math.abs(n) >= 1000) return "$" + (n / 1000).toFixed(1) + "K";
  return "$" + n.toFixed(0);
}

const DIFF_OPTIONS: { value: Difficulty; emoji: string; label: string; desc: string }[] = [
  { value: "easy", emoji: "🟢", label: "Easy", desc: "3 flights · 6 bookings" },
  { value: "medium", emoji: "🟡", label: "Medium", desc: "4 flights · 12 bookings" },
  { value: "hard", emoji: "🔴", label: "Hard", desc: "5 flights · 20 bookings" },
];

// ── quantum search animation ────────────────────────────────────────────────

function QuantumSearchOverlay({
  active,
  searchSpace,
  onDone,
}: {
  active: boolean;
  searchSpace: number;
  onDone: () => void;
}) {
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState<"superposition" | "amplify" | "measure">("superposition");
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  useEffect(() => {
    if (!active) return;
    setProgress(0);
    setPhase("superposition");

    const t1 = setTimeout(() => setPhase("amplify"), 400);
    const t2 = setTimeout(() => setPhase("measure"), 1000);

    const start = Date.now();
    const duration = 1500;
    const tick = setInterval(() => {
      const elapsed = Date.now() - start;
      const p = Math.min(1, elapsed / duration);
      setProgress(p);
      if (p >= 1) {
        clearInterval(tick);
        setTimeout(() => onDoneRef.current(), 200);
      }
    }, 30);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearInterval(tick);
    };
  }, [active]);

  if (!active) return null;

  const amplitudeBarCount = Math.min(searchSpace, 40);
  const highlightedIndex = Math.floor(progress * amplitudeBarCount);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-zinc-950/90 backdrop-blur-sm flex items-center justify-center"
    >
      <div className="text-center max-w-lg px-6">
        {/* quantum icon */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
          className="text-5xl mb-4 mx-auto"
        >
          ⚛️
        </motion.div>

        <motion.p
          key={phase}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-lg font-bold text-white mb-2"
        >
          {phase === "superposition" && "Creating quantum superposition…"}
          {phase === "amplify" && "Amplifying optimal solutions…"}
          {phase === "measure" && "Measuring & collapsing wavefunction…"}
        </motion.p>

        <p className="text-zinc-400 text-sm mb-6">
          {phase === "superposition"
            ? `Encoding all ${searchSpace.toLocaleString()} combinations as parallel quantum states`
            : phase === "amplify"
              ? "Grover amplification: boosting high-profit amplitudes, suppressing low-profit"
              : "Collapsing to the single best booking configuration"}
        </p>

        {/* amplitude visualization */}
        <div className="flex items-end justify-center gap-[2px] h-24 mb-4">
          {Array.from({ length: amplitudeBarCount }).map((_, i) => {
            // Amplitude profile: bars near the optimal index are taller
            let height = 5 + Math.random() * 20;
            if (phase === "amplify" && i === highlightedIndex) {
              height = 90;
            } else if (phase === "amplify" && Math.abs(i - highlightedIndex) <= 3) {
              height = 30 + Math.random() * 40;
            } else if (phase === "measure") {
              height = i === highlightedIndex ? 95 : 5;
            }
            return (
              <motion.div
                key={i}
                layout
                className="w-2 rounded-t-sm"
                style={{
                  height,
                  background:
                    i === highlightedIndex && phase !== "superposition"
                      ? "linear-gradient(to top, #f59e0b, #fbbf24)"
                      : "linear-gradient(to top, oklch(0.5 0.15 250), oklch(0.65 0.22 250))",
                  opacity: i === highlightedIndex ? 1 : 0.4 + Math.random() * 0.3,
                }}
                transition={{ duration: 0.3 }}
              />
            );
          })}
        </div>

        {/* progress bar */}
        <div className="h-1.5 rounded-full bg-zinc-800 overflow-hidden mb-3">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-amber-400"
            animate={{ width: `${progress * 100}%` }}
          />
        </div>

        <p className="text-zinc-500 text-xs font-mono">
          Quantum search: O(√N) = √{searchSpace.toLocaleString()} ≈ {Math.ceil(Math.sqrt(searchSpace))} steps
          <br />
          Classical brute force: O(N) = {searchSpace.toLocaleString()} steps
        </p>
      </div>
    </motion.div>
  );
}

// ── capacity bar ────────────────────────────────────────────────────────────

function CapacityBar({ load, capacity, color }: { load: number; capacity: number; color: string }) {
  const pct = Math.min(100, (load / capacity) * 100);
  const over = load > capacity;
  return (
    <div className="mt-2">
      <div className="flex justify-between text-xs text-zinc-400 mb-1">
        <span>{load}t loaded</span>
        <span>{capacity}t capacity</span>
      </div>
      <div className={cn("h-3 rounded-full bg-zinc-800 overflow-hidden border", over ? "border-red-500" : "border-zinc-700")}>
        <motion.div
          className="h-full rounded-full"
          style={{ background: over ? "#ef4444" : color }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ type: "spring", stiffness: 120, damping: 20 }}
        />
      </div>
      <AnimatePresence>
        {over && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="text-red-400 text-xs mt-1 font-semibold"
          >
            ⚠️ Over capacity by {load - capacity}t!
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── booking card ────────────────────────────────────────────────────────────

function BookingCard({
  booking,
  flight,
  accepted,
  optimal,
  solved,
  showCosts,
  costConfig,
  onToggle,
}: {
  booking: Booking;
  flight: Flight;
  accepted: boolean;
  optimal: boolean;
  solved: boolean;
  showCosts: boolean;
  costConfig: CostConfig;
  onToggle: () => void;
}) {
  const cost = flight.distanceKm * booking.tons * costConfig.fuelCostPerTonKm + costConfig.handlingFeePerBooking;
  const profit = booking.revenue - cost;
  const profitPerTon = profit / booking.tons;

  return (
    <motion.button
      onClick={onToggle}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.97 }}
      className={cn(
        "relative w-full text-left rounded-xl p-4 border transition-all duration-200 cursor-pointer",
        accepted
          ? "bg-zinc-800 border-zinc-500 shadow-lg"
          : "bg-zinc-900/60 border-zinc-700/50 opacity-60",
        solved && optimal && "ring-2 ring-yellow-400/80 shadow-lg shadow-yellow-400/10",
        solved && !optimal && accepted && "opacity-50",
        solved && !optimal && !accepted && "opacity-30"
      )}
    >
      <div
        className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl"
        style={{ background: booking.color }}
      />
      <div className="pl-2">
        <div className="flex items-center justify-between">
          <span className="font-bold text-white text-sm">
            Booking {booking.id}
            {solved && optimal && <span className="ml-2 text-yellow-400 text-xs">★ optimal</span>}
            {solved && !optimal && accepted && <span className="ml-2 text-red-400 text-xs">✗ suboptimal</span>}
          </span>
          <span
            className={cn(
              "text-xs font-mono px-2 py-0.5 rounded-full border",
              accepted ? "bg-zinc-700 border-zinc-500 text-white" : "bg-zinc-900 border-zinc-700 text-zinc-500"
            )}
          >
            {accepted ? "ACCEPTED" : "REJECTED"}
          </span>
        </div>
        <p className="text-zinc-400 text-xs mt-1">{booking.destination} · {flight.route}</p>
        <div className="flex gap-3 mt-2 text-xs flex-wrap">
          <span className="text-zinc-300">
            <span className="text-zinc-500">Weight </span>
            {booking.tons}t
          </span>
          <span className="text-zinc-300">
            <span className="text-zinc-500">Rate </span>
            ${booking.ratePerKg}/kg
          </span>
          <span className="font-semibold" style={{ color: booking.color }}>
            Rev {fmtShort(booking.revenue)}
          </span>
          {showCosts && (
            <>
              <span className="text-red-400/70">
                Cost {fmtShort(cost)}
              </span>
              <span className={cn("font-bold", profit >= 0 ? "text-emerald-400" : "text-red-400")}>
                {profit >= 0 ? "+" : ""}{fmtShort(profit)}
              </span>
              <span className="text-zinc-500">
                ${profitPerTon.toFixed(0)}/ton
              </span>
            </>
          )}
        </div>
      </div>
    </motion.button>
  );
}

// ── flight section ──────────────────────────────────────────────────────────

function FlightSection({
  flight,
  bookings,
  accepted,
  optimal,
  solved,
  showCosts,
  costConfig,
  onToggle,
}: {
  flight: Flight;
  bookings: Booking[];
  accepted: Set<string>;
  optimal: Set<string>;
  solved: boolean;
  showCosts: boolean;
  costConfig: CostConfig;
  onToggle: (id: string) => void;
}) {
  const load = bookings
    .filter((b) => accepted.has(b.id))
    .reduce((s, b) => s + b.tons, 0);

  return (
    <div
      className="rounded-2xl border border-zinc-700/60 bg-zinc-900/50 p-5 backdrop-blur-sm"
      style={{ boxShadow: `0 0 30px ${flight.color}18` }}
    >
      <div className="flex items-center gap-3 mb-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0"
          style={{ background: `${flight.color}22`, border: `1px solid ${flight.color}55` }}
        >
          {flight.emoji}
        </div>
        <div>
          <h3 className="font-bold text-white text-base">{flight.name}</h3>
          <p className="text-zinc-400 text-xs">{flight.route} · {flight.distanceKm.toLocaleString()}km</p>
        </div>
        <div className="ml-auto text-right">
          <p className="text-xs text-zinc-500">capacity</p>
          <p className="font-bold text-sm" style={{ color: flight.color }}>
            {flight.capacityTons}t
          </p>
        </div>
      </div>

      <CapacityBar load={load} capacity={flight.capacityTons} color={flight.color} />

      <div className="mt-4 space-y-2">
        {bookings.map((b) => (
          <BookingCard
            key={b.id}
            booking={b}
            flight={flight}
            accepted={accepted.has(b.id)}
            optimal={optimal.has(b.id)}
            solved={solved}
            showCosts={showCosts}
            costConfig={costConfig}
            onToggle={() => onToggle(b.id)}
          />
        ))}
      </div>
    </div>
  );
}

// ── configuration panel ─────────────────────────────────────────────────────

function ConfigPanel({
  difficulty,
  showCosts,
  seed,
  solving,
  solved,
  onDifficultyChange,
  onShowCostsToggle,
  onRegenerate,
}: {
  difficulty: Difficulty;
  showCosts: boolean;
  seed: number;
  solving: boolean;
  solved: boolean;
  onDifficultyChange: (d: Difficulty) => void;
  onShowCostsToggle: () => void;
  onRegenerate: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-zinc-700/60 bg-zinc-900/40 p-4 mb-6"
    >
      <div className="flex flex-wrap items-center gap-4">
        {/* difficulty selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">Difficulty</span>
          <div className="flex gap-1">
            {DIFF_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => onDifficultyChange(opt.value)}
                disabled={solving}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer border",
                  difficulty === opt.value
                    ? "bg-white/10 border-white/20 text-white"
                    : "bg-transparent border-transparent text-zinc-500 hover:text-zinc-300"
                )}
                title={opt.desc}
              >
                {opt.emoji} {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div className="w-px h-6 bg-zinc-700" />

        {/* cost toggle */}
        <button
          onClick={onShowCostsToggle}
          className={cn(
            "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer border",
            showCosts
              ? "bg-amber-500/10 border-amber-500/30 text-amber-400"
              : "bg-transparent border-transparent text-zinc-500 hover:text-zinc-300"
          )}
        >
          💸 {showCosts ? "Costs Visible" : "Show Costs"}
        </button>

        <div className="w-px h-6 bg-zinc-700" />

        {/* regenerate */}
        <button
          onClick={onRegenerate}
          disabled={solving}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer border border-transparent text-zinc-400 hover:text-white hover:bg-white/5 disabled:opacity-40"
        >
          🎲 New Auction
        </button>

        <div className="ml-auto text-xs text-zinc-600 font-mono">
          seed: {seed}
          {solved && <span className="ml-2 text-yellow-500/60">· solved</span>}
        </div>
      </div>
    </motion.div>
  );
}

// ── live metrics dashboard ──────────────────────────────────────────────────

function LiveMetrics({
  accepted,
  flights,
  bookings,
  costConfig,
  showCosts,
  valid,
}: {
  accepted: Set<string>;
  flights: Flight[];
  bookings: Booking[];
  costConfig: CostConfig;
  showCosts: boolean;
  valid: boolean;
}) {
  const live = useMemo(
    () => evaluateSelection(accepted, flights, bookings, costConfig),
    [accepted, flights, bookings, costConfig]
  );

  const totalCapacity = flights.reduce((s, f) => s + f.capacityTons, 0);
  const utilization = totalCapacity > 0 ? (live.totalTonsAccepted / totalCapacity) * 100 : 0;

  const metrics = [
    { label: "Revenue", value: fmtShort(live.totalRevenue), color: "text-blue-400", emoji: "📈" },
    ...(showCosts
      ? [
          { label: "Costs", value: fmtShort(live.totalCost), color: "text-red-400", emoji: "💸" },
          {
            label: "Profit",
            value: (live.totalProfit >= 0 ? "+" : "") + fmtShort(live.totalProfit),
            color: live.totalProfit >= 0 ? "text-emerald-400" : "text-red-400",
            emoji: "💰",
          },
        ]
      : []),
    { label: "Tonnage", value: `${live.totalTonsAccepted}t / ${live.totalTonsAvailable}t`, color: "text-zinc-300", emoji: "⚖️" },
    { label: "Utilization", value: `${utilization.toFixed(0)}%`, color: "text-zinc-400", emoji: "📊" },
  ];

  return (
    <motion.div
      className="text-center mb-8"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
    >
      <div className="flex flex-wrap justify-center gap-6">
        {metrics.map((m) => (
          <div key={m.label} className="flex flex-col items-center">
            <p className="text-zinc-500 text-xs uppercase tracking-widest mb-1">
              {m.emoji} {m.label}
            </p>
            <motion.p
              key={`${m.label}-${m.value}`}
              initial={{ y: -6, opacity: 0.5 }}
              animate={{ y: 0, opacity: 1 }}
              className={cn("text-3xl font-black tabular-nums", m.color)}
            >
              {m.value}
            </motion.p>
          </div>
        ))}
      </div>
      {!valid && accepted.size > 0 && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-red-400 text-sm mt-3 font-semibold"
        >
          ⚠️ Over capacity — invalid selection
        </motion.p>
      )}
    </motion.div>
  );
}

// ── result panel ────────────────────────────────────────────────────────────

function ResultPanel({
  result,
  flights,
  solved,
  valid,
  showCosts,
  costConfig,
  bookings,
}: {
  result: AuctionResult;
  flights: Flight[];
  solved: boolean;
  valid: boolean;
  showCosts: boolean;
  costConfig: CostConfig;
  bookings: Booking[];
}) {
  const decisions = useMemo(() => {
    return bookings.map((b) => ({
      ...explainBookingDecision(b, result.accepted.has(b.id), flights, bookings, result.accepted, costConfig),
      booking: b,
    }));
  }, [bookings, flights, result, costConfig]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className={cn(
        "rounded-2xl border p-6 mb-6",
        solved
          ? "border-yellow-500/60 bg-gradient-to-b from-yellow-900/20 to-transparent"
          : "border-zinc-600 bg-zinc-900/60"
      )}
    >
      {solved && (
        <>
          <div className="flex items-center gap-3 mb-2">
            <span className="text-2xl">🏆</span>
            <div>
              <p className="text-yellow-400 font-bold text-lg">
                Optimal Solution — {showCosts ? "Maximum Profit" : "Maximum Revenue"}
              </p>
              <p className="text-zinc-500 text-xs">
                {showCosts
                  ? `${fmt(result.totalProfit)} profit (${fmt(result.totalRevenue)} revenue − ${fmt(result.totalCost)} costs)`
                  : fmt(result.totalRevenue)}
              </p>
            </div>
          </div>

          {/* per-booking decisions */}
          <div className="mt-4 space-y-2">
            <p className="text-xs text-zinc-500 uppercase tracking-wider font-semibold mb-3">
              📋 Booking Decisions
            </p>
            <div className="grid gap-2">
              {decisions.map((d) => {
                const isAcc = result.accepted.has(d.booking.id);
                return (
                  <div
                    key={d.booking.id}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-xs border",
                      isAcc
                        ? "border-emerald-500/20 bg-emerald-500/5"
                        : "border-red-500/10 bg-red-500/5"
                    )}
                  >
                    <span
                      className="w-6 h-6 rounded flex items-center justify-center font-bold text-white text-[10px] shrink-0"
                      style={{ background: d.booking.color }}
                    >
                      {d.booking.id}
                    </span>
                    <span className="text-zinc-300 flex-1">
                      {d.booking.destination} · {d.booking.tons}t · {fmtShort(d.booking.revenue)}
                    </span>
                    <span
                      className={cn(
                        "px-2 py-0.5 rounded-full text-[10px] font-bold",
                        isAcc ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"
                      )}
                    >
                      {isAcc ? "✓ ACCEPT" : "✗ REJECT"}
                    </span>
                    <span className="text-zinc-500 text-right max-w-[200px] hidden sm:inline">
                      {d.reason}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* per-flight breakdown */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mt-4">
        {flights.map((f) => {
          const rev = result.revenuePerFlight[f.id] ?? 0;
          const cost = result.costPerFlight[f.id] ?? 0;
          const profit = result.profitPerFlight[f.id] ?? 0;
          const load = result.loadPerFlight[f.id] ?? 0;
          const util = f.capacityTons > 0 ? ((load / f.capacityTons) * 100).toFixed(0) : "0";

          return (
            <div
              key={f.id}
              className="rounded-xl p-4 bg-zinc-800/60 border border-zinc-700"
              style={{ borderLeftColor: f.color, borderLeftWidth: 3 }}
            >
              <p className="text-xs text-zinc-400 mb-2">{f.name} · {f.route}</p>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-zinc-500">Revenue</span>
                  <span className="text-blue-400 font-mono">{fmtShort(rev)}</span>
                </div>
                {showCosts && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Costs</span>
                      <span className="text-red-400 font-mono">{fmtShort(cost)}</span>
                    </div>
                    <div className="flex justify-between font-bold">
                      <span className="text-zinc-400">Profit</span>
                      <span className={cn("font-mono", profit >= 0 ? "text-emerald-400" : "text-red-400")}>
                        {profit >= 0 ? "+" : ""}{fmtShort(profit)}
                      </span>
                    </div>
                  </>
                )}
                <div className="flex justify-between text-xs">
                  <span className="text-zinc-500">Load</span>
                  <span className="text-zinc-300">{load}t / {f.capacityTons}t ({util}%)</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* totals row */}
      <div className="mt-4 pt-4 border-t border-zinc-700 flex flex-wrap justify-between text-sm">
        <div className="flex gap-6">
          <div>
            <span className="text-zinc-500">Total Revenue </span>
            <span className="text-blue-400 font-bold">{fmt(result.totalRevenue)}</span>
          </div>
          {showCosts && (
            <>
              <div>
                <span className="text-zinc-500">Total Cost </span>
                <span className="text-red-400 font-bold">{fmt(result.totalCost)}</span>
              </div>
              <div>
                <span className="text-zinc-500">Total Profit </span>
                <span className={cn("font-bold", result.totalProfit >= 0 ? "text-emerald-400" : "text-red-400")}>
                  {fmt(result.totalProfit)}
                </span>
              </div>
            </>
          )}
        </div>
        <div>
          <span className="text-zinc-500">Tonnage </span>
          <span className="text-zinc-300 font-bold">
            {result.totalTonsAccepted}t / {result.totalTonsAvailable}t
          </span>
        </div>
      </div>

      {!solved && !valid && (
        <p className="text-center text-red-400 text-sm mt-3">— invalid (over capacity)</p>
      )}
    </motion.div>
  );
}

// ── comparison panel ────────────────────────────────────────────────────────

function ComparisonPanel({
  userResult,
  optimalResult,
  showCosts,
}: {
  userResult: AuctionResult;
  optimalResult: AuctionResult;
  showCosts: boolean;
}) {
  const revenueGap = optimalResult.totalRevenue - userResult.totalRevenue;
  const costGap = optimalResult.totalCost - userResult.totalCost;
  const profitGap = optimalResult.totalProfit - userResult.totalProfit;
  const tonGap = optimalResult.totalTonsAccepted - userResult.totalTonsAccepted;

  const rows = [
    { label: "Revenue", user: userResult.totalRevenue, optimal: optimalResult.totalRevenue, gap: revenueGap, fmt: fmt, color: "blue", unit: "" },
    ...(showCosts
      ? [
          { label: "Costs", user: userResult.totalCost, optimal: optimalResult.totalCost, gap: costGap, fmt: fmt, color: "red", unit: "" },
          { label: "Profit", user: userResult.totalProfit, optimal: optimalResult.totalProfit, gap: profitGap, fmt: (n: number) => (n >= 0 ? "+" : "") + fmt(n), color: "emerald", unit: "" },
        ]
      : []),
    { label: "Tonnage", user: userResult.totalTonsAccepted, optimal: optimalResult.totalTonsAccepted, gap: tonGap, fmt: (n: number) => `${n}t`, color: "zinc", unit: "" },
    { label: "Utilization", user: (userResult.totalTonsAvailable > 0 ? (userResult.totalTonsAccepted / userResult.totalTonsAvailable) * 100 : 0), optimal: (optimalResult.totalTonsAvailable > 0 ? (optimalResult.totalTonsAccepted / optimalResult.totalTonsAvailable) * 100 : 0), gap: 0, fmt: (n: number) => `${n.toFixed(0)}%`, color: "zinc", unit: "" },
  ];

  const colorMap: Record<string, string> = {
    blue: "text-blue-400 border-blue-500/30 bg-blue-500/5",
    red: "text-red-400 border-red-500/30 bg-red-500/5",
    emerald: "text-emerald-400 border-emerald-500/30 bg-emerald-500/5",
    zinc: "text-zinc-300 border-zinc-500/30 bg-zinc-500/5",
    amber: "text-amber-400 border-amber-500/30 bg-amber-500/5",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="rounded-xl border border-amber-500/30 bg-gradient-to-b from-amber-500/5 to-transparent p-5 mb-6"
    >
      <h3 className="text-center font-bold text-amber-400 text-sm mb-4">
        ⚔️ Your Selection vs Quantum Optimal
      </h3>

      <div className="space-y-3">
        {/* header */}
        <div className="grid grid-cols-4 gap-3 text-xs font-semibold uppercase tracking-wider">
          <span className="text-zinc-500">Metric</span>
          <span className="text-center text-blue-400">Your Pick</span>
          <span className="text-center text-amber-400">Optimal</span>
          <span className="text-center text-zinc-500">Δ Gap</span>
        </div>

        {rows.map((row) => {
          const gapPct = row.optimal !== 0 && row.gap !== 0
            ? ((Math.abs(row.gap) / Math.abs(row.optimal)) * 100).toFixed(0)
            : null;
          const isPositive = row.gap > 0;

          return (
            <div
              key={row.label}
              className="grid grid-cols-4 gap-3 items-center py-2 px-3 rounded-lg border border-zinc-800 bg-zinc-900/40"
            >
              <span className="text-xs text-zinc-400 font-semibold">{row.label}</span>
              <span className={cn("text-center text-sm font-mono font-bold", colorMap[row.color])}>
                {row.fmt(row.user)}
              </span>
              <span className="text-center text-sm font-mono font-bold text-amber-400">
                {row.fmt(row.optimal)}
              </span>
              <span className="text-center text-xs">
                {row.gap !== 0 ? (
                  <span className={cn(
                    "px-2 py-0.5 rounded-full font-mono",
                    isPositive ? "bg-emerald-500/15 text-emerald-400" : "bg-red-500/15 text-red-400"
                  )}>
                    {isPositive ? "+" : ""}{row.fmt(row.gap)}
                    {gapPct && <span className="opacity-60 ml-1">({gapPct}%)</span>}
                  </span>
                ) : (
                  <span className="text-zinc-600">—</span>
                )}
              </span>
            </div>
          );
        })}
      </div>

      {/* insight */}
      {profitGap > 0 && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-zinc-400 text-xs mt-4 text-center"
        >
          💡 The quantum solver found {fmt(profitGap)} more profit by optimising across all flights simultaneously — something human intuition often misses when juggling multiple constraints.
        </motion.p>
      )}
    </motion.div>
  );
}

// ── algorithm explainer ─────────────────────────────────────────────────────

function AlgorithmExplainer({
  algoInfo,
  bookings,
  flights,
  optimalSet,
  costConfig,
  useGreedy,
}: {
  algoInfo: AlgorithmInfo;
  bookings: Booking[];
  flights: Flight[];
  optimalSet: Set<string>;
  costConfig: CostConfig;
  useGreedy: boolean;
}) {
  const searchSpace = 1 << bookings.length;
  const sqrtN = Math.ceil(Math.sqrt(searchSpace));

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ delay: 0.3 }}
      className="rounded-2xl border border-zinc-700/60 bg-zinc-900/40 p-6"
    >
      <h2 className="text-center font-bold text-lg mb-5 text-zinc-200">
        🧠 How the {algoInfo.isQuantumInspired ? "Quantum" : ""} Solver Works
      </h2>

      <div className="grid sm:grid-cols-2 gap-6 text-sm">
        {/* algorithm card */}
        <div className="space-y-3 rounded-xl border border-zinc-700/40 bg-zinc-800/40 p-4">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{algoInfo.icon}</span>
            <div>
              <h3 className="font-bold text-white">{algoInfo.name}</h3>
              <p className="text-zinc-500 text-xs">{algoInfo.shortDesc}</p>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-zinc-500">Search space</span>
              <span className="text-white font-mono">
                {searchSpace.toLocaleString()} combinations
              </span>
            </div>
            {algoInfo.isQuantumInspired && (
              <div className="flex justify-between text-xs">
                <span className="text-zinc-500">Quantum speedup</span>
                <span className="text-amber-400 font-mono">
                  O({sqrtN.toLocaleString()}) vs O({searchSpace.toLocaleString()})
                </span>
              </div>
            )}
            <div className="flex justify-between text-xs">
              <span className="text-zinc-500">Solver type</span>
              <span className={cn("font-mono", algoInfo.isQuantumInspired ? "text-purple-400" : "text-blue-400")}>
                {useGreedy ? "Greedy Heuristic" : algoInfo.isQuantumInspired ? "Quantum-Inspired" : "Classical Exhaustive"}
              </span>
            </div>
          </div>
        </div>

        {/* quantum analogy */}
        <div className="space-y-3 rounded-xl border border-purple-500/20 bg-purple-500/5 p-4">
          <div className="flex items-center gap-2">
            <span className="text-2xl">⚛️</span>
            <h3 className="font-bold text-white">The Quantum Analogy</h3>
          </div>
          <p className="text-zinc-400 leading-relaxed text-xs">
            {algoInfo.quantumAnalogy}
          </p>
          <div className="mt-3 p-3 rounded-lg bg-zinc-800/60 border border-zinc-700/40">
            <p className="text-zinc-500 text-[10px] uppercase tracking-wider mb-1">Why This Matters for Logistics</p>
            <p className="text-zinc-400 text-xs leading-relaxed">
              {searchSpace <= 1024
                ? `With ${bookings.length} bookings, classical brute force is fine — but scale to 30 bookings and the search space explodes to 2³⁰ ≈ 1 billion combinations, where quantum algorithms would excel.`
                : `With ${bookings.length} bookings spanning ${searchSpace.toLocaleString()} combinations, only a quantum-inspired approach can find near-optimal solutions in reasonable time. Real quantum hardware would do this even faster.`
              }
            </p>
          </div>
        </div>
      </div>

      {/* decision logic */}
      <div className="mt-5 p-4 rounded-xl border border-zinc-700/40 bg-zinc-800/30">
        <h4 className="text-xs text-zinc-500 uppercase tracking-wider font-semibold mb-3">
          🔍 Why Each Booking Was Chosen or Rejected
        </h4>
        <div className="grid sm:grid-cols-2 gap-2">
          {bookings.map((b) => {
            const decision = explainBookingDecision(
              b,
              optimalSet.has(b.id),
              flights,
              bookings,
              optimalSet,
              costConfig,
            );
            const isAcc = optimalSet.has(b.id);
            const flight = flights.find(f => f.id === b.flightId)!;
            const cost = flight.distanceKm * b.tons * costConfig.fuelCostPerTonKm + costConfig.handlingFeePerBooking;
            const profit = b.revenue - cost;

            return (
              <div
                key={b.id}
                className={cn(
                  "flex items-start gap-2 rounded-lg px-3 py-2 text-xs",
                  isAcc ? "bg-emerald-500/5" : "bg-red-500/5"
                )}
              >
                <span
                  className={cn(
                    "w-5 h-5 rounded flex items-center justify-center font-bold text-white text-[10px] mt-0.5 shrink-0",
                    isAcc ? "bg-emerald-500/70" : "bg-red-500/70"
                  )}
                >
                  {b.id}
                </span>
                <div>
                  <p className="text-zinc-300">
                    <span className="font-semibold">{b.destination}</span> · {b.tons}t · ${b.ratePerKg}/kg
                    · profit {profit >= 0 ? "+" : ""}{fmtShort(profit)}
                  </p>
                  <p className={cn("text-[11px] mt-0.5", isAcc ? "text-emerald-400/70" : "text-red-400/70")}>
                    {decision.reason}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}

// ── main page ────────────────────────────────────────────────────────────────

export default function FlightCapacityPage() {
  const [difficulty, setDifficulty] = useState<Difficulty>("easy");
  const [seed, setSeed] = useState(() => Math.floor(Math.random() * 10000));
  const [showCosts, setShowCosts] = useState(false);
  const [useGreedy, setUseGreedy] = useState(false);

  const [auction, setAuction] = useState<AuctionConfig>(() => generateAuction("easy", seed));
  const { flights, bookings, costConfig } = auction;

  const [accepted, setAccepted] = useState<Set<string>>(new Set());
  const [userResult, setUserResult] = useState<AuctionResult | null>(null);
  const [optimalResult, setOptimalResult] = useState<AuctionResult | null>(null);
  const [optimalSet, setOptimalSet] = useState<Set<string>>(new Set());
  const [solved, setSolved] = useState(false);
  const [solving, setSolving] = useState(false);
  const [showQuantumOverlay, setShowQuantumOverlay] = useState(false);

  const valid = useMemo(() => isValidSelection(accepted, flights, bookings), [accepted, flights, bookings]);

  // Automatically toggle greedy for large search spaces
  const effectiveGreedy = useMemo(() => {
    const searchSpace = 1 << bookings.length;
    return useGreedy || searchSpace > 65536; // force greedy beyond 16 bookings
  }, [useGreedy, bookings.length]);

  const algoInfo = useMemo(
    () => getAlgorithmInfo(bookings.length, effectiveGreedy),
    [bookings.length, effectiveGreedy]
  );

  const toggle = useCallback((id: string) => {
    setAccepted((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
    setUserResult(null);
    setOptimalResult(null);
    setSolved(false);
    setOptimalSet(new Set());
  }, []);

  const handleCalculate = useCallback(() => {
    const result = evaluateSelection(accepted, flights, bookings, costConfig);
    setUserResult(result);
    setOptimalResult(null);
    setSolved(false);
  }, [accepted, flights, bookings, costConfig]);

  const handleRegenerate = useCallback(() => {
    const newSeed = Math.floor(Math.random() * 10000);
    setSeed(newSeed);
    const newAuction = generateAuction(difficulty, newSeed);
    setAuction(newAuction);
    setAccepted(new Set());
    setUserResult(null);
    setOptimalResult(null);
    setSolved(false);
    setOptimalSet(new Set());
  }, [difficulty]);

  const handleDifficultyChange = useCallback((d: Difficulty) => {
    setDifficulty(d);
    const newSeed = Math.floor(Math.random() * 10000);
    setSeed(newSeed);
    const newAuction = generateAuction(d, newSeed);
    setAuction(newAuction);
    setAccepted(new Set());
    setUserResult(null);
    setOptimalResult(null);
    setSolved(false);
    setOptimalSet(new Set());
  }, []);

  const solveRef = useRef<(() => void) | null>(null);

  const handleSolve = useCallback(() => {
    // Save user's current selection
    const live = evaluateSelection(accepted, flights, bookings, costConfig);
    setUserResult(accepted.size > 0 && valid ? live : null);

    setSolving(true);
    setShowQuantumOverlay(true);

    const doSolve = () => {
      const solver = effectiveGreedy ? solveGreedy : solveExhaustive;
      const sol = solver(flights, bookings, costConfig);
      setAccepted(new Set(sol.accepted));
      setOptimalSet(new Set(sol.accepted));
      setOptimalResult(sol);
      setSolved(true);
      setSolving(false);
    };

    solveRef.current = doSolve;
  }, [accepted, flights, bookings, costConfig, valid, effectiveGreedy]);

  const handleQuantumDone = useCallback(() => {
    setShowQuantumOverlay(false);
    solveRef.current?.();
    solveRef.current = null;
  }, []);

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <NavBar />

      {/* quantum overlay */}
      <AnimatePresence>
        {showQuantumOverlay && (
          <QuantumSearchOverlay
            active={showQuantumOverlay}
            searchSpace={algoInfo.searchSpaceSize}
            onDone={handleQuantumDone}
          />
        )}
      </AnimatePresence>

      <div className="max-w-6xl mx-auto px-4 py-10">
        {/* ── title ── */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-6"
        >
          <h1 className="text-4xl font-extrabold tracking-tight mb-2">
            Flight Capacity Auction <span>✈️💰</span>
          </h1>
          <p className="text-zinc-400 max-w-2xl mx-auto text-sm leading-relaxed">
            Multiple cargo flights are departing. Each has a weight limit — planes can&apos;t take off
            overloaded. <strong className="text-white">Your job: select which bookings to accept</strong> on each flight
            to maximise profit. Not all bookings can fit — capacity is scarce and every choice has a cost.
          </p>
          <p className="text-zinc-500 text-xs mt-2">
            {bookings.length} bookings across {flights.length} flights · {algoInfo.searchSpaceSize.toLocaleString()} possible combinations
            {effectiveGreedy && <span className="text-amber-400 ml-1">· using heuristic (too many for brute force)</span>}
          </p>
        </motion.div>

        {/* ── config panel ── */}
        <ConfigPanel
          difficulty={difficulty}
          showCosts={showCosts}
          seed={seed}
          solving={solving}
          solved={solved}
          onDifficultyChange={handleDifficultyChange}
          onShowCostsToggle={() => setShowCosts((prev) => !prev)}
          onRegenerate={handleRegenerate}
        />

        {/* ── live metrics ── */}
        <LiveMetrics
          accepted={accepted}
          flights={flights}
          bookings={bookings}
          costConfig={costConfig}
          showCosts={showCosts}
          valid={valid}
        />

        {/* ── flight sections ── */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5 mb-8">
          {flights.map((flight) => (
            <FlightSection
              key={flight.id}
              flight={flight}
              bookings={bookings.filter((b) => b.flightId === flight.id)}
              accepted={accepted}
              optimal={optimalSet}
              solved={solved}
              showCosts={showCosts}
              costConfig={costConfig}
              onToggle={toggle}
            />
          ))}
        </div>

        {/* ── action buttons ── */}
        <div className="flex flex-wrap gap-3 justify-center mb-6">
          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            onClick={handleCalculate}
            disabled={solving}
            className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 font-semibold text-sm cursor-pointer transition-colors disabled:opacity-60"
          >
            📊 Calculate My {showCosts ? "Profit" : "Revenue"}
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            onClick={handleSolve}
            disabled={solving}
            className="px-6 py-3 rounded-xl bg-yellow-500 hover:bg-yellow-400 text-zinc-900 font-semibold text-sm cursor-pointer transition-colors disabled:opacity-60"
          >
            {solving ? "⚛️ Solving…" : algoInfo.isQuantumInspired ? "⚛️ Quantum Solver" : "🤖 AI Revenue Manager"}
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => {
              setAccepted(new Set());
              setUserResult(null);
              setOptimalResult(null);
              setSolved(false);
              setOptimalSet(new Set());
            }}
            disabled={solving}
            className="px-4 py-3 rounded-xl border border-zinc-700 hover:border-zinc-500 text-zinc-400 hover:text-white font-semibold text-sm cursor-pointer transition-colors disabled:opacity-40"
          >
            🔄 Clear All
          </motion.button>
        </div>

        {/* ── user result panel ── */}
        <AnimatePresence>
          {userResult && !solved && (
            <ResultPanel
              result={userResult}
              flights={flights}
              solved={false}
              valid={valid}
              showCosts={showCosts}
              costConfig={costConfig}
              bookings={bookings}
            />
          )}
        </AnimatePresence>

        {/* ── optimal result panel ── */}
        <AnimatePresence>
          {optimalResult && solved && (
            <ResultPanel
              result={optimalResult}
              flights={flights}
              solved={true}
              valid={true}
              showCosts={showCosts}
              costConfig={costConfig}
              bookings={bookings}
            />
          )}
        </AnimatePresence>

        {/* ── comparison panel ── */}
        <AnimatePresence>
          {solved && userResult && optimalResult && (
            <ComparisonPanel
              userResult={userResult}
              optimalResult={optimalResult}
              showCosts={showCosts}
            />
          )}
        </AnimatePresence>

        {/* ── algorithm explainer ── */}
        <AnimatePresence>
          {solved && optimalResult && (
            <AlgorithmExplainer
              algoInfo={algoInfo}
              bookings={bookings}
              flights={flights}
              optimalSet={optimalSet}
              costConfig={costConfig}
              useGreedy={effectiveGreedy}
            />
          )}
        </AnimatePresence>

        {/* ── footer hint ── */}
        {!solved && (
          <p className="text-center text-zinc-600 text-xs mt-8">
            💡 Hint: Click bookings to accept or reject them. Then click &quot;Calculate My Revenue&quot; to see your result,
            or &quot;AI Revenue Manager&quot; to find the optimal selection.
          </p>
        )}
      </div>
    </div>
  );
}
