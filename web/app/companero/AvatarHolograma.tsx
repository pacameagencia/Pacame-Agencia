/**
 * Avatar holográfico PACAME — entidad IA reactiva a audio.
 *
 * Render Canvas 2D con pseudo-3D por órbitas polares.
 * Reacciona en tiempo real a la amplitud del audio (AnalyserNode).
 * Estados: idle / listening / thinking / speaking — cada uno con paleta + comportamiento.
 *
 * Stack: Canvas 2D + simplex-noise. Zero dependencias nuevas.
 */
"use client";

import { useEffect, useRef } from "react";
import { createNoise3D } from "simplex-noise";

type AvatarState = "idle" | "listening" | "thinking" | "speaking";

interface Props {
  state: AvatarState;
  analyser?: AnalyserNode | null;
}

// Paleta por estado: [core, mid, edge, particle, glow]
const PALETTES: Record<AvatarState, [string, string, string, string, string]> = {
  idle:      ["#67e8f9", "#22d3ee", "#0891b2", "#a5f3fc", "rgba(34,211,238,0.35)"],
  listening: ["#7dd3fc", "#38bdf8", "#0284c7", "#e0f2fe", "rgba(56,189,248,0.55)"],
  thinking:  ["#facc15", "#eab308", "#a16207", "#fef08a", "rgba(250,204,21,0.5)"],
  speaking:  ["#f0abfc", "#d946ef", "#a21caf", "#f5d0fe", "rgba(217,70,239,0.65)"],
};

