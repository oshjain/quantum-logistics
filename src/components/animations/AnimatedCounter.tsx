import { useRef, useState, useEffect } from "react";
import { useInView } from "motion/react";

interface AnimatedCounterProps {
  from?: number;
  to: number;
  suffix?: string;
  prefix?: string;
  duration?: number;
  className?: string;
  decimals?: number;
}

export function AnimatedCounter({
  from = 0,
  to,
  suffix = "",
  prefix = "",
  duration = 2,
  className,
  decimals = 0,
}: AnimatedCounterProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const [val, setVal] = useState(from);

  useEffect(() => {
    if (!inView) return;
    const startTime = performance.now();
    const isInt = decimals === 0;

    const tick = (now: number) => {
      const elapsed = (now - startTime) / 1000;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = from + (to - from) * eased;

      setVal(isInt ? Math.floor(current) : current);

      if (progress < 1) {
        requestAnimationFrame(tick);
      } else {
        setVal(to);
      }
    };

    requestAnimationFrame(tick);
  }, [inView, from, to, duration, decimals]);

  const display = val.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  return (
    <span ref={ref} className={className}>
      {prefix}{display}{suffix}
    </span>
  );
}
