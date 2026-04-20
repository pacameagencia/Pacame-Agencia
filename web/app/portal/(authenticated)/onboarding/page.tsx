"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  Loader2,
  ArrowRight,
  ArrowLeft,
  Upload,
  Sparkles,
  Palette,
  Type,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Celebration from "@/components/effects/Celebration";

const sectorOptions = [
  "Hosteleria y restauracion",
  "Salud y bienestar",
  "Comercio y retail",
  "Tecnologia y SaaS",
  "Educacion y formacion",
  "Servicios profesionales",
  "Construccion e inmobiliaria",
  "Turismo y ocio",
  "Otro",
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [primaryColor, setPrimaryColor] = useState("#7C3AED");
  const [secondaryColor, setSecondaryColor] = useState("#06B6D4");
  const [tagline, setTagline] = useState("");
  const [sector, setSector] = useState("");

  function handleLogoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoFile(file);
    const reader = new FileReader();
    reader.onload = () => setLogoPreview(reader.result as string);
    reader.readAsDataURL(file);
  }

  async function handleComplete() {
    setSaving(true);

    try {
      // Upload logo if selected
      let logoUrl: string | null = null;
      if (logoFile) {
        const formData = new FormData();
        formData.append("file", logoFile);
        formData.append("file_type", "logo");

        const uploadRes = await fetch("/api/client-files", {
          method: "POST",
          body: formData,
        });
        if (uploadRes.ok) {
          const uploadData = (await uploadRes.json()) as { file: { file_url: string } };
          logoUrl = uploadData.file.file_url;
        }
      }

      // Save brand settings
      await fetch("/api/portal", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update_brand_settings",
          logo_url: logoUrl,
          primary_color: primaryColor,
          secondary_color: secondaryColor,
          company_tagline: tagline,
          sector,
        }),
      });

      // Mark onboarding complete
      await fetch("/api/portal", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "complete_onboarding",
        }),
      });

      setShowCelebration(true);
      setStep(3);

      setTimeout(() => {
        router.push("/portal/dashboard");
      }, 3000);
    } catch {
      // Silently proceed to dashboard even on error
      router.push("/portal/dashboard");
    } finally {
      setSaving(false);
    }
  }

  const steps = [
    // Step 0: Welcome
    <motion.div
      key="welcome"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -30 }}
      transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
      className="text-center max-w-lg mx-auto"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.2, type: "spring", stiffness: 200, damping: 15 }}
        className="w-20 h-20 rounded-2xl bg-brand-gradient flex items-center justify-center mx-auto mb-8"
      >
        <Sparkles className="w-10 h-10 text-white" />
      </motion.div>
      <h1 className="font-heading font-bold text-4xl text-ink mb-4">
        Bienvenido a{" "}
        <span className="bg-gradient-to-r from-brand-primary to-cyan-spark bg-clip-text text-transparent">
          PACAME
        </span>
      </h1>
      <p className="text-ink/50 font-body text-lg leading-relaxed mb-8">
        Vamos a configurar tu portal en 2 minutos. Podras personalizar
        los colores, subir tu logo y preparar todo para que tu experiencia
        sea unica.
      </p>
      <Button
        variant="gradient"
        size="xl"
        onClick={() => setStep(1)}
        className="gap-2"
      >
        Empezar <ArrowRight className="w-4 h-4" />
      </Button>
    </motion.div>,

    // Step 1: Logo + Colors
    <motion.div
      key="branding"
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
      className="max-w-lg mx-auto"
    >
      <h2 className="font-heading font-bold text-2xl text-ink mb-2 text-center">
        Tu identidad visual
      </h2>
      <p className="text-sm text-ink/40 font-body mb-8 text-center">
        Sube tu logo y elige los colores de tu marca
      </p>

      {/* Logo upload */}
      <div className="flex flex-col items-center mb-8">
        <div
          onClick={() => logoInputRef.current?.click()}
          className="w-28 h-28 rounded-full border-2 border-dashed border-white/[0.15] flex items-center justify-center cursor-pointer hover:border-brand-primary/50 transition-colors overflow-hidden mb-3"
        >
          {logoPreview ? (
            <img src={logoPreview} alt="Logo" className="w-full h-full object-cover" />
          ) : (
            <Upload className="w-8 h-8 text-ink/20" />
          )}
        </div>
        <button
          onClick={() => logoInputRef.current?.click()}
          className="text-xs text-brand-primary font-body hover:underline"
        >
          {logoPreview ? "Cambiar logo" : "Subir logo"}
        </button>
        <input
          ref={logoInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleLogoSelect}
        />
      </div>

      {/* Colors */}
      <div className="grid grid-cols-2 gap-6 mb-8">
        <div>
          <label className="block text-xs text-ink/50 font-body mb-2 flex items-center gap-1.5">
            <Palette className="w-3 h-3" /> Color primario
          </label>
          <div className="flex items-center gap-3">
            <label className="relative cursor-pointer">
              <input
                type="color"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                className="absolute inset-0 opacity-0 cursor-pointer w-10 h-10"
              />
              <div
                className="w-10 h-10 rounded-xl border-2 border-ink/[0.12]"
                style={{ backgroundColor: primaryColor }}
              />
            </label>
            <input
              type="text"
              value={primaryColor}
              onChange={(e) => setPrimaryColor(e.target.value)}
              className="flex-1 px-4 py-3 rounded-xl bg-white/[0.06] border border-ink/[0.08] text-ink font-body text-sm focus:outline-none focus:border-accent-gold/50 transition-colors uppercase"
              maxLength={7}
            />
          </div>
        </div>
        <div>
          <label className="block text-xs text-ink/50 font-body mb-2 flex items-center gap-1.5">
            <Palette className="w-3 h-3" /> Color secundario
          </label>
          <div className="flex items-center gap-3">
            <label className="relative cursor-pointer">
              <input
                type="color"
                value={secondaryColor}
                onChange={(e) => setSecondaryColor(e.target.value)}
                className="absolute inset-0 opacity-0 cursor-pointer w-10 h-10"
              />
              <div
                className="w-10 h-10 rounded-xl border-2 border-ink/[0.12]"
                style={{ backgroundColor: secondaryColor }}
              />
            </label>
            <input
              type="text"
              value={secondaryColor}
              onChange={(e) => setSecondaryColor(e.target.value)}
              className="flex-1 px-4 py-3 rounded-xl bg-white/[0.06] border border-ink/[0.08] text-ink font-body text-sm focus:outline-none focus:border-accent-gold/50 transition-colors uppercase"
              maxLength={7}
            />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Button variant="ghost" onClick={() => setStep(0)} className="gap-1">
          <ArrowLeft className="w-4 h-4" /> Atras
        </Button>
        <Button variant="gradient" size="xl" onClick={() => setStep(2)} className="flex-1 gap-2">
          Siguiente <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </motion.div>,

    // Step 2: Tagline + Sector
    <motion.div
      key="info"
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
      className="max-w-lg mx-auto"
    >
      <h2 className="font-heading font-bold text-2xl text-ink mb-2 text-center">
        Cuentanos sobre tu empresa
      </h2>
      <p className="text-sm text-ink/40 font-body mb-8 text-center">
        Esto nos ayuda a personalizar tu experiencia
      </p>

      <div className="space-y-6 mb-8">
        <div>
          <label className="block text-xs text-ink/50 font-body mb-2 flex items-center gap-1.5">
            <Type className="w-3 h-3" /> Tagline o slogan
          </label>
          <input
            type="text"
            value={tagline}
            onChange={(e) => setTagline(e.target.value)}
            placeholder="Ej: Transformamos ideas en experiencias digitales"
            className="w-full px-4 py-3 rounded-xl bg-white/[0.06] border border-ink/[0.08] text-ink placeholder:text-ink/25 font-body text-sm focus:outline-none focus:border-accent-gold/50 transition-colors"
            maxLength={120}
          />
        </div>
        <div>
          <label className="block text-xs text-ink/50 font-body mb-2">
            Sector
          </label>
          <select
            value={sector}
            onChange={(e) => setSector(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-white/[0.06] border border-ink/[0.08] text-ink font-body text-sm focus:outline-none focus:border-accent-gold/50 transition-colors appearance-none cursor-pointer"
          >
            <option value="" className="bg-[#1a1a1a]">Selecciona un sector</option>
            {sectorOptions.map((s) => (
              <option key={s} value={s} className="bg-[#1a1a1a]">
                {s}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Button variant="ghost" onClick={() => setStep(1)} className="gap-1">
          <ArrowLeft className="w-4 h-4" /> Atras
        </Button>
        <Button
          variant="gradient"
          size="xl"
          onClick={handleComplete}
          disabled={saving}
          className="flex-1 gap-2"
        >
          {saving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <CheckCircle2 className="w-4 h-4" />
          )}
          {saving ? "Configurando..." : "Completar configuracion"}
        </Button>
      </div>
    </motion.div>,

    // Step 3: Complete
    <motion.div
      key="complete"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
      className="text-center max-w-lg mx-auto"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.3, type: "spring", stiffness: 200, damping: 15 }}
        className="w-20 h-20 rounded-full bg-mint/20 flex items-center justify-center mx-auto mb-6"
      >
        <CheckCircle2 className="w-10 h-10 text-mint" />
      </motion.div>
      <h1 className="font-heading font-bold text-3xl text-ink mb-3">
        Todo listo
      </h1>
      <p className="text-ink/50 font-body text-lg mb-4">
        Tu portal esta configurado. Redirigiendo al dashboard...
      </p>
      <Loader2 className="w-5 h-5 animate-spin text-brand-primary mx-auto" />
    </motion.div>,
  ];

  // Step indicators
  const totalSteps = 4;

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center relative">
      {showCelebration && <Celebration particleCount={100} duration={3000} />}

      {/* Progress dots */}
      <div className="flex items-center gap-2 mb-12">
        {Array.from({ length: totalSteps }).map((_, i) => (
          <div
            key={i}
            className="h-1.5 rounded-full transition-all duration-500"
            style={{
              width: i === step ? "32px" : "8px",
              backgroundColor: i <= step ? primaryColor : "rgba(255,255,255,0.1)",
            }}
          />
        ))}
      </div>

      {/* Step content */}
      <div className="w-full px-4">
        <AnimatePresence mode="wait">
          {steps[step]}
        </AnimatePresence>
      </div>
    </div>
  );
}
