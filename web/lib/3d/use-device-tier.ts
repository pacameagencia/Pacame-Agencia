"use client";

import { useEffect, useState } from "react";

export type DeviceTier = "low" | "mid" | "high";

interface NavigatorWithMemory extends Navigator {
  deviceMemory?: number;
  connection?: {
    effectiveType?: "slow-2g" | "2g" | "3g" | "4g";
    saveData?: boolean;
  };
}

/**
 * Determina la "potencia" del dispositivo para configurar LOD del 3D.
 *
 *   - low:  pixelRatio=1, geometría 50%, sin postprocessing, sin shadows.
 *   - mid:  pixelRatio≤1.5, FXAA simple, shadow map 512.
 *   - high: pixelRatio≤2,   SMAA + bloom sutil, shadow map 1024.
 *
 * Inputs:
 *   - navigator.deviceMemory (GB) — Chrome/Edge móvil/desktop.
 *   - hardwareConcurrency        — núcleos lógicos.
 *   - connection.effectiveType    — slow-2g/2g/3g/4g.
 *   - prefers-reduced-data        — user opt-in.
 *
 * Default conservador: si no hay datos, asumir mid (para no excluir
 * desktops legítimos que no exponen deviceMemory).
 */
export function useDeviceTier(): DeviceTier {
  const [tier, setTier] = useState<DeviceTier>("mid");

  useEffect(() => {
    if (typeof navigator === "undefined") return;

    const nav = navigator as NavigatorWithMemory;
    const mem = nav.deviceMemory ?? 4;
    const cores = nav.hardwareConcurrency ?? 4;
    const conn = nav.connection?.effectiveType;
    const saveData = nav.connection?.saveData === true;
    const reducedData = window.matchMedia?.("(prefers-reduced-data: reduce)")?.matches === true;

    // Forzado a low si user pide save-data o reduced-data
    if (saveData || reducedData) {
      setTier("low");
      return;
    }

    // 2g/slow-2g siempre low
    if (conn === "slow-2g" || conn === "2g") {
      setTier("low");
      return;
    }

    // High: ≥8GB RAM + ≥4 cores
    if (mem >= 8 && cores >= 4) {
      setTier("high");
      return;
    }

    // Low: <4GB RAM o <4 cores en 3g
    if (mem < 4 || (cores < 4 && conn === "3g")) {
      setTier("low");
      return;
    }

    setTier("mid");
  }, []);

  return tier;
}
