/**
 * Avatar JARVIS — humanoide holográfico de cuerpo completo, proyección desde pedestal.
 *
 * Estilo: Iron Man / Vision Pro / Star Wars projection — no cartoon.
 * - SVG line-art con multiple capas de glow
 * - Cara con ojos + boca animados (lipsync real desde AnalyserNode)
 * - Corte holográfico inferior (los pies fade-out a líneas)
 * - Cono de proyección desde la base + anillo HUD orbital
 * - Canvas detrás para partículas/scanlines/aura
 */
"use client";

import { useEffect, useRef } from "react";

type AvatarState = "idle" | "listening" | "thinking" | "speaking";

interface Props {
  state: AvatarState;
  analyser?: AnalyserNode | null;
}

const COLORS: Record<AvatarState, { primary: string; secondary: string; glow: string }> = {
  idle:      { primary: "#67e8f9", secondary: "#22d3ee", glow: "rgba(34,211,238,0.45)" },
  listening: { primary: "#7dd3fc", secondary: "#38bdf8", glow: "rgba(56,189,248,0.65)" },
  thinking:  { primary: "#fcd34d", secondary: "#f59e0b", glow: "rgba(245,158,11,0.55)" },
  speaking:  { primary: "#f0abfc", secondary: "#d946ef", glow: "rgba(217,70,239,0.65)" },
};

