import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { ReactNode } from "react";

interface Props {
  kicker: string;
  title: string;
  titleAccent?: string;
  desc: string;
  children: ReactNode;
  ctaText?: string;
  ctaHref?: string;
  ctaKicker?: string;
}

/**
 * Shared editorial layout para todas las tools gratis.
 * Hero con chrono + headline + sub + CTA sticky bottom.
 */
export default function ToolLayout({
  kicker,
  title,
  titleAccent,
  desc,
  children,
  ctaText = "Ver todos los servicios PACAME",
  ctaHref = "/servicios",
  ctaKicker = "¿Necesitas que lo hagamos por ti?",
}: Props) {
  return (
    <main className="min-h-screen bg-paper pb-32">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-10">
        <Link
          href="/herramientas"
          className="inline-flex items-center gap-1.5 text-[13px] font-body text-ink/50 hover:text-ink transition-colors mb-6"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Volver a herramientas
        </Link>

        <div className="flex items-baseline gap-3 text-[11px] font-mono uppercase tracking-[0.22em] text-ink/45 mb-6 border-b border-ink/10 pb-3">
          <span className="text-accent-gold">{kicker}</span>
          <span className="h-px w-8 bg-ink/20" />
          <span>Herramienta gratis · Sin registro previo</span>
        </div>

        <h1 className="font-heading font-bold text-[clamp(2rem,5vw,4rem)] text-ink leading-[0.95] tracking-[-0.03em] mb-5">
          {titleAccent ? (
            <>
              {title.split(titleAccent)[0]}
              <span className="font-accent italic font-normal text-accent-gold">
                {titleAccent}
              </span>
              {title.split(titleAccent)[1] || ""}
              <span className="text-accent-burgundy">.</span>
            </>
          ) : (
            <>
              {title}
              <span className="text-accent-burgundy">.</span>
            </>
          )}
        </h1>

        <p className="text-[17px] md:text-[18px] text-ink/60 font-body leading-relaxed max-w-2xl mb-10">
          {desc}
        </p>

        {children}

        <div className="mt-20 p-8 md:p-10 rounded-3xl border border-accent-gold/20 bg-gradient-to-br from-accent-gold/[0.06] to-transparent">
          <div className="text-[11px] font-mono uppercase tracking-[0.22em] text-accent-gold mb-3">
            {ctaKicker}
          </div>
          <h3 className="font-heading font-bold text-2xl md:text-3xl text-ink leading-tight mb-4">
            Hazlo con nosotros en dias, no meses.
          </h3>
          <p className="text-ink/60 font-body mb-6 leading-relaxed max-w-xl">
            24 servicios desde 49€. Bundle con descuento. Entrega garantizada.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href={ctaHref}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-accent-gold text-paper font-heading font-semibold text-[13px] hover:brightness-110 transition"
            >
              {ctaText}
            </Link>
            <Link
              href="/encuentra-tu-solucion"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-ink border border-ink/15 hover:border-ink/30 font-heading font-medium text-[13px] transition"
            >
              Quiz 2 min
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
