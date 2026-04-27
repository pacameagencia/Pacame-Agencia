/**
 * PACAME VerificationBadges — visible slots for partnerships and certifications.
 *
 * Three trust tiers:
 *   - Asociaciones (Sequra, ICEX, Cámara, Confebask, ENAC)
 *   - Tech partners (Stripe, Google, Meta, Vercel, Supabase, GDPR)
 *   - Press (Forbes, El País, Genbeta, Marketing4Ecommerce, Startup Pulse)
 *
 * Each badge shows:
 *   - status="verified": logo + name + green pulse "Verificado"
 *   - status="review":   logo grey + name + amber pulse "En revisión"
 *   - status="pending":  silhouette + name + mustard pulse "Verificación en proceso"
 *
 * Spanish Modernism palette only. No violet, no neon.
 */

import Image from "next/image";

export type VerificationStatus = "verified" | "review" | "pending";

export interface Verification {
  name: string;
  logo?: string;
  status: VerificationStatus;
  url?: string;
  type?: "association" | "partner" | "press";
}

interface VerificationBadgesProps {
  items: Verification[];
  title?: string;
  subtitle?: string;
  layout?: "row" | "grid";
}

function StatusBadge({ status }: { status: VerificationStatus }) {
  if (status === "verified") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[9px] font-mono tracking-[0.18em] uppercase text-olive-600 bg-olive-500/10 border border-olive-500/30 rounded-sm">
        <span className="relative flex h-1.5 w-1.5">
          <span className="absolute inline-flex h-full w-full rounded-full bg-olive-500 opacity-50 animate-ping" />
          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-olive-500" />
        </span>
        Verificado
      </span>
    );
  }
  if (status === "review") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[9px] font-mono tracking-[0.18em] uppercase text-mustard-700 bg-mustard-500/10 border border-mustard-500/40 rounded-sm">
        <span className="relative flex h-1.5 w-1.5">
          <span className="absolute inline-flex h-full w-full rounded-full bg-mustard-500 opacity-60 animate-ping" />
          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-mustard-500" />
        </span>
        En revisión
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[9px] font-mono tracking-[0.18em] uppercase text-terracotta-700 bg-terracotta-500/10 border border-terracotta-500/30 rounded-sm">
      <span className="relative flex h-1.5 w-1.5">
        <span className="absolute inline-flex h-full w-full rounded-full bg-terracotta-500 opacity-50 animate-ping" />
        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-terracotta-500" />
      </span>
      En proceso
    </span>
  );
}

function BadgeCard({ v }: { v: Verification }) {
  const Tag = v.url ? "a" : "div";
  const dim = v.status !== "verified" ? "opacity-60" : "opacity-100";

  return (
    <Tag
      {...(v.url ? { href: v.url, target: "_blank", rel: "noopener noreferrer" } : {})}
      className={`group relative flex flex-col items-center gap-3 p-5 border border-ink/10 bg-sand-50/50 hover:bg-sand-50 hover:border-ink/20 transition-all duration-300 rounded-sm ${dim}`}
      aria-label={`${v.name} — ${v.status}`}
    >
      <div className="relative h-9 w-full flex items-center justify-center">
        {v.logo ? (
          <Image
            src={v.logo}
            alt={v.name}
            width={120}
            height={36}
            className="h-9 w-auto object-contain grayscale group-hover:grayscale-0 transition-all duration-300"
          />
        ) : (
          <span className="font-display italic text-[18px] text-ink/40">{v.name}</span>
        )}
      </div>
      <div className="flex flex-col items-center gap-1.5">
        <span className="text-[11px] font-sans font-medium text-ink/70 text-center">
          {v.name}
        </span>
        <StatusBadge status={v.status} />
      </div>
    </Tag>
  );
}

export default function VerificationBadges({
  items,
  title,
  subtitle,
  layout = "grid",
}: VerificationBadgesProps) {
  if (!items.length) return null;

  return (
    <section
      className="relative w-full"
      aria-live="polite"
      aria-label={title || "Verificaciones y partners"}
    >
      {(title || subtitle) && (
        <header className="mb-6 flex items-baseline gap-3 pb-3 border-b border-ink/10">
          {title && (
            <span className="text-[10px] md:text-[11px] font-mono uppercase tracking-[0.22em] text-mustard-600">
              § {title}
            </span>
          )}
          {subtitle && (
            <span className="text-[10px] md:text-[11px] font-mono uppercase tracking-[0.22em] text-ink/40">
              {subtitle}
            </span>
          )}
          <span className="h-px flex-1 bg-ink/10" />
        </header>
      )}

      <div
        className={
          layout === "row"
            ? "flex flex-wrap items-stretch gap-3 md:gap-4"
            : "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4"
        }
      >
        {items.map((v) => (
          <BadgeCard key={v.name} v={v} />
        ))}
      </div>

      <p className="mt-6 text-[11px] font-mono uppercase tracking-[0.18em] text-ink/35 text-center">
        Mostramos cada estado real. Si está &quot;en proceso&quot; es porque la verificación está activa, no decorativa.
      </p>
    </section>
  );
}

/**
 * Default association list para layout-level use.
 *
 * REGLA Sprint 26 (Pablo): solo logos oficiales. Para asociaciones
 * (Sequra/ICEX/Cámara/Confebask/ENAC) NO existe brand-mark en simple-icons
 * y NO tenemos derecho de uso confirmado → mantenemos placeholder con
 * `logo: undefined` (el componente renderiza wordmark editorial). Cuando
 * Pablo confirme la verificación, descargamos el SVG oficial de la propia
 * organización y se sustituye aquí.
 */
export const PACAME_ASSOCIATIONS: Verification[] = [
  { name: "Sequra", status: "pending", type: "association" },
  { name: "ICEX España", status: "pending", type: "association" },
  { name: "Cámara Madrid", status: "pending", type: "association" },
  { name: "Confebask", status: "pending", type: "association" },
  { name: "ENAC", status: "pending", type: "association" },
];

/**
 * Tech partners con logos OFICIALES (simple-icons CC0).
 * Stripe/Vercel/Supabase verified = SDK/cuenta activa con permisos full.
 * Google/Meta = review = aplicación enviada al programa partner.
 */
export const PACAME_PARTNERS: Verification[] = [
  { name: "Stripe", logo: "/logos/brands/stripe.svg", status: "verified", type: "partner" },
  { name: "Google", logo: "/logos/brands/google.svg", status: "review", type: "partner" },
  { name: "Meta", logo: "/logos/brands/meta.svg", status: "review", type: "partner" },
  { name: "Vercel", logo: "/logos/brands/vercel.svg", status: "verified", type: "partner" },
  { name: "Supabase", logo: "/logos/brands/supabase.svg", status: "verified", type: "partner" },
  { name: "GDPR / LOPDGDD", status: "verified", type: "partner" },
];

/**
 * Press: NO tenemos derecho de uso de logos hasta que aparezca mención
 * editorial real. Mantenemos placeholder con wordmark editorial.
 */
export const PACAME_PRESS: Verification[] = [
  { name: "Forbes España", status: "pending", type: "press" },
  { name: "El País", status: "pending", type: "press" },
  { name: "Genbeta", status: "pending", type: "press" },
  { name: "Marketing4Ecommerce", status: "pending", type: "press" },
  { name: "Startup Pulse", status: "pending", type: "press" },
];
