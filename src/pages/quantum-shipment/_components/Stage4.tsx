import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "@/components/ui/button.tsx";
import { Sparkles } from "lucide-react";
import { quantumStage4 } from "@/lib/quantum-shipment-game.ts";
import type { StageResult } from "@/lib/quantum-shipment-game.ts";

interface Stage4Props {
  seeds: number[];
  onComplete: (result: StageResult) => void;
  result?: StageResult;
  onQuantumBoosted?: () => void;
}

// Stack: position 0 = bottom, 5 = top. 5 existing containers + 1 yours
// Ship retrieves your container 3rd (so 2 retrieved before yours)
const RETRIEVAL_ORDER = 3;
const STACK_SIZE = 6;
const EXISTING_COLORS = [
  "bg-purple-500/40 border-purple-500",
  "bg-yellow-500/40 border-yellow-500",
  "bg-green-500/40 border-green-500",
  "bg-red-500/40 border-red-500",
  "bg-pink-500/40 border-pink-500",
];

function calcReshuffles(yourPosition: number): number {
  // yourPosition = index from bottom (0=bottom, 5=top)
  const itemsAbove = STACK_SIZE - 1 - yourPosition;
  // Containers that need to be moved before yours: items above - (containers retrieved before yours)
  const containersBefore = RETRIEVAL_ORDER - 1; // 2
  return Math.max(0, itemsAbove - containersBefore);
}

