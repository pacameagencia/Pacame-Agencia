"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";

interface Star {
  x: number;
  y: number;
  radius: number;
  opacity: number;
  twinkleSpeed: number;
  twinklePhase: number;
}

interface ConstellationBackgroundProps {
  density?: number;
  interactive?: boolean;
  className?: string;
}

export default function ConstellationBackground({
  density = 60,
  interactive = true,
  className = "",
}: ConstellationBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const starsRef = useRef<Star[]>([]);
  const mouseRef = useRef({ x: 0, y: 0 });
  const animationRef = useRef<number>(0);
  const isVisibleRef = useRef(true);
  const reducedMotion = useReducedMotion();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const initStars = useCallback(
    (width: number, height: number) => {
      const stars: Star[] = [];
      const count = Math.floor((width * height) / (1920 * 1080 / density));
      for (let i = 0; i < count; i++) {
        stars.push({
          x: Math.random() * width,
          y: Math.random() * height,
          radius: Math.random() * 1.5 + 0.5,
          opacity: Math.random() * 0.5 + 0.1,
          twinkleSpeed: Math.random() * 0.02 + 0.005,
          twinklePhase: Math.random() * Math.PI * 2,
        });
      }
      starsRef.current = stars;
    },
    [density]
  );

  useEffect(() => {
    if (!isClient) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        isVisibleRef.current = entry.isIntersecting;
      },
      { threshold: 0 }
    );
    observer.observe(canvas);

    const resize = () => {
      const rect = canvas.parentElement?.getBoundingClientRect();
      if (!rect) return;
      canvas.width = rect.width;
      canvas.height = rect.height;
      initStars(canvas.width, canvas.height);
    };

    resize();
    window.addEventListener("resize", resize);

    if (interactive) {
      const handleMouse = (e: MouseEvent) => {
        const rect = canvas.getBoundingClientRect();
        mouseRef.current = {
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
        };
      };
      window.addEventListener("mousemove", handleMouse);
    }

    let time = 0;
    const connectionDistance = 120;

    const draw = () => {
      if (!isVisibleRef.current) {
        animationRef.current = requestAnimationFrame(draw);
        return;
      }

      time += 1;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const stars = starsRef.current;
      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;

      // Draw connection lines
      if (!reducedMotion) {
        ctx.strokeStyle = "rgba(192, 199, 212, 0.04)";
        ctx.lineWidth = 0.5;
        for (let i = 0; i < stars.length; i++) {
          for (let j = i + 1; j < stars.length; j++) {
            const dx = stars[i].x - stars[j].x;
            const dy = stars[i].y - stars[j].y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < connectionDistance) {
              const alpha = (1 - dist / connectionDistance) * 0.06;
              ctx.strokeStyle = `rgba(192, 199, 212, ${alpha})`;
              ctx.beginPath();
              ctx.moveTo(stars[i].x, stars[i].y);
              ctx.lineTo(stars[j].x, stars[j].y);
              ctx.stroke();
            }
          }
        }
      }

      // Draw stars
      for (const star of stars) {
        let offsetX = 0;
        let offsetY = 0;

        if (interactive && !reducedMotion) {
          const dx = mx - star.x;
          const dy = my - star.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 300) {
            const force = (1 - dist / 300) * 3;
            offsetX = (dx / dist) * force;
            offsetY = (dy / dist) * force;
          }
        }

        const twinkle = reducedMotion
          ? star.opacity
          : star.opacity +
            Math.sin(time * star.twinkleSpeed + star.twinklePhase) *
              star.opacity *
              0.6;

        ctx.beginPath();
        ctx.arc(
          star.x + offsetX,
          star.y + offsetY,
          star.radius,
          0,
          Math.PI * 2
        );
        ctx.fillStyle = `rgba(192, 199, 212, ${Math.max(0, twinkle)})`;
        ctx.fill();
      }

      animationRef.current = requestAnimationFrame(draw);
    };

    if (reducedMotion) {
      // Draw once
      draw();
      cancelAnimationFrame(animationRef.current);
    } else {
      animationRef.current = requestAnimationFrame(draw);
    }

    return () => {
      cancelAnimationFrame(animationRef.current);
      window.removeEventListener("resize", resize);
      observer.disconnect();
    };
  }, [isClient, density, interactive, reducedMotion, initStars]);

  if (!isClient) return null;

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 w-full h-full pointer-events-none ${className}`}
      style={{ contain: "layout style paint" }}
    />
  );
}
