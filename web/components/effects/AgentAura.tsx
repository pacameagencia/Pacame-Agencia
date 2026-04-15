"use client";

import { useReducedMotion } from "framer-motion";

interface AgentAuraProps {
  color: string;
  size?: number;
  className?: string;
  gold?: boolean;
}

export default function AgentAura({
  color,
  size = 120,
  className = "",
  gold = true,
}: AgentAuraProps) {
  const reducedMotion = useReducedMotion();

  if (reducedMotion) return null;

  return (
    <div
      className={`absolute pointer-events-none ${className}`}
      style={{
        width: size,
        height: size,
        left: "50%",
        top: "50%",
        transform: "translate(-50%, -50%)",
      }}
    >
      {/* Primary agent color glow */}
      <div
        className="absolute inset-0 rounded-full animate-breathe"
        style={{
          background: `radial-gradient(circle, ${color}20 0%, ${color}08 40%, transparent 70%)`,
        }}
      />
      {/* Golden accent glow */}
      {gold && (
        <div
          className="absolute inset-0 rounded-full animate-breathe"
          style={{
            background: `radial-gradient(circle, rgba(212,168,83,0.08) 0%, transparent 60%)`,
            animationDelay: "-3s",
          }}
        />
      )}
    </div>
  );
}
