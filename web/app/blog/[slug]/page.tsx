import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

// ISR: post de blog — 1h cache
export const revalidate = 3600;
import { ArrowLeft, Clock, ArrowRight, Calendar } from "lucide-react";
import { blogPosts } from "@/lib/data/blog-posts";
import ReadingProgress from "@/components/blog/ReadingProgress";
import BreadcrumbJsonLd from "@/components/BreadcrumbJsonLd";
import ScrollReveal from "@/components/ui/scroll-reveal";
import { CardTilt, CardTiltContent } from "@/components/ui/card-tilt";
import GoldenDivider from "@/components/effects/GoldenDivider";
import MagneticButton from "@/components/effects/MagneticButton";
import { ShinyButton } from "@/components/ui/shiny-button";
import TableOfContents from "@/components/blog/TableOfContents";
import ShareButtons from "@/components/blog/ShareButtons";
import InlineNewsletter from "@/components/blog/InlineNewsletter";
import PostContent from "@/components/blog/PostContent";
import { extractHeadings, readingTimeMinutes } from "@/lib/blog-utils";

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
      publishedTime: post.dateISO,
      authors: [post.agentName],
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

  const headings = extractHeadings(post.content);
  // Si el autor ya definio readTime manual lo respetamos, si no lo calculamos
  const computedReadTime = readingTimeMinutes(post.content);
  const readTimeLabel = post.readTime || `${computedReadTime} min`;

  // Related: mismo category, fallback con otros
  const relatedSameCat = blogPosts
    .filter((p) => p.slug !== slug && p.category === post.category)
    .slice(0, 3);
  const related =
    relatedSameCat.length >= 3
      ? relatedSameCat
      : [
          ...relatedSameCat,
          ...blogPosts
            .filter(
              (p) =>
                p.slug !== slug && !relatedSameCat.some((r) => r.slug === p.slug),
            )
            .slice(0, 3 - relatedSameCat.length),
        ];

  const shareUrl = `https://pacameagencia.com/blog/${slug}`;

  return (
    <div className="bg-pacame-black min-h-screen">
      <ReadingProgress color={post.color} />
      <BreadcrumbJsonLd
        items={[
          { name: "Inicio", url: "https://pacameagencia.com" },
          { name: "Blog", url: "https://pacameagencia.com/blog" },
          { name: post.title, url: shareUrl },
        ]}
      />
      {/* Structured data: Article completo */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Article",
            headline: post.title,
            description: post.excerpt,
            author: {
              "@type": "Person",
              name: post.agentName,
              worksFor: {
                "@type": "Organization",
                name: "PACAME",
              },
            },
            publisher: {
              "@type": "Organization",
              name: "PACAME",
              url: "https://pacameagencia.com",
              logo: {
                "@type": "ImageObject",
                url: "https://pacameagencia.com/logo.png",
              },
            },
            datePublished: post.dateISO,
            dateModified: post.dateISO,
            mainEntityOfPage: {
              "@type": "WebPage",
              "@id": shareUrl,
            },
            articleSection: post.category,
            wordCount: post.content.split(/\s+/).length,
            image: `https://pacameagencia.com/api/og?title=${encodeURIComponent(post.title)}&category=${encodeURIComponent(post.category)}`,
            url: shareUrl,
          }),
        }}
      />

      <article className="pt-36 pb-20">
        {/* Hero con breadcrumb + meta + title */}
        <header className="max-w-6xl mx-auto px-6 mb-12">
          <nav aria-label="Breadcrumb" className="mb-8">
            <Link
              href="/blog"
              className="inline-flex items-center gap-2 text-sm text-pacame-white/50 hover:text-olympus-gold font-body transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Volver al blog
            </Link>
          </nav>

          <div className="max-w-3xl">
            <div className="flex flex-wrap items-center gap-3 mb-5">
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
              <div className="flex items-center gap-1.5 text-xs text-pacame-white/50 font-body">
                <Clock className="w-3 h-3" />
                {readTimeLabel} de lectura
              </div>
              <div className="flex items-center gap-1.5 text-xs text-pacame-white/50 font-body">
                <Calendar className="w-3 h-3" />
                {post.date}
              </div>
            </div>

            <h1 className="font-heading font-bold text-display text-pacame-white mb-6 text-balance leading-tight">
              {post.title}
            </h1>

            <p className="text-xl text-pacame-white/70 font-body font-light mb-8 leading-relaxed">
              {post.excerpt}
            </p>

            <div className="flex items-center justify-between pb-8 border-b border-white/[0.06]">
              <div className="flex items-center gap-3">
                <span
                  className="w-10 h-10 rounded-full flex items-center justify-center text-base font-bold font-heading"
                  style={{
                    backgroundColor: `${post.color}30`,
                    color: post.color,
                    border: `1px solid ${post.color}40`,
                  }}
                >
                  {post.agentName[0]}
                </span>
                <div>
                  <p className="text-sm text-pacame-white font-body font-medium">
                    {post.agentName}
                  </p>
                  <p className="text-xs text-pacame-white/50 font-body">
                    Agente IA de PACAME
                  </p>
                </div>
              </div>
              <ShareButtons url={shareUrl} title={post.title} />
            </div>
          </div>
        </header>

        {/* Cover visual — gradient con la categoria si no hay imagen real */}
        <div className="max-w-6xl mx-auto px-6 mb-16">
          <div
            className="relative w-full aspect-[21/9] rounded-3xl overflow-hidden border border-white/[0.06]"
            style={{
              background: `linear-gradient(135deg, ${post.color}30 0%, #141414 50%, ${post.color}20 100%)`,
            }}
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(212,168,83,0.15),transparent_60%)]" />
            <div className="absolute inset-0 flex items-center justify-center">
              <span
                className="font-heading font-bold text-[12vw] leading-none opacity-10 select-none"
                style={{ color: post.color }}
              >
                {post.agentName}
              </span>
            </div>
          </div>
        </div>

        {/* Layout 3 columnas */}
        <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-[220px_minmax(0,1fr)_260px] gap-10 lg:gap-12">
          {/* Left: TOC sticky (solo en desktop) */}
          <aside className="hidden lg:block">
            <div className="sticky top-28">
              <TableOfContents headings={headings} accentColor={post.color} />
            </div>
          </aside>

          {/* Center: contenido */}
          <div className="min-w-0">
            <PostContent markdown={post.content} />

            <div className="mt-16"><GoldenDivider variant="line" /></div>

            {/* CTA final fuerte */}
            <ScrollReveal>
              <CardTilt tiltMaxAngle={4}>
                <CardTiltContent className="mt-10 rounded-3xl bg-gradient-to-br from-olympus-gold/10 via-dark-card to-electric-violet/10 border border-olympus-gold/20 p-10 text-center card-golden-shine">
                  <p className="text-[11px] uppercase tracking-[0.25em] text-olympus-gold font-body font-medium mb-4">
                    Del blog al producto
                  </p>
                  <h3 className="font-heading font-bold text-2xl md:text-3xl text-pacame-white mb-4 text-balance">
                    Te gusta lo que lees? Ahora pruebalo con tu negocio.
                  </h3>
                  <p className="text-base text-pacame-white/60 font-body mb-8 max-w-xl mx-auto">
                    Diagnostico digital gratuito. Te decimos que necesitas,
                    cuanto cuesta y lo entregamos en menos de 10 dias.
                  </p>
                  <MagneticButton>
                    <ShinyButton
                      gradientFrom="#D4A853"
                      gradientTo="#7C3AED"
                      gradientOpacity={0.8}
                      className="min-w-[280px] h-14 px-8 text-base font-medium shadow-glow-gold hover:shadow-glow-gold-lg transition-shadow duration-500"
                    >
                      <Link href="/servicios" className="flex items-center gap-2 text-pacame-white">
                        Ver servicios PACAME
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    </ShinyButton>
                  </MagneticButton>
                </CardTiltContent>
              </CardTilt>
            </ScrollReveal>
          </div>

          {/* Right: sidebar sticky */}
          <aside className="hidden lg:block">
            <div className="sticky top-28 space-y-6">
              <InlineNewsletter />

              {/* Related posts */}
              {related.length > 0 && (
                <div className="rounded-2xl bg-dark-card border border-white/[0.06] p-5">
                  <p className="uppercase tracking-[0.2em] text-[11px] text-olympus-gold/70 font-body font-medium mb-4">
                    Seguir leyendo
                  </p>
                  <ul className="space-y-4">
                    {related.slice(0, 3).map((rp) => (
                      <li key={rp.slug}>
                        <Link
                          href={`/blog/${rp.slug}`}
                          className="group block"
                        >
                          <span
                            className="text-[10px] uppercase tracking-wider font-body inline-block mb-1"
                            style={{ color: rp.color }}
                          >
                            {rp.category}
                          </span>
                          <h4 className="font-heading font-semibold text-sm text-pacame-white/90 group-hover:text-olympus-gold transition-colors leading-snug line-clamp-2">
                            {rp.title}
                          </h4>
                          <p className="text-[11px] text-pacame-white/40 font-body mt-1 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {rp.readTime}
                          </p>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Share vertical */}
              <div className="rounded-2xl bg-dark-card border border-white/[0.06] p-5">
                <p className="uppercase tracking-[0.2em] text-[11px] text-olympus-gold/70 font-body font-medium mb-4">
                  Compartir articulo
                </p>
                <ShareButtons url={shareUrl} title={post.title} />
              </div>
            </div>
          </aside>
        </div>

        {/* Related mobile */}
        {related.length > 0 && (
          <div className="lg:hidden max-w-3xl mx-auto px-6 mt-16 pt-10 border-t border-white/[0.06]">
            <ScrollReveal>
              <h3 className="font-heading font-bold text-xl text-pacame-white mb-6">
                Articulos relacionados
              </h3>
            </ScrollReveal>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {related.slice(0, 2).map((rp) => (
                <Link
                  key={rp.slug}
                  href={`/blog/${rp.slug}`}
                  className="group block rounded-xl bg-dark-card border border-white/[0.06] p-5 hover:border-olympus-gold/20 transition-all"
                >
                  <span
                    className="text-[10px] px-2 py-0.5 rounded-full font-body font-medium inline-block mb-3"
                    style={{
                      backgroundColor: `${rp.color}15`,
                      color: rp.color,
                    }}
                  >
                    {rp.category}
                  </span>
                  <h4 className="font-heading font-semibold text-sm text-pacame-white group-hover:text-olympus-gold transition-colors line-clamp-2 mb-2">
                    {rp.title}
                  </h4>
                  <p className="text-xs text-pacame-white/60 font-body flex items-center gap-1.5">
                    <Clock className="w-3 h-3" />
                    {rp.readTime}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        )}
      </article>
    </div>
  );
}
