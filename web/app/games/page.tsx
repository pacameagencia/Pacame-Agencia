import type { Metadata } from "next";
import Link from "next/link";
import { createServerSupabase } from "@/lib/supabase/server";
import { Gamepad2, Sparkles, Play } from "lucide-react";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Games — Experiencias interactivas PACAME",
  description:
    "Experiencias jugables desarrolladas por PACAME. Unity WebGL, Three.js, 3D interactivo, inmersivo. Prueba nuestras demos.",
  alternates: { canonical: "https://pacameagencia.com/games" },
  openGraph: {
    title: "Games · PACAME",
    description: "Demos interactivas 3D + Unity WebGL.",
    images: [{ url: "/opengraph-image", width: 1200, height: 630 }],
  },
};

interface GameRow {
  slug: string;
  title: string;
  description: string | null;
  thumbnail_url: string | null;
  cover_image_url: string | null;
  engine: string;
  is_featured: boolean;
  play_count: number;
  tags: string[];
}

async function listGames(): Promise<GameRow[]> {
  try {
    const supabase = createServerSupabase();
    const { data } = await supabase
      .from("games_catalog")
      .select(
        "slug, title, description, thumbnail_url, cover_image_url, engine, is_featured, play_count, tags"
      )
      .eq("is_active", true)
      .order("is_featured", { ascending: false })
      .order("created_at", { ascending: false });
    return (data || []) as GameRow[];
  } catch {
    return [];
  }
}

export default async function GamesPage() {
  const games = await listGames();
  const featured = games.find((g) => g.is_featured);
  const rest = games.filter((g) => !g.is_featured);

  return (
    <main className="min-h-screen bg-paper pt-24 pb-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Hero */}
        <div className="mb-14 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 mb-5 rounded-full bg-creative/10 border border-creative/30">
            <Gamepad2 className="w-3.5 h-3.5 text-creative" />
            <span className="text-[11px] text-creative font-mono uppercase tracking-wider">
              Laboratorio interactivo
            </span>
          </div>
          <h1 className="font-heading font-bold text-5xl md:text-7xl text-ink leading-[0.95] mb-5">
            Games &<br />
            <span className="bg-gradient-to-r from-brand-primary via-creative to-accent-burgundy bg-clip-text text-transparent">
              experiencias inmersivas
            </span>
          </h1>
          <p className="text-ink/60 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
            Demos jugables construidas con <strong className="text-ink">Unity WebGL</strong>,
            Three.js y canvas interactivo. Para probar el potencial de la
            plataforma con tus propias manos.
          </p>
        </div>

        {/* Featured */}
        {featured && (
          <Link
            href={`/games/${featured.slug}`}
            className="group block mb-12 rounded-3xl overflow-hidden bg-ink text-paper relative aspect-[16/9] md:aspect-[21/9] hover:shadow-2xl transition-shadow"
          >
            {featured.cover_image_url ? (
              <img
                src={featured.cover_image_url}
                alt={featured.title}
                className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-75 transition"
              />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-brand-primary via-creative-deep to-ink" />
            )}

            {/* Overlay content */}
            <div className="absolute inset-0 flex flex-col justify-end p-8 md:p-12 bg-gradient-to-t from-ink via-ink/60 to-transparent">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-4 h-4 text-accent-gold" />
                <span className="text-[11px] text-accent-gold font-mono uppercase tracking-wider">
                  Destacado
                </span>
              </div>
              <h2 className="font-heading font-bold text-3xl md:text-5xl mb-3">
                {featured.title}
              </h2>
              {featured.description && (
                <p className="text-paper/80 font-body max-w-xl leading-relaxed mb-5">
                  {featured.description}
                </p>
              )}
              <div className="inline-flex items-center gap-2 text-sm">
                <span className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-accent-gold text-ink font-semibold group-hover:brightness-110 transition">
                  <Play className="w-4 h-4" /> Jugar ahora
                </span>
                <span className="text-paper/60 font-mono text-xs ml-3">
                  {featured.engine.toUpperCase()}
                </span>
              </div>
            </div>
          </Link>
        )}

        {/* Grid */}
        {rest.length > 0 && (
          <>
            <h3 className="font-heading font-semibold text-xl text-ink mb-6">
              Todos los juegos
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {rest.map((g) => (
                <Link
                  key={g.slug}
                  href={`/games/${g.slug}`}
                  className="group block rounded-2xl overflow-hidden bg-paper-deep border border-ink/[0.06] hover:border-ink/[0.12] hover:shadow-lg transition-all"
                >
                  <div className="aspect-video relative bg-ink overflow-hidden">
                    {g.thumbnail_url ? (
                      <img
                        src={g.thumbnail_url}
                        alt={g.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-brand-primary to-creative flex items-center justify-center">
                        <Gamepad2 className="w-12 h-12 text-paper/40" />
                      </div>
                    )}
                    <div className="absolute top-3 right-3 px-2 py-0.5 rounded-md bg-ink/80 backdrop-blur text-[10px] text-paper font-mono uppercase tracking-wider">
                      {g.engine}
                    </div>
                  </div>
                  <div className="p-5">
                    <h4 className="font-heading font-semibold text-lg text-ink mb-1 group-hover:text-brand-primary transition">
                      {g.title}
                    </h4>
                    {g.description && (
                      <p className="text-ink/60 font-body text-sm line-clamp-2">
                        {g.description}
                      </p>
                    )}
                    {g.tags?.length > 0 && (
                      <div className="flex gap-1 mt-3 flex-wrap">
                        {g.tags.slice(0, 3).map((t) => (
                          <span
                            key={t}
                            className="text-[10px] text-ink/50 bg-ink/5 px-2 py-0.5 rounded-full font-mono"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}

        {/* Empty */}
        {games.length === 0 && (
          <div className="text-center py-20 text-ink/40">
            <Gamepad2 className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p className="font-body">Aun no hay juegos publicados. Volvera pronto.</p>
          </div>
        )}
      </div>
    </main>
  );
}
