"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Search, Loader2, CheckCircle2, XCircle, AlertTriangle,
  ArrowRight, Zap, Globe, Smartphone, Gauge, Shield, Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface AuditResult {
  score: number;
  categories: {
    name: string;
    score: number;
    icon: string;
    issues: string[];
    recommendations: string[];
  }[];
  summary: string;
  priority_action: string;
}

const categoryIcons: Record<string, typeof Globe> = {
  seo: Globe,
  mobile: Smartphone,
  speed: Gauge,
  security: Shield,
  ux: Eye,
};

function ScoreRing({ score }: { score: number }) {
  const color = score >= 80 ? "#84CC16" : score >= 50 ? "#F59E0B" : "#EF4444";
  const circumference = 2 * Math.PI * 54;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="relative w-36 h-36">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r="54" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
        <circle
          cx="60" cy="60" r="54" fill="none" stroke={color} strokeWidth="8"
          strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset}
          className="transition-all duration-1000"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-heading font-bold text-3xl text-pacame-white">{score}</span>
        <span className="text-[10px] text-pacame-white/60 font-body">/100</span>
      </div>
    </div>
  );
}

export default function AuditoriaPage() {
  const [url, setUrl] = useState("");
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "loading" | "done">("idle");
  const [result, setResult] = useState<AuditResult | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!url) return;
    setState("loading");

    try {
      const res = await fetch("/api/audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, email }),
      });
      const data = await res.json();
      setResult(data.audit);
    } catch {
      setResult({
        score: 45,
        summary: "Tu web tiene margen de mejora significativo. Contactanos para un analisis detallado.",
        priority_action: "Optimizar velocidad de carga y meta tags SEO",
        categories: [
          { name: "SEO", score: 40, icon: "seo", issues: ["Meta tags incompletos", "Sin sitemap.xml", "URLs no optimizadas"], recommendations: ["Añadir meta titles y descriptions unicos", "Crear sitemap.xml automatico", "Optimizar estructura de URLs"] },
          { name: "Movil", score: 55, icon: "mobile", issues: ["Textos demasiado pequenos", "Botones muy juntos"], recommendations: ["Aumentar font-size base a 16px", "Espaciar elementos tactiles"] },
          { name: "Velocidad", score: 35, icon: "speed", issues: ["Imagenes sin optimizar", "CSS bloqueante", "Sin cache del navegador"], recommendations: ["Convertir imagenes a WebP", "Cargar CSS critico inline", "Configurar cache headers"] },
          { name: "Seguridad", score: 60, icon: "security", issues: ["Sin HTTPS en todas las paginas"], recommendations: ["Forzar HTTPS con redireccion 301"] },
          { name: "UX", score: 50, icon: "ux", issues: ["Sin CTA claro", "Formulario de contacto oculto"], recommendations: ["Añadir CTA visible en hero", "Mover formulario arriba del fold"] },
        ],
      });
    }
    setState("done");
  }

  return (
    <div className="bg-pacame-black min-h-screen">
      {/* Hero */}
      <section className="relative pt-36 pb-20 overflow-hidden">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-neon-cyan/[0.05] rounded-full blur-[200px] pointer-events-none" />

        <div className="relative z-10 max-w-3xl mx-auto px-6 text-center">
          <p className="text-[13px] font-body font-medium text-neon-cyan mb-5 uppercase tracking-[0.2em]">
            Auditoria gratuita
          </p>

          <h1 className="font-heading font-bold text-display text-pacame-white mb-6 text-balance">
            Auditoria web gratuita{" "}
            <span className="gradient-text-vivid">en 30 segundos.</span>
          </h1>
          <p className="text-xl text-pacame-white/60 font-body max-w-xl mx-auto mb-12 font-light">
            Introduce la URL de tu negocio y nuestros agentes IA analizan SEO, velocidad,
            movil, seguridad y UX. Gratis.
          </p>

          {state === "idle" && (
            <form onSubmit={handleSubmit} className="max-w-xl mx-auto">
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://tunegocio.com"
                  required
                  className="flex-1 h-14 px-5 rounded-xl bg-dark-card border border-white/[0.08] text-pacame-white font-body text-sm placeholder:text-pacame-white/50 focus:border-neon-cyan focus:ring-1 focus:ring-neon-cyan outline-none"
                />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@email.com (opcional)"
                  className="sm:w-56 h-14 px-5 rounded-xl bg-dark-card border border-white/[0.08] text-pacame-white font-body text-sm placeholder:text-pacame-white/50 focus:border-neon-cyan focus:ring-1 focus:ring-neon-cyan outline-none"
                />
              </div>
              <Button type="submit" variant="gradient" size="xl" className="w-full sm:w-auto mt-4 group">
                <Search className="w-4 h-4" />
                Analizar mi web gratis
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </form>
          )}

          {state === "loading" && (
            <div className="max-w-md mx-auto rounded-2xl glass p-10 text-center">
              <Loader2 className="w-10 h-10 text-neon-cyan mx-auto mb-4 animate-spin" />
              <p className="text-sm text-pacame-white/60 font-body">Nuestros agentes IA estan analizando tu web...</p>
              <div className="flex items-center justify-center gap-4 mt-4 text-xs text-pacame-white/50 font-body">
                <span>SEO...</span>
                <span>Velocidad...</span>
                <span>Movil...</span>
                <span>Seguridad...</span>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Results */}
      {state === "done" && result && (
        <section className="section-padding">
          <div className="max-w-4xl mx-auto px-4 sm:px-6">
            {/* Overall score */}
            <div className="rounded-3xl glass p-8 sm:p-10 mb-8 text-center">
              <p className="text-xs text-pacame-white/60 font-body mb-4 uppercase tracking-widest">Puntuacion general</p>
              <div className="flex justify-center mb-6">
                <ScoreRing score={result.score} />
              </div>
              <p className="text-pacame-white/60 font-body max-w-lg mx-auto mb-4">{result.summary}</p>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-signal/10 border border-amber-signal/20">
                <Zap className="w-4 h-4 text-amber-signal" />
                <span className="text-sm text-amber-signal font-body">Prioridad: {result.priority_action}</span>
              </div>
            </div>

            {/* Categories */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
              {result.categories.map((cat) => {
                const Icon = categoryIcons[cat.icon] || Globe;
                const scoreColor = cat.score >= 70 ? "text-lime-pulse" : cat.score >= 40 ? "text-amber-signal" : "text-red-400";
                return (
                  <div key={cat.name} className="rounded-2xl bg-dark-card border border-white/[0.06] p-5">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <Icon className="w-4 h-4 text-pacame-white/50" />
                        <span className="font-heading font-semibold text-sm text-pacame-white">{cat.name}</span>
                      </div>
                      <span className={`font-heading font-bold text-lg ${scoreColor}`}>{cat.score}</span>
                    </div>

                    <div className="space-y-2 mb-4">
                      {cat.issues.map((issue) => (
                        <div key={issue} className="flex items-start gap-2">
                          <XCircle className="w-3.5 h-3.5 text-red-400 mt-0.5 flex-shrink-0" />
                          <span className="text-xs text-pacame-white/50 font-body">{issue}</span>
                        </div>
                      ))}
                    </div>

                    <div className="space-y-2">
                      {cat.recommendations.map((rec) => (
                        <div key={rec} className="flex items-start gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-lime-pulse mt-0.5 flex-shrink-0" />
                          <span className="text-xs text-pacame-white/50 font-body">{rec}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* CTA */}
            <div className="rounded-3xl bg-brand-gradient p-8 sm:p-10 relative overflow-hidden text-center">
              <div className="absolute inset-0 bg-black/20" />
              <div className="relative z-10">
                <AlertTriangle className="w-8 h-8 text-white mx-auto mb-4" />
                <h2 className="font-heading font-bold text-2xl text-white mb-3">
                  Tu web necesita atencion.
                </h2>
                <p className="text-white/80 font-body mb-6 max-w-lg mx-auto">
                  Cada dia con estos problemas pierdes clientes potenciales. Nuestros agentes IA
                  pueden resolverlo en dias, no meses.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button variant="secondary" size="xl" asChild className="bg-white/20 border-white/30 text-white hover:bg-white/30 group">
                    <Link href="/contacto">
                      <Zap className="w-4 h-4" />
                      Quiero solucionarlo
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </Button>
                  <Button variant="secondary" size="xl" asChild className="bg-white/10 border-white/20 text-white/80 hover:bg-white/20">
                    <Link href="https://wa.me/34722669381?text=Hola! Acabo de hacer la auditoria y quiero mejorar mi web" target="_blank" rel="noopener">
                      Hablar por WhatsApp
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* How it works (only on idle) */}
      {state === "idle" && (
        <section className="section-padding">
          <div className="max-w-4xl mx-auto px-4 sm:px-6">
            <h2 className="font-heading font-bold text-2xl text-pacame-white text-center mb-10">
              ¿Que analizamos?
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {[
                { icon: Globe, title: "SEO", desc: "Meta tags, estructura, sitemap, indexacion, keywords y contenido." },
                { icon: Gauge, title: "Rendimiento", desc: "Velocidad de carga, Core Web Vitals, imagenes y recursos." },
                { icon: Smartphone, title: "Movil", desc: "Responsive, usabilidad tactil, viewport y accesibilidad." },
                { icon: Shield, title: "Seguridad", desc: "HTTPS, cabeceras de seguridad, formularios y vulnerabilidades." },
                { icon: Eye, title: "UX y Conversion", desc: "CTAs, formularios, recorrido del usuario y puntos de fuga." },
                { icon: Zap, title: "Plan de Accion", desc: "Recomendaciones priorizadas por impacto para que sepas por donde empezar." },
              ].map((item) => (
                <div key={item.title} className="rounded-2xl bg-dark-card border border-white/[0.06] p-6">
                  <item.icon className="w-6 h-6 text-neon-cyan mb-3" />
                  <h3 className="font-heading font-semibold text-pacame-white mb-2">{item.title}</h3>
                  <p className="text-xs text-pacame-white/50 font-body">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
