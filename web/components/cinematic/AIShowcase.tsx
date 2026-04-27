"use client";

/**
 * PACAME — AIShowcase (Sprint 27)
 *
 * Sección que comunica "usamos las IAs más punteras del mercado".
 * Grid de 6 IAs con poster generado (Atlas Cloud) + slot opcional para
 * video demo + link a la página oficial de cada IA.
 *
 * Estrategia honesta: el poster muestra la calidad que esa IA puede
 * generar (no inventamos que sea nuestro). El usuario ve "ah, esta es
 * la calidad que PACAME puede entregarme porque usa esa IA".
 *
 * Cuando Pablo descargue videos demo oficiales (CC0 o con permiso) los
 * pone en /public/videos/ai-showcase/{slug}.mp4 y el componente los usa
 * automáticamente como background autoplay muted loop. Mientras no
 * existan, se muestra el poster estático.
 */

import Image from "next/image";
import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { ArrowUpRight, Play, Sparkles } from "lucide-react";
import KineticHeading from "./KineticHeading";
import { EASE_APPLE } from "@/lib/animations/easings";

interface AITool {
  /** Slug interno (ruta archivo poster + video) */
  slug: string;
  /** Nombre comercial */
  name: string;
  /** Vendor / empresa */
  vendor: string;
  /** Categoría corta (kicker) */
  category: string;
  /** Una línea de qué hace para el cliente PACAME */
  tagline: string;
  /** URL oficial para "Ver demo" */
  officialUrl: string;
  /** Si existe video MP4 en /public/videos/ai-showcase/{slug}.mp4 (Pablo lo añade) */
  hasVideo?: boolean;
}

const AI_TOOLS: AITool[] = [
  {
    slug: "sora",
    name: "Sora",
    vendor: "OpenAI",
    category: "Video",
    tagline: "Generamos vídeos cinematográficos a partir de un brief.",
    officialUrl: "https://openai.com/sora",
  },
  {
    slug: "veo",
    name: "Veo 3",
    vendor: "Google DeepMind",
    category: "Video HD",
    tagline: "Spots y reels en calidad estudio sin rodaje.",
    officialUrl: "https://deepmind.google/models/veo/",
  },
  {
    slug: "runway",
    name: "Runway Gen-3",
    vendor: "Runway",
    category: "Motion design",
    tagline: "Postproducción y motion para tus campañas Meta/Google.",
    officialUrl: "https://runwayml.com/",
  },
  {
    slug: "midjourney",
    name: "Midjourney v6",
    vendor: "Midjourney",
    category: "Imagen editorial",
    tagline: "Visuales únicos para tu web, ads y RRSS.",
    officialUrl: "https://www.midjourney.com/",
  },
  {
    slug: "chatgpt-image",
    name: "GPT Image",
    vendor: "OpenAI",
    category: "Producto + UI",
    tagline: "Mockups, iconos y composiciones product-grade.",
    officialUrl: "https://openai.com/index/introducing-4o-image-generation/",
  },
  {
    slug: "claude",
    name: "Claude 4",
    vendor: "Anthropic",
    category: "Copy + estrategia",
    tagline: "Copywriting, estrategia y código revisado por humanos.",
    officialUrl: "https://www.anthropic.com/claude",
  },
  {
    slug: "kling",
    name: "Kling AI",
    vendor: "Kuaishou",
    category: "Video acción",
    tagline: "Movimiento humano y dinamismo para campañas brand.",
    officialUrl: "https://kling.kuaishou.com/",
  },
];

