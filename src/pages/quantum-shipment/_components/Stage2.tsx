import { useState } from "react";
import { motion } from "motion/react";
import { Button } from "@/components/ui/button.tsx";
import { Sparkles, Package } from "lucide-react";
import { generatePallets, quantumStage2, type PalletType } from "@/lib/quantum-shipment-game.ts";
import type { StageResult } from "@/lib/quantum-shipment-game.ts";

interface Stage2Props {
  seeds: number[];
  onComplete: (result: StageResult) => void;
  result?: StageResult;
  onQuantumBoosted?: () => void;
}

export default function Stage2FactoryLoading({ seeds, onComplete, result, onQuantumBoosted }: Stage2Props) {
  const pallets = generatePallets(seeds);
  const [revealed, setRevealed] = useState<boolean[]>(Array(10).fill(false));
  const [slots, setSlots] = useState<(PalletType | null)[]>(Array(10).fill(null));
  const [pendingPallet, setPendingPallet] = useState<PalletType | null>(null);
  const [pendingIdx, setPendingIdx] = useState<number | null>(null);
  const [done, setDone] = useState(result?.completed ?? false);
  const [quantumDone, setQuantumDone] = useState(result?.quantumBoosted ?? false);
  const [quantumSlots, setQuantumSlots] = useState<(PalletType | null)[]>([]);
  const [currentPalletIdx, setCurrentPalletIdx] = useState(0);

  const nextUnplacedPallet = pallets.find((p, i) => !slots.some((s) => s?.id === p.id));
  const unrevealedPallet = !revealed[currentPalletIdx] && currentPalletIdx < 10;

  const handleReveal = () => {
    if (currentPalletIdx >= 10) return;
    const newRevealed = [...revealed];
    newRevealed[currentPalletIdx] = true;
    setRevealed(newRevealed);
    setPendingPallet(pallets[currentPalletIdx]);
    setPendingIdx(currentPalletIdx);
  };

  const handleSlotClick = (slotIdx: number) => {
    if (!pendingPallet || slots[slotIdx]) return;
    const newSlots = [...slots];
    newSlots[slotIdx] = pendingPallet;
    setSlots(newSlots);
    setPendingPallet(null);
    setPendingIdx(null);
    const nextIdx = currentPalletIdx + 1;
    setCurrentPalletIdx(nextIdx);
    if (nextIdx >= 10) {
      // All placed
      const penalties = newSlots.filter((p, i) => {
        if (!p) return false;
        if (p.weight === "heavy" && i >= 5) return true;
        if (p.weight === "light" && i < 5) return true;
        return false;
      }).length;
      const cost = 200 + penalties * 100; // base $200 + penalties
      const time = 0.5 + penalties * 0.2;
      const qPlacement = quantumStage2(pallets);
      const qPenalties = qPlacement.filter((p, i) => {
        if (!pallets[i]) return false;
        if (pallets[i].weight === "heavy" && p >= 5) return true;
        if (pallets[i].weight === "light" && p < 5) return true;
        return false;
      }).length;
      const qCost = 200 + qPenalties * 100;
      const qTime = 0.5 + qPenalties * 0.2;
      const sr: StageResult = {
        manualCost: cost,
        manualTime: time,
        quantumCost: qCost,
        quantumTime: qTime,
        savings: { cost: cost - qCost, time: time - qTime },
        completed: true,
        quantumBoosted: false,
        manualOutcome: `${penalties} penalty placements — $${penalties * 100} extra`,
        quantumOutcome: `0 penalties — perfect loading`,
      };
      onComplete(sr);
      setDone(true);
    }
  };

  const handleQuantumBoost = () => {
    const optimalPlacement = quantumStage2(pallets);
    const qSlots: (PalletType | null)[] = Array(10).fill(null);
    pallets.forEach((p, i) => {
      qSlots[optimalPlacement[i]] = p;
    });
    setQuantumSlots(qSlots);
    setQuantumDone(true);
    onQuantumBoosted?.();
  };

  const manualPenalties = slots.filter((p, i) => {
    if (!p) return false;
    if (p.weight === "heavy" && i >= 5) return true;
    if (p.weight === "light" && i < 5) return true;
    return false;
  }).length;

  const renderSlotGrid = (
    slotArr: (PalletType | null)[],
    interactive: boolean,
    label: string
  ) => (
    <div>
      <div className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">{label}</div>
      <div className="flex gap-1 mb-1">
        <div className="flex-1 text-center text-xs text-muted-foreground border-b border-dashed border-orange-500/40 pb-1">
          ← FRONT (Heavy Zone)
        </div>
        <div className="flex-1 text-center text-xs text-muted-foreground border-b border-dashed border-blue-500/40 pb-1">
          REAR (Light Zone) →
        </div>
      </div>
      <div className="flex gap-1">
        {slotArr.map((pallet, i) => {
          const isHeavyZone = i < 5;
          const isWrongPlacement =
            pallet &&
            ((pallet.weight === "heavy" && !isHeavyZone) ||
              (pallet.weight === "light" && isHeavyZone));
          const isPending = interactive && pendingPallet !== null && !pallet;
          return (
            <motion.div
              key={i}
              whileHover={isPending ? { scale: 1.08 } : {}}
              onClick={() => interactive && handleSlotClick(i)}
              className={`flex-1 aspect-square rounded flex items-center justify-center text-xs font-bold border cursor-pointer transition-all ${
                pallet
                  ? isWrongPlacement
                    ? "bg-destructive/30 border-destructive"
                    : pallet.weight === "heavy"
                    ? "bg-orange-500/30 border-orange-500"
                    : "bg-blue-500/30 border-blue-500"
                  : isHeavyZone
                  ? "border-orange-500/20 bg-orange-500/5 hover:bg-orange-500/15"
                  : "border-blue-500/20 bg-blue-500/5 hover:bg-blue-500/15"
              } ${isPending ? "cursor-pointer ring-2 ring-primary/50" : ""}`}
            >
              {pallet ? (
                <span>{pallet.weight === "heavy" ? "H" : "L"}</span>
              ) : (
                <span className="text-muted-foreground/30">{i + 1}</span>
              )}
              {isWrongPlacement && <span className="absolute text-xs">⚠</span>}
            </motion.div>
          );
        })}
      </div>
      <div className="mt-1 flex gap-2 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 bg-orange-500/50 rounded inline-block"></span> Heavy
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 bg-blue-500/50 rounded inline-block"></span> Light
        </span>
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="bg-[oklch(0.08_0.02_220)] rounded-lg p-4 border border-border text-sm text-muted-foreground">
        <p className="font-medium text-foreground mb-1">Mission</p>
        <p>
          Load 10 pallets into the container. Slots 1–5 are the heavy zone (near cab), 6–10 are
          the light zone (rear). Reveal pallets one by one and place them. Wrong zone = $100
          penalty + 0.2 day delay per violation.
        </p>
      </div>

      {/* Pending pallet indicator */}
      <div className="flex items-center gap-3">
        <div className="text-sm font-medium">
          {currentPalletIdx < 10
            ? `Pallet ${currentPalletIdx + 1}/10`
            : "All pallets placed!"}
        </div>
        {pendingPallet && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-bold ${
              pendingPallet.weight === "heavy"
                ? "bg-orange-500/20 text-orange-400 border border-orange-500/40"
                : "bg-blue-500/20 text-blue-400 border border-blue-500/40"
            }`}
          >
            <Package className="w-3 h-3" />
            {pendingPallet.weight === "heavy" ? "HEAVY pallet" : "LIGHT pallet"} — click a slot!
          </motion.div>
        )}
        {!pendingPallet && currentPalletIdx < 10 && !done && (
          <Button size="sm" variant="secondary" onClick={handleReveal}>
            Reveal Next Pallet
          </Button>
        )}
      </div>

      {renderSlotGrid(slots, !done, "Your Loading")}

      {done && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-sm rounded-lg p-3 bg-card border border-border"
        >
          <span className="font-semibold">Result: </span>
          {manualPenalties} wrong placements — ${manualPenalties * 100} penalty
          {manualPenalties === 0 && " 🎉 Perfect!"}
        </motion.div>
      )}

      {done && !quantumDone && (
        <Button
          onClick={handleQuantumBoost}
          className="w-full bg-[oklch(0.72_0.22_200)] hover:bg-[oklch(0.78_0.2_200)] text-black font-bold"
        >
          <Sparkles className="w-4 h-4 mr-2" />
          Quantum Boost — See Optimal Loading
        </Button>
      )}

      {quantumDone && quantumSlots.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-3"
        >
          {renderSlotGrid(quantumSlots, false, "Quantum Optimal Loading")}
          <div className="rounded-lg p-4 bg-[oklch(0.08_0.05_200)] border border-[oklch(0.25_0.1_200)] text-sm">
            <div className="flex items-center gap-2 font-bold text-[oklch(0.72_0.22_200)] mb-1">
              <Sparkles className="w-4 h-4" />
              Quantum Result
            </div>
            <p>Optimal arrangement: 0 violations — saved ${manualPenalties * 100} in repacking fees.</p>
          </div>
        </motion.div>
      )}
    </div>
  );
}
