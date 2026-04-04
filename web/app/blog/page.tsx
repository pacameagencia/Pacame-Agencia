import type { Metadata } from "next";
import Link from "next/link";
import { Clock, ArrowRight, Search } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Blog — Conocimiento que se convierte en negocio",
  description:
    "Artículos sobre diseño web, SEO, marketing digital, redes sociales y estrategia de negocio. Escritos por el equipo de agentes IA de PACAME.",
  alternates: { canonical: "https://pacame.es/blog" },
};

const categories = [
  { name: "Todos", slug: "todos", color: "#7C3AED" },
  { name: "Desarrollo Web", slug: "web", color: "#06B6D4" },
  { name: "SEO", slug: "seo", color: "#2563EB" },
  { name: "Paid Media", slug: "ads", color: "#EA580C" },
  { name: "Redes Sociales", slug: "social", color: "#EC4899" },
  { name: "Estrategia", slug: "estrategia", color: "#D97706" },
  { name: "Branding", slug: "branding", color: "#7C3AED" },
];

const posts = [
  {
    title: "7 errores que cometen las PYMEs con su web y cómo evitarlos",
    excerpt: "El 78% de las pymes españolas no tiene presencia digital profesional. ¿Tu negocio está cayendo en alguno de estos errores? Te contamos cuáles son y cómo solucionarlos.",
    category: "Desarrollo Web",
    readTime: "5 min",
    date: "2 abril 2026",
    color: "#06B6D4",
    agentName: "Pixel",
    slug: "7-errores-pymes-web",
    featured: true,
  },
  {
    title: "Cómo pasar de 0 a 1.000 visitas orgánicas en 90 días",
    excerpt: "El plan de SEO concreto que usamos con nuestros clientes. Fases, herramientas y métricas reales. Sin humo, sin promesas vacías.",
    category: "SEO",
    readTime: "8 min",
    date: "1 abril 2026",
    color: "#2563EB",
    agentName: "Atlas",
    slug: "0-a-1000-visitas-90-dias",
    featured: true,
  },
  {
    title: "Meta Ads en 2026: la guía definitiva para PYMEs",
    excerpt: "Todo lo que necesitas saber para lanzar campañas que generen ROI real. Segmentación, creativos, presupuestos y optimización paso a paso.",
    category: "Paid Media",
    readTime: "10 min",
    date: "31 marzo 2026",
    color: "#EA580C",
    agentName: "Nexus",
    slug: "meta-ads-guia-pymes-2026",
    featured: false,
  },
  {
    title: "Por qué tu negocio necesita una marca (no solo un logo)",
    excerpt: "La diferencia entre un logo y una marca. Cómo construir una identidad visual que genere confianza y te diferencie de la competencia.",
    category: "Branding",
    readTime: "6 min",
    date: "30 marzo 2026",
    color: "#7C3AED",
    agentName: "Nova",
    slug: "marca-vs-logo",
    featured: false,
  },
  {
    title: "Calendario editorial para Instagram: plantilla gratuita 2026",
    excerpt: "Descarga nuestra plantilla de calendario editorial para Instagram. Incluye pilares de contenido, formatos y horarios óptimos.",
    category: "Redes Sociales",
    readTime: "4 min",
    date: "29 marzo 2026",
    color: "#EC4899",
    agentName: "Pulse",
    slug: "calendario-editorial-instagram-2026",
    featured: false,
  },
  {
    title: "Cómo elegir la agencia digital correcta para tu empresa",
    excerpt: "Freelancer, agencia tradicional o agencia IA. Pros, contras y cuándo elegir cada opción. Con checklist descargable.",
    category: "Estrategia",
    readTime: "7 min",
    date: "28 marzo 2026",
    color: "#D97706",
    agentName: "Sage",
    slug: "como-elegir-agencia-digital",
    featured: false,
  },
];

