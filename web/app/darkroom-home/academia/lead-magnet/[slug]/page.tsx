/**
 * Dark Academy · Página de captura email por lead magnet específico.
 *
 * URL pública: `darkroomcreative.cloud/academia/lead-magnet/[slug]`.
 * Resuelve magnet desde Supabase. Si no existe o no está published → 404.
 *
 * Server component que renderiza shell + delega form a client component
 * `AcademyCaptureForm`.
 */

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ensureDarkRoomHost } from "@/lib/darkroom/host-guard";
import { createServerSupabase } from "@/lib/supabase/server";
import AcademyCaptureForm from "@/components/darkroom/AcademyCaptureForm";

interface PageProps {
  params: Promise<{ slug: string }>;
}

interface MagnetData {
  id: string;
  module_id: string | null;
  slug: string;
  title: string;
  description: string;
  format: string;
  published: boolean;
}

interface ModuleData {
  id: string;
  title: string;
}

async function getMagnet(slug: string): Promise<{ magnet: MagnetData; module: ModuleData | null } | null> {
  const supabase = createServerSupabase();

  const { data: magnetData } = await supabase
    .from("academy_lead_magnets")
    .select("id, module_id, slug, title, description, format, published")
    .eq("slug", slug)
    .maybeSingle();

  const magnet = magnetData as MagnetData | null;
  if (!magnet || !magnet.published) return null;

  let mod: ModuleData | null = null;
  if (magnet.module_id) {
    const { data: modData } = await supabase
      .from("academy_modules")
      .select("id, title")
      .eq("id", magnet.module_id)
      .maybeSingle();
    mod = modData as ModuleData | null;
  }

  return { magnet, module: mod };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const data = await getMagnet(slug);
  if (!data) {
    return {
      title: "Recurso no disponible · Dark Academy",
      robots: { index: false, follow: false },
    };
  }
  return {
    title: `${data.magnet.title} · Dark Academy`,
    description: data.magnet.description,
    alternates: {
      canonical: `https://darkroomcreative.cloud/academia/lead-magnet/${data.magnet.slug}`,
    },
    openGraph: {
      type: "article",
      title: `${data.magnet.title} · Dark Academy`,
      description: data.magnet.description,
      url: `https://darkroomcreative.cloud/academia/lead-magnet/${data.magnet.slug}`,
      siteName: "Dark Academy",
      locale: "es_ES",
    },
    robots: { index: true, follow: true },
  };
}

const C = {
  bg: "#0A0A0A",
  bgSoft: "#141414",
  bgCard: "#161616",
  border: "rgba(255,255,255,0.08)",
  borderGold: "rgba(212,175,55,0.25)",
  text: "#F5F5F0",
  textMid: "#A1A1AA",
  textLow: "#71717A",
  gold: "#D4AF37",
  fontDisplay: '"Space Grotesk", Inter, system-ui, -apple-system, "Segoe UI", sans-serif',
  fontBody: 'Inter, system-ui, -apple-system, "Segoe UI", sans-serif',
  fontMono: '"JetBrains Mono", ui-monospace, "SF Mono", Menlo, Consolas, monospace',
};

export default async function LeadMagnetCapturePage({ params }: PageProps) {
  await ensureDarkRoomHost();

  const { slug } = await params;
  const data = await getMagnet(slug);
  if (!data) notFound();

  const { magnet, module: mod } = data;

  return (
    <main
      style={{
        background: C.bg,
        color: C.text,
        fontFamily: C.fontBody,
        minHeight: "100vh",
      }}
    >
      <section style={{ maxWidth: 720, margin: "0 auto", padding: "80px 24px 64px" }}>
        <Link
          href="/academia"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            color: C.textMid,
            textDecoration: "none",
            fontSize: 12,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            marginBottom: 24,
            fontFamily: C.fontMono,
          }}
        >
          ← Volver a la academia
        </Link>

        <div
          aria-hidden="true"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "5px 12px",
            border: `1px solid ${C.gold}`,
            color: C.gold,
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            marginBottom: 20,
          }}
        >
          {mod ? `Lead magnet · ${mod.id}` : "Lead magnet"}
        </div>

        <h1
          style={{
            fontFamily: C.fontDisplay,
            fontSize: "clamp(30px, 5vw, 44px)",
            fontWeight: 700,
            lineHeight: 1.1,
            letterSpacing: "-0.02em",
            margin: "0 0 16px",
            color: C.text,
          }}
        >
          {magnet.title}
        </h1>

        <p
          style={{
            fontSize: 17,
            color: C.textMid,
            lineHeight: 1.6,
            margin: "0 0 32px",
          }}
        >
          {magnet.description}
        </p>

        {mod && (
          <div
            style={{
              background: C.bgSoft,
              border: `1px solid ${C.borderGold}`,
              padding: "14px 18px",
              borderRadius: 6,
              margin: "0 0 32px",
              fontSize: 13,
              color: C.textMid,
            }}
          >
            <span style={{ color: C.gold, fontFamily: C.fontMono, fontSize: 12, letterSpacing: "0.06em" }}>
              {mod.id} · {mod.title}
            </span>
            <br />
            Este recurso es la entrada al módulo. Te llega al email tras registrarte.
          </div>
        )}

        <AcademyCaptureForm magnetSlug={magnet.slug} magnetTitle={magnet.title} />

        <p
          style={{
            fontSize: 13,
            color: C.textLow,
            margin: "24px 0 0",
            lineHeight: 1.6,
            textAlign: "center",
          }}
        >
          Formato: {magnet.format.toUpperCase()} · Se entrega por email tras confirmar.
          Sin spam. Cancelas con 1 clic.
        </p>
      </section>
    </main>
  );
}
