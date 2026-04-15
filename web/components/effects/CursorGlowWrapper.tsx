"use client";

import dynamic from "next/dynamic";

const CursorGlow = dynamic(() => import("@/components/effects/CursorGlow"), { ssr: false });

export default function CursorGlowWrapper() {
  return <CursorGlow />;
}
