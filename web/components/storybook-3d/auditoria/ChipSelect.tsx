"use client";

/**
 * ChipSelect — selector de chips genérico para el form auditoría.
 *
 * Modos:
 *  - single: selecciona uno (radio-like).
 *  - multi:  selecciona varios (checkbox-like).
 *
 * A11y: cada chip es un <button> con aria-pressed. Navegable con Tab + Enter.
 * Estilo: pills mate, terracota cuando seleccionados.
 */

interface ChipSelectProps<T extends string> {
  options: readonly T[];
  labelOf: (opt: T) => string;
  value: T | T[] | null;
  onChange: (next: T | T[]) => void;
  mode?: "single" | "multi";
  ariaLabel: string;
  /** Para multi mode: máximo permitido (default 6). */
  max?: number;
}

export default function ChipSelect<T extends string>({
  options,
  labelOf,
  value,
  onChange,
  mode = "single",
  ariaLabel,
  max = 6,
}: ChipSelectProps<T>) {
  const selectedSet =
    mode === "multi"
      ? new Set(Array.isArray(value) ? value : value ? [value] : [])
      : new Set(value !== null && !Array.isArray(value) ? [value] : []);

  const toggle = (opt: T) => {
    if (mode === "single") {
      onChange(opt);
      return;
    }
    const next = new Set(selectedSet);
    if (next.has(opt)) {
      next.delete(opt);
    } else {
      if (next.size >= max) return; // límite
      next.add(opt);
    }
    onChange(Array.from(next) as T[]);
  };

  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className="flex flex-wrap gap-2"
    >
      {options.map((opt) => {
        const selected = selectedSet.has(opt);
        return (
          <button
            key={opt}
            type="button"
            onClick={() => toggle(opt)}
            aria-pressed={selected}
            className={`
              rounded-full px-4 py-2 text-sm font-medium border transition-all
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mustard-500 focus-visible:ring-offset-1 focus-visible:ring-offset-paper
              ${selected
                ? "bg-terracotta-500 border-terracotta-500 text-paper hover:bg-terracotta-600"
                : "bg-paper border-ink/20 text-ink hover:border-ink/40 hover:bg-ink/5"
              }
            `}
          >
            {labelOf(opt)}
          </button>
        );
      })}
    </div>
  );
}