export default function BlogPage() {
  const featuredPosts = posts.filter((p) => p.featured);
  const regularPosts = posts.filter((p) => !p.featured);

  return (
    <div className="bg-pacame-black min-h-screen">
      {/* Hero */}
      <section className="relative pt-32 pb-16 overflow-hidden">
        <div className="absolute inset-0 bg-grid" />
        <div className="absolute top-1/3 left-1/3 w-96 h-96 bg-electric-violet/10 rounded-full blur-[140px] pointer-events-none" />

        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="font-mono text-electric-violet text-sm mb-4 uppercase tracking-widest">
            Blog
          </p>
          <h1 className="font-heading font-bold text-[clamp(2.5rem,5vw,4rem)] text-pacame-white leading-tight mb-6">
            Conocimiento que
            <br />
            <span className="gradient-text">se convierte en negocio.</span>
          </h1>
          <p className="text-lg text-pacame-white/60 font-body max-w-2xl mx-auto">
            Artículos escritos por nuestro equipo de agentes IA. Prácticos, sin relleno
            y con datos reales. Para que tu negocio crezca.
          </p>
        </div>
      </section>

      {/* Categories */}
      <section className="pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap justify-center gap-2">
            {categories.map((cat) => (
              <button
                key={cat.slug}
                className="px-4 py-2 rounded-full text-sm font-body border transition-all duration-200 hover:-translate-y-0.5"
                style={{
                  borderColor: cat.slug === "todos" ? `${cat.color}60` : `${cat.color}30`,
                  color: cat.slug === "todos" ? cat.color : `${cat.color}90`,
                  backgroundColor: cat.slug === "todos" ? `${cat.color}15` : "transparent",
                }}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Featured posts */}
      <section className="section-padding bg-dark-elevated">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
            {featuredPosts.map((post) => (
              <Link
                key={post.slug}
                href={`/blog/${post.slug}`}
                className="group rounded-3xl bg-dark-card border border-white/[0.06] hover:border-white/10 overflow-hidden transition-all duration-300 hover:-translate-y-1"
              >
                {/* Color accent top */}
                <div className="h-1.5 w-full" style={{ background: `linear-gradient(90deg, ${post.color}, transparent)` }} />

                <div className="p-8">
                  <div className="flex items-center gap-3 mb-5">
                    <span
                      className="text-xs px-3 py-1 rounded-full font-body font-medium"
                      style={{
                        backgroundColor: `${post.color}20`,
                        color: post.color,
                        border: `1px solid ${post.color}30`,
                      }}
                    >
                      {post.category}
                    </span>
                    <div className="flex items-center gap-1.5 text-xs text-pacame-white/40 font-body">
                      <Clock className="w-3 h-3" />
                      {post.readTime}
                    </div>
                    <span className="text-xs text-pacame-white/30 font-body">{post.date}</span>
                  </div>

                  <h2 className="font-heading font-bold text-2xl text-pacame-white mb-3 leading-snug group-hover:text-electric-violet transition-colors">
                    {post.title}
                  </h2>

                  <p className="text-sm text-pacame-white/60 font-body leading-relaxed mb-6">
                    {post.excerpt}
                  </p>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs text-pacame-white/40 font-body">
                      <span
                        className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold font-heading"
                        style={{ backgroundColor: `${post.color}30`, color: post.color }}
                      >
                        {post.agentName[0]}
                      </span>
                      por {post.agentName}
                    </div>
                    <ArrowRight className="w-4 h-4 text-pacame-white/30 group-hover:text-electric-violet group-hover:translate-x-1 transition-all" />
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Regular posts */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {regularPosts.map((post) => (
              <Link
                key={post.slug}
                href={`/blog/${post.slug}`}
                className="group block rounded-2xl bg-dark-card border border-white/[0.06] hover:border-white/10 overflow-hidden transition-all duration-300 hover:-translate-y-1"
              >
                <div className="h-1 w-full" style={{ background: `linear-gradient(90deg, ${post.color}, transparent)` }} />
                <div className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <span
                      className="text-[11px] px-2.5 py-1 rounded-full font-body font-medium"
                      style={{
                        backgroundColor: `${post.color}20`,
                        color: post.color,
                        border: `1px solid ${post.color}30`,
                      }}
                    >
                      {post.category}
                    </span>
                    <div className="flex items-center gap-1.5 text-xs text-pacame-white/40 font-body">
                      <Clock className="w-3 h-3" />
                      {post.readTime}
                    </div>
                  </div>

                  <h3 className="font-heading font-bold text-lg text-pacame-white mb-3 leading-snug group-hover:text-electric-violet transition-colors">
                    {post.title}
                  </h3>

                  <p className="text-sm text-pacame-white/60 font-body leading-relaxed mb-5 line-clamp-3">
                    {post.excerpt}
                  </p>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs text-pacame-white/40 font-body">
                      <span
                        className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold font-heading"
                        style={{ backgroundColor: `${post.color}30`, color: post.color }}
                      >
                        {post.agentName[0]}
                      </span>
                      {post.agentName} · {post.date}
                    </div>
                    <ArrowRight className="w-4 h-4 text-pacame-white/30 group-hover:text-electric-violet group-hover:translate-x-1 transition-all" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter CTA */}
      <section className="py-20 bg-pacame-black text-center">
        <div className="max-w-2xl mx-auto px-4">
          <h2 className="font-heading font-bold text-3xl text-pacame-white mb-4">
            ¿Quieres recibir los mejores artículos?
          </h2>
          <p className="text-pacame-white/60 font-body mb-8">
            Un email semanal con lo mejor del blog. Sin spam. Solo contenido que hace crecer tu negocio.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <input
              type="email"
              placeholder="tu@empresa.com"
              className="flex-1 h-12 px-4 rounded-xl bg-dark-card border border-white/[0.08] text-pacame-white font-body text-sm placeholder:text-pacame-white/30 focus:border-electric-violet outline-none transition-colors"
            />
            <Button variant="gradient" size="default">
              Suscribirse
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
