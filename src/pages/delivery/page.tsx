import { useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import NavBar from "@/components/NavBar.tsx";
import { solveTSP, routeDistance, dist, type Point } from "@/lib/tsp.ts";
import { cn } from "@/lib/utils.ts";

// ── Fixed map points (canvas 500×380) ──────────────────────────────────────
const FIXED_POINTS: Point[] = [
  { x: 250, y: 190, label: "Sam's Bakery", emoji: "🏠", color: "#f59e0b" },
  { x: 95,  y: 80,  label: "Red Café",     emoji: "☕", color: "#ef4444" },
  { x: 390, y: 65,  label: "Blue Café",    emoji: "☕", color: "#3b82f6" },
  { x: 430, y: 280, label: "Green Café",   emoji: "☕", color: "#22c55e" },
  { x: 110, y: 310, label: "Yellow Café",  emoji: "☕", color: "#eab308" },
  { x: 280, y: 335, label: "Purple Café",  emoji: "☕", color: "#a855f7" },
];

const MAP_W = 500;
const MAP_H = 380;
const DOT_R = 18;
const TOTAL_PERMS = 120; // 5! = 120 routes

// ── Colour helpers ───────────────────────────────────────────────────────────
const BG = "oklch(0.06 0.02 260)";
const CARD = "oklch(0.1 0.025 260)";

// ── Draw helpers ─────────────────────────────────────────────────────────────
function polylinePoints(tour: number[], pts: Point[]): string {
  return tour.map((i) => `${pts[i].x},${pts[i].y}`).join(" ");
}

// ── Map component ─────────────────────────────────────────────────────────────
interface MapProps {
  points: Point[];
  userTour: number[];
  solvedTour: number[] | null;
  onClickPoint: (i: number) => void;
  mode: "manual" | "solved";
}

function DeliveryMap({ points, userTour, solvedTour, onClickPoint, mode }: MapProps) {
  return (
    <svg
      viewBox={`0 0 ${MAP_W} ${MAP_H}`}
      className="w-full rounded-xl border border-border bg-card"
      style={{ maxHeight: 420 }}
    >
      {/* Road-texture grid */}
      <defs>
        <pattern id="road-grid" width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M 40 0 L 0 0 0 40" fill="none" stroke="oklch(0.18 0.03 260)" strokeWidth="0.5" />
        </pattern>
      </defs>
      <rect width={MAP_W} height={MAP_H} fill="oklch(0.085 0.02 260)" rx={12} />
      <rect width={MAP_W} height={MAP_H} fill="url(#road-grid)" rx={12} />

      {/* User tour lines */}
      {mode === "manual" && userTour.length >= 2 && (
        <polyline
          points={polylinePoints(userTour, points)}
          fill="none"
          stroke="oklch(0.72 0.22 200)"
          strokeWidth={2.5}
          strokeDasharray="6 4"
          opacity={0.7}
        />
      )}

      {/* Solved tour */}
      {mode === "solved" && solvedTour && (
        <motion.polyline
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 1.2, ease: "easeInOut" }}
          points={polylinePoints(solvedTour, points)}
          fill="none"
          stroke="#f59e0b"
          strokeWidth={3}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}

      {/* Points */}
      {points.map((pt, i) => {
        const inUserTour = userTour.includes(i);
        const isNext = mode === "manual" && !inUserTour;
        const isHome = i === 0;

        return (
          <g
            key={i}
            onClick={() => onClickPoint(i)}
            className="cursor-pointer"
            style={{ filter: isNext ? "brightness(1)" : undefined }}
          >
            <circle
              cx={pt.x}
              cy={pt.y}
              r={DOT_R + 4}
              fill={pt.color}
              opacity={0.15}
            />
            <circle
              cx={pt.x}
              cy={pt.y}
              r={DOT_R}
              fill={inUserTour || mode === "solved" ? pt.color : "oklch(0.15 0.03 260)"}
              stroke={pt.color}
              strokeWidth={2}
              className="transition-all duration-200"
            />
            <text
              x={pt.x}
              y={pt.y + 5}
              textAnchor="middle"
              fontSize={14}
              style={{ userSelect: "none" }}
            >
              {pt.emoji}
            </text>
            <text
              x={pt.x}
              y={pt.y + DOT_R + 13}
              textAnchor="middle"
              fontSize={9}
              fill={pt.color}
              fontFamily="Space Grotesk, sans-serif"
              fontWeight="600"
            >
              {isHome ? "HOME" : pt.label.replace(" Café", "")}
            </text>

            {/* Order badge */}
            {mode === "manual" && inUserTour && (
              <text
                x={pt.x + DOT_R - 2}
                y={pt.y - DOT_R + 6}
                textAnchor="middle"
                fontSize={8}
                fill="white"
                fontWeight="bold"
                fontFamily="monospace"
              >
                {userTour.indexOf(i) + 1}
              </text>
            )}
          </g>
        );
      })}

      {/* Truck emoji on solved route */}
      {mode === "solved" && solvedTour && solvedTour.length >= 2 && (
        <text
          x={points[solvedTour[1]].x}
          y={points[solvedTour[1]].y - 28}
          textAnchor="middle"
          fontSize={18}
        >
          🚚
        </text>
      )}
    </svg>
  );
}

