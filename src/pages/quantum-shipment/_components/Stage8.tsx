import { useState } from "react";
import { motion } from "motion/react";
import { Button } from "@/components/ui/button.tsx";
import { Sparkles, CheckCircle2, AlertTriangle } from "lucide-react";
import { seededRandom } from "@/lib/quantum-shipment-game.ts";
import type { StageResult } from "@/lib/quantum-shipment-game.ts";

interface Stage8Props {
  seeds: number[];
  onComplete: (result: StageResult) => void;
  result?: StageResult;
  onQuantumBoosted?: () => void;
}

// Green: 10% random inspection, if caught 2-day delay + $500
// Red: guaranteed 1-day inspection, no fine
export default function Stage8Customs({ seeds, onComplete, result, onQuantumBoosted }: Stage8Props) {
  const rng = seededRandom(Math.floor((seeds[0] ?? 0.5) * 1e9));
  const greenInspected = rng() < 0.1;

  const [chosen, setChosen] = useState<"green" | "red" | null>(
    result?.manualChoice as "green" | "red" | null ?? null
  );
  const [outcome, setOutcome] = useState<{ cost: number; time: number; inspected: boolean } | null>(null);
  const [quantumDone, setQuantumDone] = useState(result?.quantumBoosted ?? false);

  const calcChannel = (channel: "green" | "red") => {
    if (channel === "red") return { cost: 0, time: 1, inspected: true };
    return {
      cost: greenInspected ? 500 : 0,
      time: greenInspected ? 2 : 0.5,
      inspected: greenInspected,
    };
  };

  const handlePick = (channel: "green" | "red") => {
    if (chosen) return;
    const res = calcChannel(channel);
    setChosen(channel);
    setOutcome(res);

    // Quantum: expected green = 0.1*$500 + 0.1*2 + 0.9*0.5 = $50 + 0.65d avg
    // Red: $0 + 1d
    // Green has lower expected cost ($50 < $0) but higher expected time (0.65d < 1d)
    // Quantum picks green (lower expected time & cost)
    const qChannel: "green" | "red" = "green";
    const qRes = calcChannel(qChannel);

    const sr: StageResult = {
      manualCost: res.cost,
      manualTime: res.time,
      quantumCost: qRes.cost,
      quantumTime: qRes.time,
      savings: { cost: res.cost - qRes.cost, time: res.time - qRes.time },
      completed: true,
      quantumBoosted: false,
      manualChoice: channel,
      quantumChoice: qChannel,
      manualOutcome: `${channel === "green" ? "Green" : "Red"} channel: $${res.cost}, ${res.time}d${res.inspected && channel === "green" ? " (inspected!)" : ""}`,
      quantumOutcome: `Green channel: expected $50 cost, 0.65d avg delay — better than red's guaranteed 1 day`,
    };
    onComplete(sr);
  };

  const handleQuantumBoost = () => { setQuantumDone(true); onQuantumBoosted?.(); };

  const channels = [
    {
      id: "green" as const,
      color: "text-emerald-400",
      borderColor: "border-emerald-500/50",
      bgColor: "bg-emerald-500/10",
      label: "Green Channel",
      desc: "Random inspection — 10% chance",
      risk: "If caught: $500 fine + 2-day delay",
      safe: "If clear: ~4 hour processing",
      expected: "Expected: $50 cost, 0.65 days avg",
    },
    {
      id: "red" as const,
      color: "text-red-400",
      borderColor: "border-red-500/50",
      bgColor: "bg-red-500/10",
      label: "Red Channel",
      desc: "Full inspection — guaranteed",
      risk: "Always 1-day delay, no fine",
      safe: "100% certain: 1 day, no surprises",
      expected: "Expected: $0 cost, 1.0 day avg",
    },
  ];

  return (
    <div className="space-y-4">
      <div className="bg-[oklch(0.08_0.02_220)] rounded-lg p-4 border border-border text-sm text-muted-foreground">
        <p className="font-medium text-foreground mb-1">Mission</p>
        <p>
          Container arrives at New York port. Choose a customs channel. Green is fast but risky —
          10% chance of full inspection with $500 fine and 2-day delay. Red guarantees inspection
          but only 1 day, no fine.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {channels.map((ch) => {
          const isChosen = chosen === ch.id;
          return (
            <motion.button
              key={ch.id}
              whileHover={!chosen ? { scale: 1.02 } : {}}
              onClick={() => handlePick(ch.id)}
              disabled={!!chosen}
              className={`rounded-xl p-4 border-2 text-left cursor-pointer transition-all ${
                isChosen ? `${ch.borderColor} ${ch.bgColor}` : "border-border bg-card hover:border-primary/40"
              } ${chosen && !isChosen ? "opacity-50" : ""}`}
            >
              <div className={`font-bold text-lg mb-1 ${ch.color}`}>{ch.label}</div>
              <div className="text-xs text-muted-foreground space-y-1">
                <div className="font-medium text-foreground">{ch.desc}</div>
                <div className="text-destructive/80">{ch.risk}</div>
                <div className="text-emerald-400/80">{ch.safe}</div>
                <div className="mt-2 text-muted-foreground italic">{ch.expected}</div>
              </div>
            </motion.button>
          );
        })}
      </div>

      {outcome && chosen && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`rounded-lg p-3 border text-sm flex items-center gap-2 ${
            outcome.inspected && chosen === "green"
              ? "bg-destructive/10 border-destructive"
              : "bg-card border-border"
          }`}
        >
          {outcome.inspected && chosen === "green" ? (
            <AlertTriangle className="w-4 h-4 text-destructive" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          )}
          <span>
            <span className="font-semibold">{chosen === "green" ? "Green" : "Red"} Channel: </span>
            {outcome.inspected && chosen === "green" && "Inspection triggered! "}
            ${outcome.cost} cost, {outcome.time} day{outcome.time !== 1 ? "s" : ""}
          </span>
        </motion.div>
      )}

      {outcome && !quantumDone && (
        <Button
          onClick={handleQuantumBoost}
          className="w-full bg-[oklch(0.72_0.22_200)] hover:bg-[oklch(0.78_0.2_200)] text-black font-bold"
        >
          <Sparkles className="w-4 h-4 mr-2" />
          Quantum Boost — Optimal Customs Strategy
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
            Quantum Optimal: Green Channel
          </div>
          <div className="space-y-1 text-xs">
            <div>Green expected: <strong>$50</strong> + <strong>0.65 days</strong> average</div>
            <div>Red guaranteed: <strong>$0</strong> + <strong>1.0 day</strong> certain</div>
            <div className="text-[oklch(0.78_0.2_140)] font-bold mt-2">
              Green channel wins on expected time. Quantum always chooses green.
            </div>
          </div>
          {chosen === "red" && (
            <p className="mt-2 text-amber-400 text-xs">
              You chose red — safer but 35% slower on average. Cost of certainty: 0.35 extra days.
            </p>
          )}
          {chosen === "green" && greenInspected && (
            <p className="mt-2 text-amber-400 text-xs">
              Unlucky — inspected this time. But quantum would still choose green (10% inspection risk is worth it).
            </p>
          )}
        </motion.div>
      )}
    </div>
  );
}
