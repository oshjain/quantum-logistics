import { motion } from "motion/react";
import { Button } from "@/components/ui/button.tsx";
import { Sparkles, Ship, Truck, Train, Plane, ArrowRight } from "lucide-react";

interface IntroScreenProps {
  onBegin: () => void;
}

const JOURNEY_STAGES = [
  { icon: "📦", label: "Empty Container Pickup", desc: "Find an available container near the factory" },
  { icon: "🏭", label: "Factory Loading", desc: "Load pallets — heavy ones in front, light ones in rear" },
  { icon: "🚛", label: "Drayage to Port", desc: "Truck the container 900km to the port — pick the fastest route" },
  { icon: "🏗️", label: "Container Yard Stacking", desc: "Stack containers so port cranes can work without reshuffling" },
  { icon: "⛴️", label: "Vessel Stowage", desc: "Load the ship so every port's cargo is accessible in order" },
  { icon: "🔄", label: "Transshipment Hub", desc: "Swap containers between ships at a mega-hub like Singapore" },
  { icon: "🌊", label: "Ocean Transit & Charter", desc: "Book space on a vessel — spot market vs contract rates" },
  { icon: "🏛️", label: "NY Port & Customs", desc: "Clear customs — pick the fastest lane, avoid inspection delays" },
  { icon: "🚂", label: "Rail Loading & Scheduling", desc: "Load the container onto a train — respect weight limits and balance" },
  { icon: "🚚", label: "Last-Mile Truck Delivery", desc: "Deliver to 5 warehouses across Chicago — the classic TSP puzzle" },
];

export default function IntroScreen({ onBegin }: IntroScreenProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl border border-primary/30 p-8" style={{ background: "linear-gradient(135deg, oklch(0.09 0.04 220), oklch(0.12 0.06 200))" }}>
        <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ background: "radial-gradient(ellipse at 30% 20%, oklch(0.72 0.22 200), transparent 70%)" }} />
        <div className="relative space-y-5">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", bounce: 0.5, delay: 0.1 }}
            className="w-14 h-14 rounded-2xl bg-primary/20 border border-primary/40 flex items-center justify-center mx-auto"
          >
            <span className="text-3xl">🌍</span>
          </motion.div>

          <div className="text-center space-y-3">
            <h1 className="text-3xl font-bold tracking-tight leading-tight">
              One Container.<br />
              <span style={{ background: "linear-gradient(135deg, oklch(0.72 0.22 200), #a855f7, #f59e0b)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Ten Decisions.</span><br />
              Infinite Possibilities.
            </h1>
            <p className="text-muted-foreground text-sm max-w-lg mx-auto leading-relaxed">
              You're about to follow <strong className="text-foreground">one container</strong> from a factory in Delhi to a warehouse in Chicago — through 10 real logistics touchpoints. At each stop, you'll make a call. Then hit <strong className="text-foreground">Quantum Boost</strong> to see what a quantum computer would have done.
            </p>
          </div>
        </div>
      </div>

      {/* The scale bombshell */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="rounded-xl border border-border/50 p-5" style={{ background: "oklch(0.1 0.02 260 / 0.5)" }}
      >
        <div className="flex items-start gap-3">
          <div className="text-2xl shrink-0">🤯</div>
          <div className="space-y-3 text-sm">
            <p className="text-muted-foreground leading-relaxed">
              This is <strong className="text-foreground">one container</strong> on <strong className="text-foreground">one route</strong>. Now zoom out:
            </p>
            <div className="grid sm:grid-cols-3 gap-3">
              {[
                { value: "12M", label: "containers moved per year by a single major shipping line", color: "#3b82f6" },
                { value: "343", label: "ports served across 121 countries — every pairing is a possible route", color: "#a855f7" },
                { value: "10¹⁰⁰", label: "possible container-to-route combinations — more than atoms in the universe", color: "#f59e0b" },
              ].map((stat) => (
                <div key={stat.label} className="text-center p-3 rounded-lg" style={{ background: "oklch(0.1 0.02 260 / 0.5)" }}>
                  <p className="text-xl font-bold font-mono" style={{ color: stat.color }}>{stat.value}</p>
                  <p className="text-[11px] text-muted-foreground leading-tight mt-1">{stat.label}</p>
                </div>
              ))}
            </div>
            <p className="text-muted-foreground leading-relaxed">
              A classical computer would take <strong className="text-foreground">longer than the age of the universe</strong> to check every combination. So it gives up and guesses. A quantum computer checks them <strong className="text-foreground" style={{ color: "oklch(0.72 0.22 200)" }}>all at once</strong> — turning an impossible problem into a routine calculation.
            </p>
          </div>
        </div>
      </motion.div>

      {/* The 10 stages preview */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="space-y-3"
      >
        <p className="text-xs font-mono text-muted-foreground uppercase tracking-widest text-center">Your Journey — 10 Quantum Touchpoints</p>
        <div className="grid sm:grid-cols-2 gap-2">
          {JOURNEY_STAGES.map((stage, i) => (
            <div
              key={stage.label}
              className="flex items-center gap-3 rounded-lg border border-border/40 p-3"
              style={{ background: "oklch(0.1 0.02 260 / 0.4)" }}
            >
              <div className="w-8 h-8 rounded-full bg-primary/15 border border-primary/30 flex items-center justify-center shrink-0">
                <span className="text-sm">{stage.icon}</span>
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium text-foreground truncate">{i + 1}. {stage.label}</p>
                <p className="text-[10px] text-muted-foreground leading-tight">{stage.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* CTA */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="text-center"
      >
        <Button
          onClick={onBegin}
          size="lg"
          className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-10 py-6 text-base gap-2 shadow-lg shadow-primary/20"
        >
          <Sparkles className="w-5 h-5" />
          Begin the Journey
          <ArrowRight className="w-4 h-4" />
        </Button>
        <p className="text-xs text-muted-foreground mt-3">
          Delhi, India → Singapore → New York → Chicago, USA · 10 stages · ~5 minutes
        </p>
      </motion.div>
    </motion.div>
  );
}
