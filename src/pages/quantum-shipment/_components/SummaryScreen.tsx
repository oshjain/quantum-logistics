import { motion } from "motion/react";
import { Button } from "@/components/ui/button.tsx";
import { RotateCcw, Sparkles, Trophy } from "lucide-react";
import type { GameState, StageId } from "@/lib/quantum-shipment-game.ts";

interface SummaryScreenProps {
  gameState: GameState;
  onRestart: () => void;
}

const STAGE_LABELS: Record<StageId, string> = {
  1: "Empty Container Pickup",
  2: "Factory Loading",
  3: "Drayage to Port",
  4: "Container Yard Stacking",
  5: "Vessel Stowage",
  6: "Transshipment Hub",
  7: "Ocean Transit",
  8: "NY Customs",
  9: "Rail Scheduling",
  10: "Last-Mile Delivery",
};

export default function SummaryScreen({ gameState, onRestart }: SummaryScreenProps) {
  const stageIds: StageId[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  const totalSavedCost = gameState.totalManualCost - gameState.totalQuantumCost;
  const totalSavedTime = gameState.totalManualTime - gameState.totalQuantumTime;
  const savingsPct = gameState.totalManualCost > 0
    ? Math.round((totalSavedCost / gameState.totalManualCost) * 100)
    : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Hero */}
      <div className="text-center py-8 space-y-3">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", bounce: 0.5, delay: 0.2 }}
          className="w-16 h-16 rounded-full bg-primary/20 border border-primary flex items-center justify-center mx-auto"
        >
          <Trophy className="w-8 h-8 text-primary" />
        </motion.div>
        <h1 className="text-3xl font-bold">Journey Complete!</h1>
        <p className="text-muted-foreground">Delhi, India → Chicago, USA — 10 Quantum Touchpoints</p>
        <div className="inline-flex items-center gap-2 bg-[oklch(0.1_0.06_140)] border border-[oklch(0.3_0.1_140)] rounded-full px-6 py-2">
          <Sparkles className="w-4 h-4 text-[oklch(0.78_0.2_140)]" />
          <span className="text-[oklch(0.78_0.2_140)] font-bold text-lg">
            Quantum saved ${totalSavedCost.toLocaleString()} and {totalSavedTime.toFixed(1)} days
          </span>
        </div>
      </div>

      {/* Totals */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Your Total Cost", value: `$${gameState.totalManualCost.toLocaleString()}`, sub: "manual decisions", variant: "neutral" },
          { label: "Quantum Total", value: `$${gameState.totalQuantumCost.toLocaleString()}`, sub: "optimal decisions", variant: "quantum" },
          { label: "Savings", value: `$${totalSavedCost.toLocaleString()}`, sub: `${savingsPct}% cheaper`, variant: "savings" },
        ].map((stat) => (
          <div
            key={stat.label}
            className={`rounded-xl p-4 border text-center ${
              stat.variant === "quantum"
                ? "bg-[oklch(0.1_0.04_200)] border-[oklch(0.25_0.1_200)]"
                : stat.variant === "savings"
                ? "bg-[oklch(0.08_0.05_140)] border-[oklch(0.22_0.08_140)]"
                : "bg-card border-border"
            }`}
          >
            <div className={`text-2xl font-bold ${
              stat.variant === "quantum" ? "text-primary" : stat.variant === "savings" ? "text-[oklch(0.78_0.2_140)]" : ""
            }`}>
              {stat.value}
            </div>
            <div className="text-xs text-muted-foreground mt-1">{stat.label}</div>
            <div className="text-xs text-muted-foreground/60">{stat.sub}</div>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-4">
        {[
          { label: "Your Total Time", value: `${gameState.totalManualTime.toFixed(1)} days`, sub: "manual path" },
          { label: "Quantum Time", value: `${gameState.totalQuantumTime.toFixed(1)} days`, sub: `${totalSavedTime.toFixed(1)} days faster`, isQuantum: true },
        ].map((stat) => (
          <div key={stat.label} className={`rounded-xl p-4 border text-center ${stat.isQuantum ? "bg-[oklch(0.1_0.04_200)] border-[oklch(0.25_0.1_200)]" : "bg-card border-border"}`}>
            <div className={`text-xl font-bold ${stat.isQuantum ? "text-primary" : ""}`}>{stat.value}</div>
            <div className="text-xs text-muted-foreground mt-1">{stat.label}</div>
            <div className="text-xs text-muted-foreground/60">{stat.sub}</div>
          </div>
        ))}
      </div>

      {/* Per-stage table */}
      <div className="rounded-xl border border-border overflow-hidden">
        <div className="bg-card border-b border-border px-4 py-3">
          <h2 className="font-bold text-sm">Stage-by-Stage Breakdown</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left px-4 py-2 text-xs text-muted-foreground font-medium">Stage</th>
                <th className="text-right px-3 py-2 text-xs text-muted-foreground font-medium">Your $</th>
                <th className="text-right px-3 py-2 text-xs text-muted-foreground font-medium">Quantum $</th>
                <th className="text-right px-3 py-2 text-xs text-muted-foreground font-medium">Your Days</th>
                <th className="text-right px-3 py-2 text-xs text-muted-foreground font-medium">Q Days</th>
                <th className="text-right px-3 py-2 text-xs text-[oklch(0.78_0.2_140)] font-medium">Saved</th>
              </tr>
            </thead>
            <tbody>
              {stageIds.map((id, i) => {
                const sr = gameState.stageResults[id];
                if (!sr) return null;
                const savedCost = sr.manualCost - sr.quantumCost;
                return (
                  <motion.tr
                    key={id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className={`border-b border-border/50 ${savedCost > 0 ? "hover:bg-[oklch(0.08_0.04_140)]" : "hover:bg-muted/20"}`}
                  >
                    <td className="px-4 py-2">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-primary/20 text-primary text-xs flex items-center justify-center font-bold">
                          {id}
                        </span>
                        <span className="text-xs">{STAGE_LABELS[id]}</span>
                      </div>
                    </td>
                    <td className="text-right px-3 py-2 text-xs">${sr.manualCost.toLocaleString()}</td>
                    <td className="text-right px-3 py-2 text-xs text-primary">${sr.quantumCost.toLocaleString()}</td>
                    <td className="text-right px-3 py-2 text-xs">{sr.manualTime.toFixed(1)}</td>
                    <td className="text-right px-3 py-2 text-xs text-primary">{sr.quantumTime.toFixed(1)}</td>
                    <td className="text-right px-3 py-2 text-xs font-bold text-[oklch(0.78_0.2_140)]">
                      {savedCost > 0 ? `+$${savedCost.toLocaleString()}` : savedCost < 0 ? `−$${Math.abs(savedCost)}` : "—"}
                    </td>
                  </motion.tr>
                );
              })}
              <tr className="bg-muted/20 font-bold">
                <td className="px-4 py-3 text-xs uppercase tracking-wider">TOTAL</td>
                <td className="text-right px-3 py-3 text-xs">${gameState.totalManualCost.toLocaleString()}</td>
                <td className="text-right px-3 py-3 text-xs text-primary">${gameState.totalQuantumCost.toLocaleString()}</td>
                <td className="text-right px-3 py-3 text-xs">{gameState.totalManualTime.toFixed(1)}</td>
                <td className="text-right px-3 py-3 text-xs text-primary">{gameState.totalQuantumTime.toFixed(1)}</td>
                <td className="text-right px-3 py-3 text-xs text-[oklch(0.78_0.2_140)]">
                  +${totalSavedCost.toLocaleString()}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* CTA */}
      <div className="text-center pb-8">
        <Button
          onClick={onRestart}
          size="lg"
          className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-8 gap-2"
        >
          <RotateCcw className="w-4 h-4" />
          Play Again
        </Button>
        <p className="text-xs text-muted-foreground mt-3">
          Quantum logistics optimization across the entire shipment lifecycle
        </p>
      </div>
    </motion.div>
  );
}