export default function AIShowcase() {
  return (
    <section
      id="ai-showcase"
      className="relative overflow-hidden bg-tech-bg py-32 md:py-44 text-tech-text"
    >
      {/* Background mesh sutil */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-50"
      >
        <div className="absolute right-1/4 top-1/3 h-[40rem] w-[40rem] rounded-full bg-tech-accent/5 blur-[140px]" />
        <div className="absolute left-1/4 bottom-1/4 h-[30rem] w-[30rem] rounded-full bg-tech-accent-2/8 blur-[120px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-6">
        {/* Header */}
        <div className="mb-16 max-w-3xl md:mb-20">
          <span className="mb-6 inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.22em] text-tech-text-mute">
            <span className="h-px w-8 bg-tech-accent" />
            Capítulo · Tecnología
          </span>
          <KineticHeading
            as="h2"
            className="font-sans font-semibold tracking-tight text-tech-text"
            style={{
              fontSize: "clamp(2.25rem, 5vw, 4rem)",
              lineHeight: "1.05",
              letterSpacing: "-0.035em",
            }}
            ariaLabel="Calidad de Hollywood. Precio de PYME."
          >
            <span className="block">Calidad de Hollywood.</span>
            <span
              className="block font-light"
              style={{
                background:
                  "linear-gradient(120deg, var(--tech-accent) 0%, var(--tech-accent-2) 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              Precio de PYME.
            </span>
          </KineticHeading>
          <p className="mt-6 max-w-2xl text-[16px] leading-relaxed text-tech-text-soft md:text-[18px]">
            Trabajamos con los modelos generativos más punteros del mundo: Sora,
            Veo&nbsp;3, Runway, Midjourney, GPT Image, Kling, Claude. Tú no
            pagas la licencia ni la curva de aprendizaje — eso ya lo
            absorbimos nosotros. Tú recibes la calidad final.
          </p>
        </div>

        {/* Disclaimer honesto */}
        <div className="mb-12 inline-flex items-center gap-2 rounded-full border border-tech-warning/40 bg-tech-warning/5 px-4 py-2">
          <Sparkles className="h-3.5 w-3.5 text-tech-warning" strokeWidth={2.2} />
          <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-tech-warning">
            Posters representativos · Calidad real de cada modelo
          </span>
        </div>

        {/* Grid */}
        <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
          {AI_TOOLS.map((tool, i) => (
            <motion.li
              key={tool.slug}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-10%" }}
              transition={{
                duration: 0.7,
                delay: (i % 3) * 0.08,
                ease: EASE_APPLE,
              }}
            >
              <AICard tool={tool} />
            </motion.li>
          ))}
        </ul>

        {/* Footer line */}
        <p className="mt-16 max-w-2xl text-[13px] leading-relaxed text-tech-text-soft border-t border-tech-border-soft pt-6">
          Cada proyecto se entrega con outputs revisados, anotados y firmados
          por Pablo Calleja. La IA acelera, el humano garantiza.
        </p>
      </div>
    </section>
  );
}

function AICard({ tool }: { tool: AITool }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hovering, setHovering] = useState(false);

  return (
    <a
      href={tool.officialUrl}
      target="_blank"
      rel="noopener noreferrer"
      data-cursor="hover"
      onMouseEnter={() => {
        setHovering(true);
        videoRef.current?.play().catch(() => {});
      }}
      onMouseLeave={() => {
        setHovering(false);
        videoRef.current?.pause();
      }}
      className="group relative block overflow-hidden rounded-2xl border border-tech-border bg-tech-surface transition-all duration-500 hover:border-tech-accent/50 hover:shadow-tech-glow focus:outline-none focus-visible:ring-2 focus-visible:ring-tech-accent/40"
      aria-label={`${tool.name} de ${tool.vendor} — abrir página oficial`}
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-tech-elevated">
        {/* Poster generado con Atlas Cloud (WebP optimizado) */}
        <Image
          src={`/generated/optimized/ai-showcase/${tool.slug}-poster.webp`}
          alt={`Ejemplo de calidad visual generado con ${tool.name}`}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className={`object-cover transition-all duration-700 ${
            hovering && tool.hasVideo ? "opacity-0" : "opacity-100"
          } group-hover:scale-[1.04]`}
        />

        {/* Video opcional — Pablo lo añade en /public/videos/ai-showcase/{slug}.mp4 */}
        {tool.hasVideo && (
          <video
            ref={videoRef}
            src={`/videos/ai-showcase/${tool.slug}.mp4`}
            poster={`/generated/optimized/ai-showcase/${tool.slug}-poster.webp`}
            muted
            loop
            playsInline
            preload="none"
            className="absolute inset-0 h-full w-full object-cover transition-opacity duration-500"
            style={{ opacity: hovering ? 1 : 0 }}
          />
        )}

        {/* Top gradient mask + badge play si hay video */}
        <div className="absolute inset-0 bg-gradient-to-b from-tech-bg/30 via-transparent to-tech-bg/95" />
        {tool.hasVideo && (
          <div className="absolute right-4 top-4 inline-flex h-8 w-8 items-center justify-center rounded-full border border-tech-text/20 bg-tech-bg/60 text-tech-text backdrop-blur-sm transition-all duration-300 group-hover:border-tech-accent group-hover:text-tech-accent">
            <Play className="h-3.5 w-3.5 fill-current" />
          </div>
        )}

        {/* Top kicker */}
        <div className="absolute left-4 top-4">
          <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-tech-text/80 backdrop-blur-sm">
            {tool.category}
          </span>
        </div>

        {/* Bottom name + vendor */}
        <div className="absolute inset-x-0 bottom-0 p-5">
          <div
            className="font-sans text-[26px] font-semibold leading-none tracking-tight text-tech-text"
            style={{ letterSpacing: "-0.02em" }}
          >
            {tool.name}
          </div>
          <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.2em] text-tech-text-soft">
            {tool.vendor}
          </div>
        </div>
      </div>

      {/* Tagline + CTA */}
      <div className="flex items-start justify-between gap-3 border-t border-tech-border-soft p-5">
        <p className="text-[13px] leading-relaxed text-tech-text-soft">
          {tool.tagline}
        </p>
        <ArrowUpRight
          className="mt-0.5 h-4 w-4 flex-shrink-0 text-tech-text-mute transition-all duration-300 group-hover:rotate-45 group-hover:text-tech-accent"
          strokeWidth={1.8}
        />
      </div>
    </a>
  );
}
