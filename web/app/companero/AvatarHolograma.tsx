/**
 * Avatar PACAME — personaje holográfico expresivo (estilo Pou + humanoide).
 *
 * SVG con cara animada (ojos, párpados, pupilas, cejas, boca con visemas, mejillas)
 * + halo/aura procedural en Canvas detrás, reactivo al audio real.
 *
 * Emociones por estado:
 *   idle      → respira, parpadea, mira alrededor, sonríe leve
 *   listening → ojos grandes, pupila dilatada, mira al usuario, ladea cabeza
 *   thinking  → ojos miran arriba-derecha, ceja inquieta, boca pequeña
 *   speaking  → boca abre/cierra con FFT real, ojos enfocados, ligeros nods
 */
"use client";

import { useEffect, useRef } from "react";

type AvatarState = "idle" | "listening" | "thinking" | "speaking";

interface Props {
  state: AvatarState;
  analyser?: AnalyserNode | null;
}

export default function AvatarHolograma({ state, analyser }: Props) {
  // Canvas detrás para el aura/partículas
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // Refs SVG para animar manualmente cada feature
  const headRef = useRef<SVGGElement>(null);
  const leftEyelidRef = useRef<SVGEllipseElement>(null);
  const rightEyelidRef = useRef<SVGEllipseElement>(null);
  const leftPupilRef = useRef<SVGCircleElement>(null);
  const rightPupilRef = useRef<SVGCircleElement>(null);
  const leftIrisRef = useRef<SVGCircleElement>(null);
  const rightIrisRef = useRef<SVGCircleElement>(null);
  const mouthRef = useRef<SVGPathElement>(null);
  const teethRef = useRef<SVGPathElement>(null);
  const tongueRef = useRef<SVGPathElement>(null);
  const browLRef = useRef<SVGPathElement>(null);
  const browRRef = useRef<SVGPathElement>(null);
  const cheekLRef = useRef<SVGEllipseElement>(null);
  const cheekRRef = useRef<SVGEllipseElement>(null);

  const stateRef = useRef(state);
  const analyserRef = useRef(analyser);
  useEffect(() => { stateRef.current = state; }, [state]);
  useEffect(() => { analyserRef.current = analyser; }, [analyser]);

  // Animación principal
  useEffect(() => {
    let raf = 0;
    let t = 0;
    let blinkTimer = 0;
    let blinking = 0; // 0..1
    let nextBlink = 2 + Math.random() * 3;
    let lookX = 0; let lookY = 0;
    let lookTargetX = 0; let lookTargetY = 0;
    let nextLook = 0;
    let amp = 0; let amp2 = 0; // suavizados distintos
    let headTilt = 0; // -1..1
    let nodPhase = 0;
    let openness = 0; // boca 0..1

    const td = new Uint8Array(256);
    const fd = new Uint8Array(128);

    const tick = () => {
      const dt = 1 / 60;
      t += dt;
      blinkTimer += dt;

      const s = stateRef.current;
      const an = analyserRef.current;

      // --- Audio amplitude real ---
      let target = 0;
      if (an && s === "speaking") {
        if (td.length !== an.fftSize) {
          // Allocate matching arrays if fftSize changed
        }
        const buf = new Uint8Array(an.fftSize);
        an.getByteTimeDomainData(buf as any);
        let sum = 0;
        for (let i = 0; i < buf.length; i++) {
          const v = (buf[i] - 128) / 128;
          sum += v * v;
        }
        target = Math.min(1, Math.sqrt(sum / buf.length) * 4.5);
      } else if (s === "listening") {
        target = 0.05 + Math.abs(Math.sin(t * 1.3)) * 0.15;
      } else if (s === "thinking") {
        target = 0.05 + Math.abs(Math.sin(t * 4)) * 0.08;
      } else {
        target = 0.04 + Math.abs(Math.sin(t * 0.7)) * 0.04;
      }
      amp += (target - amp) * 0.35;
      amp2 += (target - amp2) * 0.12;

      // --- Parpadeo natural ---
      if (blinkTimer > nextBlink && blinking === 0) {
        blinking = 0.001; // arranca
      }
      if (blinking > 0) {
        blinking += dt * 11;
        if (blinking >= 2) {
          blinking = 0;
          blinkTimer = 0;
          nextBlink = 2.5 + Math.random() * 3.5;
        }
      }
      const eyelidClose = blinking > 1 ? 2 - blinking : blinking; // 0..1..0

      // --- Mirada (lookAt natural) ---
      if (t > nextLook) {
        if (s === "thinking") {
          lookTargetX = 0.6; lookTargetY = -0.7;
        } else if (s === "listening" || s === "speaking") {
          lookTargetX = (Math.random() - 0.5) * 0.4;
          lookTargetY = (Math.random() - 0.5) * 0.3 - 0.05;
        } else {
          lookTargetX = (Math.random() - 0.5) * 1.4;
          lookTargetY = (Math.random() - 0.5) * 0.8;
        }
        nextLook = t + 1 + Math.random() * 2;
      }
      lookX += (lookTargetX - lookX) * 0.06;
      lookY += (lookTargetY - lookY) * 0.06;

      // --- Head tilt + nod ---
      let tiltTarget = 0;
      if (s === "listening") tiltTarget = 0.15 + Math.sin(t * 0.6) * 0.05;
      else if (s === "thinking") tiltTarget = -0.1;
      else if (s === "idle") tiltTarget = Math.sin(t * 0.4) * 0.04;
      headTilt += (tiltTarget - headTilt) * 0.05;

      if (s === "speaking") nodPhase += dt * 4 * (0.4 + amp);
      const nodY = s === "speaking" ? Math.sin(nodPhase) * amp * 6 : Math.sin(t * 0.9) * 1.2;

      // --- Aplicar a la cabeza ---
      if (headRef.current) {
        const breathe = 1 + Math.sin(t * 1.4) * 0.012;
        headRef.current.setAttribute(
          "transform",
          `translate(0 ${nodY}) rotate(${headTilt * 8} 200 200) scale(${breathe})`
        );
        headRef.current.style.transformOrigin = "200px 220px";
      }

      // --- Párpados ---
      const lidScale = 1 - eyelidClose;
      [leftEyelidRef.current, rightEyelidRef.current].forEach((el) => {
        if (!el) return;
        // El "ojo abierto" se simula reduciendo la altura del párpado superior negro
        el.setAttribute("ry", String(8 + (1 - lidScale) * 26));
      });

      // --- Pupilas + iris ---
      const pupilDilate =
        s === "listening" ? 1.2 :
        s === "thinking" ? 0.85 :
        s === "speaking" ? 1.0 :
        0.95 + Math.sin(t * 1.1) * 0.05;

      [
        { iris: leftIrisRef.current, pupil: leftPupilRef.current, cx: 158, cy: 175 },
        { iris: rightIrisRef.current, pupil: rightPupilRef.current, cx: 242, cy: 175 },
      ].forEach(({ iris, pupil, cx, cy }) => {
        if (!iris || !pupil) return;
        const dx = lookX * 6;
        const dy = lookY * 4;
        iris.setAttribute("cx", String(cx + dx));
        iris.setAttribute("cy", String(cy + dy));
        pupil.setAttribute("cx", String(cx + dx * 1.3));
        pupil.setAttribute("cy", String(cy + dy * 1.3));
        pupil.setAttribute("r", String(4.2 * pupilDilate));
      });

      // --- Cejas (emoción) ---
      // Rest: ligera curva. Listening: levantadas. Thinking: curvadas hacia dentro. Speaking: mueven con amp.
      let browYL = 0, browYR = 0, browAngL = 0, browAngR = 0;
      if (s === "listening") { browYL = -4; browYR = -4; }
      else if (s === "thinking") { browYL = 1; browYR = 1; browAngL = 4; browAngR = -4; }
      else if (s === "speaking") {
        browYL = -1.5 - amp * 3; browYR = -1.5 - amp * 3;
      }
      if (browLRef.current) {
        browLRef.current.setAttribute(
          "transform",
          `translate(0 ${browYL}) rotate(${browAngL} 158 145)`
        );
      }
      if (browRRef.current) {
        browRRef.current.setAttribute(
          "transform",
          `translate(0 ${browYR}) rotate(${browAngR} 242 145)`
        );
      }

      // --- Boca (lipsync con visemas + sonrisa idle) ---
      // openness: 0..1 desde amp. Pero solo cuando habla, sino sonrisa.
      const targetOpen = s === "speaking" ? Math.min(1, amp * 1.6) : 0;
      openness += (targetOpen - openness) * 0.4;

      // Tipo de viseme: usar amp2 (más lento) para alternar entre "abierta redonda" y "ancha estrecha"
      const visemeWide = (Math.sin(t * 8.5) * 0.5 + 0.5) * (s === "speaking" ? 1 : 0); // 0..1 oscilante rápido

      const mouthCx = 200;
      const mouthCy = 245;
      const baseW = 36;
      const baseH = 6;

      let mouthPath = "";
      if (s === "idle" || (s === "speaking" && openness < 0.05)) {
        // Sonrisa
        const smileLift = s === "idle" ? 4 : 1;
        mouthPath = `M ${mouthCx - baseW / 2} ${mouthCy} Q ${mouthCx} ${mouthCy + smileLift + 4} ${mouthCx + baseW / 2} ${mouthCy}`;
      } else if (s === "listening") {
        // Boca pequeña redondeada (atento, "oh")
        const r = 4 + Math.sin(t * 2) * 1;
        mouthPath = `M ${mouthCx - r} ${mouthCy} Q ${mouthCx} ${mouthCy + r * 1.3} ${mouthCx + r} ${mouthCy} Q ${mouthCx} ${mouthCy - r * 0.6} ${mouthCx - r} ${mouthCy} Z`;
      } else if (s === "thinking") {
        // Línea pequeña torcida
        mouthPath = `M ${mouthCx - 8} ${mouthCy + 1} Q ${mouthCx + 4} ${mouthCy - 2} ${mouthCx + 12} ${mouthCy + 2}`;
      } else {
        // Speaking: viseme. Mezcla forma redonda (open) con forma ancha (wide)
        const open = openness;
        const w = baseW * (1 - visemeWide * 0.3);
        const h = baseH + open * 22;
        // Viseme redondo (a/o) cuando wide=0; viseme ancho (e/i) cuando wide=1 con menos altura
        const finalH = h * (1 - visemeWide * 0.4);
        const finalW = w * (0.85 + visemeWide * 0.2);
        // Path elíptico
        mouthPath =
          `M ${mouthCx - finalW / 2} ${mouthCy} ` +
          `Q ${mouthCx} ${mouthCy + finalH} ${mouthCx + finalW / 2} ${mouthCy} ` +
          `Q ${mouthCx} ${mouthCy - finalH * 0.45} ${mouthCx - finalW / 2} ${mouthCy} Z`;
      }
      if (mouthRef.current) mouthRef.current.setAttribute("d", mouthPath);

      // Dientes superiores (visibles cuando openness > 0.2)
      if (teethRef.current) {
        const tShow = Math.max(0, openness - 0.2);
        teethRef.current.setAttribute("opacity", String(tShow));
        const tw = baseW * (1 - visemeWide * 0.25) * 0.7;
        teethRef.current.setAttribute(
          "d",
          `M ${mouthCx - tw / 2} ${mouthCy - 1} L ${mouthCx + tw / 2} ${mouthCy - 1} L ${mouthCx + tw / 2} ${mouthCy + 1.5} L ${mouthCx - tw / 2} ${mouthCy + 1.5} Z`
        );
      }
      // Lengua (visible interior cuando muy abierta)
      if (tongueRef.current) {
        const show = Math.max(0, openness - 0.35);
        tongueRef.current.setAttribute("opacity", String(show * 0.9));
        const tw = baseW * 0.55;
        const th = openness * 14;
        tongueRef.current.setAttribute(
          "d",
          `M ${mouthCx - tw / 2} ${mouthCy + 4} Q ${mouthCx} ${mouthCy + 4 + th} ${mouthCx + tw / 2} ${mouthCy + 4} Q ${mouthCx} ${mouthCy + 4 + th * 0.4} ${mouthCx - tw / 2} ${mouthCy + 4} Z`
        );
      }

      // --- Mejillas glow (felicidad) ---
      const cheekIntensity =
        s === "speaking" ? 0.55 + amp * 0.4 :
        s === "listening" ? 0.5 :
        s === "idle" ? 0.4 + Math.sin(t * 1.2) * 0.1 :
        0.25;
      [cheekLRef.current, cheekRRef.current].forEach((c) => {
        if (c) c.setAttribute("opacity", String(cheekIntensity));
      });

      // --- Canvas aura ---
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
      const cx = W / 2; const cy = H / 2; const S = Math.min(W, H);

      const colorMap: Record<AvatarState, [string, string]> = {
        idle:      ["rgba(125, 211, 252, 0.45)", "rgba(56, 189, 248, 0.0)"],
        listening: ["rgba(56, 189, 248, 0.65)", "rgba(14, 165, 233, 0.0)"],
        thinking:  ["rgba(250, 204, 21, 0.55)", "rgba(234, 179, 8, 0.0)"],
        speaking:  ["rgba(244, 114, 182, 0.6)", "rgba(217, 70, 239, 0.0)"],
      };
      const [c1, c2] = colorMap[s];
      const auraR = S * 0.4 * (1 + a2 * 0.18 + a * 0.1);
      const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, auraR);
      grad.addColorStop(0, c1);
      grad.addColorStop(1, c2);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);

      // Anillo waveform real (solo speaking)
      const an = analyserRef.current;
      if (s === "speaking" && an) {
        an.getByteFrequencyData(fd as any);
        const bars = 64;
        const baseR = S * 0.35;
        ctx.save();
        ctx.translate(cx, cy);
        for (let i = 0; i < bars; i++) {
          const ang = (i / bars) * Math.PI * 2 - Math.PI / 2;
          const idx = Math.floor((i / bars) * Math.min(fd.length * 0.7, fd.length));
          const v = fd[idx] / 255;
          const len = 4 + v * 28;
          const x1 = Math.cos(ang) * baseR;
          const y1 = Math.sin(ang) * baseR;
          const x2 = Math.cos(ang) * (baseR + len);
          const y2 = Math.sin(ang) * (baseR + len);
          ctx.strokeStyle = v > 0.55 ? "rgba(255,255,255,0.85)" : "rgba(244,114,182,0.7)";
          ctx.lineWidth = 1.6;
          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.stroke();
        }
        ctx.restore();
      }

      // Burbujas suaves flotando (idle decoration)
      const bubbles = 12;
      for (let i = 0; i < bubbles; i++) {
        const phase = (time * 0.3 + i) % 6;
        const bx = cx + Math.cos(time * 0.4 + i * 1.7) * S * 0.36;
        const by = cy + Math.sin(time * 0.5 + i) * S * 0.32 - phase * 8;
        const br = 1 + (i % 3);
        ctx.fillStyle = `rgba(255,255,255,${0.04 + (i % 4) * 0.03})`;
        ctx.beginPath();
        ctx.arc(bx, by, br, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div className={`avatar-wrap avatar-${state}`}>
      <canvas ref={canvasRef} className="avatar-aura-canvas" />

      <svg
        viewBox="0 0 400 460"
        className="avatar-svg"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Gradiente cuerpo/cabeza */}
          <radialGradient id="head-grad" cx="35%" cy="30%" r="80%">
            <stop offset="0%" stopColor="#bae6fd" />
            <stop offset="40%" stopColor="#7dd3fc" />
            <stop offset="80%" stopColor="#38bdf8" />
            <stop offset="100%" stopColor="#0ea5e9" />
          </radialGradient>
          <radialGradient id="iris-grad" cx="30%" cy="30%" r="70%">
            <stop offset="0%" stopColor="#22d3ee" />
            <stop offset="60%" stopColor="#0e7490" />
            <stop offset="100%" stopColor="#083344" />
          </radialGradient>
          <radialGradient id="cheek-grad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#fb7185" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#fb7185" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="body-grad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#0ea5e9" />
            <stop offset="100%" stopColor="#0c4a6e" />
          </linearGradient>
          <radialGradient id="mouth-inner" cx="50%" cy="0%" r="100%">
            <stop offset="0%" stopColor="#7f1d1d" />
            <stop offset="100%" stopColor="#1e293b" />
          </radialGradient>
          <filter id="head-glow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="soft-shadow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="6" />
          </filter>
        </defs>

        {/* Sombra suave bajo personaje */}
        <ellipse cx="200" cy="430" rx="110" ry="14" fill="#000" opacity="0.35" filter="url(#soft-shadow)" />

        {/* Personaje principal */}
        <g ref={headRef} filter="url(#head-glow)">
          {/* Cuerpo / torso simplificado, como Pou */}
          <path
            d="M 120,310 Q 110,290 130,275 L 270,275 Q 290,290 280,310 L 290,400 Q 290,425 270,430 L 130,430 Q 110,425 110,400 Z"
            fill="url(#body-grad)"
            opacity="0.92"
          />
          {/* Brillo del cuerpo */}
          <ellipse cx="170" cy="320" rx="40" ry="60" fill="#bae6fd" opacity="0.18" />

          {/* Logo PACAME en pecho */}
          <text x="200" y="370" textAnchor="middle" fontSize="14" fontFamily="ui-monospace, monospace" fill="#bae6fd" opacity="0.7" letterSpacing="2">
            PACAME
          </text>

          {/* Cabeza grande redondeada (estilo Pou) */}
          <ellipse
            cx="200"
            cy="190"
            rx="120"
            ry="125"
            fill="url(#head-grad)"
          />
          {/* Brillo highlight superior izquierda */}
          <ellipse cx="155" cy="135" rx="40" ry="30" fill="#ffffff" opacity="0.35" />
          <ellipse cx="155" cy="135" rx="22" ry="14" fill="#ffffff" opacity="0.55" />

          {/* "Antena" tech holo */}
          <line x1="200" y1="65" x2="200" y2="85" stroke="#22d3ee" strokeWidth="2" opacity="0.7" />
          <circle cx="200" cy="62" r="4" fill="#67e8f9">
            <animate attributeName="opacity" values="1;0.4;1" dur="1.6s" repeatCount="indefinite" />
          </circle>

          {/* Cejas */}
          <path
            ref={browLRef}
            d="M 138,140 Q 158,132 178,140"
            fill="none"
            stroke="#0c4a6e"
            strokeWidth="4.5"
            strokeLinecap="round"
          />
          <path
            ref={browRRef}
            d="M 222,140 Q 242,132 262,140"
            fill="none"
            stroke="#0c4a6e"
            strokeWidth="4.5"
            strokeLinecap="round"
          />

          {/* Ojos: blanco + iris + pupila + brillo + párpado */}
          {/* Ojo izquierdo */}
          <ellipse cx="158" cy="175" rx="26" ry="30" fill="#ffffff" />
          <circle ref={leftIrisRef} cx="158" cy="175" r="14" fill="url(#iris-grad)" />
          <circle ref={leftPupilRef} cx="158" cy="175" r="6" fill="#020617" />
          {/* Brillo */}
          <circle cx="153" cy="170" r="3.5" fill="#ffffff" opacity="0.95" />
          <circle cx="162" cy="183" r="1.6" fill="#ffffff" opacity="0.7" />
          {/* Párpado superior (negro, controlable) */}
          <ellipse ref={leftEyelidRef} cx="158" cy="148" rx="28" ry="8" fill="#0c4a6e" />

          {/* Ojo derecho */}
          <ellipse cx="242" cy="175" rx="26" ry="30" fill="#ffffff" />
          <circle ref={rightIrisRef} cx="242" cy="175" r="14" fill="url(#iris-grad)" />
          <circle ref={rightPupilRef} cx="242" cy="175" r="6" fill="#020617" />
          <circle cx="237" cy="170" r="3.5" fill="#ffffff" opacity="0.95" />
          <circle cx="246" cy="183" r="1.6" fill="#ffffff" opacity="0.7" />
          <ellipse ref={rightEyelidRef} cx="242" cy="148" rx="28" ry="8" fill="#0c4a6e" />

          {/* Mejillas (rosadas, cute) */}
          <ellipse ref={cheekLRef} cx="135" cy="225" rx="20" ry="12" fill="url(#cheek-grad)" />
          <ellipse ref={cheekRRef} cx="265" cy="225" rx="20" ry="12" fill="url(#cheek-grad)" />

          {/* Nariz mini (puntito) */}
          <ellipse cx="200" cy="218" rx="3" ry="2" fill="#0c4a6e" opacity="0.4" />

          {/* Interior de boca (oscuro) — solo se ve cuando se abre */}
          <ellipse cx="200" cy="250" rx="22" ry="14" fill="url(#mouth-inner)" />

          {/* Lengua */}
          <path ref={tongueRef} d="" fill="#f87171" opacity="0" />
          {/* Dientes superiores */}
          <path ref={teethRef} d="" fill="#ffffff" opacity="0" />

          {/* Boca (línea/curva animada) — encima del interior */}
          <path
            ref={mouthRef}
            d="M 182,245 Q 200,253 218,245"
            fill="none"
            stroke="#0c4a6e"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
      </svg>

      {/* Pedestal holográfico sutil */}
      <div className="avatar-pedestal" aria-hidden>
        <div className="pedestal-disc" />
      </div>
    </div>
  );
}
