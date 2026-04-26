import Link from "next/link";
import { Bookmark, Sparkles } from "lucide-react";

export interface PromptCardData {
  id: string;
  modality: string;
  target: string;
  use_case: string | null;
  raw_input: string;
  enhanced_prompts: { title?: string }[];
  starred?: boolean;
  folder?: string | null;
  created_at: string;
}

interface Props {
  prompt: PromptCardData;
  href?: string;
  showDate?: boolean;
  variant?: "default" | "compact";
}

export function PromptCard({ prompt: p, href, showDate = true, variant = "default" }: Props) {
  const firstVariant = p.enhanced_prompts?.[0]?.title ?? "Sin título";
  const total = p.enhanced_prompts?.length ?? 0;

  const card = (
    <article className="bg-paper border-2 border-ink/20 hover:border-ink p-4 transition-colors h-full">
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
          {p.starred && (
            <Bookmark
              className="w-3 h-3 fill-mustard-500 text-mustard-500"
              aria-label="Favorito"
            />
          )}
        </div>
        {showDate && (
          <span className="font-mono text-[10px] text-ink-mute whitespace-nowrap">
            {new Date(p.created_at).toLocaleDateString("es-ES", {
              day: "2-digit",
              month: "short",
              year: "2-digit",
            })}
          </span>
        )}
      </div>
      <p className="font-sans text-[14px] text-ink mb-2 line-clamp-2">{p.raw_input}</p>
      {variant !== "compact" && (
        <div className="flex items-center justify-between text-[11px] font-mono text-ink-mute">
          <span className="flex items-center gap-1">
            <Sparkles className="w-3 h-3" aria-hidden /> {firstVariant}
            {total > 1 && ` + ${total - 1} más`}
          </span>
          <span>
            {total} variante{total === 1 ? "" : "s"}
          </span>
        </div>
      )}
    </article>
  );

  if (href) {
    return (
      <Link href={href} className="block">
        {card}
      </Link>
    );
  }
  return card;
}
