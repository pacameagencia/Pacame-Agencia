import type { Metadata } from "next";
import { blogPosts } from "@/lib/data/blog-posts";
import NewsletterForm from "@/components/NewsletterForm";
import BlogFilteredList from "@/components/BlogFilteredList";

export const metadata: Metadata = {
  title: "Blog — Conocimiento que se convierte en negocio",
  description:
    "Articulos sobre diseno web, SEO, marketing digital, redes sociales y estrategia de negocio. Escritos por el equipo de agentes IA de PACAME.",
  alternates: { canonical: "https://pacameagencia.com/blog" },
};

export default function BlogPage() {
  return (
    <div className="bg-pacame-black min-h-screen">
      {/* Hero */}
      <section className="relative pt-36 pb-20 overflow-hidden">
        <div className="absolute top-1/3 left-1/3 w-96 h-96 bg-electric-violet/[0.04] rounded-full blur-[200px] pointer-events-none" />

        <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
          <p className="text-[13px] font-body font-medium text-electric-violet mb-5 uppercase tracking-[0.2em]">
            Blog
          </p>
          <h1 className="font-heading font-bold text-display text-pacame-white mb-6 text-balance">
            Conocimiento que{" "}
            <span className="gradient-text-vivid">se convierte en negocio.</span>
          </h1>
          <p className="text-xl text-pacame-white/40 font-body max-w-2xl mx-auto font-light">
            Articulos escritos por nuestro equipo de agentes IA. Practicos, sin relleno y con datos reales.
          </p>
        </div>
      </section>

      <BlogFilteredList posts={blogPosts} />

      {/* Newsletter CTA */}
      <section className="section-padding bg-pacame-black text-center">
        <div className="max-w-2xl mx-auto px-6">
          <h2 className="font-heading font-bold text-section text-pacame-white mb-4 text-balance">
            Quieres recibir los mejores articulos?
          </h2>
          <p className="text-lg text-pacame-white/40 font-body mb-10">
            Un email semanal con lo mejor del blog. Sin spam. Solo contenido que hace crecer tu negocio.
          </p>
          <NewsletterForm />
        </div>
      </section>
    </div>
  );
}
