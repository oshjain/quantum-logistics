import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "@/components/ui/button.tsx";
import { Sparkles, CheckCircle2, AlertCircle } from "lucide-react";
import {
  STAGE1_DEPOTS,
  calcStage1Cost,
  parseStage1Seeds,
  quantumStage1,
} from "@/lib/quantum-shipment-game.ts";
import type { StageResult } from "@/lib/quantum-shipment-game.ts";

interface Stage1Props {
  seeds: number[];
  onComplete: (result: StageResult) => void;
  result?: StageResult;
  onQuantumBoosted?: () => void;
}

export default function Stage1EmptyPickup({ seeds, onComplete, result, onQuantumBoosted }: Stage1Props) {
  const parsedSeeds = parseStage1Seeds(seeds);
  const [chosen, setChosen] = useState<string | null>(result?.manualChoice ?? null);
  const [outcome, setOutcome] = useState<ReturnType<typeof calcStage1Cost> | null>(null);
  const [quantumDone, setQuantumDone] = useState(result?.quantumBoosted ?? false);
  const [quantumResult, setQuantumResult] = useState<ReturnType<typeof quantumStage1> | null>(null);

  const handlePick = (depotId: string) => {
    if (chosen) return;
    const res = calcStage1Cost(depotId, parsedSeeds);
    setChosen(depotId);
    setOutcome(res);
    const qr = quantumStage1(parsedSeeds);
    const stageResult: StageResult = {
      manualCost: res.cost,
      manualTime: res.time,
      quantumCost: qr.cost,
      quantumTime: qr.time,
      savings: { cost: res.cost - qr.cost, time: res.time - qr.time },
      completed: true,
      quantumBoosted: false,
      manualChoice: depotId,
      quantumChoice: qr.choice,
      manualOutcome: `Depot ${depotId}: $${res.cost}${res.penalised ? " (penalty applied)" : ""}`,
      quantumOutcome: qr.message,
    };
    onComplete(stageResult);
  };

  const handleQuantumBoost = () => {
    const qr = quantumStage1(parsedSeeds);
    setQuantumResult(qr);
    setQuantumDone(true);
    onQuantumBoosted?.();
  };

  return (
    <div className="space-y-4">
      <div className="bg-[oklch(0.08_0.02_220)] rounded-lg p-4 border border-border text-sm text-muted-foreground">
        <p className="font-medium text-foreground mb-1">Mission</p>
        <p>
          You need an empty 40ft container from one of 3 depots near Delhi. Choose wisely — some
          depots may already be booked. Cost = distance × $2/km. Occupied depot = $50 penalty + 0.5
          day delay.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {STAGE1_DEPOTS.map((depot) => {
          const isChosen = chosen === depot.id;
          const isOccupied =
            depot.id === "A" ? parsedSeeds.depotAOccupied : false;
          const isRevealed = !!chosen;

          return (
            <motion.button
              key={depot.id}
              whileHover={!chosen ? { scale: 1.03 } : {}}
              whileTap={!chosen ? { scale: 0.97 } : {}}
              onClick={() => handlePick(depot.id)}
              disabled={!!chosen}
              className={`relative rounded-xl p-4 border text-left transition-all cursor-pointer ${
                isChosen
                  ? isOccupied
                    ? "border-destructive bg-[oklch(0.12_0.05_25)] text-destructive"
                    : "border-[oklch(0.72_0.22_200)] bg-[oklch(0.1_0.04_200)]"
                  : "border-border bg-card hover:border-primary/50"
              } ${chosen && !isChosen ? "opacity-50" : ""}`}
            >
              <div className="text-lg font-bold mb-1">{depot.name}</div>
              <div className="text-xs text-muted-foreground mb-2">{depot.distance}km from factory</div>
              <div className="text-sm font-semibold">${depot.distance * 2} base</div>
              <div className="text-xs text-muted-foreground">{depot.available} containers</div>

              {isRevealed && depot.id === "A" && (
                <AnimatePresence>
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className={`mt-2 text-xs font-medium flex items-center gap-1 ${
                      isOccupied ? "text-destructive" : "text-[oklch(0.78_0.2_140)]"
                    }`}
                  >
                    {isOccupied ? (
                      <>
                        <AlertCircle className="w-3 h-3" /> Occupied! +$50, +0.5d
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-3 h-3" /> Available!
                      </>
                    )}
                  </motion.div>
                </AnimatePresence>
              )}
              {isRevealed && depot.id !== "A" && (
                <div className="mt-2 text-xs text-[oklch(0.78_0.2_140)] flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Available
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
          <span className="font-semibold">Your result: </span>
          Depot {chosen} — ${outcome.cost} total, {outcome.time.toFixed(1)} days
          {outcome.penalised && " (depot was occupied — penalty applied!)"}
        </motion.div>
      )}

      {outcome && !quantumDone && (
        <Button
          onClick={handleQuantumBoost}
          className="w-full bg-[oklch(0.72_0.22_200)] hover:bg-[oklch(0.78_0.2_200)] text-black font-bold"
        >
          <Sparkles className="w-4 h-4 mr-2" />
          Quantum Boost — See Optimal Choice
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
          <p className="text-foreground mb-1">{quantumResult.message}</p>
          {outcome && (
            <div className="mt-2 flex gap-4 text-xs">
              <span className="text-muted-foreground">
                Your cost: <span className="text-foreground font-medium">${outcome.cost}</span>
              </span>
              <span className="text-muted-foreground">
                Quantum cost: <span className="text-[oklch(0.72_0.22_200)] font-medium">${quantumResult.cost}</span>
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
