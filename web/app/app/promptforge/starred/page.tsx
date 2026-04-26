import { requireProductUser } from "@/lib/products/session";
import { createServerSupabase } from "@/lib/supabase/server";
import { Bookmark, Sparkles } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";
import { PromptCard, type PromptCardData } from "@/components/products/promptforge/PromptCard";

export const dynamic = "force-dynamic";

export default async function StarredPage() {
  const user = await requireProductUser("/p/promptforge");
  const supabase = createServerSupabase();
  const { data } = await supabase
    .from("promptforge_prompts")
    .select("id, modality, target, use_case, raw_input, enhanced_prompts, starred, folder, created_at")
    .eq("user_id", user.id)
    .eq("starred", true)
    .order("created_at", { ascending: false })
    .limit(200);

  const prompts = (data ?? []) as PromptCardData[];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <header>
        <span className="font-mono text-[10px] tracking-[0.25em] uppercase text-ink-mute">
          PromptForge · Favoritos
        </span>
        <h1
          className="font-display text-ink mt-2"
          style={{ fontSize: "clamp(1.75rem, 4vw, 2.5rem)", lineHeight: "1", letterSpacing: "-0.025em", fontWeight: 500 }}
        >
          {prompts.length} favorito{prompts.length === 1 ? "" : "s"}
        </h1>
      </header>

      {prompts.length === 0 ? (
        <EmptyState
          icon={Bookmark}
          title="Aún no has marcado ningún prompt"
          description="Cuando un prompt te funcione, márcalo con la estrella y aparecerá aquí para reutilizarlo."
          cta={{ label: "Ir a Forge", href: "/app/promptforge", icon: Sparkles }}
        />
      ) : (
        <ul className="space-y-3">
          {prompts.map((p) => (
            <li key={p.id}>
              <PromptCard prompt={p} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
