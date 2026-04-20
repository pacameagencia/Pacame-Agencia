"use client";

import { useState } from "react";
import { Check, Link2 } from "lucide-react";

interface ShareButtonsProps {
  url: string;
  title: string;
  orientation?: "horizontal" | "vertical";
}

/**
 * Share buttons para X, LinkedIn, WhatsApp + copy link.
 */
export default function ShareButtons({
  url,
  title,
  orientation = "horizontal",
}: ShareButtonsProps) {
  const [copied, setCopied] = useState(false);
  const text = encodeURIComponent(title);
  const encoded = encodeURIComponent(url);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignora errores de clipboard (permisos)
    }
  };

  const layout =
    orientation === "vertical"
      ? "flex flex-col gap-2"
      : "flex flex-wrap items-center gap-2";

  return (
    <div className={layout}>
      <a
        href={`https://twitter.com/intent/tweet?text=${text}&url=${encoded}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Compartir en X"
        className="w-9 h-9 rounded-lg bg-paper-deep border border-ink/[0.06] flex items-center justify-center text-xs font-mono text-ink/60 hover:text-accent-gold hover:border-accent-gold/30 transition-colors"
      >
        X
      </a>
      <a
        href={`https://www.linkedin.com/sharing/share-offsite/?url=${encoded}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Compartir en LinkedIn"
        className="w-9 h-9 rounded-lg bg-paper-deep border border-ink/[0.06] flex items-center justify-center text-xs font-mono text-ink/60 hover:text-accent-gold hover:border-accent-gold/30 transition-colors"
      >
        in
      </a>
      <a
        href={`https://api.whatsapp.com/send?text=${text}%20${encoded}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Compartir por WhatsApp"
        className="w-9 h-9 rounded-lg bg-paper-deep border border-ink/[0.06] flex items-center justify-center text-xs font-mono text-ink/60 hover:text-accent-gold hover:border-accent-gold/30 transition-colors"
      >
        WA
      </a>
      <button
        type="button"
        onClick={handleCopy}
        aria-label="Copiar enlace"
        className="w-9 h-9 rounded-lg bg-paper-deep border border-ink/[0.06] flex items-center justify-center text-ink/60 hover:text-accent-gold hover:border-accent-gold/30 transition-colors"
      >
        {copied ? (
          <Check className="w-4 h-4 text-accent-gold" />
        ) : (
          <Link2 className="w-4 h-4" />
        )}
      </button>
    </div>
  );
}
