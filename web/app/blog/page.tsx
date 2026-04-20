import type { Metadata } from "next";
import { blogPosts } from "@/lib/data/blog-posts";
import NewsletterForm from "@/components/NewsletterForm";

// ISR: indice de blog — 1h cache
export const revalidate = 3600;
import BlogFilteredList from "@/components/BlogFilteredList";
import BreadcrumbJsonLd from "@/components/BreadcrumbJsonLd";
import ScrollReveal from "@/components/ui/scroll-reveal";
import GoldenDivider from "@/components/effects/GoldenDivider";

function BlogListJsonLd() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Blog PACAME — Articulos sobre marketing digital y desarrollo web",
    description: "Articulos practicos sobre diseno web, SEO, marketing digital y estrategia de negocio para PYMEs.",
    url: "https://pacameagencia.com/blog",
    numberOfItems: blogPosts.length,
    itemListElement: blogPosts.map((post, i) => ({
      "@type": "ListItem",
      position: i + 1,
      item: {
        "@type": "BlogPosting",
        headline: post.title,
        description: post.excerpt,
        url: `https://pacameagencia.com/blog/${post.slug}`,
        datePublished: post.dateISO,
        author: {
          "@type": "Organization",
          name: "PACAME",
          url: "https://pacameagencia.com",
        },
        publisher: {
          "@type": "Organization",
          name: "PACAME",
          url: "https://pacameagencia.com",
        },
        articleSection: post.category,
      },
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

export const metadata: Metadata = {
  title: "Blog — Conocimiento que se convierte en negocio",
  description:
    "Articulos sobre diseno web, SEO, marketing digital, redes sociales y estrategia de negocio. Escritos por el equipo de agentes IA de PACAME.",
  alternates: { canonical: "https://pacameagencia.com/blog" },
};

export default function BlogPage() {
  const totalPosts = blogPosts.length;

  return (
    <div className="bg-pacame-black min-h-screen">
      <BlogListJsonLd />
      <BreadcrumbJsonLd
        items={[
          { name: "Inicio", url: "https://pacameagencia.com" },
          { name: "Blog", url: "https://pacameagencia.com/blog" },
        ]}
      />
      {/* Hero */}
      <section className="relative pt-36 pb-16 overflow-hidden">
        <div className="absolute top-1/3 left-1/3 w-96 h-96 bg-electric-violet/[0.04] rounded-full blur-[200px] pointer-events-none" />
        <div className="absolute top-1/4 right-1/4 w-[400px] h-[400px] bg-olympus-gold/[0.05] rounded-full blur-[180px] pointer-events-none" />

        <ScrollReveal className="relative z-10 max-w-4xl mx-auto px-6 text-center">
          <p className="text-[13px] font-body font-medium text-olympus-gold mb-5 uppercase tracking-[0.25em]">
            Blog PACAME · {totalPosts} articulos
          </p>
          <h1 className="font-heading font-bold text-display text-pacame-white mb-6 text-balance">
            Ideas para PYMEs que{" "}
            <span className="gradient-text-vivid">quieren crecer con IA.</span>
          </h1>
          <p className="text-xl text-pacame-white/60 font-body max-w-2xl mx-auto font-light">
            Articulos practicos escritos por nuestro equipo de agentes IA.
            Sin relleno, con datos reales y pasos accionables.
          </p>
        </ScrollReveal>
      </section>

      <BlogFilteredList posts={blogPosts} />

      <div className="max-w-4xl mx-auto px-6"><GoldenDivider variant="laurel" /></div>

      {/* Newsletter strip antes del footer */}
      <section className="section-padding bg-pacame-black text-center">
        <ScrollReveal className="max-w-2xl mx-auto px-6">
          <h2 className="font-heading font-bold text-section text-pacame-white mb-4 text-balance">
            Un email cada viernes. Solo lo que importa.
          </h2>
          <p className="text-lg text-pacame-white/60 font-body mb-10">
            Tips de marketing digital, casos reales y herramientas que usamos a diario.
            Sin spam, sin humo.
          </p>
          <NewsletterForm />
        </ScrollReveal>
      </section>
    </div>
  );
}
