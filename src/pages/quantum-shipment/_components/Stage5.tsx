import { useState } from "react";
import { motion } from "motion/react";
import { Button } from "@/components/ui/button.tsx";
import { Sparkles } from "lucide-react";
import {
  generateStowageContainers,
  calcStowagePenalties,
  quantumStowage,
  type StowageContainer,
} from "@/lib/quantum-shipment-game.ts";
import type { StageResult } from "@/lib/quantum-shipment-game.ts";

interface Stage5Props {
  seeds: number[];
  onComplete: (result: StageResult) => void;
  result?: StageResult;
  onQuantumBoosted?: () => void;
}

const DEST_COLORS: Record<string, string> = {
  singapore: "bg-emerald-500/30 border-emerald-500 text-emerald-300",
  newyork: "bg-purple-500/30 border-purple-500 text-purple-300",
};

const WEIGHT_ICONS: Record<string, string> = {
  heavy: "H",
  light: "L",
  medium: "M",
};

function ContainerCard({
  container,
  small,
}: {
  container: StowageContainer;
  small?: boolean;
}) {
  return (
    <div
      className={`rounded border-2 flex flex-col items-center justify-center font-bold select-none ${
        container.isYours
          ? "bg-[oklch(0.72_0.22_200)]/30 border-[oklch(0.72_0.22_200)] text-[oklch(0.72_0.22_200)]"
          : DEST_COLORS[container.dest]
      } ${small ? "text-xs p-1 h-10 w-full" : "text-xs p-2 h-12 w-full"}`}
    >
      <span>{container.isYours ? "YOU" : WEIGHT_ICONS[container.weight]}</span>
      <span className="text-[10px] opacity-75">{container.dest === "singapore" ? "SG" : "NY"}</span>
    </div>
  );
}

