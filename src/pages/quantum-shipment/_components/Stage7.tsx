import { useState } from "react";
import { motion } from "motion/react";
import { Button } from "@/components/ui/button.tsx";
import { Sparkles, Anchor, Zap } from "lucide-react";
import { seededRandom } from "@/lib/quantum-shipment-game.ts";
import type { StageResult } from "@/lib/quantum-shipment-game.ts";

interface Stage7Props {
  seeds: number[];
  onComplete: (result: StageResult) => void;
  result?: StageResult;
  onQuantumBoosted?: () => void;
}

const DELAY_CHANCE = 0.1;
const DELAY_DAYS = 3;
const CHARTER_EXTRA = 5000;
const REGULAR_TRANSIT = 25;
const CHARTER_TRANSIT = 20;
const BASE_OCEAN_COST = 0; // included in vessel booking from stage 6

export default function Stage7OceanTransit({ seeds, onComplete, result, onQuantumBoosted }: Stage7Props) {
  const rng = seededRandom(Math.floor((seeds[0] ?? 0.3) * 1e9));
  const isDelayed = rng() < DELAY_CHANCE;

  const [chosen, setChosen] = useState<"regular" | "charter" | null>(
    result?.manualChoice as "regular" | "charter" | null ?? null
  );
  const [outcome, setOutcome] = useState<{ cost: number; time: number; delayed: boolean } | null>(null);
  const [quantumDone, setQuantumDone] = useState(result?.quantumBoosted ?? false);

  const calcChoice = (choice: "regular" | "charter") => {
    if (choice === "charter") {
      return { cost: CHARTER_EXTRA, time: CHARTER_TRANSIT, delayed: false };
    }
    return {
      cost: 0,
      time: isDelayed ? REGULAR_TRANSIT + DELAY_DAYS : REGULAR_TRANSIT,
      delayed: isDelayed,
    };
  };

  const handlePick = (choice: "regular" | "charter") => {
    if (chosen) return;
    const res = calcChoice(choice);
    setChosen(choice);
    setOutcome(res);

    // Quantum: expected cost of regular = 0.1 * delay penalty (value of time)
    // Value of 3 days = $600 (rough logistics cost per day)
    const dayValue = 200;
    const expectedRegularExtra = DELAY_CHANCE * DELAY_DAYS * dayValue; // $60
    // Charter: $5000 extra but saves ~1 day average
    // Quantum: regular is almost always cheaper unless delay probability is high
    const qChoice: "regular" | "charter" = expectedRegularExtra < CHARTER_EXTRA ? "regular" : "charter";
    const qRes = calcChoice(qChoice);

    const sr: StageResult = {
      manualCost: res.cost,
      manualTime: res.time,
      quantumCost: qRes.cost,
      quantumTime: qRes.time,
      savings: { cost: res.cost - qRes.cost, time: res.time - qRes.time },
      completed: true,
      quantumBoosted: false,
      manualChoice: choice,
      quantumChoice: qChoice,
      manualOutcome: `${choice === "charter" ? "Chartered" : "Regular"}: $${res.cost}, ${res.time} days${res.delayed ? " (delayed!)" : ""}`,
      quantumOutcome: `Regular booking: 10% delay risk only adds ~$60 expected cost vs $5000 charter premium`,
    };
    onComplete(sr);
  };

  const handleQuantumBoost = () => { setQuantumDone(true); onQuantumBoosted?.(); };

  const options = [
    {
      id: "regular" as const,
      icon: <Anchor className="w-5 h-5" />,
      title: "Regular Booking",
      description: "Stay with current booking. 10% chance of 3-day delay.",
      cost: "$0 extra",
      time: `${REGULAR_TRANSIT} days (+ possible ${DELAY_DAYS}d delay)`,
      risk: "Low extra cost, small delay risk",
    },
    {
      id: "charter" as const,
      icon: <Zap className="w-5 h-5" />,
      title: "Charter the Vessel",
      description: "Pay extra to guarantee immediate departure and faster transit.",
      cost: `+$${CHARTER_EXTRA.toLocaleString()} extra`,
      time: `${CHARTER_TRANSIT} days guaranteed`,
      risk: "Expensive but zero delay risk",
    },
  ];

  return (
    <div className="space-y-4">
      <div className="bg-[oklch(0.08_0.02_220)] rounded-lg p-4 border border-border text-sm text-muted-foreground">
        <p className="font-medium text-foreground mb-1">Mission</p>
        <p>
          Singapore to New York ocean transit. Regular booking: 25 days, 10% chance of 3-day
          congestion delay. Charter option: guaranteed 20-day transit, but $5,000 premium. Is the
          certainty worth it?
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {options.map((opt) => {
          const isChosen = chosen === opt.id;
          const calc = calcChoice(opt.id);
          return (
            <motion.button
              key={opt.id}
              whileHover={!chosen ? { scale: 1.02 } : {}}
              onClick={() => handlePick(opt.id)}
              disabled={!!chosen}
              className={`rounded-xl p-4 border text-left cursor-pointer transition-all ${
                isChosen
                  ? "border-primary bg-primary/10"
                  : "border-border bg-card hover:border-primary/50"
              } ${chosen && !isChosen ? "opacity-50" : ""}`}
            >
              <div className="flex items-center gap-2 mb-2 text-primary">{opt.icon}</div>
              <div className="font-bold mb-1">{opt.title}</div>
              <p className="text-xs text-muted-foreground mb-3">{opt.description}</p>
              <div className="text-xs space-y-1">
                <div className="font-semibold">{opt.cost}</div>
                <div className="text-muted-foreground">{opt.time}</div>
                <div className="text-muted-foreground italic">{opt.risk}</div>
              </div>
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
          {chosen === "charter" ? "Chartered vessel" : "Regular booking"}
          {outcome.delayed && " — ⚠ Congestion! 3-day delay occurred."}
          {!outcome.delayed && chosen === "regular" && " — No delay. Smooth sailing!"}
          {" "}Total: ${outcome.cost}, {outcome.time} days
        </motion.div>
      )}

      {outcome && !quantumDone && (
        <Button
          onClick={handleQuantumBoost}
          className="w-full bg-[oklch(0.72_0.22_200)] hover:bg-[oklch(0.78_0.2_200)] text-black font-bold"
        >
          <Sparkles className="w-4 h-4 mr-2" />
          Quantum Boost — Optimal Risk Analysis
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
            Quantum Risk Analysis
          </div>
          <p>
            Expected cost of regular booking: <strong>~${Math.round(DELAY_CHANCE * DELAY_DAYS * 200)} extra risk</strong> (10% × 3 days × $200/day).
            Charter costs <strong>$5,000</strong> more. Regular is the rational choice — the delay premium
            is only ${Math.round(DELAY_CHANCE * DELAY_DAYS * 200)} in expected value.
          </p>
          {chosen === "charter" && (
            <p className="mt-2 text-[oklch(0.78_0.2_140)] font-bold">
              You overpaid by ~${CHARTER_EXTRA - Math.round(DELAY_CHANCE * DELAY_DAYS * 200)} vs optimal expected cost.
            </p>
          )}
          {chosen === "regular" && outcome.delayed && (
            <p className="mt-2 text-amber-400">
              Unlucky — delay occurred this time. But quantum would still choose regular due to expected value.
            </p>
          )}
          {chosen === "regular" && !outcome.delayed && (
            <p className="mt-2 text-[oklch(0.78_0.2_140)]">
              Correct choice! No delay occurred and you saved $5,000 vs. charter.
            </p>
          )}
        </motion.div>
      )}
    </div>
  );
}
