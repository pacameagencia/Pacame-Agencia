/**
 * Avatar holográfico PACAME — figura humana cyberpunk con lipsync.
 * Stack: SVG puro + CSS animations. Sin dependencias.
 */
"use client";

import { useEffect, useRef } from "react";

type AvatarState = "idle" | "listening" | "thinking" | "speaking";

interface Props {
  state: AvatarState;
  amplitude: number; // 0..1, para lipsync
}

export default function AvatarHolograma({ state, amplitude }: Props) {
  const mouthRef = useRef<SVGPathElement>(null);
  const eyesRef = useRef<SVGGElement>(null);

  // Lipsync: cambiar path de la boca según amplitud
  useEffect(() => {
    if (!mouthRef.current) return;
    if (state === "speaking") {
      const open = Math.max(2, amplitude * 10);
      mouthRef.current.setAttribute(
        "d",
        `M 85,155 Q 100,${155 + open} 115,155 Q 100,${155 + open / 2} 85,155 Z`
      );
    } else {
      // Boca cerrada relajada
      mouthRef.current.setAttribute("d", "M 85,155 Q 100,158 115,155");
    }
  }, [amplitude, state]);

  // Blink de ojos cada 4s
  useEffect(() => {
    if (!eyesRef.current) return;
    const interval = setInterval(() => {
      if (!eyesRef.current) return;
      eyesRef.current.style.transform = "scaleY(0.1)";
      setTimeout(() => {
        if (eyesRef.current) eyesRef.current.style.transform = "scaleY(1)";
      }, 120);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className={`avatar-container avatar-${state}`}>
      {/* Capa de aura/glow */}
      <div className="avatar-aura" aria-hidden />
      <div className="avatar-ring" aria-hidden />
      <div className="avatar-ring avatar-ring-2" aria-hidden />

      {/* Figura SVG del avatar */}
      <svg
        viewBox="0 0 200 280"
        className="avatar-svg"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="holo-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#67e8f9" stopOpacity="0.95" />
            <stop offset="50%" stopColor="#3b82f6" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#6366f1" stopOpacity="0.6" />
          </linearGradient>
          <linearGradient id="holo-body" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.3" />
          </linearGradient>
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <pattern
            id="scan-pattern"
            x="0"
            y="0"
            width="100"
            height="4"
            patternUnits="userSpaceOnUse"
          >
            <rect width="100" height="2" fill="rgba(103, 232, 249, 0.15)" />
          </pattern>
        </defs>

        {/* Cabeza/rostro — contorno */}
        <g filter="url(#glow)">
          {/* Cuerpo/torso (hombros) */}
          <path
            d="M 50,230 Q 50,200 75,190 L 125,190 Q 150,200 150,230 L 150,280 L 50,280 Z"
            fill="url(#holo-body)"
            stroke="url(#holo-gradient)"
            strokeWidth="1.5"
            opacity="0.75"
          />

          {/* Cuello */}
          <rect
            x="90"
            y="175"
            width="20"
            height="20"
            fill="url(#holo-body)"
            stroke="url(#holo-gradient)"
            strokeWidth="1"
            opacity="0.6"
          />

          {/* Cabeza (forma tipo calavera digital) */}
          <path
            d="M 65,100 Q 65,55 100,55 Q 135,55 135,100 L 135,135 Q 135,175 100,180 Q 65,175 65,135 Z"
            fill="rgba(14, 165, 233, 0.08)"
            stroke="url(#holo-gradient)"
            strokeWidth="2"
          />

          {/* Ojos (placa negra tipo visor) */}
          <g ref={eyesRef} style={{ transformOrigin: "100px 115px", transition: "transform 0.08s" }}>
            <rect
              x="72"
              y="108"
              width="56"
              height="14"
              rx="7"
              fill="rgba(0, 0, 0, 0.85)"
              stroke="url(#holo-gradient)"
              strokeWidth="0.8"
            />
            {/* Luces de ojo — LED izquierdo */}
            <circle cx="85" cy="115" r="3" fill="#67e8f9">
              <animate
                attributeName="opacity"
                values="1;0.3;1"
                dur="2s"
                repeatCount="indefinite"
              />
            </circle>
            {/* LED derecho */}
            <circle cx="115" cy="115" r="3" fill="#67e8f9">
              <animate
                attributeName="opacity"
                values="0.3;1;0.3"
                dur="2s"
                repeatCount="indefinite"
              />
            </circle>
          </g>

          {/* Nariz (línea sutil) */}
          <path
            d="M 100,130 L 100,145 L 96,148"
            fill="none"
            stroke="url(#holo-gradient)"
            strokeWidth="1"
            opacity="0.5"
          />

          {/* Boca — animada con lipsync */}
          <path
            ref={mouthRef}
            d="M 85,155 Q 100,158 115,155"
            fill="rgba(14, 165, 233, 0.3)"
            stroke="url(#holo-gradient)"
            strokeWidth="1.5"
          />

          {/* Detalles cyberpunk: circuitos en la mejilla */}
          <g opacity="0.4">
            <circle cx="72" cy="135" r="1.5" fill="#67e8f9" />
            <circle cx="65" cy="128" r="1" fill="#67e8f9" />
            <line x1="72" y1="135" x2="65" y2="128" stroke="#67e8f9" strokeWidth="0.5" />
            <circle cx="128" cy="135" r="1.5" fill="#67e8f9" />
            <circle cx="135" cy="128" r="1" fill="#67e8f9" />
            <line x1="128" y1="135" x2="135" y2="128" stroke="#67e8f9" strokeWidth="0.5" />
          </g>

          {/* Placa de pecho "PACAME" */}
          <rect
            x="85"
            y="210"
            width="30"
            height="8"
            rx="1"
            fill="rgba(103, 232, 249, 0.15)"
            stroke="url(#holo-gradient)"
            strokeWidth="0.5"
          />
          <text
            x="100"
            y="216.5"
            textAnchor="middle"
            fontSize="5"
            fontFamily="monospace"
            fill="#67e8f9"
            opacity="0.8"
          >
            PACAME
          </text>
        </g>

        {/* Overlay scan-lines sobre toda la figura */}
        <rect
          x="0"
          y="0"
          width="200"
          height="280"
          fill="url(#scan-pattern)"
          opacity="0.6"
        />

        {/* Partículas flotantes */}
        <g className="particles" opacity="0.6">
          <circle cx="40" cy="60" r="1" fill="#67e8f9">
            <animate
              attributeName="cy"
              values="60;200;60"
              dur="8s"
              repeatCount="indefinite"
            />
          </circle>
          <circle cx="165" cy="80" r="1" fill="#3b82f6">
            <animate
              attributeName="cy"
              values="80;220;80"
              dur="10s"
              repeatCount="indefinite"
            />
          </circle>
          <circle cx="25" cy="150" r="0.8" fill="#67e8f9">
            <animate
              attributeName="cy"
              values="150;40;150"
              dur="9s"
              repeatCount="indefinite"
            />
          </circle>
          <circle cx="180" cy="200" r="0.8" fill="#6366f1">
            <animate
              attributeName="cy"
              values="200;70;200"
              dur="11s"
              repeatCount="indefinite"
            />
          </circle>
        </g>
      </svg>

      {/* Pedestal / base */}
      <div className="avatar-pedestal" aria-hidden>
        <div className="pedestal-glow" />
        <div className="pedestal-ring" />
        <div className="pedestal-beam" />
      </div>
    </div>
  );
}
