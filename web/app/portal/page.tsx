"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Loader2,
  Mail,
  Lock,
  ArrowRight,
  Shield,
  Eye,
  EyeOff,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import ScrollReveal from "@/components/ui/scroll-reveal";
import { CardTilt, CardTiltContent } from "@/components/ui/card-tilt";

type Tab = "login" | "magic";

const inputClass =
  "w-full px-4 py-3 rounded-xl bg-white/[0.06] border border-white/[0.08] text-pacame-white placeholder:text-pacame-white/25 font-body text-sm focus:outline-none focus:border-olympus-gold/50 transition-colors";

const tabVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
  exit: { opacity: 0, y: -12, transition: { duration: 0.2 } },
};

export default function PortalPage() {
  return (
    <Suspense
      fallback={
        <div className="bg-pacame-black min-h-screen flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-electric-violet" />
        </div>
      }
    >
      <PortalLoginContent />
    </Suspense>
  );
}

function PortalLoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const resetSuccess = searchParams.get("reset") === "ok";

  const [activeTab, setActiveTab] = useState<Tab>("login");

  // Login state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState("");

  // Magic link state
  const [magicEmail, setMagicEmail] = useState("");
  const [magicLoading, setMagicLoading] = useState(false);
  const [magicSent, setMagicSent] = useState(false);
  const [magicError, setMagicError] = useState("");

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;

    setLoginLoading(true);
    setLoginError("");

    try {
      const res = await fetch("/api/client-auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "login",
          email: email.trim(),
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setLoginError(data.error || "Error al iniciar sesion");
        setLoginLoading(false);
        return;
      }

      router.push("/portal/dashboard");
    } catch {
      setLoginError("Error de conexion. Intentalo de nuevo.");
      setLoginLoading(false);
    }
  }

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault();
    if (!magicEmail.trim()) return;

    setMagicLoading(true);
    setMagicError("");

    try {
      await fetch("/api/portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "request_access",
          email: magicEmail.trim(),
        }),
      });
      setMagicSent(true);
    } catch {
      setMagicError("Error de conexion. Intentalo de nuevo.");
    }

    setMagicLoading(false);
  }

  return (
    <div className="bg-pacame-black min-h-screen flex items-center justify-center px-6">
      <ScrollReveal className="w-full max-w-md">
        {/* Logo + header */}
        <motion.div
          className="text-center mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="inline-flex w-14 h-14 rounded-2xl bg-brand-gradient items-center justify-center mb-4 shadow-glow-violet">
            <span className="text-white font-heading font-bold text-xl">P</span>
          </div>
          <h1 className="font-heading font-bold text-3xl text-pacame-white">
            Portal de cliente
          </h1>
          <p className="text-sm text-pacame-white/50 font-body mt-2">
            Accede a tu proyecto, contenido y pagos
          </p>
        </motion.div>

        {/* Reset success banner */}
        {resetSuccess && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-6 p-3 rounded-xl bg-lime-pulse/10 border border-lime-pulse/20 text-center"
          >
            <p className="text-sm text-lime-pulse font-body">
              Password actualizado correctamente. Inicia sesion con tu nuevo password.
            </p>
          </motion.div>
        )}

        {/* Card */}
        <CardTilt tiltMaxAngle={3} scale={1.005}>
          <CardTiltContent className="rounded-2xl bg-dark-card border border-white/[0.06] p-6 sm:p-8">
            {/* Tab switcher */}
            <div className="flex rounded-xl bg-white/[0.04] p-1 mb-6">
              <button
                type="button"
                onClick={() => setActiveTab("login")}
                className={`flex-1 py-2.5 px-3 rounded-lg text-sm font-body font-medium transition-all ${
                  activeTab === "login"
                    ? "bg-white/[0.08] text-pacame-white shadow-sm"
                    : "text-pacame-white/40 hover:text-pacame-white/60"
                }`}
              >
                <Lock className="w-3.5 h-3.5 inline-block mr-1.5 -mt-0.5" />
                Iniciar sesion
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("magic")}
                className={`flex-1 py-2.5 px-3 rounded-lg text-sm font-body font-medium transition-all ${
                  activeTab === "magic"
                    ? "bg-white/[0.08] text-pacame-white shadow-sm"
                    : "text-pacame-white/40 hover:text-pacame-white/60"
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 inline-block mr-1.5 -mt-0.5" />
                Acceso rapido
              </button>
            </div>

            {/* Tab content */}
            <AnimatePresence mode="wait">
              {activeTab === "login" ? (
                <motion.form
                  key="login"
                  variants={tabVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  onSubmit={handleLogin}
                  className="space-y-4"
                >
                  <div>
                    <label
                      htmlFor="login-email"
                      className="block text-xs text-pacame-white/40 font-body mb-1.5"
                    >
                      Email
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-pacame-white/25" />
                      <input
                        id="login-email"
                        type="email"
                        placeholder="tu@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        autoComplete="email"
                        className={`${inputClass} pl-10`}
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="login-password"
                      className="block text-xs text-pacame-white/40 font-body mb-1.5"
                    >
                      Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-pacame-white/25" />
                      <input
                        id="login-password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Tu password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        autoComplete="current-password"
                        className={`${inputClass} pl-10 pr-10`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-pacame-white/25 hover:text-pacame-white/50 transition-colors"
                        tabIndex={-1}
                      >
                        {showPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  {loginError && (
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-xs text-rose-alert font-body text-center"
                    >
                      {loginError}
                    </motion.p>
                  )}

                  <Button
                    type="submit"
                    variant="gradient"
                    size="xl"
                    disabled={loginLoading}
                    className="w-full gap-2"
                  >
                    {loginLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <ArrowRight className="w-4 h-4" />
                    )}
                    Iniciar sesion
                  </Button>

                  <div className="text-center">
                    <Link
                      href="/portal/reset-password"
                      className="text-xs text-electric-violet/60 hover:text-electric-violet font-body transition-colors"
                    >
                      Olvidaste tu password?
                    </Link>
                  </div>
                </motion.form>
              ) : (
                <motion.div
                  key="magic"
                  variants={tabVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                >
                  {magicSent ? (
                    <div className="text-center py-4">
                      <Mail className="w-8 h-8 text-lime-pulse mx-auto mb-3" />
                      <h2 className="font-heading font-semibold text-pacame-white mb-2">
                        Enlace enviado
                      </h2>
                      <p className="text-sm text-pacame-white/50 font-body">
                        Si tu email esta registrado, recibiras un enlace de acceso
                        en tu bandeja de entrada. Revisa tambien spam.
                      </p>
                    </div>
                  ) : (
                    <form onSubmit={handleMagicLink} className="space-y-4">
                      <div>
                        <label
                          htmlFor="magic-email"
                          className="block text-xs text-pacame-white/40 font-body mb-1.5"
                        >
                          Email
                        </label>
                        <div className="relative">
                          <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-pacame-white/25" />
                          <input
                            id="magic-email"
                            type="email"
                            placeholder="tu@email.com"
                            value={magicEmail}
                            onChange={(e) => setMagicEmail(e.target.value)}
                            required
                            autoComplete="email"
                            className={`${inputClass} pl-10`}
                          />
                        </div>
                      </div>

                      <p className="text-xs text-pacame-white/30 font-body">
                        Te enviaremos un enlace magico para acceder sin password.
                      </p>

                      {magicError && (
                        <motion.p
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="text-xs text-rose-alert font-body text-center"
                        >
                          {magicError}
                        </motion.p>
                      )}

                      <Button
                        type="submit"
                        variant="gradient"
                        size="xl"
                        disabled={magicLoading}
                        className="w-full gap-2"
                      >
                        {magicLoading ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Mail className="w-4 h-4" />
                        )}
                        Enviar enlace de acceso
                      </Button>
                    </form>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </CardTiltContent>
        </CardTilt>

        {/* Trust strip */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="flex items-center gap-2 justify-center mt-6 text-xs text-pacame-white/30 font-body"
        >
          <Shield className="w-3.5 h-3.5" />
          Portal seguro PACAME
        </motion.div>
      </ScrollReveal>
    </div>
  );
}
