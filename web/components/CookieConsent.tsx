"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Cookie, Shield, BarChart3, Settings2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getCookieConsent, setCookieConsent } from "@/lib/cookie-consent";
import type { CookieConsentState } from "@/lib/cookie-consent";

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);
  const [showCustomize, setShowCustomize] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [functional, setFunctional] = useState(false);

  useEffect(() => {
    const consent = getCookieConsent();
    if (!consent) {
      // Small delay so the page loads first
      const timer = setTimeout(() => setVisible(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  function saveConsent(state: CookieConsentState) {
    setCookieConsent(state);
    setVisible(false);
  }

  function handleAcceptAll() {
    saveConsent({
      essential: true,
      analytics: true,
      functional: true,
      timestamp: new Date().toISOString(),
    });
  }

  function handleRejectNonEssential() {
    saveConsent({
      essential: true,
      analytics: false,
      functional: false,
      timestamp: new Date().toISOString(),
    });
  }

  function handleSaveCustom() {
    saveConsent({
      essential: true,
      analytics,
      functional,
      timestamp: new Date().toISOString(),
    });
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          className="fixed bottom-0 inset-x-0 z-[60] p-4 sm:p-6"
          role="dialog"
          aria-label="Preferencias de cookies"
        >
          <div className="max-w-2xl mx-auto bg-[#141414]/95 backdrop-blur-xl border border-olympus-gold/15 rounded-2xl shadow-2xl overflow-hidden">
            {/* Main banner */}
            <div className="p-5 sm:p-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-olympus-gold/10 flex items-center justify-center flex-shrink-0">
                  <Cookie className="w-5 h-5 text-olympus-gold" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-heading font-bold text-base text-pacame-white mb-1">
                    Tu privacidad es importante
                  </h3>
                  <p className="text-sm text-pacame-white/50 font-body leading-relaxed">
                    Usamos cookies esenciales para que el sitio funcione. Con tu permiso, tambien usamos cookies
                    analiticas para mejorar tu experiencia.{" "}
                    <Link
                      href="/cookies"
                      className="text-olympus-gold/70 hover:text-olympus-gold underline underline-offset-2 transition-colors"
                    >
                      Mas informacion
                    </Link>
                  </p>
                </div>
                <button
                  onClick={handleRejectNonEssential}
                  className="text-pacame-white/20 hover:text-pacame-white/50 transition-colors flex-shrink-0"
                  aria-label="Cerrar y rechazar cookies no esenciales"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Customize panel */}
              <AnimatePresence>
                {showCustomize && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-5 pt-5 border-t border-white/[0.06] space-y-4">
                      {/* Essential — always on */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Shield className="w-4 h-4 text-olympus-gold/60" />
                          <div>
                            <span className="text-sm font-heading font-semibold text-pacame-white">Esenciales</span>
                            <p className="text-xs text-pacame-white/30 font-body">Necesarias para el funcionamiento basico</p>
                          </div>
                        </div>
                        <div className="w-11 h-6 rounded-full bg-olympus-gold/20 flex items-center px-0.5 cursor-not-allowed">
                          <div className="w-5 h-5 rounded-full bg-olympus-gold translate-x-5" />
                        </div>
                      </div>

                      {/* Analytics */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <BarChart3 className="w-4 h-4 text-pacame-white/40" />
                          <div>
                            <span className="text-sm font-heading font-semibold text-pacame-white">Analiticas</span>
                            <p className="text-xs text-pacame-white/30 font-body">Google Analytics para mejorar el sitio</p>
                          </div>
                        </div>
                        <button
                          onClick={() => setAnalytics(!analytics)}
                          className={`w-11 h-6 rounded-full flex items-center px-0.5 transition-colors duration-200 ${
                            analytics ? "bg-olympus-gold/20" : "bg-white/[0.08]"
                          }`}
                          role="switch"
                          aria-checked={analytics}
                          aria-label="Cookies analiticas"
                        >
                          <div
                            className={`w-5 h-5 rounded-full transition-all duration-200 ${
                              analytics ? "bg-olympus-gold translate-x-5" : "bg-pacame-white/30 translate-x-0"
                            }`}
                          />
                        </button>
                      </div>

                      {/* Functional */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Settings2 className="w-4 h-4 text-pacame-white/40" />
                          <div>
                            <span className="text-sm font-heading font-semibold text-pacame-white">Funcionales</span>
                            <p className="text-xs text-pacame-white/30 font-body">Preferencias y personalizacion</p>
                          </div>
                        </div>
                        <button
                          onClick={() => setFunctional(!functional)}
                          className={`w-11 h-6 rounded-full flex items-center px-0.5 transition-colors duration-200 ${
                            functional ? "bg-olympus-gold/20" : "bg-white/[0.08]"
                          }`}
                          role="switch"
                          aria-checked={functional}
                          aria-label="Cookies funcionales"
                        >
                          <div
                            className={`w-5 h-5 rounded-full transition-all duration-200 ${
                              functional ? "bg-olympus-gold translate-x-5" : "bg-pacame-white/30 translate-x-0"
                            }`}
                          />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Buttons */}
              <div className="mt-5 flex flex-col sm:flex-row gap-2.5">
                <Button
                  variant="gradient"
                  size="sm"
                  onClick={handleAcceptAll}
                  className="rounded-full flex-1 shadow-glow-gold text-sm"
                >
                  Aceptar todas
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRejectNonEssential}
                  className="rounded-full flex-1 text-pacame-white/50 hover:text-pacame-white text-sm"
                >
                  Solo esenciales
                </Button>
                {showCustomize ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSaveCustom}
                    className="rounded-full flex-1 border-olympus-gold/20 hover:border-olympus-gold/40 text-sm"
                  >
                    Guardar preferencias
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowCustomize(true)}
                    className="rounded-full flex-1 border-white/[0.08] hover:border-white/20 text-sm"
                  >
                    Personalizar
                  </Button>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
