import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import NavBar from "@/components/NavBar.tsx";
import { cn } from "@/lib/utils.ts";
import {
  LOADS,
  LOCATIONS,
  simulateTrip,
  solveBruteForce,
  quantumAnnealingSolver,
  fmt,
  DEFAULT_CONFIG,
  type Load,
  type TripResult,
  type TripConfig,
  type LoadResult,
  type SQAProgress,
} from "@/lib/trip-chain-solver.ts";

// ── helpers ──────────────────────────────────────────────────────────────────

function locById(id: string) {
  return LOCATIONS.find((l) => l.id === id)!;
}

// Random load generation — time windows spread across a single workday
const PICKUP_LOCS = ["fac1", "whx", "why", "fac2", "port"];
const LOAD_COLORS = ["#ef4444", "#a855f7", "#22c55e", "#06b6d4", "#f59e0b", "#ec4899", "#3b82f6", "#f97316", "#14b8a6", "#8b5cf6", "#e11d48", "#0ea5e9", "#84cc16", "#f43f5e", "#6366f1", "#10b981", "#d946ef", "#facc15", "#fb923c", "#2dd4bf"];

function randomLoads(n: number): Load[] {
  const loads: Load[] = [];
  // Spread pickup windows across 8:00–16:00, 40 min apart, 75 min window each
  for (let i = 0; i < n; i++) {
    const letter = String.fromCharCode(65 + (i % 26));
    const suffix = i >= 26 ? String(Math.floor(i / 26)) : "";
    const pickup = PICKUP_LOCS[Math.floor(Math.random() * PICKUP_LOCS.length)];
    const dropPool = PICKUP_LOCS.filter((id) => id !== pickup);
    const drop = i === n - 1
      ? (Math.random() < 0.4 ? "home" : dropPool[Math.floor(Math.random() * dropPool.length)])
      : dropPool[Math.floor(Math.random() * dropPool.length)];
    const pickupWindowStart = 8 * 60 + i * 40; // 40 min spacing
    const pickupWindowEnd = pickupWindowStart + 75; // 75 min window
    const dropDeadline = pickupWindowEnd + 120; // 2 hrs to deliver
    loads.push({
      id: letter + suffix,
      name: `Load ${letter}${suffix}`,
      pickupLoc: pickup,
      dropLoc: drop,
      pickupWindowStart,
      pickupWindowEnd,
      dropDeadline,
      color: LOAD_COLORS[i % LOAD_COLORS.length],
    });
  }
  return loads;
}

