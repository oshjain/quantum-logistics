import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { StarRating } from "./StarRating.tsx";
import { useAuthContext } from "@/lib/auth/index.ts";

export function RatingModal() {
  const { email } = useAuthContext();
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const submitRating = useMutation(api.ratings.submitRating);
  const userRating = useQuery(api.ratings.getUserRating, { email: email ?? "" });
  const stats = useQuery(api.ratings.getRatingStats);

  const hasRated = !!userRating;

  const handleSubmit = async () => {
    if (!email || rating === 0) return;
    await submitRating({ email, rating, comment: comment || undefined });
    setSubmitted(true);
    setTimeout(() => {
      setOpen(false);
      setSubmitted(false);
    }, 1500);
  };

  if (!email) return null;

  return (
    <>
      {/* Trigger button */}
      <button
        onClick={() => {
          setRating(userRating?.rating ?? 0);
          setComment(userRating?.comment ?? "");
          setOpen(true);
        }}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-amber-500/25 bg-amber-500/5 text-amber-400 text-xs font-semibold hover:bg-amber-500/10 transition-all duration-200 hover:scale-105"
      >
        {hasRated ? "★ Update Rating" : "★ Rate This Platform"}
        {stats && stats.count > 0 && (
          <span className="text-muted-foreground font-mono text-[10px]">
            ({stats.average.toFixed(1)} · {stats.count})
          </span>
        )}
      </button>

      {/* Modal */}
      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-[100] flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => !submitted && setOpen(false)} />

            {/* Panel */}
            <motion.div
              className="relative z-10 w-full max-w-md rounded-2xl border border-border/50 bg-card p-6 sm:p-8 shadow-2xl"
              initial={{ scale: 0.9, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.9, y: 20, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
            >
              {submitted ? (
                <div className="text-center py-8">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200 }}
                    className="text-5xl mb-4"
                  >
                    🌟
                  </motion.div>
                  <p className="text-lg font-bold text-amber-400">Thank you!</p>
                  <p className="text-sm text-muted-foreground mt-1">Your feedback helps us improve.</p>
                </div>
              ) : (
                <>
                  <h3 className="text-lg font-bold mb-1">Rate the Quantum Lab</h3>
                  <p className="text-xs text-muted-foreground mb-5">
                    How would you rate your overall experience with this platform?
                  </p>

                  <div className="flex justify-center mb-4">
                    <StarRating value={rating} onChange={setRating} size={36} />
                  </div>

                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Share your thoughts... (optional)"
                    className="w-full rounded-xl border border-border/50 bg-background px-4 py-3 text-sm resize-none h-24 focus:outline-none focus:border-primary/40 transition-colors"
                  />

                  <div className="flex gap-3 mt-5">
                    <button
                      onClick={() => setOpen(false)}
                      className="flex-1 px-4 py-2.5 rounded-xl border border-border/50 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSubmit}
                      disabled={rating === 0}
                      className="flex-1 px-4 py-2.5 rounded-xl bg-amber-500 text-white text-sm font-semibold disabled:opacity-40 hover:bg-amber-600 transition-all"
                    >
                      {hasRated ? "Update" : "Submit"}
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
