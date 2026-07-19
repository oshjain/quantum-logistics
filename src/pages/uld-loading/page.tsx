import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import NavBar from "@/components/NavBar.tsx";
import { cn } from "@/lib/utils.ts";
import {
  ULDS,
  COMPARTMENTS,
  validatePlan,
  solveULD,
} from "@/lib/uld-solver.ts";
import type { LoadPlan } from "@/lib/uld-solver.ts";

// Shape icons
const shapeIcon = (shape: string) =>
  shape === "tall" ? "↑" : shape === "long" ? "↔" : "■";

const shapeLabel = (shape: string) =>
  shape === "tall" ? "Tall" : shape === "long" ? "Long" : "Standard";

export default function ULDPage() {
  const [assignments, setAssignments] = useState<Record<string, string>>({});
  const [selected, setSelected] = useState<string | null>(null);
  const [plan, setPlan] = useState<LoadPlan | null>(null);
  const [mode, setMode] = useState<"manual" | "solved">("manual");
  const [flashError, setFlashError] = useState<string | null>(null);
  const [solving, setSolving] = useState(false);
  const [userStats, setUserStats] = useState<{ valid: boolean; weight: number; loaded: number } | null>(null);

  const weightPerComp = (compId: string) =>
    ULDS.filter((u) => assignments[u.id] === compId).reduce(
      (s, u) => s + u.weight,
      0
    );

  const handleULDClick = (id: string) => {
    setSelected((prev) => (prev === id ? null : id));
    setPlan(null);
  };

  const handleCompartmentClick = (compId: string) => {
    if (!selected) return;
    const uld = ULDS.find((u) => u.id === selected)!;
    const comp = COMPARTMENTS.find((c) => c.id === compId)!;

    // Validate shape constraints immediately
    if (uld.shape === "tall" && !comp.allowsTall) {
      triggerFlash(`${uld.id} is tall — can't fit in ${comp.name}!`);
      return;
    }
    if (uld.shape === "long" && !comp.allowsLong) {
      triggerFlash(`${uld.id} is long — Middle only!`);
      return;
    }
    // Validate weight
    const current = weightPerComp(compId);
    if (current + uld.weight > comp.maxWeight) {
      triggerFlash(
        `${comp.name} would be overweight (${current + uld.weight}t / ${comp.maxWeight}t)!`
      );
      return;
    }

    setAssignments((prev) => ({ ...prev, [selected]: compId }));
    setSelected(null);
    setPlan(null);
    setMode("manual");
  };

  const triggerFlash = (msg: string) => {
    setFlashError(msg);
    setTimeout(() => setFlashError(null), 2000);
  };

  const handleCheck = () => {
    setPlan(validatePlan(assignments));
  };

  const handleAutoSolve = () => {
    setSolving(true);
    setTimeout(() => {
      const result = solveULD();
      setAssignments(result.assignments);
      setPlan(result);
      setMode("solved");
      setSolving(false);
    }, 1200);
  };

  const handleReset = () => {
    setAssignments({});
    setSelected(null);
    setPlan(null);
    setMode("manual");
    setFlashError(null);
  };

  const fwdW = weightPerComp("fwd");
  const aftW = weightPerComp("aft");
  const balanced = Math.abs(fwdW - aftW) <= 2;
  const assignedCount = Object.values(assignments).filter(Boolean).length;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <NavBar />

      <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-3"
        >
          <h1 className="text-4xl font-bold tracking-tight">
            ULD Loading Challenge{" "}
            <span role="img" aria-label="plane">
              ✈️
            </span>
          </h1>
          <p className="text-zinc-400 max-w-2xl mx-auto text-sm leading-relaxed">
            You're loading a cargo plane. 6 cargo units (ULDs) need to fit in 3
            compartments. Some are <strong className="text-white">tall</strong>{" "}
            (no Aft!), one is{" "}
            <strong className="text-white">long</strong> (Middle only!), and
            the plane must stay{" "}
            <strong className="text-white">balanced</strong>. Can you fit them
            all?
          </p>
        </motion.div>

        {/* Flash error */}
        <AnimatePresence>
          {flashError && (
            <motion.div
              key="flash"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="bg-red-900/60 border border-red-500 text-red-200 rounded-lg px-4 py-2 text-center text-sm font-medium"
            >
              ⚠️ {flashError}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main layout */}
        <div className="flex flex-col lg:flex-row gap-6">
          {/* ULD Pool */}
          <div className="lg:w-56 flex-shrink-0 space-y-3">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-zinc-400">
              Cargo Units
            </h2>
            {ULDS.map((uld) => {
              const assigned = assignments[uld.id];
              const isSelected = selected === uld.id;
              return (
                <motion.button
                  key={uld.id}
                  onClick={() => !assigned && handleULDClick(uld.id)}
                  whileHover={!assigned ? { scale: 1.03 } : {}}
                  whileTap={!assigned ? { scale: 0.97 } : {}}
                  className={cn(
                    "w-full rounded-xl border px-3 py-2.5 text-left transition-all",
                    assigned
                      ? "opacity-40 cursor-not-allowed border-zinc-700 bg-zinc-900"
                      : isSelected
                      ? "border-yellow-400 bg-yellow-400/10 shadow-lg shadow-yellow-400/20 cursor-pointer"
                      : "border-zinc-700 bg-zinc-900 hover:border-zinc-500 cursor-pointer"
                  )}
                  style={
                    isSelected
                      ? {}
                      : { borderLeftColor: uld.color, borderLeftWidth: 3 }
                  }
                  disabled={!!assigned}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm" style={{ color: uld.color }}>
                      {uld.id}
                    </span>
                    <span className="text-lg font-mono">{shapeIcon(uld.shape)}</span>
                  </div>
                  <div className="text-xs text-zinc-400 mt-0.5">
                    {uld.weight}t · {shapeLabel(uld.shape)}
                  </div>
                  {assigned && (
                    <div className="text-xs text-zinc-500 mt-0.5">
                      → {COMPARTMENTS.find((c) => c.id === assigned)?.name}
                    </div>
                  )}
                </motion.button>
              );
            })}
          </div>

          {/* Plane diagram */}
          <div className="flex-1 space-y-3">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-zinc-400">
              Plane Cross-Section{" "}
              {selected && (
                <span className="text-yellow-400 normal-case font-normal">
                  — click a compartment to place{" "}
                  <strong>{selected}</strong>
                </span>
              )}
            </h2>
            <div className="grid grid-cols-3 gap-3">
              {COMPARTMENTS.map((comp) => {
                const w = weightPerComp(comp.id);
                const pct = Math.min((w / comp.maxWeight) * 100, 100);
                const over = w > comp.maxWeight;
                const uldsHere = ULDS.filter((u) => assignments[u.id] === comp.id);
                const canPlace =
                  selected &&
                  (() => {
                    const uld = ULDS.find((u) => u.id === selected)!;
                    if (uld.shape === "tall" && !comp.allowsTall) return false;
                    if (uld.shape === "long" && !comp.allowsLong) return false;
                    return w + uld.weight <= comp.maxWeight;
                  })();

                return (
                  <motion.button
                    key={comp.id}
                    onClick={() => handleCompartmentClick(comp.id)}
                    whileHover={selected ? { scale: 1.02 } : {}}
                    whileTap={selected ? { scale: 0.98 } : {}}
                    className={cn(
                      "rounded-2xl border-2 p-3 text-left transition-all min-h-[180px] flex flex-col",
                      selected && canPlace
                        ? "border-yellow-400/70 bg-zinc-800/80 shadow-lg shadow-yellow-400/10 cursor-pointer"
                        : selected && !canPlace
                        ? "border-red-700/50 bg-zinc-900 cursor-not-allowed"
                        : "border-zinc-700 bg-zinc-900 cursor-default"
                    )}
                    style={{ borderTopColor: comp.color, borderTopWidth: 4 }}
                    disabled={!selected}
                  >
                    <div className="font-bold text-sm" style={{ color: comp.color }}>
                      {comp.name}
                    </div>
                    <div className="text-xs text-zinc-400 mt-0.5">
                      Max {comp.maxWeight}t
                    </div>
                    <div className="flex gap-2 mt-1 text-xs">
                      <span className={comp.allowsTall ? "text-green-400" : "text-red-400"}>
                        {comp.allowsTall ? "✓" : "✗"} Tall
                      </span>
                      <span className={comp.allowsLong ? "text-green-400" : "text-red-400"}>
                        {comp.allowsLong ? "✓" : "✗"} Long
                      </span>
                    </div>

                    {/* Capacity bar */}
                    <div className="mt-2 h-1.5 bg-zinc-700 rounded-full overflow-hidden">
                      <motion.div
                        className={cn(
                          "h-full rounded-full",
                          over ? "bg-red-500" : pct > 80 ? "bg-yellow-400" : "bg-green-500"
                        )}
                        animate={{ width: `${pct}%` }}
                        transition={{ type: "spring", stiffness: 120, damping: 20 }}
                      />
                    </div>
                    <div className={cn("text-xs mt-1", over ? "text-red-400" : "text-zinc-400")}>
                      {w}t / {comp.maxWeight}t
                    </div>

                    {/* Assigned ULDs */}
                    <div className="flex flex-wrap gap-1 mt-2 flex-1 content-start">
                      <AnimatePresence>
                        {uldsHere.map((u) => (
                          <motion.div
                            key={u.id}
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0, opacity: 0 }}
                            className="rounded px-1.5 py-0.5 text-xs font-bold text-zinc-900"
                            style={{ backgroundColor: u.color }}
                          >
                            {u.id}
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>
                  </motion.button>
                );
              })}
            </div>

            {/* Balance indicator */}
            <div
              className={cn(
                "rounded-xl border px-4 py-3 flex items-center justify-between",
                balanced ? "border-green-700 bg-green-900/20" : "border-yellow-700 bg-yellow-900/10"
              )}
            >
              <div className="text-sm">
                <span className="text-zinc-400">Balance: </span>
                <span className="font-mono font-bold">
                  Fwd {fwdW}t
                </span>
                <span className="text-zinc-500 mx-2">↔</span>
                <span className="font-mono font-bold">
                  Aft {aftW}t
                </span>
              </div>
              <div
                className={cn(
                  "text-xs font-semibold px-2 py-1 rounded-full",
                  balanced
                    ? "bg-green-500/20 text-green-400"
                    : "bg-yellow-500/20 text-yellow-400"
                )}
              >
                {balanced ? "✓ Balanced" : `Off by ${Math.abs(fwdW - aftW)}t`}
              </div>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap gap-3 justify-center">
          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            onClick={handleCheck}
            className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl font-semibold text-sm cursor-pointer transition-colors"
          >
            Check My Loading
          </motion.button>
          <motion.button
            whileHover={!solving ? { scale: 1.04 } : {}}
            whileTap={!solving ? { scale: 0.96 } : {}}
            onClick={!solving ? handleAutoSolve : undefined}
            disabled={solving}
            className="bg-violet-600 hover:bg-violet-500 disabled:opacity-60 text-white px-5 py-2.5 rounded-xl font-semibold text-sm cursor-pointer transition-colors"
          >
            {solving ? "Solving…" : "🤖 Auto-Loadmaster"}
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            onClick={handleReset}
            className="border border-zinc-600 hover:border-zinc-400 text-zinc-300 px-5 py-2.5 rounded-xl font-semibold text-sm cursor-pointer transition-colors"
          >
            Reset
          </motion.button>
        </div>

        {/* Results */}
        <AnimatePresence>
          {plan && (
            <motion.div
              key="plan"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className={cn(
                "rounded-xl border p-4 text-sm",
                plan.valid
                  ? "border-green-600 bg-green-900/20 text-green-300"
                  : "border-red-600 bg-red-900/20 text-red-300"
              )}
            >
              {mode === "solved" && plan.valid ? (
                <p className="font-semibold">
                  ✅ All 6 ULDs loaded! Plane is balanced.
                </p>
              ) : plan.valid ? (
                <p className="font-semibold">✓ Perfect load! All constraints satisfied.</p>
              ) : (
                <ul className="space-y-1">
                  {plan.errors.map((e, i) => (
                    <li key={i}>⚠️ {e}</li>
                  ))}
                  {assignedCount < 6 && (
                    <li>⚠️ {6 - assignedCount} ULD(s) not yet assigned</li>
                  )}
                </ul>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Explainer */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-zinc-800">
          {[
            {
              title: "Shape Constraints",
              icon: "📐",
              body: "Tall ULDs can't fit in the Aft due to low ceiling. The oversized long ULD only fits in the wide Middle compartment. Shape matters as much as weight!",
            },
            {
              title: "Weight & Balance",
              icon: "⚖️",
              body: "Each compartment has a max weight limit. But even within limits, the plane's center of gravity must stay within bounds — Forward and Aft must be within 2 tonnes of each other.",
            },
            {
              title: "Constraint Satisfaction",
              icon: "🧩",
              body: "Real-world cargo loading is a constraint satisfaction problem. The solver uses backtracking — it tries assignments recursively and backtracks on any violation until a valid plan is found.",
            },
          ].map((col) => (
            <motion.div
              key={col.title}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-zinc-900 rounded-xl p-4 border border-zinc-800"
            >
              <div className="text-2xl mb-2">{col.icon}</div>
              <h3 className="font-semibold text-sm text-white mb-1">{col.title}</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">{col.body}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
