import { motion } from "motion/react";
import type { GameState } from "@/lib/quantum-shipment-game.ts";

interface DashboardProps {
  state: GameState;
}

function StatBlock({
  label,
  cost,
  time,
  variant,
}: {
  label: string;
  cost: number;
  time: number;
  variant: "manual" | "quantum";
}) {
  const isQuantum = variant === "quantum";
  return (
    <div
      className={`flex-1 rounded-lg p-3 border ${
        isQuantum
          ? "bg-[oklch(0.1_0.04_200)] border-[oklch(0.25_0.1_200)] text-[oklch(0.72_0.22_200)]"
          : "bg-card border-border"
      }`}
    >
      <div className="text-xs font-semibold mb-1 opacity-70 uppercase tracking-wider">{label}</div>
      <div className="flex gap-4">
        <div>
          <span className="text-lg font-bold">${cost.toLocaleString()}</span>
          <span className="text-xs ml-1 opacity-60">cost</span>
        </div>
        <div>
          <span className="text-lg font-bold">{time.toFixed(1)}</span>
          <span className="text-xs ml-1 opacity-60">days</span>
        </div>
      </div>
    </div>
  );
}

export default function Dashboard({ state }: DashboardProps) {
  const savedCost = state.totalManualCost - state.totalQuantumCost;
  const savedTime = state.totalManualTime - state.totalQuantumTime;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full rounded-xl border border-border bg-card p-4"
    >
      <div className="flex flex-col md:flex-row gap-3 items-stretch">
        <StatBlock
          label="Your Path"
          cost={state.totalManualCost}
          time={state.totalManualTime}
          variant="manual"
        />
        <StatBlock
          label="Quantum Path"
          cost={state.totalQuantumCost}
          time={state.totalQuantumTime}
          variant="quantum"
        />
        <div className="flex-1 rounded-lg p-3 border bg-[oklch(0.08_0.05_140)] border-[oklch(0.22_0.08_140)]">
          <div className="text-xs font-semibold mb-1 opacity-70 uppercase tracking-wider text-[oklch(0.78_0.2_140)]">
            Quantum Savings
          </div>
          <div className="flex gap-4">
            <div>
              <span className="text-lg font-bold text-[oklch(0.78_0.2_140)]">
                {savedCost >= 0 ? "+" : ""}${Math.abs(savedCost).toLocaleString()}
              </span>
              <span className="text-xs ml-1 opacity-60">saved</span>
            </div>
            <div>
              <span className="text-lg font-bold text-[oklch(0.78_0.2_140)]">
                {savedTime >= 0 ? "+" : ""}{Math.abs(savedTime).toFixed(1)}
              </span>
              <span className="text-xs ml-1 opacity-60">days</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