function move<T>(arr: T[], from: number, to: number): T[] {
  const next = [...arr];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

// ── SVG Map ───────────────────────────────────────────────────────────────────

const W = 500;
const H = 420;

function MapSVG({ order, result }: { order: Load[]; result: TripResult | null }) {
  // Build path: home → pickup₁ → drop₁ → pickup₂ → drop₂ → …
  const pathPoints: { x: number; y: number; label: string; empty: boolean }[] = [];
  const home = locById("home");
  pathPoints.push({ x: home.x, y: home.y, label: "START", empty: true });

  for (let i = 0; i < order.length; i++) {
    const ld = order[i];
    const pu = locById(ld.pickupLoc);
    const dr = locById(ld.dropLoc);
    pathPoints.push({ x: pu.x, y: pu.y, label: `${ld.name} PU`, empty: true });
    pathPoints.push({ x: dr.x, y: dr.y, label: `${ld.name} DROP`, empty: false });
  }

  const pts = pathPoints.map((p) => `${p.x},${p.y}`).join(" ");

  // Segment colors: empty = dashed amber, loaded = green/red based on result
  const segments: { x1: number; y1: number; x2: number; y2: number; empty: boolean; late: boolean }[] = [];
  for (let i = 0; i + 1 < pathPoints.length; i++) {
    const a = pathPoints[i];
    const b = pathPoints[i + 1];
    const loadIdx = Math.floor(i / 2);
    const lr: LoadResult | undefined = result?.loadResults[loadIdx];
    segments.push({
      x1: a.x, y1: a.y, x2: b.x, y2: b.y,
      empty: b.empty,
      late: lr?.late ?? false,
    });
  }

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full rounded-xl border border-white/10 bg-gray-900">
      {/* Location dots */}
      {LOCATIONS.map((loc) => (
        <g key={loc.id}>
          <circle cx={loc.x} cy={loc.y} r={18} fill={loc.color} opacity={0.2} />
          <circle cx={loc.x} cy={loc.y} r={9} fill={loc.color} />
          <text x={loc.x} y={loc.y + 26} textAnchor="middle" fontSize={11} fill="#cbd5e1" fontWeight={600}>
            {loc.shortName}
          </text>
        </g>
      ))}

      {/* Path segments */}
      {segments.map((s, i) => (
        <line
          key={i}
          x1={s.x1} y1={s.y1} x2={s.x2} y2={s.y2}
          stroke={s.empty ? "#f59e0b" : s.late ? "#ef4444" : "#22c55e"}
          strokeWidth={s.empty ? 2 : 3}
          strokeDasharray={s.empty ? "6 4" : undefined}
          opacity={0.8}
        />
      ))}

      {/* Animated truck dot */}
      {pathPoints.length > 1 && (
        <motion.circle
          r={8}
          fill="#ffffff"
          stroke="#f59e0b"
          strokeWidth={2}
          initial={{ cx: pathPoints[0].x, cy: pathPoints[0].y }}
          animate={{ cx: pathPoints[pathPoints.length - 1].x, cy: pathPoints[pathPoints.length - 1].y }}
          transition={{ duration: 2, ease: "easeInOut" }}
        />
      )}

      {/* Order labels */}
      {order.map((ld, i) => {
        const pu = locById(ld.pickupLoc);
        return (
          <text key={ld.id} x={pu.x + 12} y={pu.y - 12} fontSize={10} fill={ld.color} fontWeight={700}>
            {i + 1}
          </text>
        );
      })}
    </svg>
  );
}

// ── Timeline ──────────────────────────────────────────────────────────────────

