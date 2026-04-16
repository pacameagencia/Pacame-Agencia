"use client";

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";
import { createNoise3D } from "simplex-noise";

interface GradientMeshCanvasProps {
  colors?: string[];
  speed?: number;
  intensity?: number;
  className?: string;
}

function hexToRgb(hex: string): [number, number, number] {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)]
    : [124, 58, 237];
}

export default function GradientMeshCanvas({
  colors = ["#7C3AED", "#4338CA", "#06B6D4", "#D4A853"],
  speed = 0.3,
  intensity = 0.12,
  className = "",
}: GradientMeshCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const isVisibleRef = useRef(true);
  const reducedMotion = useReducedMotion();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const noise3D = createNoise3D();
    const rgbColors = colors.map(hexToRgb);

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
      // Use lower resolution for performance
      canvas.width = Math.floor(rect.width / 4);
      canvas.height = Math.floor(rect.height / 4);
      canvas.style.width = rect.width + "px";
      canvas.style.height = rect.height + "px";
    };

    resize();
    window.addEventListener("resize", resize);

    let time = 0;

    const draw = () => {
      if (!isVisibleRef.current) {
        animationRef.current = requestAnimationFrame(draw);
        return;
      }

      time += 0.002 * speed;
      const { width, height } = canvas;

      const imageData = ctx.createImageData(width, height);
      const data = imageData.data;

      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const idx = (y * width + x) * 4;
          const nx = x / width;
          const ny = y / height;

          let r = 0, g = 0, b = 0, totalWeight = 0;

          for (let i = 0; i < rgbColors.length; i++) {
            const noiseVal = noise3D(
              nx * 2 + i * 1.7,
              ny * 2 + i * 1.3,
              time + i * 0.5
            );
            const weight = Math.max(0, (noiseVal + 1) / 2);
            r += rgbColors[i][0] * weight;
            g += rgbColors[i][1] * weight;
            b += rgbColors[i][2] * weight;
            totalWeight += weight;
          }

          if (totalWeight > 0) {
            r /= totalWeight;
            g /= totalWeight;
            b /= totalWeight;
          }

          data[idx] = r;
          data[idx + 1] = g;
          data[idx + 2] = b;
          data[idx + 3] = intensity * 255;
        }
      }

      ctx.putImageData(imageData, 0, 0);
      animationRef.current = requestAnimationFrame(draw);
    };

    if (reducedMotion) {
      time = 0;
      // Draw one frame
      const { width, height } = canvas;
      const imageData = ctx.createImageData(width, height);
      const d = imageData.data;
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const idx = (y * width + x) * 4;
          const nx = x / width;
          const ny = y / height;
          let r = 0, g = 0, b = 0, tw = 0;
          for (let i = 0; i < rgbColors.length; i++) {
            const nv = noise3D(nx * 2 + i * 1.7, ny * 2 + i * 1.3, i * 0.5);
            const w = Math.max(0, (nv + 1) / 2);
            r += rgbColors[i][0] * w;
            g += rgbColors[i][1] * w;
            b += rgbColors[i][2] * w;
            tw += w;
          }
          if (tw > 0) { r /= tw; g /= tw; b /= tw; }
          d[idx] = r; d[idx + 1] = g; d[idx + 2] = b; d[idx + 3] = intensity * 255;
        }
      }
      ctx.putImageData(imageData, 0, 0);
    } else {
      animationRef.current = requestAnimationFrame(draw);
    }

    return () => {
      cancelAnimationFrame(animationRef.current);
      window.removeEventListener("resize", resize);
      observer.disconnect();
    };
  }, [isClient, colors, speed, intensity, reducedMotion]);

  if (!isClient) return null;

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 pointer-events-none ${className}`}
      style={{ contain: "layout style paint", imageRendering: "auto", filter: "blur(30px)" }}
    />
  );
}
