import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import NavBar from "@/components/NavBar.tsx";
import { cn } from "@/lib/utils.ts";
import {
  FLIGHTS,
  BOOKINGS,
  evaluateSelection,
  solveAuction,
  isValidSelection,
  type AuctionResult,
  type Flight,
  type Booking,
} from "@/lib/flight-capacity-solver.ts";

// ── helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number) {
  return "$" + n.toLocaleString();
}

function flightBookings(flightId: string): Booking[] {
  return BOOKINGS.filter((b) => b.flightId === flightId);
}

function loadForFlight(flightId: string, accepted: Set<string>): number {
  return flightBookings(flightId)
    .filter((b) => accepted.has(b.id))
    .reduce((s, b) => s + b.tons, 0);
}

// ── sub-components ────────────────────────────────────────────────────────────

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

function BookingCard({
  booking,
  accepted,
  optimal,
  solved,
  onToggle,
}: {
  booking: Booking;
  accepted: boolean;
  optimal: boolean;
  solved: boolean;
  onToggle: () => void;
}) {
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
        solved && optimal && "ring-2 ring-yellow-400/80",
        solved && !optimal && "opacity-40"
      )}
    >
      {/* glow strip */}
      <div
        className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl"
        style={{ background: booking.color }}
      />
      <div className="pl-2">
        <div className="flex items-center justify-between">
          <span className="font-bold text-white text-sm">
            Booking {booking.id}
            {solved && optimal && <span className="ml-2 text-yellow-400 text-xs">★ optimal</span>}
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
        <p className="text-zinc-400 text-xs mt-1">{booking.destination}</p>
        <div className="flex gap-4 mt-2 text-xs">
          <span className="text-zinc-300">
            <span className="text-zinc-500">Weight </span>
            {booking.tons}t
          </span>
          <span className="text-zinc-300">
            <span className="text-zinc-500">Rate </span>
            ${booking.ratePerKg}/kg
          </span>
          <span className="font-semibold" style={{ color: booking.color }}>
            {fmt(booking.revenue)}
          </span>
        </div>
      </div>
    </motion.button>
  );
}

function FlightSection({
  flight,
  accepted,
  optimal,
  solved,
  onToggle,
}: {
  flight: Flight;
  accepted: Set<string>;
  optimal: Set<string>;
  solved: boolean;
  onToggle: (id: string) => void;
}) {
  const bookings = flightBookings(flight.id);
  const load = loadForFlight(flight.id, accepted);

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
          <p className="text-zinc-400 text-xs">{flight.route}</p>
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
            accepted={accepted.has(b.id)}
            optimal={optimal.has(b.id)}
            solved={solved}
            onToggle={() => onToggle(b.id)}
          />
        ))}
      </div>
    </div>
  );
}

// ── main page ─────────────────────────────────────────────────────────────────

