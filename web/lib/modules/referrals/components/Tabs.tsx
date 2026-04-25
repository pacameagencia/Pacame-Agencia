"use client";

import { useState } from "react";

export type TabItem = {
  id: string;
  label: string;
  count?: number;
};

type Props = {
  items: TabItem[];
  defaultId?: string;
  onChange?: (id: string) => void;
  children: (activeId: string) => React.ReactNode;
};

export function Tabs({ items, defaultId, onChange, children }: Props) {
  const [active, setActive] = useState(defaultId ?? items[0]?.id ?? "");

  const change = (id: string) => {
    setActive(id);
    onChange?.(id);
  };

  return (
    <div className="space-y-4">
      <div role="tablist" className="flex flex-wrap gap-1 border-b border-ink/10">
        {items.map((it) => {
          const isActive = it.id === active;
          return (
            <button
              key={it.id}
              role="tab"
              aria-selected={isActive}
              type="button"
              onClick={() => change(it.id)}
              className={
                "px-4 py-2 text-sm font-medium transition border-b-2 -mb-px " +
                (isActive
                  ? "text-terracotta-500 border-terracotta-500"
                  : "text-ink/60 border-transparent hover:text-ink")
              }
            >
              {it.label}
              {typeof it.count === "number" && (
                <span className="ml-2 inline-flex items-center justify-center rounded-sm bg-ink/5 px-1.5 py-0.5 text-xs">
                  {it.count}
                </span>
              )}
            </button>
          );
        })}
      </div>
      <div role="tabpanel">{children(active)}</div>
    </div>
  );
}
