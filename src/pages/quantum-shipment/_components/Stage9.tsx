import { useState } from "react";
import { motion } from "motion/react";
import { Button } from "@/components/ui/button.tsx";
import { Sparkles, Train, AlertCircle } from "lucide-react";
import { seededRandom } from "@/lib/quantum-shipment-game.ts";
import type { StageResult } from "@/lib/quantum-shipment-game.ts";

interface Stage9Props {
  seeds: number[];
  onComplete: (result: StageResult) => void;
  result?: StageResult;
  onQuantumBoosted?: () => void;
}

const TRAINS = [
  { id: "A", name: "Train A", depart: 0.5, transit: 2, cost: 1200, fullChance: 0.8 },
  { id: "B", name: "Train B", depart: 1, transit: 2.5, cost: 1000, fullChance: 0.05 },
];

export default function Stage9Rail({ seeds, onComplete, result, onQuantumBoosted }: Stage9Props) {
  const rng = seededRandom(Math.floor((seeds[0] ?? 0.4) * 1e9));
  const trainCapacity = TRAINS.map((t) => rng() < t.fullChance);
  // trainCapacity[i] = true means FULL

  const [chosen, setChosen] = useState<string | null>(result?.manualChoice ?? null);
  const [outcome, setOutcome] = useState<{ cost: number; time: number; missed: boolean } | null>(null);
  const [quantumDone, setQuantumDone] = useState(result?.quantumBoosted ?? false);

  const calcTrain = (trainId: string, isFull: boolean) => {
    const t = TRAINS.find((x) => x.id === trainId)!;
    if (isFull) {
      // Wait for next: add 1 day wait + next train transit
      const nextT = TRAINS.find((x) => x.id !== trainId) ?? TRAINS[1];
      return { cost: t.cost + 100, time: t.depart + nextT.transit + 1, missed: true };
    }
    return { cost: t.cost, time: t.depart + t.transit, missed: false };
  };

  const handlePick = (trainId: string) => {
    if (chosen) return;
    const idx = TRAINS.findIndex((t) => t.id === trainId);
    const res = calcTrain(trainId, trainCapacity[idx]);
    setChosen(trainId);
    setOutcome(res);

    // Quantum: expected value analysis
    const expected = TRAINS.map((t, i) => {
      const avail = calcTrain(t.id, false);
      const full = calcTrain(t.id, true);
      return {
        id: t.id,
        expectedCost: t.fullChance * full.cost + (1 - t.fullChance) * avail.cost,
        expectedTime: t.fullChance * full.time + (1 - t.fullChance) * avail.time,
      };
    });
    const bestByTime = expected.reduce((a, b) => (a.expectedTime < b.expectedTime ? a : b));
    const bestIdx = TRAINS.findIndex((t) => t.id === bestByTime.id);
    const qActual = calcTrain(bestByTime.id, trainCapacity[bestIdx]);

    const sr: StageResult = {
      manualCost: res.cost,
      manualTime: res.time,
      quantumCost: qActual.cost,
      quantumTime: qActual.time,
      savings: { cost: res.cost - qActual.cost, time: res.time - qActual.time },
      completed: true,
      quantumBoosted: false,
      manualChoice: trainId,
      quantumChoice: bestByTime.id,
      manualOutcome: `Train ${trainId}: $${res.cost}, ${res.time.toFixed(1)} days${res.missed ? " (missed — rebooked)" : ""}`,
      quantumOutcome: `Train ${bestByTime.id}: best expected time ${bestByTime.expectedTime.toFixed(1)} days`,
    };
    onComplete(sr);
  };

  const handleQuantumBoost = () => { setQuantumDone(true); onQuantumBoosted?.(); };

  const quantumChoice = TRAINS.map((t, i) => {
    const avail = calcTrain(t.id, false);
    const full = calcTrain(t.id, true);
    return {
      id: t.id,
      expectedTime: t.fullChance * full.time + (1 - t.fullChance) * avail.time,
      expectedCost: t.fullChance * full.cost + (1 - t.fullChance) * avail.cost,
    };
  }).reduce((a, b) => (a.expectedTime < b.expectedTime ? a : b));

  return (
    <div className="space-y-4">
      <div className="bg-[oklch(0.08_0.02_220)] rounded-lg p-4 border border-border text-sm text-muted-foreground">
        <p className="font-medium text-foreground mb-1">Mission</p>
        <p>
          Container goes by rail New York → Chicago. Train A departs sooner but has 80% full
          capacity. Train B is slower but nearly always available. If your train is full, wait 1
          day for rescheduling.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {TRAINS.map((train, i) => {
          const isChosen = chosen === train.id;
          const isFull = trainCapacity[i];
          const isRevealed = !!chosen;
          const avail = calcTrain(train.id, false);
          const full = calcTrain(train.id, true);
          return (
            <motion.button
              key={train.id}
              whileHover={!chosen ? { scale: 1.02 } : {}}
              onClick={() => handlePick(train.id)}
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
                <Train className="w-4 h-4 text-primary" />
                <span className="font-bold">{train.name}</span>
              </div>
              <div className="text-xs text-muted-foreground space-y-1">
                <div>Departs in: {train.depart} day{train.depart !== 1 ? "s" : ""}</div>
                <div>Transit: {train.transit} days</div>
                <div>Cost: ${train.cost.toLocaleString()}</div>
                <div className={train.fullChance > 0.5 ? "text-amber-400" : "text-emerald-400"}>
                  {Math.round(train.fullChance * 100)}% chance full
                </div>
                <div className="mt-1 text-muted-foreground/60">
                  Best case: {avail.time}d / Worst: {full.time}d
                </div>
              </div>
              {isRevealed && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className={`mt-2 text-xs font-bold flex items-center gap-1 ${isFull ? "text-destructive" : "text-emerald-400"}`}
                >
                  {isFull ? <><AlertCircle className="w-3 h-3" /> Full — rebooked!</> : "✓ Boarded!"}
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
          Train {chosen} — ${outcome.cost.toLocaleString()}, {outcome.time.toFixed(1)} days
          {outcome.missed && " (train was full — rescheduled, +1 day)"}
        </motion.div>
      )}

      {outcome && !quantumDone && (
        <Button
          onClick={handleQuantumBoost}
          className="w-full bg-[oklch(0.72_0.22_200)] hover:bg-[oklch(0.78_0.2_200)] text-black font-bold"
        >
          <Sparkles className="w-4 h-4 mr-2" />
          Quantum Boost — Optimal Train Selection
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
            Quantum Optimal: Train {quantumChoice.id}
          </div>
          <div className="text-xs space-y-1">
            {TRAINS.map((t, i) => {
              const exp = TRAINS.map((x, j) => {
                const avail2 = calcTrain(x.id, false);
                const full2 = calcTrain(x.id, true);
                return {
                  id: x.id,
                  expectedTime: x.fullChance * full2.time + (1 - x.fullChance) * avail2.time,
                };
              })[i];
              return (
                <div key={t.id}>
                  Train {t.id}: {t.fullChance * 100}% full → expected {exp.expectedTime.toFixed(1)} days
                </div>
              );
            })}
            <div className="text-[oklch(0.78_0.2_140)] font-bold mt-2">
              Train B wins on expected transit time despite being slower — it almost never gets full.
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
