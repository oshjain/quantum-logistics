import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils.ts";

export interface TutorialStep {
  title: string;
  body: string;
  highlightSelector?: string;
  placement?: "center" | "top" | "bottom" | "left" | "right";
  emoji?: string;
}

interface TutorialOverlayProps {
  steps: TutorialStep[];
  storageKey: string; // localStorage key to remember dismissal
  /** Optional callback when user completes or dismisses tutorial */
  onComplete?: () => void;
  /** Show a "Why This Matters" card at the end */
  businessContext?: {
    title: string;
    body: string;
    source?: string;
  };
}

const STORAGE_PREFIX = "tutorial-dismissed-";

export default function TutorialOverlay({
  steps,
  storageKey,
  onComplete,
  businessContext,
}: TutorialOverlayProps) {
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    const dismissed = localStorage.getItem(STORAGE_PREFIX + storageKey);
    if (!dismissed) {
      // Small delay so the page content renders first
      const timer = setTimeout(() => setVisible(true), 600);
      return () => clearTimeout(timer);
    }
  }, [storageKey]);

  const dismiss = () => {
    setVisible(false);
    localStorage.setItem(STORAGE_PREFIX + storageKey, "true");
    onComplete?.();
  };

  const next = () => {
    if (step < steps.length - 1) {
      setStep((s) => s + 1);
    } else {
      dismiss();
    }
  };

  const prev = () => {
    if (step > 0) setStep((s) => s - 1);
  };

  const currentStep = steps[step];

  if (!visible) return null;

  return (
    <AnimatePresence>
      <motion.div
        key="tutorial-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center"
        style={{ background: "rgba(0,0,0,0.75)" }}
        onClick={(e) => {
          // Don't close when clicking inside the card
          if (e.target === e.currentTarget) dismiss();
        }}
      >
        <motion.div
          initial={{ scale: 0.92, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.92, opacity: 0, y: 20 }}
          transition={{ type: "spring", stiffness: 300, damping: 24 }}
          className="relative max-w-lg w-full mx-4 rounded-2xl border border-white/15 overflow-hidden"
          style={{ background: "oklch(0.12 0.03 260)" }}
        >
          {/* Progress bar */}
          <div className="flex gap-1 px-6 pt-5 pb-2">
            {steps.map((_, i) => (
              <div
                key={i}
                className={cn(
                  "h-1 flex-1 rounded-full transition-colors duration-300",
                  i <= step ? "bg-primary" : "bg-white/10",
                )}
              />
            ))}
          </div>

          {/* Step counter */}
          <div className="px-6 pb-1">
            <span className="text-xs font-mono text-white/40 uppercase tracking-widest">
              Step {step + 1} of {steps.length}
            </span>
          </div>

          {/* Content */}
          <div className="px-6 py-4">
            <div className="flex items-start gap-3 mb-3">
              {currentStep.emoji && (
                <span className="text-3xl shrink-0">{currentStep.emoji}</span>
              )}
              <div>
                <h3 className="text-xl font-bold text-white mb-2">
                  {currentStep.title}
                </h3>
                <p className="text-white/70 text-base leading-relaxed">
                  {currentStep.body}
                </p>
              </div>
            </div>

            {/* Business context on last step */}
            {step === steps.length - 1 && businessContext && (
              <div className="mt-4 rounded-xl border border-amber-500/30 bg-amber-500/8 px-4 py-3">
                <p className="text-amber-300 font-semibold text-sm mb-1">
                  {businessContext.title}
                </p>
                <p className="text-white/60 text-sm leading-relaxed">
                  {businessContext.body}
                </p>
                {businessContext.source && (
                  <p className="text-[10px] text-white/30 font-mono mt-1.5">
                    Source: {businessContext.source}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Buttons */}
          <div className="px-6 pb-5 flex items-center justify-between gap-3">
            <div className="flex gap-2">
              {step > 0 && (
                <button
                  onClick={prev}
                  className="px-3 py-2 rounded-lg text-sm text-white/50 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                >
                  ← Back
                </button>
              )}
              <button
                onClick={dismiss}
                className="px-3 py-2 rounded-lg text-sm text-white/30 hover:text-white/60 transition-colors cursor-pointer"
              >
                Skip
              </button>
            </div>
            <button
              onClick={next}
              className="px-5 py-2 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-semibold transition-colors cursor-pointer"
            >
              {step < steps.length - 1 ? "Next →" : "Got it"}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
