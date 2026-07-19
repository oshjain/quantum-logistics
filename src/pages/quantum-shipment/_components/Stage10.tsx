import { useState } from "react";
import { motion } from "motion/react";
import { Button } from "@/components/ui/button.tsx";
import { Sparkles } from "lucide-react";
import type { StageResult } from "@/lib/quantum-shipment-game.ts";

interface Stage10Props {
  seeds: number[];
  onComplete: (result: StageResult) => void;
  result?: StageResult;
  onQuantumBoosted?: () => void;
}

// 5 delivery stops + start (rail yard) 
// We use fixed positions on a mini SVG canvas
const LOCATIONS = [
  { id: 0, name: "Rail Yard", x: 50, y: 75, isStart: true },
  { id: 1, name: "Stop A", x: 20, y: 20 },
  { id: 2, name: "Stop B", x: 75, y: 15 },
  { id: 3, name: "Stop C", x: 85, y: 60 },
  { id: 4, name: "Stop D", x: 30, y: 55 },
  { id: 5, name: "Stop E", x: 60, y: 35 },
];

function dist(a: { x: number; y: number }, b: { x: number; y: number }): number {
  return Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2));
}

function routeDistance(route: number[]): number {
  let total = 0;
  for (let i = 0; i < route.length - 1; i++) {
    total += dist(LOCATIONS[route[i]], LOCATIONS[route[i + 1]]);
  }
  return total;
}

// Brute-force TSP for 5 stops (5! = 120 permutations)
function allPerms(arr: number[]): number[][] {
  if (arr.length <= 1) return [arr];
  const result: number[][] = [];
  for (let i = 0; i < arr.length; i++) {
    const rest = [...arr.slice(0, i), ...arr.slice(i + 1)];
    for (const perm of allPerms(rest)) {
      result.push([arr[i], ...perm]);
    }
  }
  return result;
}

function optimalTSP(): { route: number[]; distance: number } {
  const stops = [1, 2, 3, 4, 5];
  const perms = allPerms(stops);
  let best = { route: stops, distance: Infinity };
  for (const perm of perms) {
    const full = [0, ...perm, 0];
    const d = routeDistance(full);
    if (d < best.distance) best = { route: full, distance: d };
  }
  return best;
}

