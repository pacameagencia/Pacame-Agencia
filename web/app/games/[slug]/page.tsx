import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Gamepad2, Sparkles } from "lucide-react";
import { createServerSupabase } from "@/lib/supabase/server";
import UnityLoader from "@/components/games/UnityLoader";

export const dynamic = "force-dynamic";

interface GameDetail {
  slug: string;
  title: string;
  description: string | null;
  engine: string;
  build_url: string | null;
  loader_url: string | null;
  data_url: string | null;
  framework_url: string | null;
  wasm_url: string | null;
  aspect_ratio: string | null;
  cover_image_url: string | null;
  tags: string[];
  is_active: boolean;
}

async function getGame(slug: string): Promise<GameDetail | null> {
  try {
    const supabase = createServerSupabase();
    const { data } = await supabase
      .from("games_catalog")
      .select(
        "slug, title, description, engine, build_url, loader_url, data_url, framework_url, wasm_url, aspect_ratio, cover_image_url, tags, is_active"
      )
      .eq("slug", slug)
      .eq("is_active", true)
      .maybeSingle();
    return (data as GameDetail | null) ?? null;
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const game = await getGame(slug);
  if (!game) return { title: "Game no encontrado · PACAME" };
  return {
    title: `${game.title} · PACAME Games`,
    description: game.description || "Experiencia interactiva PACAME",
    alternates: { canonical: `https://pacameagencia.com/games/${game.slug}` },
    openGraph: {
      title: game.title,
      description: game.description || undefined,
      images: game.cover_image_url ? [{ url: game.cover_image_url }] : undefined,
    },
  };
}

export default async function GameDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const game = await getGame(slug);
  if (!game) notFound();

  const hasBuild =
    !!game.loader_url && !!game.data_url && !!game.framework_url && !!game.wasm_url;

  return (
    <main className="min-h-screen bg-paper pt-24 pb-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back */}
        <Link
          href="/games"
          className="inline-flex items-center gap-2 text-ink/60 hover:text-ink text-sm font-body mb-6 transition"
        >
          <ArrowLeft className="w-4 h-4" /> Todos los games
        </Link>

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-creative/10 border border-creative/30 text-[11px] text-creative font-mono uppercase tracking-wider">
              <Gamepad2 className="w-3 h-3" />
              {game.engine}
            </span>
            {game.tags?.slice(0, 4).map((t) => (
              <span
                key={t}
                className="text-[11px] text-ink/50 bg-paper/5 px-2.5 py-1 rounded-full font-mono"
              >
                {t}
              </span>
            ))}
          </div>
          <h1 className="font-heading font-bold text-4xl md:text-5xl text-ink leading-tight mb-3">
            {game.title}
          </h1>
          {game.description && (
            <p className="text-ink/60 font-body text-lg max-w-3xl leading-relaxed">
              {game.description}
            </p>
          )}
        </div>

        {/* Player / Placeholder */}
        {hasBuild && game.engine === "unity" ? (
          <UnityLoader
            loaderUrl={game.loader_url!}
            dataUrl={game.data_url!}
            frameworkUrl={game.framework_url!}
            codeUrl={game.wasm_url!}
            aspectRatio={game.aspect_ratio || "16:9"}
            productName={game.title}
          />
        ) : (
          <div
            className="relative w-full rounded-3xl overflow-hidden bg-gradient-to-br from-brand-primary via-creative-deep to-paper"
            style={{ paddingTop: "56.25%" }}
          >
            {game.cover_image_url && (
              <img
                src={game.cover_image_url}
                alt={game.title}
                className="absolute inset-0 w-full h-full object-cover opacity-40"
              />
            )}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-10">
              <div className="w-16 h-16 rounded-2xl bg-paper/10 backdrop-blur border border-ink/20 flex items-center justify-center mb-5">
                <Sparkles className="w-8 h-8 text-accent-gold" />
              </div>
              <div className="text-accent-gold font-mono text-xs uppercase tracking-[0.2em] mb-2">
                Coming soon
              </div>
              <h3 className="font-heading font-bold text-3xl text-ink mb-3">
                Estamos construyendo algo brutal
              </h3>
              <p className="text-ink/70 font-body max-w-md">
                El equipo PACAME esta trabajando en esta experiencia. Te avisamos
                cuando este lista.
              </p>
            </div>
          </div>
        )}

        {/* Instructions / info */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-5 rounded-2xl bg-paper-deep border border-ink/[0.06]">
            <div className="text-[11px] text-ink/40 font-mono uppercase tracking-wider mb-1">
              Engine
            </div>
            <div className="font-heading font-semibold text-ink">
              {game.engine === "unity" && "Unity WebGL"}
              {game.engine === "threejs" && "Three.js"}
              {game.engine === "phaser" && "Phaser 3"}
              {game.engine === "html5" && "HTML5 Canvas"}
            </div>
          </div>
          <div className="p-5 rounded-2xl bg-paper-deep border border-ink/[0.06]">
            <div className="text-[11px] text-ink/40 font-mono uppercase tracking-wider mb-1">
              Controles
            </div>
            <div className="font-heading font-semibold text-ink text-sm">
              Teclado + raton / touch
            </div>
          </div>
          <div className="p-5 rounded-2xl bg-paper-deep border border-ink/[0.06]">
            <div className="text-[11px] text-ink/40 font-mono uppercase tracking-wider mb-1">
              Full screen
            </div>
            <div className="font-heading font-semibold text-ink text-sm">
              Pulsa F11 o boton fullscreen
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
