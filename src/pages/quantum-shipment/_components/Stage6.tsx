import { useState } from "react";
import { motion } from "motion/react";
import { Button } from "@/components/ui/button.tsx";
import { Sparkles, Ship } from "lucide-react";
import { seededRandom } from "@/lib/quantum-shipment-game.ts";
import type { StageResult } from "@/lib/quantum-shipment-game.ts";

interface Stage6Props {
  seeds: number[];
  onComplete: (result: StageResult) => void;
  result?: StageResult;
  onQuantumBoosted?: () => void;
}

const VESSELS = [
  { id: "X", name: "Vessel X", departure: 1, cost: 800, fullChance: 0.7, slots: 5 },
  { id: "Y", name: "Vessel Y", departure: 2, cost: 600, fullChance: 0.5, slots: 10 },
  { id: "Z", name: "Vessel Z", departure: 3, cost: 500, fullChance: 0.2, slots: 15 },
];

export default function Stage6Transshipment({ seeds, onComplete, result, onQuantumBoosted }: Stage6Props) {
  const rng = seededRandom(Math.floor((seeds[0] ?? 0.5) * 1e9));
  // Pre-determine capacity for each vessel
  const vesselCapacity = VESSELS.map((v) => rng() < v.fullChance);
  // vesselCapacity[i] = true means FULL

  const [chosen, setChosen] = useState<string | null>(result?.manualChoice ?? null);
  const [outcome, setOutcome] = useState<{ cost: number; time: number; penalised: boolean } | null>(null);
  const [quantumDone, setQuantumDone] = useState(result?.quantumBoosted ?? false);

  const calcVessel = (vesselId: string, isFull: boolean) => {
    const v = VESSELS.find((x) => x.id === vesselId)!;
    if (isFull) {
      // Wait for next vessel
      const nextV = VESSELS.find((x) => x.departure > v.departure) ?? VESSELS[VESSELS.length - 1];
      return { cost: v.cost + 200, time: nextV.departure + 0.5, penalised: true };
    }
    return { cost: v.cost, time: v.departure, penalised: false };
  };

  const handlePick = (vesselId: string) => {
    if (chosen) return;
    const idx = VESSELS.findIndex((v) => v.id === vesselId);
    const res = calcVessel(vesselId, vesselCapacity[idx]);
    setChosen(vesselId);
    setOutcome(res);

    // Quantum: pick vessel with lowest expected cost (availability × cost)
    const expected = VESSELS.map((v, i) => {
      const available = calcVessel(v.id, false);
      const full = calcVessel(v.id, true);
      const probFull = v.fullChance;
      return { id: v.id, expected: probFull * full.cost + (1 - probFull) * available.cost };
    });
    const bestExpected = expected.reduce((a, b) => (a.expected < b.expected ? a : b));
    const bestIdx = VESSELS.findIndex((v) => v.id === bestExpected.id);
    const qActual = calcVessel(bestExpected.id, vesselCapacity[bestIdx]);

    const sr: StageResult = {
      manualCost: res.cost,
      manualTime: res.time,
      quantumCost: qActual.cost,
      quantumTime: qActual.time,
      savings: { cost: res.cost - qActual.cost, time: res.time - qActual.time },
      completed: true,
      quantumBoosted: false,
      manualChoice: vesselId,
      quantumChoice: bestExpected.id,
      manualOutcome: `Vessel ${vesselId}: $${res.cost}${res.penalised ? " (was full — penalty!)" : ""}`,
      quantumOutcome: `Vessel ${bestExpected.id}: $${qActual.cost}${qActual.penalised ? " (also full)" : ""}`,
    };
    onComplete(sr);
  };

  const handleQuantumBoost = () => { setQuantumDone(true); onQuantumBoosted?.(); };

  const quantumChoice = (() => {
    const expected = VESSELS.map((v, i) => {
      const available = calcVessel(v.id, false);
      const full = calcVessel(v.id, true);
      return { id: v.id, expected: v.fullChance * full.cost + (1 - v.fullChance) * available.cost, vessel: v };
    });
    return expected.reduce((a, b) => (a.expected < b.expected ? a : b));
  })();

  return (
    <div className="space-y-4">
      <div className="bg-[oklch(0.08_0.02_220)] rounded-lg p-4 border border-border text-sm text-muted-foreground">
        <p className="font-medium text-foreground mb-1">Mission</p>
        <p>
          Your container is at Singapore hub. Pick a vessel to New York. Earlier departures cost
          more. If the vessel is full, you pay $200 penalty and wait for the next one. Capacity is
          uncertain — you must weigh cost vs. availability risk.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {VESSELS.map((vessel, i) => {
          const isChosen = chosen === vessel.id;
          const isFull = vesselCapacity[i];
          const isRevealed = !!chosen;
          return (
            <motion.button
              key={vessel.id}
              whileHover={!chosen ? { scale: 1.03 } : {}}
              onClick={() => handlePick(vessel.id)}
              disabled={!!chosen}
              className={`rounded-xl p-4 border text-left cursor-pointer transition-all ${
                isChosen
                  ? isFull
                    ? "border-destructive bg-destructive/10"
                    : "border-primary bg-primary/10"
                  : "border-border bg-card hover:border-primary/50"
              } ${chosen && !isChosen ? "opacity-50" : ""}`}
            >
              <div className="flex items-center gap-2 mb-2">
                <Ship className="w-4 h-4 text-primary" />
                <span className="font-bold">{vessel.name}</span>
              </div>
              <div className="text-xs text-muted-foreground space-y-1">
                <div>Departs: {vessel.departure} day{vessel.departure !== 1 ? "s" : ""}</div>
                <div>Cost: ${vessel.cost}</div>
                <div className={vessel.fullChance > 0.6 ? "text-amber-400" : "text-emerald-400"}>
                  {Math.round(vessel.fullChance * 100)}% chance full
                </div>
              </div>
              {isRevealed && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className={`mt-2 text-xs font-bold ${isFull ? "text-destructive" : "text-emerald-400"}`}
                >
                  {isFull ? "⚠ FULL — penalty!" : "✓ Available!"}
                </motion.div>
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
          <span className="font-semibold">Result: </span>
          Vessel {chosen} — ${outcome.cost}, {outcome.time} day{outcome.time !== 1 ? "s" : ""} wait
          {outcome.penalised && " (vessel was full — $200 penalty applied)"}
        </motion.div>
      )}

      {outcome && !quantumDone && (
        <Button
          onClick={handleQuantumBoost}
          className="w-full bg-[oklch(0.72_0.22_200)] hover:bg-[oklch(0.78_0.2_200)] text-black font-bold"
        >
          <Sparkles className="w-4 h-4 mr-2" />
          Quantum Boost — Optimal Vessel Selection
        </Button>
      )}

      {quantumDone && outcome && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="rounded-lg p-4 bg-[oklch(0.08_0.05_200)] border border-[oklch(0.25_0.1_200)] text-sm"
        >
          <div className="flex items-center gap-2 font-bold text-[oklch(0.72_0.22_200)] mb-2">
            <Sparkles className="w-4 h-4" />
            Quantum Optimal: Vessel {quantumChoice.id}
          </div>
          <p>
            Lowest expected cost: ${Math.round(quantumChoice.expected)}/voyage considering capacity
            probability. Vessel {quantumChoice.vessel.name} had only {Math.round(quantumChoice.vessel.fullChance * 100)}% chance of being full.
          </p>
          <div className="mt-2 flex gap-4 text-xs">
            <span className="text-muted-foreground">Your cost: <span className="text-foreground font-medium">${outcome.cost}</span></span>
            <span className="text-[oklch(0.78_0.2_140)] font-bold">
              Saved: ${Math.max(0, outcome.cost - (VESSELS.find(v => v.id === quantumChoice.id)!.cost))}
            </span>
          </div>
        </motion.div>
      )}
    </div>
  );
}
