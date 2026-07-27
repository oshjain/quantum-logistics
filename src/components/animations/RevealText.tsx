import React from "react";
import { motion } from "motion/react";

interface RevealTextProps {
  children: React.ReactNode;
  as?: "h1" | "h2" | "h3" | "p" | "span";
  className?: string;
  delay?: number;
  stagger?: number;
}

export function RevealText({
  children,
  as: Tag = "p",
  className,
  delay = 0,
  stagger = 0.03,
}: RevealTextProps) {
  // If children is a plain string, animate word by word
  if (typeof children === "string") {
    const words = children.split(" ");
    return (
      <Tag className={className} style={{ overflow: "hidden" }}>
        {words.map((word, i) => (
          <span key={i} className="inline-block" style={{ overflow: "hidden", verticalAlign: "top" }}>
            <motion.span
              className="inline-block"
              initial={{ y: "100%", opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{
                duration: 0.5,
                delay: delay + i * stagger,
                ease: [0.25, 0.1, 0.25, 1],
              }}
            >
              {word}
              {i < words.length - 1 ? "\u00A0" : ""}
            </motion.span>
          </span>
        ))}
      </Tag>
    );
  }

  // For JSX children (e.g. with <span> inside), render directly with fade-in
  return (
    <Tag className={className} style={{ overflow: "hidden" }}>
      <motion.span
        className="inline-block"
        initial={{ y: "100%", opacity: 0 }}
        whileInView={{ y: 0, opacity: 1 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.5, delay, ease: [0.25, 0.1, 0.25, 1] }}
      >
        {children}
      </motion.span>
    </Tag>
  );
}

interface LetterRevealProps {
  children: string;
  className?: string;
  delay?: number;
}

export function LetterReveal({
  children,
  className,
  delay = 0,
}: LetterRevealProps) {
  const chars = children.split("");

  return (
    <span className={className} style={{ overflow: "hidden" }}>
      {chars.map((char, i) => (
        <motion.span
          key={i}
          className="inline-block"
          initial={{ y: "100%", opacity: 0, rotateZ: 12 }}
          whileInView={{ y: 0, opacity: 1, rotateZ: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{
            duration: 0.4,
            delay: delay + i * 0.025,
            ease: [0.25, 0.1, 0.25, 1],
          }}
        >
          {char === " " ? "\u00A0" : char}
        </motion.span>
      ))}
    </span>
  );
}
