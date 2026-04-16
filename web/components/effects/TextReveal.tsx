"use client";

import { useRef, useEffect, useState } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";

interface TextRevealProps {
  text: string;
  mode?: "chars" | "words" | "scramble";
  className?: string;
  delay?: number;
  tag?: "h1" | "h2" | "h3" | "span" | "p";
}

const scrambleChars = "!<>-_\\/[]{}—=+*^?#________";

function ScrambleText({
  text,
  className,
  delay,
  tag: Tag = "span",
}: TextRevealProps) {
  const ref = useRef<HTMLElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });
  const [displayText, setDisplayText] = useState("");
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (!isInView) return;
    if (reducedMotion) {
      setDisplayText(text);
      return;
    }

    let iteration = 0;
    const totalIterations = text.length * 3;
    const delayMs = (delay || 0) * 1000;

    const timeout = setTimeout(() => {
      const interval = setInterval(() => {
        setDisplayText(
          text
            .split("")
            .map((char, index) => {
              if (char === " ") return " ";
              if (index < iteration / 3) return text[index];
              return scrambleChars[Math.floor(Math.random() * scrambleChars.length)];
            })
            .join("")
        );
        iteration++;
        if (iteration >= totalIterations) clearInterval(interval);
      }, 30);

      return () => clearInterval(interval);
    }, delayMs);

    return () => clearTimeout(timeout);
  }, [isInView, text, delay, reducedMotion]);

  return (
    <Tag ref={ref as React.Ref<HTMLHeadingElement>} className={className}>
      {reducedMotion ? text : displayText || "\u00A0"}
    </Tag>
  );
}

export default function TextReveal({
  text,
  mode = "words",
  className = "",
  delay = 0,
  tag: Tag = "span",
}: TextRevealProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });
  const reducedMotion = useReducedMotion();

  if (mode === "scramble") {
    return <ScrambleText text={text} mode={mode} className={className} delay={delay} tag={Tag} />;
  }

  const items = mode === "chars" ? text.split("") : text.split(" ");

  if (reducedMotion) {
    return <Tag className={className}>{text}</Tag>;
  }

  return (
    <Tag ref={ref} className={className} aria-label={text}>
      {items.map((item, i) => (
        <span key={i} className="inline-block overflow-hidden" aria-hidden="true">
          <motion.span
            className="inline-block"
            initial={{ y: "100%", opacity: 0 }}
            animate={
              isInView
                ? { y: 0, opacity: 1 }
                : { y: "100%", opacity: 0 }
            }
            transition={{
              duration: 0.6,
              delay: delay + i * (mode === "chars" ? 0.03 : 0.08),
              ease: [0.23, 1, 0.32, 1],
            }}
          >
            {item}
            {mode === "words" && i < items.length - 1 ? "\u00A0" : ""}
          </motion.span>
        </span>
      ))}
    </Tag>
  );
}