function Timeline({ result }: { result: TripResult }) {
  const DAY_START = 7 * 60;
  const DAY_END = 19 * 60;
  const span = DAY_END - DAY_START;

  return (
    <div className="mt-4 space-y-2">
      <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Timeline</p>
      <div className="relative h-6 rounded bg-gray-800">
        {[8, 10, 12, 14, 16, 18].map((h) => (
          <div
            key={h}
            className="absolute top-0 h-full border-l border-white/10"
            style={{ left: `${((h * 60 - DAY_START) / span) * 100}%` }}
          >
            <span className="absolute -top-5 -translate-x-1/2 text-[9px] text-gray-500">{h}:00</span>
          </div>
        ))}
      </div>
      {result.loadResults.map((lr) => {
        const puPct = ((lr.pickupTime - DAY_START) / span) * 100;
        const drPct = ((lr.dropTime - DAY_START) / span) * 100;
        const width = Math.max(drPct - puPct, 1);
        return (
          <div key={lr.load.id} className="relative h-7 rounded bg-gray-800 overflow-hidden">
            <motion.div
              className={cn("absolute h-full rounded", lr.late ? "bg-red-500/70" : "bg-emerald-500/70")}
              style={{ left: `${puPct}%`, width: `${width}%` }}
              initial={{ scaleX: 0, originX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            />
            <span className="absolute inset-0 flex items-center px-2 text-[10px] font-bold text-white z-10">
              {lr.load.name} · PU {fmt(lr.pickupTime)} · DROP {fmt(lr.dropTime)}
              {lr.late && <span className="ml-1 text-red-300">⚠ LATE</span>}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ── Load Card ─────────────────────────────────────────────────────────────────

function LoadCard({
  load, index, total, onMove,
}: {
  load: Load; index: number; total: number; onMove: (dir: -1 | 1) => void;
}) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="flex items-center gap-3 rounded-xl border border-white/10 bg-gray-800/60 p-3"
    >
      <div
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-sm font-black text-white"
        style={{ backgroundColor: load.color + "33", borderColor: load.color, border: `2px solid ${load.color}` }}
      >
        <span style={{ color: load.color }}>{load.id}</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-white">{load.name}</p>
        <p className="text-[11px] text-gray-400">
          PU: <span className="text-white">{locById(load.pickupLoc).shortName}</span>{" "}
          {fmt(load.pickupWindowStart)}–{fmt(load.pickupWindowEnd)}
          &nbsp;·&nbsp;DROP: <span className="text-white">{locById(load.dropLoc).shortName}</span>{" "}
          by {fmt(load.dropDeadline)}
        </p>
      </div>
      <div className="flex flex-col gap-1">
        <button
          onClick={() => onMove(-1)}
          disabled={index === 0}
          className="rounded bg-gray-700 px-2 py-0.5 text-xs text-gray-300 disabled:opacity-20 hover:bg-gray-600 cursor-pointer"
        >
          ▲
        </button>
        <button
          onClick={() => onMove(1)}
          disabled={index === total - 1}
          className="rounded bg-gray-700 px-2 py-0.5 text-xs text-gray-300 disabled:opacity-20 hover:bg-gray-600 cursor-pointer"
        >
          ▼
        </button>
      </div>
    </motion.div>
  );
}

// ── Stats Bar ─────────────────────────────────────────────────────────────────

function StatsBar({ result, solved, loadCount }: { result: TripResult; solved: boolean; loadCount: number }) {
  let fact = 1;
  for (let i = 2; i <= loadCount; i++) fact *= i;
  return (
    <div className="grid grid-cols-3 gap-3 mt-4">
      {[
        { label: "Empty Miles", value: result.totalEmptyMiles, bad: result.totalEmptyMiles > 100, unit: " mi", sub: "deadhead" },
        { label: "Total Miles", value: result.totalMiles, bad: result.totalMiles > 250, unit: " mi", sub: `empty + ${result.totalLoadedMiles} loaded` },
        { label: "Finish Time", value: fmt(result.finishTime), bad: result.finishTime > 17 * 60, unit: "", sub: result.missedWindows > 0 ? `${result.missedWindows} missed` : "on time" },
      ].map((s) => (
        <div key={s.label} className={cn("rounded-xl p-3 text-center border", s.bad ? "border-red-500/40 bg-red-900/20" : "border-emerald-500/40 bg-emerald-900/20")}>
          <p className={cn("text-xl font-black", s.bad ? "text-red-400" : "text-emerald-400")}>
            {s.value}{s.unit}
          </p>
          <p className="text-[10px] text-gray-400 mt-0.5">{s.label}</p>
          <p className="text-[9px] text-gray-500">{s.sub}</p>
        </div>
      ))}
      {solved && result.missedWindows === 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="col-span-3 rounded-xl border border-amber-500/40 bg-amber-900/20 p-3 text-center text-sm text-amber-300 font-semibold"
        >
          ✅ Zero missed windows! {result.totalEmptyMiles} deadhead mi + {result.totalLoadedMiles} loaded mi = {result.totalMiles} total. Found via Simulated Quantum Annealing — {loadCount}! = {fact.toLocaleString()} possible orders.
        </motion.div>
      )}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function TripChainPage() {
  // Shuffle the starting order so the user doesn't begin from the near-optimal A→B→C→D sequence.
  const [loadOrder, setLoadOrder] = useState<Load[]>(() => [...LOADS].sort(() => Math.random() - 0.5));
  const [result, setResult] = useState<TripResult | null>(null);
  const [userResult, setUserResult] = useState<TripResult | null>(null);
  const [solved, setSolved] = useState(false);
  const [solving, setSolving] = useState(false);
  const [loadCount, setLoadCount] = useState(4);
  const [sqaProgress, setSqaProgress] = useState<SQAProgress | null>(null);
  const [sqaGamma, setSqaGamma] = useState<number | null>(null);
  const [bruteForceResult, setBruteForceResult] = useState<TripResult | null>(null);
  const [speedMph, setSpeedMph] = useState(DEFAULT_CONFIG.avgSpeedMph);
  const [workHours, setWorkHours] = useState(Math.round(DEFAULT_CONFIG.maxWorkMinutes / 60));

  const config: TripConfig = {
    avgSpeedMph: speedMph,
    maxWorkMinutes: workHours * 60,
    startTime: 8 * 60,
  };

  function handleRunRoute() {
    setSolved(false);
    setResult(simulateTrip(loadOrder, config));
  }

  async function handleMagicSolve() {
    setUserResult(result);
    setSolving(true);
    setSqaProgress(null);
    setSqaGamma(null);

    setTimeout(() => {
      const quantumBest = quantumAnnealingSolver(loadOrder, {
        P: 8,
        steps: 2000,
        gammaStart: 3.0,
        gammaEnd: 0.0,
        config,
        onProgress: (p: SQAProgress) => {
          setSqaProgress(p);
          setSqaGamma(p.gamma);
        },
      });
      setLoadOrder(quantumBest.order);
      setResult(quantumBest);

      if (loadOrder.length <= 8) {
        setBruteForceResult(solveBruteForce(loadOrder, config));
      } else {
        setBruteForceResult(null);
      }

      setSolved(true);
      setSolving(false);
    }, 200);
  }

  function handleRandomize() {
    setLoadOrder(randomLoads(loadCount));
    setResult(null);
    setUserResult(null);
    setSolved(false);
    setBruteForceResult(null);
    setSqaProgress(null);
    setSqaGamma(null);
  }

  function handleMove(index: number, dir: -1 | 1) {
    setLoadOrder((prev) => move(prev, index, index + dir));
    setResult(null);
    setSolved(false);
  }

  function handleReset() {
    setLoadOrder([...LOADS].sort(() => Math.random() - 0.5));
    setLoadCount(4);
    setResult(null);
    setUserResult(null);
    setSolved(false);
    setBruteForceResult(null);
    setSqaProgress(null);
    setSqaGamma(null);
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <NavBar />

      <div className="mx-auto max-w-5xl px-4 py-10">
        {/* Title */}
        <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <h1 className="text-3xl font-black tracking-tight">🚛 Trucker's Trip Chain</h1>
          <p className="mt-2 max-w-2xl text-sm text-gray-400 leading-relaxed">
            You're a trucker with {loadOrder.length} loads today. The trick? Each load has a time window. Pick them in the wrong
            order and you'll miss a deadline — or drive miles out of your way for nothing!
          </p>
        </motion.div>

        {/* ── Simulation Config + Empty Miles Explainer ── */}
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {/* Config sliders */}
          <div className="rounded-xl border border-white/10 bg-gray-900/60 p-4 space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">⚙️ Simulation Settings</p>
            <div className="flex items-center gap-3">
              <span className="text-[11px] text-gray-400 w-20 shrink-0">Avg Speed</span>
              <input
                type="range"
                min={35}
                max={75}
                step={5}
                value={speedMph}
                onChange={(e) => setSpeedMph(Number(e.target.value))}
                className="flex-1 h-1 accent-amber-500"
              />
              <span className="text-xs font-bold text-white w-16 text-right">{speedMph} mph</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[11px] text-gray-400 w-20 shrink-0">Work Hours</span>
              <input
                type="range"
                min={6}
                max={14}
                step={1}
                value={workHours}
                onChange={(e) => setWorkHours(Number(e.target.value))}
                className="flex-1 h-1 accent-amber-500"
              />
              <span className="text-xs font-bold text-white w-16 text-right">{workHours}h</span>
            </div>
            <p className="text-[10px] text-gray-500">
              Shift: 8:00–{String(8 + workHours).padStart(2, "0")}:00 · Overtime heavily penalized
            </p>
          </div>

          {/* Empty Miles explainer */}
          <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-amber-300">📦 What are "Empty Miles"?</p>
            <p className="text-[11px] text-gray-300 leading-relaxed">
              <strong className="text-amber-200">Empty miles (deadhead)</strong> = miles you drive <em>without cargo</em> —
              from your last drop-off to the next pickup. You don't get paid for these.
            </p>
            <p className="text-[11px] text-gray-300 leading-relaxed">
              <strong className="text-green-300">Loaded miles</strong> = miles with cargo onboard (pickup → drop).
              The goal: <strong className="text-white">minimize deadhead</strong> by chaining pickups that are geographically close.
            </p>
            <div className="flex gap-2 text-[10px]">
              <span className="rounded bg-amber-500/20 px-2 py-0.5 text-amber-300">🟡 Dashed line = deadhead</span>
              <span className="rounded bg-green-500/20 px-2 py-0.5 text-green-300">🟢 Solid line = loaded</span>
            </div>
          </div>
        </div>

        {/* Main layout */}
        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          {/* Left: Load cards */}
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Load Order</p>
            <div className="max-h-[420px] overflow-y-auto pr-1 space-y-3 custom-scrollbar">
              <AnimatePresence mode="popLayout">
                {loadOrder.map((ld, i) => (
                  <LoadCard key={ld.id} load={ld} index={i} total={loadOrder.length} onMove={(dir) => handleMove(i, dir)} />
                ))}
              </AnimatePresence>
            </div>

            {/* Randomize control */}
            <div className="flex items-center gap-2 pt-2">
              <div className="flex items-center gap-1 rounded-lg border border-white/10 bg-gray-800/60 px-2 py-1">
                <button
                  onClick={() => setLoadCount((c) => Math.max(3, c - 1))}
                  disabled={loadCount <= 3}
                  className="h-6 w-6 rounded bg-gray-700 text-xs text-gray-300 hover:bg-gray-600 disabled:opacity-30 cursor-pointer"
                >
                  −
                </button>
                <span className="w-6 text-center text-xs font-bold text-white">{loadCount}</span>
                <button
                  onClick={() => setLoadCount((c) => Math.min(20, c + 1))}
                  disabled={loadCount >= 20}
                  className="h-6 w-6 rounded bg-gray-700 text-xs text-gray-300 hover:bg-gray-600 disabled:opacity-30 cursor-pointer"
                >
                  +
                </button>
              </div>
              <button
                onClick={handleRandomize}
                className="flex-1 rounded-lg border border-white/10 bg-gray-800/60 py-1.5 text-xs font-semibold text-gray-200 hover:bg-gray-700 transition-colors cursor-pointer"
              >
                🎲 Random Loads ({loadCount})
              </button>
            </div>

            {/* Action buttons */}
            <div className="flex gap-3 pt-2">
              <button
                onClick={handleRunRoute}
                className="flex-1 rounded-xl bg-blue-600 py-2.5 text-sm font-bold hover:bg-blue-500 transition-colors cursor-pointer"
              >
                Run This Route
              </button>
              <button
                onClick={handleMagicSolve}
                disabled={solving}
                className="flex-1 rounded-xl bg-amber-500 py-2.5 text-sm font-bold text-gray-900 hover:bg-amber-400 transition-colors disabled:opacity-50 cursor-pointer"
              >
                {solving ? "⏳ Solving…" : "🤖 Magic Route Planner"}
              </button>
              <button
                onClick={handleReset}
                className="rounded-xl border border-white/10 bg-gray-800/60 px-4 py-2.5 text-sm font-semibold text-gray-300 hover:bg-gray-700 transition-colors cursor-pointer"
              >
                🔄 Reset
              </button>
            </div>
          </div>

          {/* Right: Map */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">Route Map</p>
            <MapSVG order={loadOrder} result={result} />
          </div>
        </div>

        {/* Results */}
        <AnimatePresence>
          {result && (
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
              className="mt-6"
            >
              <Timeline result={result} />
              <StatsBar result={result} solved={solved} loadCount={loadOrder.length} />
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
              className="mt-6 rounded-xl border border-amber-500/30 bg-amber-500/5 p-4"
            >
              <div className={`grid gap-4 ${bruteForceResult ? 'grid-cols-4' : 'grid-cols-3'}`}>
                <div className="text-center">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-blue-300">Your Route</p>
                  <p className="mt-1 text-xl font-black text-blue-400">{userResult.totalEmptyMiles} mi</p>
                  <p className="text-[11px] text-gray-400">{userResult.missedWindows} missed</p>
                </div>
                <div className="text-center">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-purple-300">⚛ Quantum SQA</p>
                  <p className="mt-1 text-xl font-black text-purple-400">{result.totalEmptyMiles} mi</p>
                  <p className="text-[11px] text-gray-400">{result.missedWindows} missed</p>
                  {sqaGamma !== null && (
                    <p className="text-[9px] text-gray-500 mt-0.5">Γ = {sqaGamma.toFixed(2)}</p>
                  )}
                </div>
                <div className="text-center">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-amber-300">Improvement</p>
                  <p className="mt-1 text-xl font-black text-amber-400">
                    −{Math.max(0, userResult.totalEmptyMiles - result.totalEmptyMiles)} mi
                  </p>
                  <p className="text-[11px] text-gray-400">
                    {Math.max(0, userResult.missedWindows - result.missedWindows)} fewer missed
                  </p>
                </div>
                {bruteForceResult && (
                  <div className="text-center">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-300">Classical Opt.</p>
                    <p className="mt-1 text-xl font-black text-emerald-400">{bruteForceResult.totalEmptyMiles} mi</p>
                    <p className="text-[11px] text-gray-400">{bruteForceResult.missedWindows} missed</p>
                    <p className="text-[9px] text-gray-500 mt-0.5">brute-force truth</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* WOW Explainer */}
        {solved && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-10 rounded-2xl border border-white/10 bg-gray-900/60 p-6 space-y-3"
        >
          <h2 className="text-lg font-black text-purple-400">⚛️ How Simulated Quantum Annealing Works</h2>
          <p className="text-sm text-gray-300 leading-relaxed">
            With {loadOrder.length} loads there are <strong className="text-white">{loadOrder.length}! = {(() => { let f=1; for(let i=2;i<=loadOrder.length;i++) f*=i; return f.toLocaleString(); })()}</strong> possible orderings.
            Classical brute-force checks every single one. <strong className="text-purple-300">Quantum annealing</strong> uses
            the physics of quantum tunneling to find near-optimal solutions much faster.
          </p>
          <div className="grid grid-cols-2 gap-3 pt-1 text-xs text-gray-400">
            <div className="rounded-lg bg-gray-800 p-3">
              <p className="font-bold text-white mb-1">🧊 Classical moves</p>
              Local swaps, 2-opt reversals, and insertion shifts explore neighboring permutations. At high temperature the system jumps freely; as it cools, only improvements are accepted.
            </div>
            <div className="rounded-lg bg-gray-800 p-3">
              <p className="font-bold text-white mb-1">⚛️ Quantum tunneling</p>
              Multiple replicas (Trotter slices) run in parallel. The transverse field Γ couples them — replicas can <em>tunnel</em> through energy barriers by swapping states, escaping local minima that trap classical solvers.
            </div>
            <div className="rounded-lg bg-gray-800 p-3">
              <p className="font-bold text-white mb-1">📉 Annealing schedule</p>
              Γ starts high (strong quantum fluctuations) and decays exponentially to zero. This mirrors how real quantum annealers (D-Wave) gradually turn off the transverse field to land in the ground state.
            </div>
            <div className="rounded-lg bg-gray-800 p-3">
              <p className="font-bold text-white mb-1">🎯 Hamiltonian encoding</p>
              <strong>H = deadhead_mi + 500×missed + 2×overtime_min.</strong> The penalty terms ensure the solver prioritizes on-time, within-shift routes over pure distance minimization.
            </div>
          </div>
        </motion.div>
        )}
      </div>
    </div>
  );
}
