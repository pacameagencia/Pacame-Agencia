/**
 * GlobalChrome — wrapper que decide qué chrome global se renderiza según la ruta.
 *
 * Hay rutas "app-like" (Jarvis /companero, futuros embeds) que necesitan ocupar
 * el viewport completo sin Header/Footer/widgets superpuestos.
 *
 * Esta lista define rutas que pintan SU PROPIO chrome (cero distracciones globales).
 */
"use client";

import { usePathname } from "next/navigation";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";
import JarvisFloatingButton from "@/components/JarvisFloatingButton";
import CursorGlowWrapper from "@/components/effects/CursorGlowWrapper";
import CookieConsent from "@/components/CookieConsent";
import LoadingScreen from "@/components/effects/LoadingScreen";
import ScrollProgress from "@/components/effects/ScrollProgress";
import NoiseOverlay from "@/components/effects/NoiseOverlay";
import BackToTop from "@/components/effects/BackToTop";

const APP_ROUTES = ["/companero"];

function isAppRoute(pathname: string | null): boolean {
  if (!pathname) return false;
  return APP_ROUTES.some((r) => pathname === r || pathname.startsWith(r + "/"));
}

export function GlobalChromeTop() {
  const pathname = usePathname();
  if (isAppRoute(pathname)) return null;
  return (
    <>
      <LoadingScreen />
      <ScrollProgress />
      <NoiseOverlay />
      <CursorGlowWrapper />
      <Header />
    </>
  );
}

export function GlobalChromeBottom() {
  const pathname = usePathname();
  if (isAppRoute(pathname)) return null;
  return (
    <>
      <Footer />
      <WhatsAppButton />
      <BackToTop />
      <JarvisFloatingButton />
      <CookieConsent />
    </>
  );
}
