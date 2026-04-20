"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Loader2,
  Mail,
  Lock,
  ArrowLeft,
  ArrowRight,
  KeyRound,
  CheckCircle,
  Eye,
  EyeOff,
  Shield,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import ScrollReveal from "@/components/ui/scroll-reveal";
import { CardTilt, CardTiltContent } from "@/components/ui/card-tilt";

type Step = "email" | "code" | "success";

const inputClass =
  "w-full px-4 py-3 rounded-xl bg-white/[0.06] border border-ink/[0.08] text-ink placeholder:text-ink/25 font-body text-sm focus:outline-none focus:border-accent-gold/50 transition-colors";

const stepVariants = {
  hidden: { opacity: 0, x: 40 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.35, ease: "easeOut" } },
  exit: { opacity: 0, x: -40, transition: { duration: 0.25, ease: "easeIn" } },
};

export default function ResetPasswordPage() {
  const router = useRouter();

  const [step, setStep] = useState<Step>("email");

  // Step 1 state
  const [email, setEmail] = useState("");
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailError, setEmailError] = useState("");

  // Step 2 state
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [codeLoading, setCodeLoading] = useState(false);
  const [codeError, setCodeError] = useState("");

  async function handleRequestCode(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;

    setEmailLoading(true);
    setEmailError("");

    try {
      const res = await fetch("/api/client-auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "reset-request",
          email: email.trim(),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setEmailError(data.error || "Error al enviar el codigo");
        setEmailLoading(false);
        return;
      }

      setStep("code");
    } catch {
      setEmailError("Error de conexion. Intentalo de nuevo.");
    }

    setEmailLoading(false);
  }

  async function handleResetConfirm(e: React.FormEvent) {
    e.preventDefault();
    if (!code.trim() || !newPassword || !confirmPassword) return;

    if (newPassword !== confirmPassword) {
      setCodeError("Los passwords no coinciden");
      return;
    }

    if (newPassword.length < 8) {
      setCodeError("El password debe tener al menos 8 caracteres");
      return;
    }

    setCodeLoading(true);
    setCodeError("");

    try {
      const res = await fetch("/api/client-auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "reset-confirm",
          email: email.trim(),
          code: code.trim(),
          new_password: newPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setCodeError(data.error || "Error al restablecer el password");
        setCodeLoading(false);
        return;
      }

      setStep("success");

      // Redirect to login after 3 seconds
      setTimeout(() => {
        router.push("/portal?reset=ok");
      }, 3000);
    } catch {
      setCodeError("Error de conexion. Intentalo de nuevo.");
      setCodeLoading(false);
    }
  }

  return (
    <div className="bg-paper min-h-screen flex items-center justify-center px-6">
      <ScrollReveal className="w-full max-w-md">
        {/* Header */}
        <motion.div
          className="text-center mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="inline-flex w-14 h-14 rounded-2xl bg-brand-gradient items-center justify-center mb-4 shadow-glow-violet">
            <KeyRound className="w-7 h-7 text-white" />
          </div>
          <h1 className="font-heading font-bold text-3xl text-ink">
            Restablecer password
          </h1>
          <p className="text-sm text-ink/50 font-body mt-2">
            {step === "email" && "Introduce tu email para recibir un codigo de verificacion"}
            {step === "code" && "Introduce el codigo y tu nuevo password"}
            {step === "success" && "Password actualizado correctamente"}
          </p>
        </motion.div>

        <CardTilt tiltMaxAngle={3} scale={1.005}>
          <CardTiltContent className="rounded-2xl bg-paper-deep border border-ink/[0.06] p-6 sm:p-8">
            <AnimatePresence mode="wait">
              {/* ─── Step 1: Email ─── */}
              {step === "email" && (
                <motion.form
                  key="email-step"
                  variants={stepVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  onSubmit={handleRequestCode}
                  className="space-y-4"
                >
                  <div>
                    <label
                      htmlFor="reset-email"
                      className="block text-xs text-ink/40 font-body mb-1.5"
                    >
                      Email de tu cuenta
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink/25" />
                      <input
                        id="reset-email"
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

                  {emailError && (
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-xs text-accent-burgundy-soft font-body text-center"
                    >
                      {emailError}
                    </motion.p>
                  )}

                  <Button
                    type="submit"
                    variant="gradient"
                    size="xl"
                    disabled={emailLoading}
                    className="w-full gap-2"
                  >
                    {emailLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <ArrowRight className="w-4 h-4" />
                    )}
                    Enviar codigo
                  </Button>

                  <div className="text-center">
                    <Link
                      href="/portal"
                      className="inline-flex items-center gap-1.5 text-xs text-ink/40 hover:text-ink/60 font-body transition-colors"
                    >
                      <ArrowLeft className="w-3 h-3" />
                      Volver al login
                    </Link>
                  </div>
                </motion.form>
              )}

              {/* ─── Step 2: Code + New password ─── */}
              {step === "code" && (
                <motion.form
                  key="code-step"
                  variants={stepVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  onSubmit={handleResetConfirm}
                  className="space-y-4"
                >
                  <div className="p-3 rounded-xl bg-brand-primary/5 border border-brand-primary/10 mb-2">
                    <p className="text-xs text-brand-primary/70 font-body text-center">
                      Hemos enviado un codigo de 6 digitos a{" "}
                      <span className="font-medium text-brand-primary">{email}</span>
                    </p>
                  </div>

                  <div>
                    <label
                      htmlFor="reset-code"
                      className="block text-xs text-ink/40 font-body mb-1.5"
                    >
                      Codigo de verificacion
                    </label>
                    <input
                      id="reset-code"
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]{6}"
                      maxLength={6}
                      placeholder="000000"
                      value={code}
                      onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                      required
                      autoComplete="one-time-code"
                      className={`${inputClass} text-center text-lg tracking-[0.5em] font-heading font-bold`}
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="new-password"
                      className="block text-xs text-ink/40 font-body mb-1.5"
                    >
                      Nuevo password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink/25" />
                      <input
                        id="new-password"
                        type={showNewPassword ? "text" : "password"}
                        placeholder="Minimo 8 caracteres"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                        minLength={8}
                        autoComplete="new-password"
                        className={`${inputClass} pl-10 pr-10`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-ink/25 hover:text-ink/50 transition-colors"
                        tabIndex={-1}
                      >
                        {showNewPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="confirm-password"
                      className="block text-xs text-ink/40 font-body mb-1.5"
                    >
                      Confirmar password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink/25" />
                      <input
                        id="confirm-password"
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Repite el password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        minLength={8}
                        autoComplete="new-password"
                        className={`${inputClass} pl-10 pr-10`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-ink/25 hover:text-ink/50 transition-colors"
                        tabIndex={-1}
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  {codeError && (
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-xs text-accent-burgundy-soft font-body text-center"
                    >
                      {codeError}
                    </motion.p>
                  )}

                  <Button
                    type="submit"
                    variant="gradient"
                    size="xl"
                    disabled={codeLoading}
                    className="w-full gap-2"
                  >
                    {codeLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <ArrowRight className="w-4 h-4" />
                    )}
                    Cambiar password
                  </Button>

                  <div className="text-center">
                    <button
                      type="button"
                      onClick={() => setStep("email")}
                      className="inline-flex items-center gap-1.5 text-xs text-ink/40 hover:text-ink/60 font-body transition-colors"
                    >
                      <ArrowLeft className="w-3 h-3" />
                      Usar otro email
                    </button>
                  </div>
                </motion.form>
              )}

              {/* ─── Step 3: Success ─── */}
              {step === "success" && (
                <motion.div
                  key="success-step"
                  variants={stepVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="text-center py-4"
                >
                  <div className="w-16 h-16 rounded-full bg-mint/10 flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-8 h-8 text-mint" />
                  </div>
                  <h2 className="font-heading font-bold text-xl text-ink mb-2">
                    Password actualizado
                  </h2>
                  <p className="text-sm text-ink/50 font-body mb-6">
                    Redirigiendo al login...
                  </p>
                  <Button variant="outline" size="lg" asChild className="gap-2">
                    <Link href="/portal?reset=ok">
                      <ArrowRight className="w-4 h-4" />
                      Ir al login ahora
                    </Link>
                  </Button>
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
          className="flex items-center gap-2 justify-center mt-6 text-xs text-ink/30 font-body"
        >
          <Shield className="w-3.5 h-3.5" />
          Portal seguro PACAME
        </motion.div>
      </ScrollReveal>
    </div>
  );
}
