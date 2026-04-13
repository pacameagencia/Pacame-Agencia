import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Clock, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { blogPosts } from "@/lib/data/blog-posts";

export function generateStaticParams() {
  return blogPosts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = blogPosts.find((p) => p.slug === slug);
  if (!post) return { title: "Articulo no encontrado" };

  return {
    title: `${post.title} | Blog PACAME`,
    description: post.excerpt,
    alternates: { canonical: `https://pacameagencia.com/blog/${slug}` },
    openGraph: {
      title: post.title,
      description: post.excerpt,
      url: `https://pacameagencia.com/blog/${slug}`,
      siteName: "PACAME",
      type: "article",
    },
  };
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = blogPosts.find((p) => p.slug === slug);
  if (!post) notFound();

  // Simple markdown-like rendering (## headers, **bold**, - lists)
  const renderContent = (content: string) => {
    return content.split("\n").map((line, i) => {
      const trimmed = line.trim();
      if (trimmed.startsWith("## ")) {
        return <h2 key={i} className="font-heading font-bold text-xl text-pacame-white mt-8 mb-4">{trimmed.slice(3)}</h2>;
      }
      if (trimmed.startsWith("### ")) {
        return <h3 key={i} className="font-heading font-semibold text-lg text-pacame-white mt-6 mb-3">{trimmed.slice(4)}</h3>;
      }
      if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
        return <li key={i} className="text-pacame-white/70 font-body ml-4 list-disc">{trimmed.slice(2)}</li>;
      }
      if (trimmed.startsWith("---")) {
        return <hr key={i} className="border-white/[0.06] my-8" />;
      }
      if (trimmed.startsWith("|")) {
        return <p key={i} className="text-pacame-white/50 font-mono text-xs">{trimmed}</p>;
      }
      if (trimmed === "") return <br key={i} />;
      // Bold text
      const parts = trimmed.split(/\*\*(.*?)\*\*/g);
      return (
        <p key={i} className="text-pacame-white/70 font-body leading-relaxed">
          {parts.map((part, j) =>
            j % 2 === 1 ? <strong key={j} className="text-pacame-white font-medium">{part}</strong> : part
          )}
        </p>
      );
    });
  };

  return (
    <div className="bg-pacame-black min-h-screen">
      {/* Article schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Article",
            headline: post.title,
            description: post.excerpt,
            author: { "@type": "Organization", name: "PACAME" },
            publisher: { "@type": "Organization", name: "PACAME", url: "https://pacameagencia.com" },
            datePublished: post.dateISO,
            url: `https://pacameagencia.com/blog/${slug}`,
          }),
        }}
      />

      <article className="pt-36 pb-20">
        <div className="max-w-3xl mx-auto px-6">
          {/* Back + meta */}
          <div className="mb-8">
            <Link href="/blog" className="inline-flex items-center gap-2 text-sm text-pacame-white/40 hover:text-pacame-white/60 font-body mb-6">
              <ArrowLeft className="w-4 h-4" />
              Volver al blog
            </Link>
            <div className="flex items-center gap-3 mb-4">
              <span
                className="text-xs px-3 py-1 rounded-full font-body font-medium"
                style={{ backgroundColor: `${post.color}20`, color: post.color, border: `1px solid ${post.color}30` }}
              >
                {post.category}
              </span>
              <div className="flex items-center gap-1.5 text-xs text-pacame-white/40 font-body">
                <Clock className="w-3 h-3" />
                {post.readTime}
              </div>
              <span className="text-xs text-pacame-white/30 font-body">{post.date}</span>
            </div>
          </div>

          {/* Title */}
          <h1 className="font-heading font-bold text-display text-pacame-white mb-4">
            {post.title}
          </h1>

          {/* Author */}
          <div className="flex items-center gap-3 mb-10 pb-8 border-b border-white/[0.06]">
            <span
              className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold font-heading"
              style={{ backgroundColor: `${post.color}30`, color: post.color }}
            >
              {post.agentName[0]}
            </span>
            <div>
              <p className="text-sm text-pacame-white font-body">Escrito por {post.agentName}</p>
              <p className="text-xs text-pacame-white/40 font-body">Agente IA de PACAME</p>
            </div>
          </div>

          {/* Content */}
          <div className="space-y-1">
            {renderContent(post.content)}
          </div>

          {/* CTA */}
          <div className="mt-12 rounded-2xl bg-dark-card border border-electric-violet/20 p-8 text-center">
            <h3 className="font-heading font-bold text-xl text-pacame-white mb-3">
              Quieres resultados como estos para tu negocio?
            </h3>
            <p className="text-sm text-pacame-white/60 font-body mb-6">
              Diagnostico gratuito. Presupuesto en 24 horas. Sin compromiso.
            </p>
            <Button variant="gradient" size="xl" asChild className="group">
              <Link href="/contacto">
                Pedir diagnostico gratis
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
          </div>
        </div>
      </article>
    </div>
  );
}