export default function Stage10LastMile({ seeds: _seeds, onComplete, result, onQuantumBoosted }: Stage10Props) {
  const [visitOrder, setVisitOrder] = useState<number[]>([0]); // start at rail yard
  const [done, setDone] = useState(result?.completed ?? false);
  const [quantumDone, setQuantumDone] = useState(result?.quantumBoosted ?? false);
  const [quantumRoute, setQuantumRoute] = useState<number[] | null>(null);

  const unvisited = [1, 2, 3, 4, 5].filter((id) => !visitOrder.includes(id));
  const allVisited = unvisited.length === 0;

  const handleStopClick = (stopId: number) => {
    if (done || visitOrder.includes(stopId)) return;
    const newOrder = [...visitOrder, stopId];
    setVisitOrder(newOrder);
    if (newOrder.length === 6) {
      // All stops visited, return to yard
      const fullRoute = [...newOrder, 0];
      const manualDist = routeDistance(fullRoute);
      const opt = optimalTSP();
      const distRatio = manualDist / opt.distance;
      // Cost: $2/km equivalent unit
      const COST_PER_UNIT = 20; // per distance unit
      const TIME_PER_UNIT = 0.05; // days per unit
      const manualCost = Math.round(manualDist * COST_PER_UNIT);
      const qCost = Math.round(opt.distance * COST_PER_UNIT);
      const manualTime = parseFloat((manualDist * TIME_PER_UNIT).toFixed(1));
      const qTime = parseFloat((opt.distance * TIME_PER_UNIT).toFixed(1));
      const sr: StageResult = {
        manualCost,
        manualTime,
        quantumCost: qCost,
        quantumTime: qTime,
        savings: { cost: manualCost - qCost, time: manualTime - qTime },
        completed: true,
        quantumBoosted: false,
        manualOutcome: `Distance: ${manualDist.toFixed(0)} units — $${manualCost}`,
        quantumOutcome: `Optimal TSP: ${opt.distance.toFixed(0)} units — $${qCost}`,
      };
      onComplete(sr);
      setDone(true);
      setVisitOrder(fullRoute);
    }
  };

  const handleQuantumBoost = () => {
    const opt = optimalTSP();
    setQuantumRoute(opt.route);
    setQuantumDone(true);
    onQuantumBoosted?.();
  };

  const currentRoute = allVisited ? [...visitOrder, 0] : visitOrder;
  const currentDist = routeDistance(currentRoute);
  const opt = optimalTSP();

  const renderMap = (route: number[], interactive: boolean, label: string) => (
    <div className="flex-1">
      <div className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">{label}</div>
      <div className="relative bg-[oklch(0.06_0.02_220)] rounded-xl border border-border overflow-hidden aspect-square max-w-[280px]">
        <svg viewBox="0 0 100 100" className="w-full h-full">
          {/* Route lines */}
          {route.length > 1 &&
            route.slice(0, -1).map((id, i) => {
              const from = LOCATIONS[id];
              const to = LOCATIONS[route[i + 1]];
              return (
                <motion.line
                  key={`${id}-${route[i + 1]}-${i}`}
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  x1={from.x}
                  y1={from.y}
                  x2={to.x}
                  y2={to.y}
                  stroke="oklch(0.72 0.22 200)"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              );
            })}

          {/* Nodes */}
          {LOCATIONS.map((loc, i) => {
            const isVisited = route.includes(loc.id);
            const isCurrent = route[route.length - 1] === loc.id;
            const isInteractive = interactive && !isVisited && !done;
            return (
              <g
                key={loc.id}
                onClick={() => isInteractive && handleStopClick(loc.id)}
                className={isInteractive ? "cursor-pointer" : ""}
              >
                <circle
                  cx={loc.x}
                  cy={loc.y}
                  r={loc.isStart ? "5" : "4"}
                  fill={
                    loc.isStart
                      ? "oklch(0.72 0.22 200)"
                      : isVisited
                      ? "oklch(0.78 0.2 140)"
                      : "oklch(0.25 0.03 260)"
                  }
                  stroke={isInteractive ? "oklch(0.72 0.22 200 / 0.5)" : "oklch(0.35 0.03 260)"}
                  strokeWidth={isInteractive ? "1" : "0.5"}
                />
                <text
                  x={loc.x}
                  y={loc.y - 6}
                  textAnchor="middle"
                  fontSize="5"
                  fill="white"
                  fontWeight="bold"
                >
                  {loc.isStart ? "⬡" : loc.name}
                </text>
              </g>
            );
          })}
        </svg>

        {interactive && !done && unvisited.length > 0 && (
          <div className="absolute bottom-2 left-2 right-2 text-center text-xs text-muted-foreground">
            Click stops to plan your route ({unvisited.length} remaining)
          </div>
        )}
      </div>
      <div className="mt-1 text-xs text-muted-foreground">
        Distance: {routeDistance(route.length > 1 ? route : [0]).toFixed(0)} units
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="bg-[oklch(0.08_0.02_220)] rounded-lg p-4 border border-border text-sm text-muted-foreground">
        <p className="font-medium text-foreground mb-1">Mission</p>
        <p>
          Final delivery in Chicago! Visit all 5 stops starting from the Rail Yard and return.
          Plan the shortest route — this is the Travelling Salesman Problem. Click stops in the
          order you want to visit them.
        </p>
      </div>

      <div className="flex gap-4 flex-wrap">
        {renderMap(visitOrder, !done, done ? "Your Route" : "Click stops to plan route")}
        {quantumDone && quantumRoute && renderMap(quantumRoute, false, "Quantum Optimal Route")}
      </div>

      {done && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-lg p-3 bg-card border border-border text-sm"
        >
          <span className="font-semibold">Your route: </span>
          {currentRoute.map((id) => LOCATIONS[id].name).join(" → ")}
          <br />
          Distance: {routeDistance(currentRoute).toFixed(0)} units vs. optimal {opt.distance.toFixed(0)} units
          {routeDistance(currentRoute) <= opt.distance * 1.05 && " 🎉 Near-optimal!"}
        </motion.div>
      )}

      {done && !quantumDone && (
        <Button
          onClick={handleQuantumBoost}
          className="w-full bg-[oklch(0.72_0.22_200)] hover:bg-[oklch(0.78_0.2_200)] text-black font-bold"
        >
          <Sparkles className="w-4 h-4 mr-2" />
          Quantum Boost — Shortest Route (TSP)
        </Button>
      )}

      {quantumDone && quantumRoute && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="rounded-lg p-4 bg-[oklch(0.08_0.05_200)] border border-[oklch(0.25_0.1_200)] text-sm"
        >
          <div className="flex items-center gap-2 font-bold text-[oklch(0.72_0.22_200)] mb-2">
            <Sparkles className="w-4 h-4" />
            Quantum TSP Solution
          </div>
          <p>
            Optimal route: {quantumRoute.map((id) => LOCATIONS[id].name).join(" → ")}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Distance: {opt.distance.toFixed(0)} units — saved {(routeDistance(currentRoute) - opt.distance).toFixed(0)} units vs. your route
          </p>
          <p className="mt-1 text-[oklch(0.78_0.2_140)] font-bold text-xs">
            Quantum evaluated all {120} permutations instantly and found the shortest path.
          </p>
        </motion.div>
      )}
    </div>
  );
}