export default function AvatarHolograma({ state, analyser }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const stateRef = useRef(state);
  const analyserRef = useRef(analyser);
  const freqDataRef = useRef<Uint8Array | null>(null);
  const timeDataRef = useRef<Uint8Array | null>(null);

  useEffect(() => { stateRef.current = state; }, [state]);
  useEffect(() => { analyserRef.current = analyser; }, [analyser]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    const noise3D = createNoise3D();

    // Responsive sizing con DPR
    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    // Partículas orbitales (nube de polvo IA)
    const PARTICLES = 80;
    const particles = Array.from({ length: PARTICLES }, () => ({
      angle: Math.random() * Math.PI * 2,
      radius: 100 + Math.random() * 140,
      speed: 0.001 + Math.random() * 0.004,
      size: 0.6 + Math.random() * 1.8,
      tilt: Math.random() * Math.PI,
      depth: Math.random(),
      phase: Math.random() * Math.PI * 2,
    }));

    // Rayos / chispas ocasionales
    let sparks: { x: number; y: number; vx: number; vy: number; life: number }[] = [];

    let t = 0;
    let amplitude = 0; // 0..1 suavizado
    let lastBeat = 0;

    const render = () => {
      t += 0.016;
      const W = canvas.clientWidth;
      const H = canvas.clientHeight;
      const cx = W / 2;
      const cy = H / 2;
      const S = Math.min(W, H);

      // Amplitud real desde AnalyserNode (si existe y está activo)
      let targetAmp = 0;
      const an = analyserRef.current;
      if (an && stateRef.current === "speaking") {
        if (!timeDataRef.current || timeDataRef.current.length !== an.fftSize) {
          timeDataRef.current = new Uint8Array(an.fftSize);
        }
        an.getByteTimeDomainData(timeDataRef.current as any);
        let sum = 0;
        const td = timeDataRef.current;
        for (let i = 0; i < td.length; i++) {
          const v = (td[i] - 128) / 128;
          sum += v * v;
        }
        targetAmp = Math.min(1, Math.sqrt(sum / td.length) * 3.5);
      } else if (stateRef.current === "listening") {
        // Pulso respiración
        targetAmp = 0.25 + Math.sin(t * 2.2) * 0.15;
      } else if (stateRef.current === "thinking") {
        targetAmp = 0.3 + Math.sin(t * 5) * 0.2;
      } else {
        targetAmp = 0.18 + Math.sin(t * 0.9) * 0.08;
      }
      amplitude += (targetAmp - amplitude) * 0.22;

      const [coreColor, midColor, edgeColor, particleColor, glowColor] =
        PALETTES[stateRef.current];

      // Fondo suave degradado radial (aumenta con amplitud)
      ctx.clearRect(0, 0, W, H);
      const bgGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, S * 0.7);
      bgGrad.addColorStop(0, glowColor);
      bgGrad.addColorStop(0.4, "rgba(8, 15, 30, 0.15)");
      bgGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, W, H);

      // --- Anillo base (pedestal holográfico en perspectiva) ---
      ctx.save();
      ctx.translate(cx, cy + S * 0.32);
      ctx.scale(1, 0.28);
      ctx.beginPath();
      ctx.arc(0, 0, S * 0.28, 0, Math.PI * 2);
      ctx.strokeStyle = glowColor;
      ctx.lineWidth = 2.5;
      ctx.shadowBlur = 20;
      ctx.shadowColor = coreColor;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(0, 0, S * 0.22, 0, Math.PI * 2);
      ctx.strokeStyle = edgeColor;
      ctx.globalAlpha = 0.5;
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.restore();

      // Haz de luz vertical (cono)
      ctx.save();
      const beamGrad = ctx.createLinearGradient(cx, cy + S * 0.3, cx, cy - S * 0.2);
      beamGrad.addColorStop(0, glowColor);
      beamGrad.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = beamGrad;
      ctx.globalAlpha = 0.35 + amplitude * 0.3;
      ctx.beginPath();
      ctx.moveTo(cx - S * 0.08, cy + S * 0.32);
      ctx.lineTo(cx + S * 0.08, cy + S * 0.32);
      ctx.lineTo(cx + S * 0.22, cy - S * 0.2);
      ctx.lineTo(cx - S * 0.22, cy - S * 0.2);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      // --- Partículas orbitales (3 planos) ---
      for (const p of particles) {
        p.angle += p.speed * (1 + amplitude * 2);
        const r = p.radius * (S / 500);
        // pseudo-3D: plano inclinado por p.tilt
        const x = Math.cos(p.angle) * r;
        const ySpin = Math.sin(p.angle) * r;
        const y = ySpin * Math.cos(p.tilt);
        const z = ySpin * Math.sin(p.tilt); // -r..r, nos da depth
        const depthFactor = (z + r) / (2 * r); // 0..1, 1 = front
        const size = p.size * (0.5 + depthFactor) * (1 + amplitude * 0.8);
        const alpha = 0.25 + depthFactor * 0.75;

        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = particleColor;
        ctx.shadowBlur = 6 + depthFactor * 10;
        ctx.shadowColor = coreColor;
        ctx.beginPath();
        ctx.arc(cx + x, cy + y, size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // --- Anillos orbitales 3D (3 ejes distintos) ---
      const ringRadius = S * 0.22 * (1 + amplitude * 0.08);
      for (let i = 0; i < 3; i++) {
        const axisTilt = t * 0.3 + i * Math.PI / 3;
        const phase = t * (0.4 + i * 0.25);
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(axisTilt);
        ctx.scale(1, 0.35 + 0.3 * Math.sin(phase));
        ctx.beginPath();
        ctx.arc(0, 0, ringRadius + i * 8, 0, Math.PI * 2);
        ctx.strokeStyle = i === 0 ? coreColor : i === 1 ? midColor : edgeColor;
        ctx.globalAlpha = 0.45 - i * 0.1;
        ctx.lineWidth = 1.4;
        ctx.shadowBlur = 14;
        ctx.shadowColor = coreColor;
        ctx.stroke();
        ctx.restore();
      }

      // --- Núcleo — blob deformado por noise + amplitud (pseudo-entidad viva) ---
      const coreR = S * 0.13 * (1 + amplitude * 0.35);
      const blobPoints = 72;
      ctx.save();
      ctx.translate(cx, cy);

      // Glow exterior
      const glowGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, coreR * 2.6);
      glowGrad.addColorStop(0, coreColor);
      glowGrad.addColorStop(0.3, glowColor);
      glowGrad.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = glowGrad;
      ctx.globalAlpha = 0.55 + amplitude * 0.4;
      ctx.beginPath();
      ctx.arc(0, 0, coreR * 2.6, 0, Math.PI * 2);
      ctx.fill();

      // Blob principal
      ctx.globalAlpha = 1;
      ctx.beginPath();
      for (let i = 0; i <= blobPoints; i++) {
        const a = (i / blobPoints) * Math.PI * 2;
        const nx = Math.cos(a);
        const ny = Math.sin(a);
        const noiseVal = noise3D(nx * 1.5, ny * 1.5, t * 0.6);
        const deform = 1 + noiseVal * (0.18 + amplitude * 0.35);
        const r = coreR * deform;
        const x = nx * r;
        const y = ny * r;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();

      // Gradiente interior del núcleo
      const coreGrad = ctx.createRadialGradient(-coreR * 0.3, -coreR * 0.3, 0, 0, 0, coreR * 1.4);
      coreGrad.addColorStop(0, "#ffffff");
      coreGrad.addColorStop(0.2, coreColor);
      coreGrad.addColorStop(0.7, midColor);
      coreGrad.addColorStop(1, edgeColor);
      ctx.fillStyle = coreGrad;
      ctx.shadowBlur = 40;
      ctx.shadowColor = coreColor;
      ctx.fill();

      // Borde luminoso
      ctx.strokeStyle = "rgba(255,255,255,0.55)";
      ctx.lineWidth = 1.2;
      ctx.shadowBlur = 0;
      ctx.stroke();

      ctx.restore();

      // --- Waveform ring (lipsync visual real, rodea el núcleo) ---
      if (an && stateRef.current === "speaking") {
        if (!freqDataRef.current || freqDataRef.current.length !== an.frequencyBinCount) {
          freqDataRef.current = new Uint8Array(an.frequencyBinCount);
        }
        an.getByteFrequencyData(freqDataRef.current as any);
        const fd = freqDataRef.current;
        const bars = 96;
        const base = coreR * 1.9;
        ctx.save();
        ctx.translate(cx, cy);
        for (let i = 0; i < bars; i++) {
          const a = (i / bars) * Math.PI * 2 - Math.PI / 2;
          const sampleIdx = Math.floor((i / bars) * Math.min(fd.length * 0.6, fd.length));
          const v = fd[sampleIdx] / 255;
          const len = 4 + v * 34;
          const x1 = Math.cos(a) * base;
          const y1 = Math.sin(a) * base;
          const x2 = Math.cos(a) * (base + len);
          const y2 = Math.sin(a) * (base + len);
          ctx.strokeStyle = v > 0.6 ? "#ffffff" : coreColor;
          ctx.globalAlpha = 0.55 + v * 0.4;
          ctx.lineWidth = 1.6;
          ctx.shadowBlur = 8;
          ctx.shadowColor = coreColor;
          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.stroke();
        }
        ctx.restore();
      }

      // --- Chispas al "beat" (cuando hay pico de amplitud) ---
      if (amplitude > 0.55 && t - lastBeat > 0.25) {
        lastBeat = t;
        for (let i = 0; i < 6; i++) {
          const a = Math.random() * Math.PI * 2;
          const v = 1 + Math.random() * 2;
          sparks.push({
            x: cx + Math.cos(a) * coreR,
            y: cy + Math.sin(a) * coreR,
            vx: Math.cos(a) * v,
            vy: Math.sin(a) * v,
            life: 1,
          });
        }
      }
      sparks = sparks.filter((s) => s.life > 0);
      for (const s of sparks) {
        s.x += s.vx;
        s.y += s.vy;
        s.life -= 0.03;
        ctx.save();
        ctx.globalAlpha = Math.max(0, s.life);
        ctx.fillStyle = "#ffffff";
        ctx.shadowBlur = 10;
        ctx.shadowColor = coreColor;
        ctx.beginPath();
        ctx.arc(s.x, s.y, 1.6, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // --- Retícula HUD superior (data points) ---
      ctx.save();
      ctx.strokeStyle = coreColor;
      ctx.globalAlpha = 0.28;
      ctx.lineWidth = 0.6;
      ctx.setLineDash([2, 4]);
      ctx.beginPath();
      ctx.arc(cx, cy, S * 0.34, -Math.PI / 2 - 0.6, -Math.PI / 2 + 0.6);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(cx, cy, S * 0.34, Math.PI / 2 - 0.6, Math.PI / 2 + 0.6);
      ctx.stroke();
      ctx.setLineDash([]);
      // Dots cardinales
      for (const a of [-Math.PI / 2, 0, Math.PI / 2, Math.PI]) {
        ctx.globalAlpha = 0.7;
        ctx.fillStyle = coreColor;
        ctx.beginPath();
        ctx.arc(cx + Math.cos(a) * S * 0.34, cy + Math.sin(a) * S * 0.34, 2, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      rafRef.current = requestAnimationFrame(render);
    };

    rafRef.current = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(rafRef.current);
      ro.disconnect();
    };
  }, []);

  return (
    <div className={`avatar-canvas-wrap avatar-${state}`}>
      <canvas ref={canvasRef} className="avatar-canvas" />
      <div className="avatar-hud">
        <span className="hud-corner hud-tl" />
        <span className="hud-corner hud-tr" />
        <span className="hud-corner hud-bl" />
        <span className="hud-corner hud-br" />
        <div className="hud-label">PACAME·ENTITY-01</div>
      </div>
    </div>
  );
}
