import { motion } from "motion/react";
import type { ReactNode } from "react";

interface GlowCardProps {
  children: ReactNode;
  className?: string;
  color?: string;
  glowIntensity?: number;
  as?: "div" | "a";
  href?: string;
  onClick?: () => void;
}

export function GlowCard({
  children,
  className,
  color = "oklch(0.72 0.22 200)",
  glowIntensity = 0.06,
  as = "div",
  href,
  onClick,
}: GlowCardProps) {
  const Tag = as === "a" ? motion.a : motion.div;

  return (
    <Tag
      href={href}
      onClick={onClick}
      className={className}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      whileHover={{
        y: -6,
        scale: 1.02,
        transition: { type: "spring", stiffness: 300, damping: 20 },
      }}
      whileTap={{ scale: 0.98 }}
      style={{
        position: "relative",
        overflow: "hidden",
        borderRadius: "16px",
        border: `1px solid ${color}30`,
        cursor: href || onClick ? "pointer" : "default",
      }}
      transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
    >
      {/* Glow overlay */}
      <motion.div
        className="pointer-events-none absolute inset-0"
        style={{
          background: `radial-gradient(ellipse at 50% 0%, ${color}, transparent 70%)`,
          opacity: glowIntensity,
        }}
        whileHover={{ opacity: glowIntensity * 3 }}
        transition={{ duration: 0.3 }}
      />

      {/* Shine border */}
      <motion.div
        className="pointer-events-none absolute inset-0 rounded-[inherit]"
        style={{
          border: `1px solid transparent`,
          backgroundOrigin: "border-box",
          backgroundClip: "border-box",
        }}
        whileHover={{
          boxShadow: `0 0 30px ${color}40, inset 0 0 30px ${color}10`,
        }}
      />

      <div className="relative z-10">{children}</div>
    </Tag>
  );
}

interface GlowBorderProps {
  children: ReactNode;
  className?: string;
  color?: string;
  speed?: number;
}

export function GlowBorder({
  children,
  className,
  color = "oklch(0.72 0.22 200)",
  speed = 4,
}: GlowBorderProps) {
  return (
    <div
      className={className}
      style={{
        position: "relative",
        overflow: "hidden",
        borderRadius: "16px",
      }}
    >
      <motion.div
        className="pointer-events-none absolute inset-0"
        style={{
          borderRadius: "inherit",
          padding: "1px",
          background: `conic-gradient(from var(--angle, 0deg), transparent 30%, ${color}80, transparent 70%)`,
          WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
          WebkitMaskComposite: "xor",
          maskComposite: "exclude",
        }}
        animate={{ "--angle": "360deg" } as Record<string, string>}
        transition={{ duration: speed, repeat: Infinity, ease: "linear" }}
      />
      <div className="relative z-10">{children}</div>
    </div>
  );
}
