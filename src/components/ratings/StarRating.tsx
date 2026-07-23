import { useState } from "react";
import { motion } from "motion/react";

interface StarRatingProps {
  value: number;
  onChange?: (rating: number) => void;
  size?: number;
  readonly?: boolean;
  showLabel?: boolean;
}

export function StarRating({
  value,
  onChange,
  size = 24,
  readonly = false,
  showLabel = true,
}: StarRatingProps) {
  const [hover, setHover] = useState(0);

  const labels = ["", "Poor", "Fair", "Good", "Great", "Excellent"];
  const display = hover || value;

  return (
    <div className="inline-flex flex-col items-center gap-1">
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            disabled={readonly}
            onClick={() => onChange?.(star)}
            onMouseEnter={() => !readonly && setHover(star)}
            onMouseLeave={() => !readonly && setHover(0)}
            className="transition-transform duration-150 hover:scale-110 active:scale-90 disabled:cursor-default"
            style={{ cursor: readonly ? "default" : "pointer" }}
          >
            <motion.span
              animate={star <= display ? { scale: [1, 1.2, 1] } : {}}
              transition={{ duration: 0.3 }}
              style={{
                fontSize: size,
                color: star <= display ? "#f59e0b" : "#334155",
                filter: star <= display ? "drop-shadow(0 0 3px rgba(245,158,11,0.4))" : "none",
                transition: "color 0.15s, filter 0.15s",
              }}
            >
              {star <= display ? "★" : "☆"}
            </motion.span>
          </button>
        ))}
      </div>
      {showLabel && display > 0 && (
        <span className="text-[10px] font-mono text-amber-400">{labels[display]}</span>
      )}
    </div>
  );
}
