"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

interface FaqItem {
  question: string;
  answer: string;
}

interface FaqCategory {
  title: string;
  color: string;
  items: FaqItem[];
}

function AccordionItem({
  faq,
  isOpen,
  onToggle,
  itemId,
}: {
  faq: FaqItem;
  isOpen: boolean;
  onToggle: () => void;
  itemId: string;
}) {
  const triggerId = `faq-trigger-${itemId}`;
  const panelId = `faq-panel-${itemId}`;

  return (
    <div className="rounded-2xl bg-dark-card border border-white/[0.06] hover:border-white/10 transition-all overflow-hidden">
      <button
        id={triggerId}
        onClick={onToggle}
        className="w-full flex items-center justify-between gap-4 p-6 text-left"
        aria-expanded={isOpen}
        aria-controls={panelId}
      >
        <h3 className="font-heading font-semibold text-lg text-pacame-white pr-4">
          {faq.question}
        </h3>
        <ChevronDown
          className={`w-5 h-5 text-pacame-white/40 flex-shrink-0 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}
        />
      </button>
      <section
        id={panelId}
        aria-labelledby={triggerId}
        className={`grid transition-all duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] ${isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}
      >
        <div className="overflow-hidden">
          <p className="text-sm text-pacame-white/60 font-body leading-relaxed px-6 pb-6">
            {faq.answer}
          </p>
        </div>
      </section>
    </div>
  );
}

export default function FaqAccordion({
  categories,
}: {
  categories: FaqCategory[];
}) {
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({});

  const toggleItem = (key: string) => {
    setOpenItems((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <>
      {categories.map((category, catIdx) => (
        <section
          key={category.title}
          className={`section-padding ${catIdx % 2 === 0 ? "bg-pacame-black border-t border-white/[0.04]" : "bg-pacame-black"}`}
        >
          <div className="max-w-4xl mx-auto px-6">
            <h2
              className="font-heading font-bold text-2xl mb-8"
              style={{ color: category.color }}
            >
              {category.title}
            </h2>

            <div className="space-y-3">
              {category.items.map((faq, faqIdx) => {
                const key = `${catIdx}-${faq.question}`;
                return (
                  <AccordionItem
                    key={key}
                    faq={faq}
                    isOpen={openItems[key] ?? false}
                    onToggle={() => toggleItem(key)}
                    itemId={`${catIdx}-${faqIdx}`}
                  />
                );
              })}
            </div>
          </div>
        </section>
      ))}
    </>
  );
}
