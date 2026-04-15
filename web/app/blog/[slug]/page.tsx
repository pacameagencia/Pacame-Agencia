import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Clock, ArrowRight, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { blogPosts } from "@/lib/data/blog-posts";
import ReadingProgress from "@/components/blog/ReadingProgress";
import BreadcrumbJsonLd from "@/components/BreadcrumbJsonLd";
import ScrollReveal, { StaggerContainer, StaggerItem } from "@/components/ui/scroll-reveal";
import { CardTilt, CardTiltContent } from "@/components/ui/card-tilt";
import GoldenDivider from "@/components/effects/GoldenDivider";
import MagneticButton from "@/components/effects/MagneticButton";
import { ShinyButton } from "@/components/ui/shiny-button";

export function generateStaticParams() {
  return blogPosts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = blogPosts.find((p) => p.slug === slug);
  if (!post) return { title: "Articulo no encontrado" };

  const ogImage = `/api/og?title=${encodeURIComponent(post.title)}&category=${encodeURIComponent(post.category)}`;

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
      images: [{ url: ogImage, width: 1200, height: 630, alt: post.title }],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.excerpt,
      images: [ogImage],
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

  const relatedPosts = blogPosts
    .filter((p) => p.slug !== slug && p.category === post.category)
    .slice(0, 3);

  // If not enough from same category, fill with other posts
  if (relatedPosts.length < 2) {
    const others = blogPosts.filter((p) => p.slug !== slug && !relatedPosts.includes(p)).slice(0, 3 - relatedPosts.length);
    relatedPosts.push(...others);
  }

  const shareUrl = `https://pacameagencia.com/blog/${slug}`;
  const shareText = encodeURIComponent(post.title);

  return (
    <div className="bg-pacame-black min-h-screen">
      <ReadingProgress color={post.color} />
      <BreadcrumbJsonLd
        items={[
          { name: "Inicio", url: "https://pacameagencia.com" },
          { name: "Blog", url: "https://pacameagencia.com/blog" },
          { name: post.title, url: `https://pacameagencia.com/blog/${slug}` },
        ]}
      />
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
            <Link href="/blog" className="inline-flex items-center gap-2 text-sm text-pacame-white/60 hover:text-pacame-white/80 font-body mb-6">
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
              <div className="flex items-center gap-1.5 text-xs text-pacame-white/60 font-body">
                <Clock className="w-3 h-3" />
                {post.readTime}
              </div>
              <span className="text-xs text-pacame-white/50 font-body">{post.date}</span>
            </div>
          </div>

          {/* Title */}
          <h1 className="font-heading font-bold text-display text-pacame-white mb-4">
            {post.title}
          </h1>

          {/* Author + share */}
          <div className="flex items-center justify-between mb-10 pb-8 border-b border-white/[0.06]">
            <div className="flex items-center gap-3">
              <span
                className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold font-heading"
                style={{ backgroundColor: `${post.color}30`, color: post.color }}
              >
                {post.agentName[0]}
              </span>
              <div>
                <p className="text-sm text-pacame-white font-body">Escrito por {post.agentName}</p>
                <p className="text-xs text-pacame-white/60 font-body">Agente IA de PACAME</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-pacame-white/50 font-body mr-1 hidden sm:inline">
                <Share2 className="w-3 h-3 inline mr-1" />Compartir
              </span>
              <a
                href={`https://twitter.com/intent/tweet?text=${shareText}&url=${encodeURIComponent(shareUrl)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-lg bg-dark-card border border-white/[0.06] flex items-center justify-center text-xs text-pacame-white/50 hover:text-pacame-white hover:border-white/20 transition-colors"
                aria-label="Compartir en X"
              >
                X
              </a>
              <a
                href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-lg bg-dark-card border border-white/[0.06] flex items-center justify-center text-xs text-pacame-white/50 hover:text-pacame-white hover:border-white/20 transition-colors"
                aria-label="Compartir en LinkedIn"
              >
                in
              </a>
              <a
                href={`https://api.whatsapp.com/send?text=${shareText}%20${encodeURIComponent(shareUrl)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-lg bg-dark-card border border-white/[0.06] flex items-center justify-center text-xs text-pacame-white/50 hover:text-pacame-white hover:border-white/20 transition-colors"
                aria-label="Compartir por WhatsApp"
              >
                WA
              </a>
            </div>
          </div>

          {/* Content */}
          <div className="space-y-1">
            {renderContent(post.content)}
          </div>

          {/* Related posts */}
          {relatedPosts.length > 0 && (
            <div className="mt-16 pt-10 border-t border-white/[0.06]">
              <ScrollReveal>
                <h3 className="font-heading font-bold text-xl text-pacame-white mb-6">
                  Articulos relacionados
                </h3>
              </ScrollReveal>
              <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" staggerDelay={0.1}>
                {relatedPosts.map((rp) => (
                  <StaggerItem key={rp.slug}>
                    <CardTilt tiltMaxAngle={8}>
                      <CardTiltContent>
                        <Link
                          href={`/blog/${rp.slug}`}
                          className="group block rounded-xl bg-dark-card border border-white/[0.06] p-5 hover:border-white/[0.12] transition-all card-golden-shine"
                        >
                          <span
                            className="text-[10px] px-2 py-0.5 rounded-full font-body font-medium inline-block mb-3"
                            style={{ backgroundColor: `${rp.color}15`, color: rp.color }}
                          >
                            {rp.category}
                          </span>
                          <h4 className="font-heading font-semibold text-sm text-pacame-white group-hover:text-electric-violet transition-colors line-clamp-2 mb-2">
                            {rp.title}
                          </h4>
                          <p className="text-xs text-pacame-white/60 font-body flex items-center gap-1.5">
                            <Clock className="w-3 h-3" />{rp.readTime}
                          </p>
                        </Link>
                      </CardTiltContent>
                    </CardTilt>
                  </StaggerItem>
                ))}
              </StaggerContainer>
            </div>
          )}

          <div className="mt-12"><GoldenDivider variant="line" /></div>

          {/* CTA */}
          <ScrollReveal>
            <CardTilt tiltMaxAngle={4}>
              <CardTiltContent className="mt-8 rounded-2xl bg-dark-card border border-electric-violet/20 p-8 text-center card-golden-shine">
                <h3 className="font-heading font-bold text-xl text-pacame-white mb-3">
                  Quieres resultados como estos para tu negocio?
                </h3>
                <p className="text-sm text-pacame-white/60 font-body mb-6">
                  Diagnostico gratuito. Presupuesto en 24 horas. Sin compromiso.
                </p>
                <MagneticButton>
                  <ShinyButton
                    gradientFrom="#D4A853"
                    gradientTo="#7C3AED"
                    gradientOpacity={0.8}
                    className="min-w-[260px] h-14 px-8 text-base font-medium shadow-glow-gold hover:shadow-glow-gold-lg transition-shadow duration-500"
                  >
                    <Link href="/contacto" className="flex items-center gap-2 text-pacame-white">
                      Pedir diagnostico gratis
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </ShinyButton>
                </MagneticButton>
              </CardTiltContent>
            </CardTilt>
          </ScrollReveal>
        </div>
      </article>
    </div>
  );
}
