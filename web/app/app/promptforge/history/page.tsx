import Link from "next/link";
import { requireProductUser } from "@/lib/products/session";
import { createServerSupabase } from "@/lib/supabase/server";
import { History, Bookmark, Wand2 } from "lucide-react";

export const dynamic = "force-dynamic";

interface HistoryRow {
  id: string;
  modality: string;
  target: string;
  use_case: string | null;
  raw_input: string;
  enhanced_prompts: { title?: string }[];
  starred: boolean;
  folder: string | null;
  created_at: string;
}

export default async function HistoryPage() {
  const user = await requireProductUser("/p/promptforge");
  const supabase = createServerSupabase();
  const { data } = await supabase
    .from("promptforge_prompts")
    .select("id, modality, target, use_case, raw_input, enhanced_prompts, starred, folder, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(100);

  const prompts = (data ?? []) as HistoryRow[];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <span className="font-mono text-[10px] tracking-[0.25em] uppercase text-ink-mute">
          PromptForge · Historial
        </span>
        <h1 className="font-display text-ink mt-2" style={{ fontSize: "clamp(1.75rem, 4vw, 2.5rem)", lineHeight: "1", letterSpacing: "-0.025em", fontWeight: 500 }}>
          {prompts.length} prompt{prompts.length === 1 ? "" : "s"} forjados
        </h1>
      </div>

      {prompts.length === 0 ? (
        <div className="bg-paper border-2 border-dashed border-ink/30 p-12 text-center">
          <History className="w-10 h-10 mx-auto text-ink-mute/40 mb-4" />
          <p className="font-sans text-ink-mute mb-4">Aún no has forjado ningún prompt.</p>
          <Link
            href="/app/promptforge"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-ink text-paper text-[14px] font-sans hover:bg-terracotta-500 transition-colors"
          >
            <Wand2 className="w-4 h-4" />
            Forjar el primero
          </Link>
        </div>
      ) : (
        <ul className="space-y-3">
          {prompts.map((p) => {
            const firstVariant = p.enhanced_prompts?.[0]?.title ?? "Sin título";
            return (
              <li key={p.id}>
                <article className="bg-paper border-2 border-ink/20 hover:border-ink p-4 transition-colors">
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-[10px] tracking-[0.15em] uppercase px-2 py-0.5 bg-indigo-600/10 text-indigo-600">
                        {p.modality}
                      </span>
                      <span className="font-mono text-[10px] tracking-[0.15em] uppercase px-2 py-0.5 bg-ink/10 text-ink">
                        {p.target}
                      </span>
                      {p.use_case && (
                        <span className="font-mono text-[10px] tracking-[0.15em] uppercase text-ink-mute">
                          · {p.use_case}
                        </span>
                      )}
                      {p.starred && <Bookmark className="w-3 h-3 fill-mustard-500 text-mustard-500" />}
                    </div>
                    <span className="font-mono text-[10px] text-ink-mute whitespace-nowrap">
                      {new Date(p.created_at).toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "2-digit" })}
                    </span>
                  </div>
                  <p className="font-sans text-[14px] text-ink mb-2 line-clamp-2">{p.raw_input}</p>
                  <div className="flex items-center justify-between text-[11px] font-mono text-ink-mute">
                    <span>→ {firstVariant} {p.enhanced_prompts && p.enhanced_prompts.length > 1 ? `+ ${p.enhanced_prompts.length - 1} más` : ""}</span>
                    <span>{p.enhanced_prompts?.length ?? 0} variantes</span>
                  </div>
                </article>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