// ── Distance display ──────────────────────────────────────────────────────────
function DistBadge({ label, dist, highlight }: { label: string; dist: number; highlight?: boolean }) {
  return (
    <div
      className={cn(
        "rounded-xl border p-4 transition-all",
        highlight ? "border-amber-500/40 bg-amber-500/10" : "border-border bg-card"
      )}
    >
      <p className="text-xs text-muted-foreground font-mono mb-1">{label}</p>
      <p
        className="text-2xl font-bold font-mono"
        style={{ color: highlight ? "#f59e0b" : "oklch(0.72 0.22 200)" }}
      >
        {dist > 0 ? dist.toFixed(1) : "—"}
        {dist > 0 && <span className="text-sm font-normal text-muted-foreground ml-1">miles</span>}
      </p>
    </div>
  );
}

// ── Cafe visit checklist ──────────────────────────────────────────────────────
function Checklist({ points, userTour }: { points: Point[]; userTour: number[] }) {
  return (
    <div className="space-y-1.5">
      {points.slice(1).map((pt, rawI) => {
        const idx = rawI + 1;
        const visited = userTour.includes(idx);
        return (
          <div
            key={idx}
            className={cn(
              "flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-all",
              visited ? "bg-primary/10 text-foreground" : "bg-secondary/40 text-muted-foreground"
            )}
          >
            <span className="text-base">{pt.emoji}</span>
            <span className={visited ? "line-through opacity-60" : ""}>{pt.label}</span>
            {visited && <span className="ml-auto text-xs font-mono text-primary">✓ #{userTour.indexOf(idx) + 1}</span>}
          </div>
        );
      })}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function DeliveryPage() {
  const points = FIXED_POINTS;

  const [userTour, setUserTour] = useState<number[]>([0]); // start at bakery
  const [mode, setMode] = useState<"manual" | "solved">("manual");
  const [solved, setSolved] = useState<ReturnType<typeof solveTSP> | null>(null);
  const [thinking, setThinking] = useState(false);
  const [showWow, setShowWow] = useState(false);

  const userDist =
    userTour.length >= 2
      ? routeDistance(
          userTour[userTour.length - 1] === 0 ? userTour : [...userTour, 0],
          points
        )
      : 0;

  const tourComplete = userTour.length === points.length + 1 && userTour[userTour.length - 1] === 0;

  const handleClickPoint = useCallback(
    (i: number) => {
      if (mode === "solved") return;
      if (userTour.length === 1 && i === 0) return; // can't click home again first

      const alreadyVisited = userTour.slice(1).includes(i);
      if (alreadyVisited && !(i === 0 && userTour.length === points.length)) return;

      // Clicking home after all cafes visited → complete the tour
      if (i === 0) {
        if (userTour.length === points.length) {
          setUserTour([...userTour, 0]);
        }
        return;
      }

      setUserTour([...userTour, i]);
    },
    [userTour, mode, points.length]
  );

  const handleReset = () => {
    setUserTour([0]);
    setMode("manual");
    setSolved(null);
    setShowWow(false);
  };

  const handleSolve = () => {
    setThinking(true);
    setShowWow(false);
    setTimeout(() => {
      const result = solveTSP(points);
      setSolved(result);
      setMode("solved");
      setThinking(false);
      setShowWow(true);
    }, 1400);
  };

  const savings = solved && tourComplete ? userDist - solved.distance : null;

  return (
    <div className="min-h-screen flex flex-col" style={{ background: BG }}>
      <NavBar />

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 py-8 space-y-6">
        {/* Title */}
        <div className="text-center">
          <div className="text-4xl mb-2">🚚🎂</div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">Sam's Delivery Dash</h1>
          <p className="text-muted-foreground mt-2 max-w-xl mx-auto text-sm sm:text-base">
            Sam baked cakes for 5 cafés and needs to deliver them all — then drive home. Help Sam
            pick the shortest route, or let the <strong>Smart Helper</strong> do it!
          </p>
        </div>

        {/* How to play */}
        <div
          className="rounded-xl border border-border p-4 text-sm"
          style={{ background: CARD }}
        >
          <p className="font-semibold mb-2 flex items-center gap-2">
            <span>📋</span> How to play
          </p>
          <ol className="space-y-1 text-muted-foreground list-decimal list-inside">
            <li>The truck starts at 🏠 <strong>Sam's Bakery</strong>.</li>
            <li>Click the cafés <em>in any order</em> to plan a delivery route.</li>
            <li>After visiting all 5 cafés, click 🏠 to return home.</li>
            <li>Then hit <strong>"Smart Helper"</strong> and watch it find the best route!</li>
          </ol>
        </div>

        <div className="grid lg:grid-cols-[1fr_300px] gap-5">
          {/* Map */}
          <div className="space-y-3">
            <DeliveryMap
              points={points}
              userTour={userTour}
              solvedTour={solved?.tour ?? null}
              onClickPoint={handleClickPoint}
              mode={mode}
            />

            {/* Hint text */}
            {mode === "manual" && !tourComplete && (
              <p className="text-center text-xs text-muted-foreground font-mono">
                {userTour.length === 1
                  ? "👆 Click a café to start!"
                  : userTour.length < points.length
                  ? `${points.length - userTour.length} café${points.length - userTour.length > 1 ? "s" : ""} left — then click 🏠 to come home`
                  : "Almost there — click 🏠 Sam's Bakery to finish!"}
              </p>
            )}

            {mode === "solved" && solved && (
              <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm">
                <p className="font-bold text-amber-400 text-base mb-1">🏆 Shortest Route Found!</p>
                <p className="text-muted-foreground">
                  <strong style={{ color: "#f59e0b" }}>
                    {solved.tour.map((i) => points[i].emoji).join(" → ")}
                  </strong>
                </p>
                <p className="mt-1 text-muted-foreground text-xs">
                  Total distance: <span className="text-amber-400 font-mono font-bold">{solved.distance.toFixed(1)} miles</span>
                  {savings !== null && savings > 0 && (
                    <span className="ml-2 text-green-400">
                      — {savings.toFixed(1)} miles shorter than your route! 🎉
                    </span>
                  )}
                </p>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Distances */}
            <div className="grid grid-cols-2 gap-3">
              <DistBadge label="Your route" dist={userDist} />
              <DistBadge label="Best route" dist={solved?.distance ?? 0} highlight />
            </div>

            {/* Possible routes counter */}
            <div
              className="rounded-xl border border-border p-4 text-center"
              style={{ background: CARD }}
            >
              <p className="text-xs text-muted-foreground font-mono mb-1">Possible routes</p>
              <p className="text-3xl font-bold font-mono text-primary">{TOTAL_PERMS.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground mt-1">
                That's 5 × 4 × 3 × 2 × 1 = 120 ways!
              </p>
            </div>

            {/* Checklist */}
            <div className="rounded-xl border border-border p-4" style={{ background: CARD }}>
              <p className="font-semibold text-sm mb-3">🎯 Cafés to deliver</p>
              <Checklist points={points} userTour={mode === "solved" ? (solved?.tour ?? userTour) : userTour} />
            </div>

            {/* Action buttons */}
            <div className="space-y-2">
              <button
                onClick={handleSolve}
                disabled={thinking || mode === "solved"}
                className="w-full py-3 rounded-xl font-bold text-sm transition-all disabled:opacity-50"
                style={{ background: "#f59e0b", color: "#1a0a00" }}
              >
                {thinking ? (
                  <span className="flex items-center justify-center gap-2">
                    <motion.span
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 0.7, ease: "linear" }}
                      className="inline-block"
                    >
                      ⚙️
                    </motion.span>
                    Checking all 120 routes…
                  </span>
                ) : mode === "solved" ? (
                  "✓ Best route shown!"
                ) : (
                  "🤖 Smart Helper — Find Best Route!"
                )}
              </button>

              <button
                onClick={handleReset}
                className="w-full py-2.5 rounded-xl font-medium text-sm border border-border hover:bg-secondary transition-colors text-muted-foreground"
              >
                🔄 Start Over
              </button>
            </div>
          </div>
        </div>

        {/* WOW explanation */}
        <AnimatePresence>
          {showWow && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-6"
            >
              <p className="text-xl font-bold mb-3">🧠 What just happened?</p>
              <div className="grid sm:grid-cols-3 gap-4 text-sm text-muted-foreground">
                <div className="space-y-1">
                  <p className="font-semibold text-foreground flex items-center gap-2">
                    <span className="text-2xl">🤔</span> The Problem
                  </p>
                  <p>
                    There are <strong className="text-foreground">120 different routes</strong> Sam could
                    take. Trying each one by hand would take ages — even just writing them all down would
                    fill several pages!
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="font-semibold text-foreground flex items-center gap-2">
                    <span className="text-2xl">⚡</span> The Smart Helper
                  </p>
                  <p>
                    The helper checked <strong className="text-foreground">every single one</strong> of those
                    120 routes in a split second and kept track of the shortest. That's its superpower!
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="font-semibold text-foreground flex items-center gap-2">
                    <span className="text-2xl">🌍</span> The Real World
                  </p>
                  <p>
                    Amazon, FedEx, and UPS do this with <strong className="text-foreground">thousands of
                    stops</strong> every day. With that many stops, even the fastest computers need very
                    clever tricks — that's where quantum thinking helps!
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
