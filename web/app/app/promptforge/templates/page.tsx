import Link from "next/link";
import { requireProductUser } from "@/lib/products/session";
import { createServerSupabase } from "@/lib/supabase/server";
import { LayoutTemplate, Sparkles, Lock } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";

export const dynamic = "force-dynamic";

interface Template {
  id: string;
  modality: string;
  target: string | null;
  use_case: string | null;
  title: string;
  description: string | null;
  popularity: number;
  is_pro: boolean;
}

const MODALITY_LABEL: Record<string, string> = {
  text: "Texto",
  image: "Imagen",
  video: "Vídeo",
  audio: "Audio",
};

export default async function TemplatesPage({
  searchParams,
}: {
  searchParams: Promise<{ uso?: string; modo?: string }>;
}) {
  await requireProductUser("/p/promptforge");
  const sp = await searchParams;
  const supabase = createServerSupabase();
  let query = supabase
    .from("promptforge_templates")
    .select("id, modality, target, use_case, title, description, popularity, is_pro")
    .order("popularity", { ascending: false });
  if (sp.uso) query = query.eq("use_case", sp.uso);
  if (sp.modo) query = query.eq("modality", sp.modo);
  const { data } = await query;
  const templates = (data ?? []) as Template[];

  const useCases = Array.from(new Set(templates.map((t) => t.use_case).filter(Boolean))) as string[];
  const modalities = Array.from(new Set(templates.map((t) => t.modality)));

  return (
    <div className="space-y-6 max-w-6xl">
      <header>
        <span className="font-mono text-[10px] tracking-[0.25em] uppercase text-ink-mute">
          PromptForge · Plantillas
        </span>
        <h1
          className="font-display text-ink mt-2"
          style={{ fontSize: "clamp(1.75rem, 4vw, 2.5rem)", lineHeight: "1", letterSpacing: "-0.025em", fontWeight: 500 }}
        >
          {templates.length} plantillas listas para usar
        </h1>
        <p className="font-sans text-ink-mute mt-1 text-sm">
          Empieza desde una receta probada y rellénala. Las plantillas Pro requieren plan superior.
        </p>
      </header>

      <div className="flex flex-wrap gap-2">
        <FilterChip href="/app/promptforge/templates" active={!sp.uso && !sp.modo}>
          Todas
        </FilterChip>
        {modalities.map((m) => (
          <FilterChip
            key={m}
            href={`/app/promptforge/templates?modo=${m}`}
            active={sp.modo === m}
          >
            {MODALITY_LABEL[m] ?? m}
          </FilterChip>
        ))}
        {useCases.map((u) => (
          <FilterChip
            key={u}
            href={`/app/promptforge/templates?uso=${u}`}
            active={sp.uso === u}
          >
            #{u}
          </FilterChip>
        ))}
      </div>

      {templates.length === 0 ? (
        <EmptyState
          icon={LayoutTemplate}
          title="Sin plantillas para este filtro"
          description="Cambia el filtro o vuelve a Todas."
          cta={{ label: "Ver todas", href: "/app/promptforge/templates" }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map((t) => (
            <article
              key={t.id}
              className="bg-paper border-2 border-ink/15 hover:border-ink p-5 transition-colors flex flex-col"
            >
              <div className="flex items-center gap-2 flex-wrap mb-3">
                <span className="font-mono text-[10px] tracking-[0.15em] uppercase px-2 py-0.5 bg-indigo-600/10 text-indigo-600">
                  {MODALITY_LABEL[t.modality] ?? t.modality}
                </span>
                {t.target && (
                  <span className="font-mono text-[10px] tracking-[0.15em] uppercase px-2 py-0.5 bg-ink/10 text-ink">
                    {t.target}
                  </span>
                )}
                {t.use_case && (
                  <span className="font-mono text-[10px] tracking-[0.15em] uppercase text-ink-mute">
                    · {t.use_case}
                  </span>
                )}
                {t.is_pro && (
                  <span className="ml-auto inline-flex items-center gap-1 font-mono text-[10px] tracking-[0.15em] uppercase text-mustard-700">
                    <Lock className="w-3 h-3" /> Pro
                  </span>
                )}
              </div>
              <h2 className="font-display text-ink text-lg mb-2" style={{ fontWeight: 500 }}>
                {t.title}
              </h2>
              {t.description && (
                <p className="font-sans text-sm text-ink-mute mb-4 flex-1">{t.description}</p>
              )}
              <Link
                href={`/app/promptforge?template=${t.id}`}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-ink text-paper font-sans text-sm hover:bg-terracotta-500 transition-colors"
              >
                <Sparkles className="w-4 h-4" /> Usar plantilla
              </Link>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

function FilterChip({
  href,
  active,
  children,
}: {
  href: string;
  active?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.15em] transition-colors ${
        active
          ? "bg-ink text-paper"
          : "bg-paper border border-ink/20 text-ink-mute hover:border-ink hover:text-ink"
      }`}
    >
      {children}
    </Link>
  );
}