export default function Stage4YardStacking({ seeds: _seeds, onComplete, result, onQuantumBoosted }: Stage4Props) {
  const [yourPosition, setYourPosition] = useState<number | null>(
    result?.manualChoice != null ? parseInt(result.manualChoice) : null
  );
  const [quantumDone, setQuantumDone] = useState(result?.quantumBoosted ?? false);
  const [quantumPosition, setQuantumPosition] = useState<number | null>(null);

  const handlePlace = (position: number) => {
    if (yourPosition !== null) return;
    setYourPosition(position);
    const reshuffles = calcReshuffles(position);
    const cost = 200 + reshuffles * 80; // base yard handling $200
    const time = 0.5 + reshuffles * 0.1;

    const qr = quantumStage4(RETRIEVAL_ORDER);
    const sr: StageResult = {
      manualCost: cost,
      manualTime: time,
      quantumCost: 200 + qr.cost,
      quantumTime: 0.5,
      savings: { cost: cost - (200 + qr.cost), time: time - 0.5 },
      completed: true,
      quantumBoosted: false,
      manualChoice: position.toString(),
      quantumChoice: qr.position.toString(),
      manualOutcome: `Position ${position + 1}: ${reshuffles} reshuffles, $${reshuffles * 80} extra`,
      quantumOutcome: qr.message,
    };
    onComplete(sr);
  };

  const handleQuantumBoost = () => {
    const qr = quantumStage4(RETRIEVAL_ORDER);
    setQuantumPosition(qr.position);
    setQuantumDone(true);
    onQuantumBoosted?.();
  };

  const reshuffles = yourPosition !== null ? calcReshuffles(yourPosition) : null;

  // Render stack from top to bottom (visual top = highest position)
  const renderStack = (highlightPos: number | null, label: string, isQuantum = false) => {
    const stackSlots = Array.from({ length: STACK_SIZE }, (_, i) => STACK_SIZE - 1 - i); // top to bottom

    return (
      <div className="flex-1">
        <div className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">{label}</div>
        <div className="flex flex-col gap-1 items-center">
          {stackSlots.map((posIdx) => {
            const isYours = posIdx === highlightPos;
            const existingIdx = posIdx >= (highlightPos ?? STACK_SIZE) ? posIdx - 1 : posIdx;
            const isExisting = posIdx !== highlightPos && existingIdx < 5;
            const isAboveYours = highlightPos !== null && posIdx > highlightPos;
            const isInsertSlot = highlightPos === null && !isQuantum;

            return (
              <motion.div
                key={posIdx}
                whileHover={isInsertSlot ? { scale: 1.04, x: 4 } : {}}
                onClick={() => isInsertSlot && handlePlace(posIdx)}
                className={`w-full max-w-[200px] h-10 rounded-lg border-2 flex items-center justify-center text-xs font-bold transition-all ${
                  isYours
                    ? isQuantum
                      ? "bg-[oklch(0.72_0.22_200)]/30 border-[oklch(0.72_0.22_200)] text-[oklch(0.72_0.22_200)]"
                      : "bg-primary/30 border-primary"
                    : isExisting
                    ? `${EXISTING_COLORS[existingIdx % EXISTING_COLORS.length]} text-foreground`
                    : isInsertSlot
                    ? "border-dashed border-muted-foreground/30 bg-muted/10 cursor-pointer hover:border-primary/60 hover:bg-primary/10 text-muted-foreground"
                    : "border-dashed border-muted-foreground/20 bg-muted/5 text-muted-foreground/30"
                }`}
              >
                {isYours ? "YOUR CONTAINER" : isExisting ? `C${existingIdx + 1}` : isInsertSlot ? `↓ Insert here` : "—"}
                {isAboveYours && !isYours && isExisting && (
                  <span className="ml-2 text-xs text-amber-400">(must move)</span>
                )}
              </motion.div>
            );
          })}
          <div className="mt-1 text-xs text-muted-foreground text-center">
            ↓ Ground / Ship Floor
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="bg-[oklch(0.08_0.02_220)] rounded-lg p-4 border border-border text-sm text-muted-foreground">
        <p className="font-medium text-foreground mb-1">Mission</p>
        <p>
          Insert your container into the stack. The ship will load your container 3rd (2 containers
          before yours). If your container is buried under containers that aren&apos;t being loaded
          before it, they must be reshuffled. Each reshuffle = $80 extra cost.
        </p>
      </div>

      <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg px-3 py-2 text-xs text-amber-400">
        Ship load order: C1, C2, then YOUR CONTAINER (3rd), then C3, C4, C5
      </div>

      <div className="flex gap-4 justify-center">
        {renderStack(yourPosition, yourPosition === null ? "Click a slot to insert your container" : "Your placement")}
        {quantumDone && renderStack(quantumPosition, "Quantum Optimal", true)}
      </div>

      {reshuffles !== null && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-lg p-3 bg-card border border-border text-sm"
        >
          <span className="font-semibold">Result: </span>
          {reshuffles} reshuffle{reshuffles !== 1 ? "s" : ""} required — ${reshuffles * 80} extra cost
          {reshuffles === 0 && " 🎉 Perfect placement!"}
        </motion.div>
      )}

      {yourPosition !== null && !quantumDone && (
        <Button
          onClick={handleQuantumBoost}
          className="w-full bg-[oklch(0.72_0.22_200)] hover:bg-[oklch(0.78_0.2_200)] text-black font-bold"
        >
          <Sparkles className="w-4 h-4 mr-2" />
          Quantum Boost — See Optimal Placement
        </Button>
      )}

      {quantumDone && quantumPosition !== null && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="rounded-lg p-4 bg-[oklch(0.08_0.05_200)] border border-[oklch(0.25_0.1_200)] text-sm"
        >
          <div className="flex items-center gap-2 font-bold text-[oklch(0.72_0.22_200)] mb-1">
            <Sparkles className="w-4 h-4" />
            Quantum Optimal: Position {quantumPosition + 1} from bottom
          </div>
          <p>
            {quantumStage4(RETRIEVAL_ORDER).message}
          </p>
          {reshuffles !== null && reshuffles > 0 && (
            <p className="mt-1 text-[oklch(0.78_0.2_140)] font-bold">
              You paid ${reshuffles * 80} extra. Quantum: $0.
            </p>
          )}
        </motion.div>
      )}
    </div>
  );
}
