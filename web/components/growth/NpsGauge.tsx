"use client";

import { useEffect, useRef, useState } from "react";

interface Props {
  score: number | null;
  size?: number;
}

/**
 * NPS gauge — arco semi-circular con aguja animada.
 * Rango: -100 a +100. Zonas:
 *   [-100, 0)  rojo (detractor-heavy)
 *   [0, 50)    amber (needs work)
 *   [50, 100]  lime (world-class)
 *
 * La aguja anima desde 0 hasta el score con easing cubic on mount.
 */
export default function NpsGauge({ score, size = 240 }: Props) {
  const [animatedScore, setAnimatedScore] = useState(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (score === null || score === undefined) {
      setAnimatedScore(0);
      return;
    }
    const start = performance.now();
    const from = animatedScore;
    const to = score;
    const duration = 900;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      // easeOutCubic
      const eased = 1 - Math.pow(1 - t, 3);
      setAnimatedScore(from + (to - from) * eased);
      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick);
      }
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [score]);

  const w = size;
  const h = size / 1.8;
  const cx = w / 2;
  const cy = h;
  const radius = w / 2 - 14;

  // Score a angulo: -100 → 180deg (izq), +100 → 0deg (der)
  const scoreToAngle = (s: number) =>
    (180 - ((Math.max(-100, Math.min(100, s)) + 100) * 180) / 200) * (Math.PI / 180);

  // Helper para coords en arco
  const polar = (angle: number, r = radius) => ({
    x: cx + r * Math.cos(angle),
    y: cy - r * Math.sin(angle),
  });

  // Arco de fondo (segmentos por zona)
  type Segment = { from: number; to: number; color: string };
  const segments: Segment[] = [
    { from: -100, to: 0, color: "#ef4444" },
    { from: 0, to: 50, color: "#f59e0b" },
    { from: 50, to: 100, color: "#84cc16" },
  ];

  function arcPath(fromScore: number, toScore: number): string {
    const a1 = scoreToAngle(fromScore);
    const a2 = scoreToAngle(toScore);
    const p1 = polar(a1);
    const p2 = polar(a2);
    const largeArc = Math.abs(a1 - a2) > Math.PI ? 1 : 0;
    // sweep=0 porque vamos de izquierda a derecha (angulo decreciente)
    return `M ${p1.x} ${p1.y} A ${radius} ${radius} 0 ${largeArc} 0 ${p2.x} ${p2.y}`;
  }

  const needleAngle = scoreToAngle(animatedScore);
  const needleTip = polar(needleAngle, radius - 8);
  const needleBase = polar(needleAngle + Math.PI, 10);

  const zoneColor =
    score === null
      ? "#6b7280"
      : score < 0
      ? "#ef4444"
      : score < 50
      ? "#f59e0b"
      : "#84cc16";

  const zoneLabel =
    score === null
      ? "Sin datos"
      : score < 0
      ? "Criticos"
      : score < 20
      ? "Por mejorar"
      : score < 50
      ? "Saludable"
      : score < 70
      ? "Excelente"
      : "World-class";

  return (
    <div className="flex flex-col items-center">
      <svg width={w} height={h + 38} viewBox={`0 0 ${w} ${h + 38}`}>
        {/* Arco de fondo gris */}
        <path
          d={arcPath(-100, 100)}
          stroke="rgba(255,255,255,0.05)"
          strokeWidth="14"
          fill="none"
          strokeLinecap="round"
        />
        {/* Segmentos de colores */}
        {segments.map((s, i) => (
          <path
            key={i}
            d={arcPath(s.from, s.to)}
            stroke={s.color}
            strokeOpacity="0.35"
            strokeWidth="14"
            fill="none"
            strokeLinecap="round"
          />
        ))}

        {/* Ticks */}
        {[-100, -50, 0, 50, 100].map((v) => {
          const a = scoreToAngle(v);
          const p1 = polar(a, radius - 22);
          const p2 = polar(a, radius - 14);
          const lbl = polar(a, radius - 32);
          return (
            <g key={v}>
              <line
                x1={p1.x}
                y1={p1.y}
                x2={p2.x}
                y2={p2.y}
                stroke="rgba(255,255,255,0.3)"
                strokeWidth="1.5"
              />
              <text
                x={lbl.x}
                y={lbl.y + 3}
                fill="rgba(255,255,255,0.35)"
                fontSize="9"
                fontFamily="ui-monospace, SFMono-Regular, monospace"
                textAnchor="middle"
              >
                {v}
              </text>
            </g>
          );
        })}

        {/* Aguja */}
        {score !== null && score !== undefined && (
          <>
            <line
              x1={needleBase.x}
              y1={needleBase.y}
              x2={needleTip.x}
              y2={needleTip.y}
              stroke={zoneColor}
              strokeWidth="3"
              strokeLinecap="round"
              style={{
                filter: `drop-shadow(0 0 6px ${zoneColor}80)`,
                transition: "stroke 400ms ease",
              }}
            />
            <circle
              cx={cx}
              cy={cy}
              r="8"
              fill={zoneColor}
              style={{
                filter: `drop-shadow(0 0 8px ${zoneColor}cc)`,
                transition: "fill 400ms ease",
              }}
            />
            <circle cx={cx} cy={cy} r="4" fill="#0a0a0a" />
          </>
        )}

        {/* Score number */}
        <text
          x={cx}
          y={cy + 24}
          fontSize="36"
          fontWeight="700"
          textAnchor="middle"
          fill={zoneColor}
          fontFamily="'Space Grotesk', system-ui, sans-serif"
          style={{ transition: "fill 400ms ease" }}
        >
          {score === null || score === undefined
            ? "—"
            : Math.round(animatedScore).toString()}
        </text>
      </svg>
      <div
        className="text-[11px] uppercase tracking-[0.18em] font-mono mt-1"
        style={{ color: zoneColor }}
      >
        {zoneLabel}
      </div>
    </div>
  );
}
