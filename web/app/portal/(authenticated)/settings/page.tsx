"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import {
  Loader2,
  Settings,
  Palette,
  Type,
  Upload,
  Check,
  RotateCcw,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import ScrollReveal from "@/components/ui/scroll-reveal";

interface BrandSettings {
  logo_url: string | null;
  primary_color: string;
  secondary_color: string;
  font_heading: string;
  font_body: string;
  company_tagline: string;
}

const fontOptions = [
  "Space Grotesk",
  "Inter",
  "Poppins",
  "Montserrat",
  "Playfair Display",
  "DM Sans",
];

export default function SettingsPage() {
  const [settings, setSettings] = useState<BrandSettings>({
    logo_url: null,
    primary_color: "#B54E30",
    secondary_color: "#283B70",
    font_heading: "Space Grotesk",
    font_body: "Inter",
    company_tagline: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch("/api/portal?action=get_settings");
      if (!res.ok) throw new Error("Error al cargar ajustes");
      const result = (await res.json()) as { settings: BrandSettings };
      setSettings(result.settings);
      setLogoPreview(result.settings.logo_url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingLogo(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("file_type", "logo");

      const res = await fetch("/api/client-files", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Error al subir logo");

      const result = (await res.json()) as { file: { file_url: string } };
      const newUrl = result.file.file_url;
      setSettings((prev) => ({ ...prev, logo_url: newUrl }));
      setLogoPreview(newUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al subir logo");
    } finally {
      setUploadingLogo(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    setError(null);

    try {
      const res = await fetch("/api/portal", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update_brand_settings",
          ...settings,
        }),
      });

      if (!res.ok) {
        const errData = (await res.json()) as { error?: string };
        throw new Error(errData.error ?? "Error al guardar");
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);

      // Update CSS custom properties
      document.documentElement.style.setProperty("--client-primary", settings.primary_color);
      document.documentElement.style.setProperty("--client-secondary", settings.secondary_color);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-brand-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-3xl">
      {/* Header */}
      <ScrollReveal>
        <div className="flex items-center gap-3 mb-1">
          <Settings className="w-6 h-6 text-brand-primary" />
          <h1 className="font-heading font-bold text-2xl text-ink">Ajustes de marca</h1>
        </div>
        <p className="text-sm text-ink/50 font-body">
          Personaliza tu portal con los colores y tipografia de tu marca
        </p>
      </ScrollReveal>

      {/* Logo */}
      <ScrollReveal delay={0.05}>
        <div className="bg-paper-deep border border-ink/[0.06] rounded-2xl p-6">
          <h2 className="font-heading font-semibold text-base text-ink mb-4 flex items-center gap-2">
            <Upload className="w-4 h-4 text-ink/50" />
            Logo
          </h2>
          <div className="flex items-center gap-6">
            <div
              className="w-20 h-20 rounded-2xl border-2 border-dashed border-ink/[0.12] flex items-center justify-center overflow-hidden cursor-pointer hover:border-white/[0.25] transition-colors"
              onClick={() => logoInputRef.current?.click()}
            >
              {uploadingLogo ? (
                <Loader2 className="w-6 h-6 animate-spin text-ink/30" />
              ) : logoPreview ? (
                <img
                  src={logoPreview}
                  alt="Logo"
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-3xl font-heading font-bold text-ink/20">P</span>
              )}
            </div>
            <div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => logoInputRef.current?.click()}
                disabled={uploadingLogo}
              >
                {uploadingLogo ? "Subiendo..." : "Cambiar logo"}
              </Button>
              <p className="text-[11px] text-ink/30 font-body mt-2">
                PNG, SVG o JPG. Recomendado: 200x200px
              </p>
            </div>
          </div>
          <input
            ref={logoInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleLogoUpload}
          />
        </div>
      </ScrollReveal>

      {/* Colors */}
      <ScrollReveal delay={0.1}>
        <div className="bg-paper-deep border border-ink/[0.06] rounded-2xl p-6">
          <h2 className="font-heading font-semibold text-base text-ink mb-4 flex items-center gap-2">
            <Palette className="w-4 h-4 text-ink/50" />
            Colores
          </h2>
          <div className="grid sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs text-ink/50 font-body mb-2">
                Color primario
              </label>
              <div className="flex items-center gap-3">
                <label className="relative cursor-pointer">
                  <input
                    type="color"
                    value={settings.primary_color}
                    onChange={(e) => setSettings((prev) => ({ ...prev, primary_color: e.target.value }))}
                    className="absolute inset-0 opacity-0 cursor-pointer w-10 h-10"
                  />
                  <div
                    className="w-10 h-10 rounded-xl border-2 border-ink/[0.12] transition-shadow hover:shadow-lg"
                    style={{ backgroundColor: settings.primary_color }}
                  />
                </label>
                <input
                  type="text"
                  value={settings.primary_color}
                  onChange={(e) => setSettings((prev) => ({ ...prev, primary_color: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl bg-white/[0.06] border border-ink/[0.08] text-ink placeholder:text-ink/25 font-body text-sm focus:outline-none focus:border-accent-gold/50 transition-colors uppercase"
                  maxLength={7}
                />
              </div>
            </div>
            <div>
              <label className="block text-xs text-ink/50 font-body mb-2">
                Color secundario
              </label>
              <div className="flex items-center gap-3">
                <label className="relative cursor-pointer">
                  <input
                    type="color"
                    value={settings.secondary_color}
                    onChange={(e) => setSettings((prev) => ({ ...prev, secondary_color: e.target.value }))}
                    className="absolute inset-0 opacity-0 cursor-pointer w-10 h-10"
                  />
                  <div
                    className="w-10 h-10 rounded-xl border-2 border-ink/[0.12] transition-shadow hover:shadow-lg"
                    style={{ backgroundColor: settings.secondary_color }}
                  />
                </label>
                <input
                  type="text"
                  value={settings.secondary_color}
                  onChange={(e) => setSettings((prev) => ({ ...prev, secondary_color: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl bg-white/[0.06] border border-ink/[0.08] text-ink placeholder:text-ink/25 font-body text-sm focus:outline-none focus:border-accent-gold/50 transition-colors uppercase"
                  maxLength={7}
                />
              </div>
            </div>
          </div>
        </div>
      </ScrollReveal>

      {/* Typography */}
      <ScrollReveal delay={0.15}>
        <div className="bg-paper-deep border border-ink/[0.06] rounded-2xl p-6">
          <h2 className="font-heading font-semibold text-base text-ink mb-4 flex items-center gap-2">
            <Type className="w-4 h-4 text-ink/50" />
            Tipografia
          </h2>
          <div className="grid sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs text-ink/50 font-body mb-2">
                Fuente de titulos
              </label>
              <select
                value={settings.font_heading}
                onChange={(e) => setSettings((prev) => ({ ...prev, font_heading: e.target.value }))}
                className="w-full px-4 py-3 rounded-xl bg-white/[0.06] border border-ink/[0.08] text-ink font-body text-sm focus:outline-none focus:border-accent-gold/50 transition-colors appearance-none cursor-pointer"
              >
                {fontOptions.map((font) => (
                  <option key={font} value={font} className="bg-[#1a1a1a] text-white">
                    {font}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-ink/50 font-body mb-2">
                Fuente de cuerpo
              </label>
              <select
                value={settings.font_body}
                onChange={(e) => setSettings((prev) => ({ ...prev, font_body: e.target.value }))}
                className="w-full px-4 py-3 rounded-xl bg-white/[0.06] border border-ink/[0.08] text-ink font-body text-sm focus:outline-none focus:border-accent-gold/50 transition-colors appearance-none cursor-pointer"
              >
                {fontOptions.map((font) => (
                  <option key={font} value={font} className="bg-[#1a1a1a] text-white">
                    {font}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </ScrollReveal>

      {/* Tagline */}
      <ScrollReveal delay={0.2}>
        <div className="bg-paper-deep border border-ink/[0.06] rounded-2xl p-6">
          <label className="block text-xs text-ink/50 font-body mb-2">
            Tagline de empresa
          </label>
          <input
            type="text"
            value={settings.company_tagline}
            onChange={(e) => setSettings((prev) => ({ ...prev, company_tagline: e.target.value }))}
            placeholder="Tu slogan o frase principal"
            className="w-full px-4 py-3 rounded-xl bg-white/[0.06] border border-ink/[0.08] text-ink placeholder:text-ink/25 font-body text-sm focus:outline-none focus:border-accent-gold/50 transition-colors"
            maxLength={120}
          />
          <p className="text-[10px] text-ink/20 font-body mt-1.5">
            {settings.company_tagline.length}/120 caracteres
          </p>
        </div>
      </ScrollReveal>

      {/* Live preview */}
      <ScrollReveal delay={0.25}>
        <div className="bg-paper-deep border border-ink/[0.06] rounded-2xl p-6">
          <h2 className="font-heading font-semibold text-base text-ink mb-4 flex items-center gap-2">
            <Eye className="w-4 h-4 text-ink/50" />
            Vista previa
          </h2>
          <div className="rounded-xl border border-ink/[0.06] bg-white/[0.02] p-6">
            <div className="flex items-center gap-4 mb-4">
              {logoPreview ? (
                <img
                  src={logoPreview}
                  alt="Logo preview"
                  className="w-12 h-12 rounded-xl object-cover"
                />
              ) : (
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg"
                  style={{ backgroundColor: settings.primary_color }}
                >
                  P
                </div>
              )}
              <div>
                <h3
                  className="font-bold text-lg text-ink"
                  style={{ fontFamily: settings.font_heading }}
                >
                  Tu Empresa
                </h3>
                {settings.company_tagline && (
                  <p
                    className="text-sm text-ink/50"
                    style={{ fontFamily: settings.font_body }}
                  >
                    {settings.company_tagline}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div
                className="px-4 py-2 rounded-xl text-white text-sm font-medium"
                style={{ backgroundColor: settings.primary_color }}
              >
                Boton primario
              </div>
              <div
                className="px-4 py-2 rounded-xl text-white text-sm font-medium"
                style={{ backgroundColor: settings.secondary_color }}
              >
                Boton secundario
              </div>
            </div>
          </div>
        </div>
      </ScrollReveal>

      {/* Save button */}
      <div className="flex items-center gap-4 sticky bottom-4 z-10">
        <motion.div className="flex-1" whileTap={{ scale: 0.98 }}>
          <Button
            variant="gradient"
            size="xl"
            className="w-full gap-2"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : saved ? (
              <Check className="w-4 h-4" />
            ) : null}
            {saving ? "Guardando..." : saved ? "Guardado" : "Guardar cambios"}
          </Button>
        </motion.div>
        <Button
          variant="ghost"
          size="icon"
          className="h-14 w-14"
          onClick={() => { setLoading(true); fetchSettings(); }}
          title="Restablecer"
        >
          <RotateCcw className="w-4 h-4" />
        </Button>
      </div>

      {/* Error */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-accent-burgundy-soft/10 border border-accent-burgundy-soft/20 rounded-xl p-3"
        >
          <p className="text-sm text-accent-burgundy-soft font-body">{error}</p>
        </motion.div>
      )}
    </div>
  );
}