export default function AvatarHolograma({ state, analyser }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const figureRef = useRef<SVGGElement>(null);
  const headRef = useRef<SVGGElement>(null);
  const mouthRef = useRef<SVGPathElement>(null);
  const eyesRef = useRef<SVGGElement>(null);
  const leftArmRef = useRef<SVGGElement>(null);
  const rightArmRef = useRef<SVGGElement>(null);
  const chestCoreRef = useRef<SVGCircleElement>(null);

  const stateRef = useRef(state);
  const analyserRef = useRef(analyser);
  useEffect(() => { stateRef.current = state; }, [state]);
  useEffect(() => { analyserRef.current = analyser; }, [analyser]);

  // Animación principal
  useEffect(() => {
    let raf = 0;
    let t = 0;
    let amp = 0;
    let amp2 = 0;
    let blinkPhase = 0;
    let nextBlink = 3 + Math.random() * 3;
    let breathPhase = 0;

    const tick = () => {
      const dt = 1 / 60;
      t += dt;
      breathPhase += dt;

      const s = stateRef.current;
      const an = analyserRef.current;

      // Amplitud audio real
      let target = 0;
      if (an && s === "speaking") {
        const buf = new Uint8Array(an.fftSize);
        an.getByteTimeDomainData(buf as any);
        let sum = 0;
        for (let i = 0; i < buf.length; i++) {
          const v = (buf[i] - 128) / 128;
          sum += v * v;
        }
        target = Math.min(1, Math.sqrt(sum / buf.length) * 4.5);
      } else if (s === "listening") target = 0.18 + Math.abs(Math.sin(t * 1.6)) * 0.18;
      else if (s === "thinking") target = 0.15 + Math.abs(Math.sin(t * 4)) * 0.1;
      else target = 0.06 + Math.abs(Math.sin(t * 0.8)) * 0.05;

      amp += (target - amp) * 0.32;
      amp2 += (target - amp2) * 0.1;

      // Respiración + flotación
      if (figureRef.current) {
        const breath = 1 + Math.sin(breathPhase * 1.4) * 0.008;
        const float = Math.sin(t * 0.7) * 4;
        figureRef.current.setAttribute(
          "transform",
          `translate(0 ${float}) scale(${breath})`
        );
        figureRef.current.style.transformOrigin = "200px 280px";
      }

      // Cabeza: ladea según estado
      if (headRef.current) {
        let tilt = 0;
        if (s === "listening") tilt = 4 + Math.sin(t * 0.8) * 1.5;
        else if (s === "thinking") tilt = -3;
        else if (s === "speaking") tilt = Math.sin(t * 3.5) * amp * 3;
        else tilt = Math.sin(t * 0.5) * 1;
        headRef.current.setAttribute("transform", `rotate(${tilt} 200 110)`);
      }

      // Parpadeo
      blinkPhase += dt;
      if (blinkPhase > nextBlink && eyesRef.current) {
        nextBlink = blinkPhase + 3 + Math.random() * 3;
        const e = eyesRef.current;
        e.style.transition = "transform 0.08s";
        e.style.transform = "scaleY(0.1)";
        setTimeout(() => {
          if (e) e.style.transform = "scaleY(1)";
        }, 130);
      }

      // Boca / lipsync
      if (mouthRef.current) {
        if (s === "speaking" && amp > 0.05) {
          const w = 28;
          const h = 4 + amp * 18;
          // Forma elíptica abierta
          mouthRef.current.setAttribute(
            "d",
            `M ${200 - w / 2},108 Q 200,${108 + h} ${200 + w / 2},108 Q 200,${108 - h * 0.3} ${200 - w / 2},108 Z`
          );
          mouthRef.current.setAttribute("fill", "rgba(255,255,255,0.15)");
        } else if (s === "listening") {
          mouthRef.current.setAttribute("d", `M 192,108 Q 200,113 208,108`);
          mouthRef.current.setAttribute("fill", "none");
        } else if (s === "thinking") {
          mouthRef.current.setAttribute("d", `M 192,109 L 208,108`);
          mouthRef.current.setAttribute("fill", "none");
        } else {
          // sonrisa idle suave
          mouthRef.current.setAttribute("d", `M 190,107 Q 200,112 210,107`);
          mouthRef.current.setAttribute("fill", "none");
        }
      }

      // Brazos: leves gestos al hablar
      if (leftArmRef.current && rightArmRef.current) {
        const armSwing = s === "speaking" ? Math.sin(t * 2.5) * amp * 2.5 : Math.sin(t * 0.5) * 0.5;
        leftArmRef.current.setAttribute("transform", `rotate(${-armSwing} 145 200)`);
        rightArmRef.current.setAttribute("transform", `rotate(${armSwing} 255 200)`);
      }

      // Núcleo arc reactor del pecho pulsa con amp
      if (chestCoreRef.current) {
        const r = 6 + amp * 4;
        chestCoreRef.current.setAttribute("r", String(r));
        chestCoreRef.current.setAttribute("opacity", String(0.7 + amp * 0.3));
      }

      drawAura(amp, amp2, t, s);
      raf = requestAnimationFrame(tick);
    };

    const drawAura = (a: number, a2: number, time: number, s: AvatarState) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      const W = canvas.clientWidth;
      const H = canvas.clientHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      if (canvas.width !== W * dpr || canvas.height !== H * dpr) {
        canvas.width = W * dpr;
        canvas.height = H * dpr;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      }
      ctx.clearRect(0, 0, W, H);
      const cx = W / 2;
      const cy = H * 0.5;
      const S = Math.min(W, H);

      const c = COLORS[s];

      // === Aura volumétrica detrás ===
      const auraR = S * 0.55 * (1 + a2 * 0.15);
      const auraGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, auraR);
      auraGrad.addColorStop(0, c.glow);
      auraGrad.addColorStop(0.5, "rgba(15, 23, 42, 0.0)");
      auraGrad.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = auraGrad;
      ctx.fillRect(0, 0, W, H);

      // === Anillo HUD orbital alrededor del avatar ===
      ctx.save();
      ctx.translate(cx, cy);
      const ringR = S * 0.42;
      ctx.strokeStyle = c.primary;
      ctx.globalAlpha = 0.35;
      ctx.lineWidth = 1;
      ctx.setLineDash([8, 4]);
      ctx.beginPath();
      ctx.arc(0, 0, ringR, time * 0.15, time * 0.15 + Math.PI * 1.4);
      ctx.stroke();
      ctx.setLineDash([]);
      // Marcadores cardinales
      for (let i = 0; i < 12; i++) {
        const ang = (i / 12) * Math.PI * 2 + time * 0.05;
        const x1 = Math.cos(ang) * ringR;
        const y1 = Math.sin(ang) * ringR;
        const x2 = Math.cos(ang) * (ringR + (i % 3 === 0 ? 12 : 6));
        const y2 = Math.sin(ang) * (ringR + (i % 3 === 0 ? 12 : 6));
        ctx.strokeStyle = c.primary;
        ctx.globalAlpha = 0.6;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      }
      ctx.restore();

      // === Waveform arc (solo speaking) ===
      if (an && s === "speaking") {
        const fd = new Uint8Array(an.frequencyBinCount);
        an.getByteFrequencyData(fd as any);
        const bars = 80;
        const baseR = S * 0.36;
        ctx.save();
        ctx.translate(cx, cy);
        for (let i = 0; i < bars; i++) {
          const ang = (i / bars) * Math.PI * 2 - Math.PI / 2;
          const idx = Math.floor((i / bars) * Math.min(fd.length * 0.65, fd.length));
          const v = fd[idx] / 255;
          const len = 4 + v * 32;
          ctx.strokeStyle = v > 0.6 ? "#ffffff" : c.primary;
          ctx.globalAlpha = 0.6 + v * 0.4;
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(Math.cos(ang) * baseR, Math.sin(ang) * baseR);
          ctx.lineTo(Math.cos(ang) * (baseR + len), Math.sin(ang) * (baseR + len));
          ctx.stroke();
        }
        ctx.restore();
      }

      // === Partículas ascendentes ===
      const particles = 30;
      for (let i = 0; i < particles; i++) {
        const seed = i * 137.5 + time * 60;
        const px = cx + Math.cos(seed * 0.01) * S * 0.35;
        const py = cy + S * 0.55 - ((seed * 0.6) % (S * 1.0));
        const alpha = (1 - ((seed * 0.6) % (S * 1.0)) / (S * 1.0)) * 0.5;
        ctx.fillStyle = c.primary;
        ctx.globalAlpha = alpha * 0.4;
        ctx.beginPath();
        ctx.arc(px, py, 1 + (i % 3) * 0.4, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      // === Scanlines horizontales sobre todo ===
      ctx.save();
      ctx.globalAlpha = 0.06;
      ctx.fillStyle = c.primary;
      const scanY = (time * 30) % 4;
      for (let y = -2 + scanY; y < H; y += 4) {
        ctx.fillRect(0, y, W, 1);
      }
      ctx.restore();
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const colors = COLORS[state];

  return (
    <div className={`jarvis-figure jarvis-${state}`}>
      <canvas ref={canvasRef} className="jarvis-canvas" />

      <svg
        viewBox="0 0 400 600"
        className="jarvis-svg"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          {/* Gradientes principales */}
          <linearGradient id="figure-grad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={colors.primary} stopOpacity="0.95" />
            <stop offset="60%" stopColor={colors.secondary} stopOpacity="0.7" />
            <stop offset="92%" stopColor={colors.secondary} stopOpacity="0.15" />
            <stop offset="100%" stopColor={colors.secondary} stopOpacity="0" />
          </linearGradient>
          <linearGradient id="body-fill" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={colors.primary} stopOpacity="0.18" />
            <stop offset="60%" stopColor={colors.secondary} stopOpacity="0.1" />
            <stop offset="100%" stopColor={colors.secondary} stopOpacity="0" />
          </linearGradient>
          <radialGradient id="cone-grad" cx="50%" cy="100%" r="80%">
            <stop offset="0%" stopColor={colors.primary} stopOpacity="0.55" />
            <stop offset="60%" stopColor={colors.secondary} stopOpacity="0.15" />
            <stop offset="100%" stopColor={colors.secondary} stopOpacity="0" />
          </radialGradient>
          <radialGradient id="core-grad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="40%" stopColor={colors.primary} />
            <stop offset="100%" stopColor={colors.secondary} stopOpacity="0" />
          </radialGradient>

          {/* Filtros de glow stack */}
          <filter id="strong-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="blur1" />
            <feGaussianBlur stdDeviation="8" in="SourceGraphic" result="blur2" />
            <feMerge>
              <feMergeNode in="blur2" />
              <feMergeNode in="blur1" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="soft-glow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="2.2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Pattern de scanlines holográficas para el cuerpo */}
          <pattern id="scan-h" x="0" y="0" width="6" height="3" patternUnits="userSpaceOnUse">
            <rect width="6" height="1" fill={colors.primary} opacity="0.16" />
          </pattern>
        </defs>

        {/* === Cono de proyección holográfica desde el pedestal === */}
        <ellipse cx="200" cy="558" rx="140" ry="14" fill={colors.primary} opacity="0.4">
          <animate attributeName="opacity" values="0.4;0.7;0.4" dur="2.4s" repeatCount="indefinite" />
        </ellipse>
        <ellipse cx="200" cy="558" rx="100" ry="9" fill="none" stroke={colors.primary} strokeWidth="1" opacity="0.7" />

        {/* Cono de luz que sube (background) */}
        <path
          d="M 130,560 L 270,560 L 240,180 L 160,180 Z"
          fill="url(#cone-grad)"
          opacity="0.6"
        />

        {/* === HUD: marcadores corner-style alrededor === */}
        <g opacity="0.6">
          {/* Top-left */}
          <path d="M 20,80 L 20,60 L 40,60" fill="none" stroke={colors.primary} strokeWidth="1.5" />
          <path d="M 380,80 L 380,60 L 360,60" fill="none" stroke={colors.primary} strokeWidth="1.5" />
          <path d="M 20,540 L 20,560 L 40,560" fill="none" stroke={colors.primary} strokeWidth="1.5" />
          <path d="M 380,540 L 380,560 L 360,560" fill="none" stroke={colors.primary} strokeWidth="1.5" />
          {/* Tick marks vertical */}
          {[100, 200, 300, 400, 500].map((y) => (
            <g key={y}>
              <line x1="14" y1={y} x2="22" y2={y} stroke={colors.primary} strokeWidth="0.8" opacity="0.55" />
              <line x1="378" y1={y} x2="386" y2={y} stroke={colors.primary} strokeWidth="0.8" opacity="0.55" />
            </g>
          ))}
        </g>

        {/* === FIGURA HUMANOIDE === */}
        <g ref={figureRef} filter="url(#strong-glow)">
          {/* Halo detrás de la cabeza */}
          <circle cx="200" cy="105" r="58" fill={colors.glow} opacity="0.5" />

          {/* Hombros y torso (line-art con relleno tenue) */}
          <path
            d="M 145,200 L 145,170 Q 170,150 200,148 Q 230,150 255,170 L 255,200 L 255,290 Q 250,310 240,340 L 250,440 Q 250,450 240,452 L 220,452 L 215,420 L 200,420 L 185,420 L 180,452 L 160,452 Q 150,450 150,440 L 160,340 Q 150,310 145,290 Z"
            fill="url(#body-fill)"
            stroke="url(#figure-grad)"
            strokeWidth="1.8"
          />
          {/* Líneas tech del torso */}
          <line x1="200" y1="170" x2="200" y2="300" stroke={colors.primary} strokeWidth="0.8" opacity="0.5" />
          <line x1="170" y1="220" x2="230" y2="220" stroke={colors.primary} strokeWidth="0.6" opacity="0.4" />
          <line x1="165" y1="260" x2="235" y2="260" stroke={colors.primary} strokeWidth="0.6" opacity="0.4" />
          <line x1="170" y1="300" x2="230" y2="300" stroke={colors.primary} strokeWidth="0.6" opacity="0.4" />

          {/* Núcleo arc-reactor del pecho */}
          <circle cx="200" cy="240" r="20" fill="none" stroke={colors.primary} strokeWidth="1.5" opacity="0.7" />
          <circle cx="200" cy="240" r="14" fill="none" stroke={colors.primary} strokeWidth="1" opacity="0.5" />
          <circle ref={chestCoreRef} cx="200" cy="240" r="6" fill="url(#core-grad)" opacity="0.85" />

          {/* Brazo izquierdo */}
          <g ref={leftArmRef} style={{ transformOrigin: "145px 200px" }}>
            <path
              d="M 145,180 Q 130,220 122,290 Q 118,330 124,360 L 138,365 Q 138,330 142,295 Q 148,225 158,200 Z"
              fill="url(#body-fill)"
              stroke="url(#figure-grad)"
              strokeWidth="1.5"
            />
            {/* Mano */}
            <ellipse cx="128" cy="370" rx="9" ry="11" fill="url(#body-fill)" stroke={colors.primary} strokeWidth="1.3" opacity="0.85" />
            <line x1="124" y1="370" x2="120" y2="385" stroke={colors.primary} strokeWidth="1" opacity="0.6" />
            <line x1="128" y1="372" x2="125" y2="388" stroke={colors.primary} strokeWidth="1" opacity="0.6" />
            <line x1="132" y1="372" x2="131" y2="388" stroke={colors.primary} strokeWidth="1" opacity="0.6" />
          </g>

          {/* Brazo derecho */}
          <g ref={rightArmRef} style={{ transformOrigin: "255px 200px" }}>
            <path
              d="M 255,180 Q 270,220 278,290 Q 282,330 276,360 L 262,365 Q 262,330 258,295 Q 252,225 242,200 Z"
              fill="url(#body-fill)"
              stroke="url(#figure-grad)"
              strokeWidth="1.5"
            />
            <ellipse cx="272" cy="370" rx="9" ry="11" fill="url(#body-fill)" stroke={colors.primary} strokeWidth="1.3" opacity="0.85" />
            <line x1="268" y1="370" x2="264" y2="385" stroke={colors.primary} strokeWidth="1" opacity="0.6" />
            <line x1="272" y1="372" x2="269" y2="388" stroke={colors.primary} strokeWidth="1" opacity="0.6" />
            <line x1="276" y1="372" x2="275" y2="388" stroke={colors.primary} strokeWidth="1" opacity="0.6" />
          </g>

          {/* Piernas (con corte holográfico inferior) */}
          <path
            d="M 175,452 L 175,540 Q 175,548 168,548 L 162,548 L 165,452 Z M 225,452 L 225,540 Q 225,548 232,548 L 238,548 L 235,452 Z"
            fill="url(#body-fill)"
            stroke="url(#figure-grad)"
            strokeWidth="1.5"
          />
          {/* Líneas de corte holográfico (las piernas se desvanecen en el fondo) */}
          {[490, 510, 530, 545].map((y, i) => (
            <line key={y} x1="158" y1={y} x2="245" y2={y} stroke={colors.primary} strokeWidth="0.8" opacity={0.7 - i * 0.18} />
          ))}

          {/* === CABEZA === */}
          <g ref={headRef} style={{ transformOrigin: "200px 110px" }}>
            {/* Helmet/face shape */}
            <path
              d="M 165,75 Q 165,40 200,38 Q 235,40 235,75 L 235,118 Q 235,148 200,153 Q 165,148 165,118 Z"
              fill="url(#body-fill)"
              stroke="url(#figure-grad)"
              strokeWidth="1.8"
            />
            {/* Visor / banda diagonal */}
            <path
              d="M 168,90 L 232,90"
              stroke={colors.primary}
              strokeWidth="0.8"
              opacity="0.5"
            />
            {/* Ojos */}
            <g ref={eyesRef} style={{ transformOrigin: "200px 95px" }}>
              <ellipse cx="184" cy="95" rx="6" ry="4" fill={colors.primary} opacity="0.95" />
              <ellipse cx="184" cy="95" rx="3" ry="2" fill="#ffffff" opacity="1" />
              <ellipse cx="216" cy="95" rx="6" ry="4" fill={colors.primary} opacity="0.95" />
              <ellipse cx="216" cy="95" rx="3" ry="2" fill="#ffffff" opacity="1" />
            </g>
            {/* Boca */}
            <path
              ref={mouthRef}
              d="M 190,107 Q 200,112 210,107"
              fill="none"
              stroke={colors.primary}
              strokeWidth="1.6"
              strokeLinecap="round"
            />
            {/* Detalle helmet superior */}
            <path
              d="M 178,55 L 178,72 M 222,55 L 222,72"
              stroke={colors.primary}
              strokeWidth="1"
              opacity="0.5"
            />
            <line x1="200" y1="38" x2="200" y2="48" stroke={colors.primary} strokeWidth="1" opacity="0.6" />
            {/* Mejillas tech */}
            <line x1="170" y1="120" x2="178" y2="125" stroke={colors.primary} strokeWidth="0.8" opacity="0.5" />
            <line x1="230" y1="120" x2="222" y2="125" stroke={colors.primary} strokeWidth="0.8" opacity="0.5" />
            {/* Cuello */}
            <path
              d="M 188,153 L 188,168 L 212,168 L 212,153"
              fill="url(#body-fill)"
              stroke="url(#figure-grad)"
              strokeWidth="1.3"
            />
          </g>

          {/* Scanlines sobre el cuerpo (overlay) */}
          <rect x="0" y="0" width="400" height="600" fill="url(#scan-h)" opacity="0.7" />
        </g>

        {/* === Base/pedestal HUD === */}
        <ellipse cx="200" cy="568" rx="105" ry="10" fill="none" stroke={colors.primary} strokeWidth="1.4" opacity="0.85" filter="url(#soft-glow)" />
        <ellipse cx="200" cy="572" rx="80" ry="6" fill="none" stroke={colors.primary} strokeWidth="0.8" opacity="0.55" />
        <ellipse cx="200" cy="576" rx="55" ry="3" fill="none" stroke={colors.primary} strokeWidth="0.6" opacity="0.4" />
      </svg>
    </div>
  );
}