export default function FlightCapacityPage() {
  const [accepted, setAccepted] = useState<Set<string>>(new Set());
  const [result, setResult] = useState<AuctionResult | null>(null);
  const [solved, setSolved] = useState(false);
  const [solving, setSolving] = useState(false);
  const [optimalSet, setOptimalSet] = useState<Set<string>>(new Set());
  const [userRevenue, setUserRevenue] = useState<number | null>(null);

  const liveRevenue = evaluateSelection(accepted).totalRevenue;
  const valid = isValidSelection(accepted);

  function toggle(id: string) {
    setAccepted((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
    setResult(null);
    setSolved(false);
    setOptimalSet(new Set());
  }

  function calculate() {
    setResult(evaluateSelection(accepted));
    setSolved(false);
  }

  async function solve() {
    // Save the user's own revenue (only if they picked bookings and stayed valid).
    setUserRevenue(accepted.size > 0 && valid ? liveRevenue : null);
    setSolving(true);
    await new Promise((r) => setTimeout(r, 1000));
    const sol = solveAuction();
    setAccepted(new Set(sol.accepted));
    setOptimalSet(new Set(sol.accepted));
    setResult(sol);
    setSolved(true);
    setSolving(false);
  }

  const rejectedLabels = BOOKINGS.filter((b) => !optimalSet.has(b.id))
    .map((b) => {
      const flight = FLIGHTS.find((f) => f.id === b.flightId)!;
      const others = flightBookings(b.flightId).filter((x) => optimalSet.has(x.id));
      const remainingCap = flight.capacityTons - others.reduce((s, x) => s + x.tons, 0);
      if (b.tons > remainingCap) return `${b.id} (too heavy for remaining space)`;
      return `${b.id} (low rate)`;
    })
    .join(", ");

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <NavBar />

      <div className="max-w-5xl mx-auto px-4 py-10">
        {/* ── title ── */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-extrabold tracking-tight mb-2">
            Flight Capacity Auction <span>✈️💰</span>
          </h1>
          <p className="text-zinc-400 max-w-2xl mx-auto text-sm leading-relaxed">
            Three cargo flights are leaving Los Angeles today. Six shipping companies want to book
            space. You can only accept some bookings — each flight has a weight limit. Pick the
            bookings that make the most money!
          </p>
          <p className="text-zinc-500 text-xs mt-2">
            64 possible combinations — can you find the best?
          </p>
        </motion.div>

        {/* ── live revenue counter ── */}
        <motion.div
          className="text-center mb-8"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <p className="text-zinc-500 text-sm uppercase tracking-widest mb-1">Total Revenue</p>
          <motion.p
            key={liveRevenue}
            initial={{ y: -8, opacity: 0.5 }}
            animate={{ y: 0, opacity: 1 }}
            className={cn(
              "text-5xl font-black tabular-nums",
              valid ? "text-emerald-400" : "text-red-400"
            )}
          >
            {fmt(liveRevenue)}
          </motion.p>
          {!valid && (
            <p className="text-red-400 text-sm mt-1 font-semibold">⚠️ Over capacity — invalid selection</p>
          )}
        </motion.div>

        {/* ── flight sections ── */}
        <div className="grid md:grid-cols-3 gap-5 mb-8">
          {FLIGHTS.map((flight) => (
            <FlightSection
              key={flight.id}
              flight={flight}
              accepted={accepted}
              optimal={optimalSet}
              solved={solved}
              onToggle={toggle}
            />
          ))}
        </div>

        {/* ── action buttons ── */}
        <div className="flex flex-wrap gap-3 justify-center mb-6">
          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            onClick={calculate}
            className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 font-semibold text-sm cursor-pointer transition-colors"
          >
            📊 Calculate Revenue
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            onClick={solve}
            disabled={solving}
            className="px-6 py-3 rounded-xl bg-yellow-500 hover:bg-yellow-400 text-zinc-900 font-semibold text-sm cursor-pointer transition-colors disabled:opacity-60"
          >
            {solving ? "🤖 Solving…" : "🤖 AI Revenue Manager"}
          </motion.button>
        </div>

        {/* ── result panel ── */}
        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className={cn(
                "rounded-2xl border p-6 mb-8",
                solved
                  ? "border-yellow-500/60 bg-yellow-900/20"
                  : "border-zinc-600 bg-zinc-900/60"
              )}
            >
              {solved && (
                <p className="text-yellow-400 font-bold text-lg mb-3">
                  🏆 Maximum revenue: {fmt(result.totalRevenue)}
                </p>
              )}
              {solved && (
                <p className="text-zinc-300 text-sm mb-4">
                  <span className="text-yellow-300 font-semibold">Accepted:</span>{" "}
                  {[...result.accepted].sort().join(", ")} —{" "}
                  <span className="text-zinc-400">rejected {rejectedLabels}</span>
                </p>
              )}
              <div className="grid sm:grid-cols-3 gap-4">
                {FLIGHTS.map((f) => (
                  <div
                    key={f.id}
                    className="rounded-xl p-4 bg-zinc-800/60 border border-zinc-700"
                    style={{ borderLeftColor: f.color, borderLeftWidth: 3 }}
                  >
                    <p className="text-xs text-zinc-400 mb-1">{f.name}</p>
                    <p className="text-xl font-bold text-white">
                      {fmt(result.revenuePerFlight[f.id] ?? 0)}
                    </p>
                    <p className="text-xs text-zinc-500 mt-1">
                      {result.loadPerFlight[f.id] ?? 0}t / {f.capacityTons}t
                    </p>
                  </div>
                ))}
              </div>
              {!solved && (
                <p className="text-center text-zinc-400 text-sm mt-4">
                  Total: <span className="text-white font-bold">{fmt(result.totalRevenue)}</span>
                  {!valid && (
                    <span className="text-red-400 ml-2">— invalid (over capacity)</span>
                  )}
                </p>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* User vs Quantum comparison */}
        <AnimatePresence>
          {solved && userRevenue !== null && result && (
            <motion.div
              key="comparison"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 mb-8"
            >
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-blue-400">Your Revenue</p>
                  <p className="mt-1 text-xl font-black text-blue-400">{fmt(userRevenue)}</p>
                </div>
                <div className="text-center">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-400">Quantum Optimal</p>
                  <p className="mt-1 text-xl font-black text-emerald-400">{fmt(result.totalRevenue)}</p>
                </div>
                <div className="text-center">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-amber-400">Extra Revenue</p>
                  <p className="mt-1 text-xl font-black text-amber-400">
                    {fmt(Math.max(0, result.totalRevenue - userRevenue))}
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── explainer ── */}
        <AnimatePresence>
          {solved && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ delay: 0.4 }}
          className="rounded-2xl border border-zinc-700/60 bg-zinc-900/40 p-6"
        >
          <h2 className="text-center font-bold text-lg mb-5 text-zinc-200">
            🧠 How the Auction Works
          </h2>
          <div className="grid sm:grid-cols-3 gap-6 text-sm">
            <div className="space-y-2">
              <div className="text-2xl">📦</div>
              <h3 className="font-bold text-white">The Problem</h3>
              <p className="text-zinc-400 leading-relaxed">
                Each flight has limited weight capacity. Accepting too many bookings is physically
                impossible — planes can't take off overloaded. You must choose which bookings to
                accept while staying within limits.
              </p>
            </div>
            <div className="space-y-2">
              <div className="text-2xl">⚖️</div>
              <h3 className="font-bold text-white">The Trade-off</h3>
              <p className="text-zinc-400 leading-relaxed">
                A heavy booking at a low rate might block a lighter, higher-rate booking. Smart
                carriers compare revenue per kilogram, not just total tonnage. Sometimes less weight
                means more money.
              </p>
            </div>
            <div className="space-y-2">
              <div className="text-2xl">🤖</div>
              <h3 className="font-bold text-white">AI Optimization</h3>
              <p className="text-zinc-400 leading-relaxed">
                With 6 bookings there are 2⁶ = 64 possible combinations. The AI tries every valid
                combination and picks the one with maximum revenue — this is the classic 0/1
                Knapsack problem solved by exhaustive search.
              </p>
            </div>
          </div>
        </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
