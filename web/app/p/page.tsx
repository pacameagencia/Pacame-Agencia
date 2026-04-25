import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, Sparkles } from "lucide-react";
import { listLiveProducts, getRecommendedTier } from "@/lib/products/registry";

export const metadata: Metadata = {
  title: "Productos · PACAME — Mini-SaaS verticales para PYMEs",
  description:
    "Cada producto PACAME resuelve un dolor específico de un nicho específico. AsesorPro para asesorías fiscales · más en camino. 14 días gratis sin tarjeta.",
  alternates: { canonical: "https://pacameagencia.com/p" },
};

export const revalidate = 60;

export default async function ProductsHubPage() {
  const products = await listLiveProducts();

  return (
    <main className="min-h-screen bg-paper pt-32 pb-24">
      <div className="max-w-6xl mx-auto px-6">
        {/* Banda editorial */}
        <div className="flex items-center justify-between mb-12 pb-6 border-b-2 border-ink">
          <div className="flex items-center gap-6">
            <span className="font-mono text-[11px] tracking-[0.25em] uppercase text-ink">
              Productos · Cuaderno PACAME
            </span>
            <span className="font-mono text-[11px] tracking-[0.25em] uppercase text-ink-mute">
              {products.length} micronicho{products.length === 1 ? "" : "s"}
            </span>
          </div>
          <span className="font-mono text-[10px] tracking-[0.25em] uppercase text-ink-mute">
            14 días gratis · sin tarjeta
          </span>
        </div>

        {/* Hero */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-20">
          <div className="lg:col-span-9">
            <span className="kicker block mb-6">Mini-SaaS verticales bajo PACAME</span>
            <h1
              className="font-display text-ink mb-6 text-balance"
              style={{
                fontSize: "clamp(2.5rem, 7vw, 6rem)",
                lineHeight: "0.95",
                letterSpacing: "-0.035em",
                fontWeight: 500,
              }}
            >
              Un dolor específico.{" "}
              <span
                className="italic font-light"
                style={{ color: "#B54E30", fontVariationSettings: '"SOFT" 100, "WONK" 1, "opsz" 144' }}
              >
                Una solución completa.
              </span>
            </h1>
          </div>
          <div className="lg:col-span-3 flex items-end">
            <p className="font-sans text-ink-soft text-[16px] leading-relaxed">
              Cada producto PACAME es un sistema operativo completo para un nicho concreto. No tools sueltas. Software que sustituye 5 herramientas que ya pagas.
            </p>
          </div>
        </div>

        {/* Grid productos */}
        {products.length === 0 ? (
          <div className="border-2 border-dashed border-ink/20 p-12 text-center">
            <Sparkles className="w-10 h-10 text-ink-mute mx-auto mb-4" />
            <p className="font-sans text-ink-mute">
              Estamos cocinando los primeros productos. Vuelve en breve.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((p) => {
              const tier = getRecommendedTier(p);
              return (
                <Link
                  key={p.id}
                  href={`/p/${p.id}`}
                  className="group bg-paper border-2 border-ink p-6 transition-all duration-300 hover:-translate-y-1 hover:translate-x-0 flex flex-col"
                  style={{ boxShadow: "5px 5px 0 #1A1813" }}
                >
                  <div className="flex items-start justify-between mb-4">
                    <span
                      className="font-mono text-[10px] tracking-[0.25em] uppercase px-2 py-1"
                      style={{
                        backgroundColor: (p.marketing.primary_color ?? "#283B70") + "20",
                        color: p.marketing.primary_color ?? "#283B70",
                      }}
                    >
                      {p.category ?? "general"}
                    </span>
                    <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-ink-mute">
                      {p.status === "beta" ? "BETA" : "LIVE"}
                    </span>
                  </div>

                  <h3
                    className="font-display text-ink mb-2"
                    style={{ fontSize: "1.75rem", lineHeight: "1.05", letterSpacing: "-0.02em", fontWeight: 500 }}
                  >
                    {p.name}
                  </h3>
                  <p className="font-sans text-ink-soft text-[14px] leading-snug mb-6 flex-1">
                    {p.tagline}
                  </p>

                  <div className="pt-4 border-t border-ink/15 flex items-baseline justify-between mb-4">
                    <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-ink-mute">
                      Desde
                    </span>
                    <span className="font-display text-ink tabular-nums" style={{ fontSize: "1.5rem", fontWeight: 500 }}>
                      {tier.price_eur} <span className="text-terracotta-500 text-sm">€/mes</span>
                    </span>
                  </div>

                  <span className="inline-flex items-center justify-between gap-2 text-[13px] font-sans font-medium text-ink group-hover:text-terracotta-500 transition-colors">
                    Ver y probar 14 días gratis
                    <ArrowUpRight className="w-4 h-4 group-hover:rotate-45 transition-transform" />
                  </span>
                </Link>
              );
            })}
          </div>
        )}

        {/* Banda PACAME */}
        <div className="mt-24 pt-12 border-t-2 border-ink grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-2">
            <span className="font-mono text-[10px] tracking-[0.25em] uppercase text-ink-mute">
              ¿Por qué PACAME?
            </span>
          </div>
          <div className="lg:col-span-10">
            <p
              className="font-display text-ink"
              style={{ fontSize: "clamp(1.25rem, 2.5vw, 1.875rem)", lineHeight: "1.2", letterSpacing: "-0.015em", fontWeight: 500 }}
            >
              Detrás de cada producto hay una factoría de IA que construye, despliega y mantiene.{" "}
              <span
                className="italic font-light"
                style={{ color: "#B54E30", fontVariationSettings: '"SOFT" 100, "WONK" 1, "opsz" 144' }}
              >
                No te vendemos software. Te resolvemos el problema.
              </span>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
