import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";

interface HeartButtonProps {
  count: number;
  isLiked: boolean;
  onToggle: () => void;
  size?: "sm" | "md" | "lg";
}

export function HeartButton({ count, isLiked, onToggle, size = "md" }: HeartButtonProps) {
  const [animating, setAnimating] = useState(false);

  const sizeMap = { sm: 28, md: 36, lg: 44 };
  const px = sizeMap[size];

  const handleClick = () => {
    setAnimating(true);
    onToggle();
    setTimeout(() => setAnimating(false), 600);
  };

  return (
    <button
      onClick={handleClick}
      className="group relative inline-flex items-center gap-1.5 transition-all duration-200 hover:scale-110 active:scale-90"
      style={{ cursor: "pointer" }}
    >
      {/* Floating hearts on click */}
      <AnimatePresence>
        {animating && (
          <>
            {[0, 1, 2].map((i) => (
              <motion.span
                key={i}
                className="absolute pointer-events-none"
                style={{
                  left: px / 2,
                  top: px / 2,
                  fontSize: px * 0.6,
                  color: isLiked ? "#ef4444" : "#64748b",
                }}
                initial={{ y: 0, x: 0, opacity: 1, scale: 0.5 }}
                animate={{
                  y: -20 - i * 12,
                  x: (i - 1) * 10,
                  opacity: 0,
                  scale: 1.5,
                }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              >
                ♥
              </motion.span>
            ))}
          </>
        )}
      </AnimatePresence>

      {/* Heart icon */}
      <motion.span
        animate={
          animating
            ? { scale: [1, 1.4, 1], rotate: [0, -10, 10, 0] }
            : { scale: 1, rotate: 0 }
        }
        transition={{ duration: 0.4, ease: "easeOut" }}
        style={{
          fontSize: px,
          color: isLiked ? "#ef4444" : "#64748b",
          filter: isLiked ? "drop-shadow(0 0 4px rgba(239,68,68,0.5))" : "none",
          transition: "color 0.2s, filter 0.2s",
        }}
      >
        {isLiked ? "♥" : "♡"}
      </motion.span>

      {/* Count */}
      <motion.span
        key={count}
        initial={{ y: -8, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="font-mono font-semibold"
        style={{
          fontSize: Math.max(14, px * 0.4),
          color: isLiked ? "#ef4444" : "#94a3b8",
        }}
      >
        {count}
      </motion.span>
    </button>
  );
}