export default function Stage5VesselStowage({ seeds, onComplete, result, onQuantumBoosted }: Stage5Props) {
  const containers = generateStowageContainers(seeds);
  const emptyGrid = (): (StowageContainer | null)[][] => [
    [null, null, null],
    [null, null, null],
    [null, null, null],
  ];

  const [grid, setGrid] = useState<(StowageContainer | null)[][]>(emptyGrid());
  const [selectedContainer, setSelectedContainer] = useState<StowageContainer | null>(null);
  const [placed, setPlaced] = useState<number[]>([]);
  const [done, setDone] = useState(result?.completed ?? false);
  const [quantumDone, setQuantumDone] = useState(result?.quantumBoosted ?? false);
  const [quantumGrid, setQuantumGrid] = useState<(StowageContainer | null)[][] | null>(null);

  const unplacedContainers = containers.filter((c) => !placed.includes(c.id));

  const handleSelect = (c: StowageContainer) => {
    if (done) return;
    setSelectedContainer(selectedContainer?.id === c.id ? null : c);
  };

  const handleGridClick = (tier: number, bay: number) => {
    if (!selectedContainer || grid[tier][bay] || done) return;
    const newGrid = grid.map((row) => [...row]);
    newGrid[tier][bay] = selectedContainer;
    setGrid(newGrid);
    setPlaced([...placed, selectedContainer.id]);
    setSelectedContainer(null);

    if (placed.length + 1 === containers.length) {
      const penalties = calcStowagePenalties(newGrid);
      const cost = 500 + penalties * 300;
      const time = 1.5 + penalties * 0.3;
      const qGrid = quantumStowage(containers);
      const qPenalties = calcStowagePenalties(qGrid);
      const qCost = 500 + qPenalties * 300;
      const qTime = 1.5 + qPenalties * 0.3;
      const sr: StageResult = {
        manualCost: cost,
        manualTime: time,
        quantumCost: qCost,
        quantumTime: qTime,
        savings: { cost: cost - qCost, time: time - qTime },
        completed: true,
        quantumBoosted: false,
        manualOutcome: `${penalties} rule violations — $${penalties * 300} extra`,
        quantumOutcome: `0 violations — perfect stowage`,
      };
      onComplete(sr);
      setDone(true);
    }
  };

  const handleQuantumBoost = () => {
    const qGrid = quantumStowage(containers);
    setQuantumGrid(qGrid);
    setQuantumDone(true);
    onQuantumBoosted?.();
  };

  const manualPenalties = calcStowagePenalties(grid);

  const renderGrid = (g: (StowageContainer | null)[][], interactive: boolean, label: string) => (
    <div className="flex-1">
      <div className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">{label}</div>
      <div className="space-y-1">
        {[2, 1, 0].map((tier) => (
          <div key={tier} className="flex gap-1 items-center">
            <div className="text-xs text-muted-foreground w-12 text-right pr-1">
              {tier === 0 ? "Bottom" : tier === 1 ? "Mid" : "Top"}
            </div>
            {[0, 1, 2].map((bay) => {
              const c = g[tier][bay];
              const isWrong =
                c &&
                ((c.weight === "heavy" && tier !== 0) ||
                  (c.dest === "newyork" && tier < 2 && g[tier + 1]?.[bay]?.dest === "singapore"));
              return (
                <motion.div
                  key={bay}
                  whileHover={interactive && !c && selectedContainer ? { scale: 1.05 } : {}}
                  onClick={() => interactive && handleGridClick(tier, bay)}
                  className={`flex-1 h-14 rounded border-2 flex items-center justify-center cursor-pointer transition-all ${
                    c
                      ? `${isWrong ? "ring-2 ring-destructive" : ""}`
                      : interactive && selectedContainer
                      ? "border-dashed border-primary/50 bg-primary/5 hover:bg-primary/10"
                      : "border-dashed border-border/40 bg-muted/5"
                  }`}
                >
                  {c ? <ContainerCard container={c} small /> : (
                    <span className="text-muted-foreground/30 text-xs">Bay {bay + 1}</span>
                  )}
                </motion.div>
              );
            })}
            <div className="w-6 text-center text-xs text-muted-foreground">{tier + 1}</div>
          </div>
        ))}
        <div className="flex gap-1 items-center">
          <div className="w-12"></div>
          {[1, 2, 3].map((b) => (
            <div key={b} className="flex-1 text-center text-xs text-muted-foreground">Bay {b}</div>
          ))}
          <div className="w-6"></div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="bg-[oklch(0.08_0.02_220)] rounded-lg p-4 border border-border text-sm text-muted-foreground">
        <p className="font-medium text-foreground mb-1">Mission</p>
        <p>
          Load 9 containers into a 3×3 ship grid (3 bays × 3 tiers). Rules: Heavy containers must
          go on the bottom tier. Singapore-bound containers must not be buried under New York-bound
          ones. Each violation = $300 reshuffle penalty.
        </p>
      </div>

      <div className="flex gap-2 flex-wrap text-xs">
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded bg-emerald-500/40 border border-emerald-500 inline-block"></span> Singapore
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded bg-purple-500/40 border border-purple-500 inline-block"></span> New York
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded bg-[oklch(0.72_0.22_200)]/30 border-[oklch(0.72_0.22_200)] inline-block"></span> Yours
        </span>
        <span className="text-muted-foreground">H=Heavy, M=Medium, L=Light</span>
      </div>

      {/* Container palette */}
      {!done && (
        <div>
          <div className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">
            {selectedContainer ? `Selected: ${selectedContainer.isYours ? "YOUR container" : `Container (${selectedContainer.weight}, ${selectedContainer.dest})`} — click a grid slot` : "Click a container to select it"}
          </div>
          <div className="flex flex-wrap gap-2">
            {unplacedContainers.map((c) => (
              <motion.div
                key={c.id}
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleSelect(c)}
                className={`w-14 h-14 rounded border-2 cursor-pointer flex flex-col items-center justify-center text-xs font-bold transition-all ${
                  c.isYours
                    ? "bg-[oklch(0.72_0.22_200)]/30 border-[oklch(0.72_0.22_200)] text-[oklch(0.72_0.22_200)]"
                    : DEST_COLORS[c.dest]
                } ${selectedContainer?.id === c.id ? "ring-2 ring-white" : ""}`}
              >
                <span>{c.isYours ? "YOU" : WEIGHT_ICONS[c.weight]}</span>
                <span className="text-[10px] opacity-75">{c.dest === "singapore" ? "SG" : "NY"}</span>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-4">
        {renderGrid(grid, !done, done ? "Your Stowage" : "Ship Grid — place containers")}
        {quantumDone && quantumGrid && renderGrid(quantumGrid, false, "Quantum Optimal")}
      </div>

      {done && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-lg p-3 bg-card border border-border text-sm"
        >
          <span className="font-semibold">Result: </span>
          {manualPenalties} violations — ${manualPenalties * 300} in reshuffle penalties
          {manualPenalties === 0 && " 🎉 Perfect stowage!"}
        </motion.div>
      )}

      {done && !quantumDone && (
        <Button
          onClick={handleQuantumBoost}
          className="w-full bg-[oklch(0.72_0.22_200)] hover:bg-[oklch(0.78_0.2_200)] text-black font-bold"
        >
          <Sparkles className="w-4 h-4 mr-2" />
          Quantum Boost — See Optimal Stowage
        </Button>
      )}

      {quantumDone && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="rounded-lg p-4 bg-[oklch(0.08_0.05_200)] border border-[oklch(0.25_0.1_200)] text-sm"
        >
          <div className="flex items-center gap-2 font-bold text-[oklch(0.72_0.22_200)] mb-1">
            <Sparkles className="w-4 h-4" />
            Quantum Optimal: 0 violations
          </div>
          <p>Heavy containers at bottom, Singapore-bound accessible — saved ${manualPenalties * 300}.</p>
        </motion.div>
      )}
    </div>
  );
}
