import { useState } from "react";
import { motion } from "motion/react";
import { Button } from "@/components/ui/button.tsx";
import { Sparkles, Truck, Moon } from "lucide-react";
import { STAGE3_ROUTES, calcStage3, quantumStage3 } from "@/lib/quantum-shipment-game.ts";
import type { StageResult } from "@/lib/quantum-shipment-game.ts";

interface Stage3Props {
  seeds: number[];
  onComplete: (result: StageResult) => void;
  result?: StageResult;
  onQuantumBoosted?: () => void;
}

export default function Stage3Drayage({ seeds: _seeds, onComplete, result, onQuantumBoosted }: Stage3Props) {
  const [chosen, setChosen] = useState<"highway" | "state" | null>(
    (result?.manualChoice as "highway" | "state") ?? null
  );
  const [outcome, setOutcome] = useState<ReturnType<typeof calcStage3> | null>(null);
  const [quantumDone, setQuantumDone] = useState(result?.quantumBoosted ?? false);
  const [quantumResult, setQuantumResult] = useState<ReturnType<typeof quantumStage3> | null>(null);

  const handlePick = (routeId: "highway" | "state") => {
    if (chosen) return;
    const res = calcStage3(routeId);
    setChosen(routeId);
    setOutcome(res);
    const qr = quantumStage3();
    const sr: StageResult = {
      manualCost: res.cost,
      manualTime: res.time,
      quantumCost: qr.cost,
      quantumTime: qr.time,
      savings: { cost: res.cost - qr.cost, time: res.time - qr.time },
      completed: true,
      quantumBoosted: false,
      manualChoice: routeId,
      quantumChoice: qr.choice,
      manualOutcome: `${STAGE3_ROUTES[routeId].name}: $${res.cost}, ${res.time.toFixed(1)} days${res.overnight ? " (overnight stop)" : ""}`,
      quantumOutcome: qr.message,
    };
    onComplete(sr);
  };

  const handleQuantumBoost = () => {
    const qr = quantumStage3();
    setQuantumResult(qr);
    setQuantumDone(true);
    onQuantumBoosted?.();
  };

  const routes = [
    {
      id: "highway" as const,
      icon: "🛣️",
      title: "Highway Route",
      speed: "80 km/h",
      distance: "900 km",
      toll: "$150 toll",
      note: "Fast but expensive. Drive time: 11.25h",
    },
    {
      id: "state" as const,
      icon: "🌾",
      title: "State Roads",
      speed: "60 km/h",
      distance: "900 km (+2h)",
      toll: "No toll",
      note: "Slower but toll-free. Drive time: 17h",
    },
  ];

  return (
    <div className="space-y-4">
      <div className="bg-[oklch(0.08_0.02_220)] rounded-lg p-4 border border-border text-sm text-muted-foreground">
        <p className="font-medium text-foreground mb-1">Mission</p>
        <p>
          Truck must travel 900km from Delhi factory to Mundra Port. Driver limit: 10h/day. If
          driving exceeds 10h, an overnight stop costs $200 + 0.5 days. Highway: $150 toll, 80km/h.
          State roads: free, but 2h extra (60km/h effective).
        </p>
      </div>

      {/* Route comparison */}
      <div className="grid grid-cols-2 gap-3">
        {routes.map((route) => {
          const calc = calcStage3(route.id);
          const isChosen = chosen === route.id;
          return (
            <motion.button
              key={route.id}
              whileHover={!chosen ? { scale: 1.02 } : {}}
              whileTap={!chosen ? { scale: 0.98 } : {}}
              onClick={() => handlePick(route.id)}
              disabled={!!chosen}
              className={`rounded-xl p-4 border text-left cursor-pointer transition-all ${
                isChosen
                  ? "border-primary bg-[oklch(0.1_0.04_200)]"
                  : "border-border bg-card hover:border-primary/50"
              } ${chosen && !isChosen ? "opacity-50" : ""}`}
            >
              <div className="text-2xl mb-2">{route.icon}</div>
              <div className="font-bold mb-1">{route.title}</div>
              <div className="text-xs text-muted-foreground space-y-1">
                <div>{route.speed} — {route.distance}</div>
                <div>{route.toll}</div>
                <div className="text-xs italic mt-1">{route.note}</div>
              </div>
              <div className="mt-3 flex gap-3">
                <div className="text-sm font-semibold">${calc.cost}</div>
                <div className="text-xs text-muted-foreground">{calc.time.toFixed(1)} days</div>
              </div>
              {calc.overnight && (
                <div className="mt-1 flex items-center gap-1 text-xs text-amber-400">
                  <Moon className="w-3 h-3" /> Overnight stop required
                </div>
              )}
            </motion.button>
          );
        })}
      </div>

      {outcome && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-lg p-3 bg-card border border-border text-sm"
        >
          <div className="flex items-center gap-2 mb-1">
            <Truck className="w-4 h-4" />
            <span className="font-semibold">{STAGE3_ROUTES[chosen!].name} selected</span>
          </div>
          <p>Total cost: ${outcome.cost} — Transit: {outcome.time.toFixed(1)} days{outcome.overnight ? " (includes overnight stop)" : ""}</p>
        </motion.div>
      )}

      {outcome && !quantumDone && (
        <Button
          onClick={handleQuantumBoost}
          className="w-full bg-[oklch(0.72_0.22_200)] hover:bg-[oklch(0.78_0.2_200)] text-black font-bold"
        >
          <Sparkles className="w-4 h-4 mr-2" />
          Quantum Boost — See Optimal Route
        </Button>
      )}

      {quantumDone && quantumResult && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="rounded-lg p-4 bg-[oklch(0.08_0.05_200)] border border-[oklch(0.25_0.1_200)] text-sm"
        >
          <div className="flex items-center gap-2 font-bold text-[oklch(0.72_0.22_200)] mb-2">
            <Sparkles className="w-4 h-4" />
            Quantum Optimal
          </div>
          <p className="text-foreground mb-2">{quantumResult.message}</p>
          {outcome && (
            <div className="flex gap-4 text-xs">
              <span className="text-muted-foreground">
                Your cost: <span className="text-foreground font-medium">${outcome.cost}</span>
              </span>
              <span className="text-muted-foreground">
                Quantum: <span className="text-[oklch(0.72_0.22_200)] font-medium">${quantumResult.cost}</span>
              </span>
              <span className="text-[oklch(0.78_0.2_140)] font-bold">
                Saved: ${outcome.cost - quantumResult.cost} &amp; {(outcome.time - quantumResult.time).toFixed(1)}d
              </span>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}
