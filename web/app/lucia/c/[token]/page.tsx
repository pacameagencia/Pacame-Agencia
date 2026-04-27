/**
 * /lucia/c/[token] — Vista pública (read-only) de una conversación con Lucía.
 *
 * Ruta:
 *   1. Carga el token desde DB. Si no existe → 404.
 *   2. Carga los mensajes de la conv en orden.
 *   3. Incrementa view_count (analítica viral).
 *   4. Pinta los mensajes y un CTA grande "Pruébalo tú gratis".
 *
 * SEO:
 *   - noindex (es contenido del usuario, no nuestro)
 *   - Pero sí Open Graph rico para que pegar el link en WhatsApp/Twitter
 *     muestre preview con el título de la conv y avatar Lucía.
 */

import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { createServerSupabase } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ token: string }>;
}

async function loadShared(token: string) {
  const supabase = createServerSupabase();
  const { data: shared } = await supabase
    .from("pacame_gpt_shared_conversations")
    .select("token, conversation_id, title, view_count, expires_at")
    .eq("token", token)
    .maybeSingle();
  if (!shared) return null;
  if (shared.expires_at && new Date(shared.expires_at) < new Date()) return null;

  const { data: msgs } = await supabase
    .from("pacame_gpt_messages")
    .select("id, role, content, created_at")
    .eq("conversation_id", shared.conversation_id)
    .order("created_at", { ascending: true });

  // Bump view count (fire-and-forget, no esperamos).
  supabase
    .from("pacame_gpt_shared_conversations")
    .update({ view_count: (shared.view_count ?? 0) + 1 })
    .eq("token", token)
    .then(() => {});

  return { shared, messages: msgs || [] };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { token } = await params;
  const data = await loadShared(token);
  const url = `https://pacameagencia.com/lucia/c/${token}`;
  if (!data) {
    return { title: "Conversación no encontrada · PACAME GPT", robots: { index: false, follow: false } };
  }
  const title = `${data.shared.title} · PACAME GPT`;
  const description = "Una conversación con Lucía, la IA española de PACAME. Pruébala tú gratis.";
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      type: "article",
      locale: "es_ES",
      siteName: "PACAME GPT",
    },
    twitter: { card: "summary_large_image", title, description },
    robots: { index: false, follow: true },
  };
}

export default async function SharedConversationPage({ params }: PageProps) {
  const { token } = await params;
  const data = await loadShared(token);
  if (!data) notFound();

  const { shared, messages } = data;

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#f4efe3",
        color: "#1a1813",
        fontFamily: "var(--font-instrument-sans), system-ui, sans-serif",
      }}
    >
      <header
        style={{
          background: "#ffffff",
          borderBottom: "1px solid rgba(26,24,19,0.06)",
          padding: "16px 22px",
          display: "flex",
          alignItems: "center",
          gap: 12,
        }}
      >
        <div
          style={{
            width: 38,
            height: 38,
            borderRadius: "50%",
            background: "linear-gradient(135deg,#b54e30,#e8b730)",
            color: "#f4efe3",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: 600,
            fontFamily: "var(--font-fraunces), Georgia, serif",
          }}
        >
          L
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontFamily: "var(--font-fraunces), Georgia, serif",
              fontWeight: 600,
              fontSize: 16,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {shared.title}
          </div>
          <div style={{ fontSize: 12, color: "#6e6858" }}>
            Conversación compartida con Lucía
          </div>
        </div>
        <Link
          href="/lucia"
          style={{
            background: "#1a1813",
            color: "#f4efe3",
            padding: "8px 14px",
            borderRadius: 10,
            fontSize: 13,
            fontWeight: 600,
            textDecoration: "none",
          }}
        >
          Probar gratis
        </Link>
      </header>

      <div
        style={{
          maxWidth: 720,
          margin: "0 auto",
          padding: "24px 18px 48px",
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        {messages.length === 0 && (
          <p style={{ color: "#6e6858", textAlign: "center", padding: 32 }}>
            Esta conversación está vacía.
          </p>
        )}
        {messages.map((m: any) => {
          const isUser = m.role === "user";
          return (
            <div
              key={m.id}
              style={{
                display: "flex",
                justifyContent: isUser ? "flex-end" : "flex-start",
              }}
            >
              <div
                style={{
                  maxWidth: "78%",
                  padding: "10px 14px",
                  borderRadius: 18,
                  borderTopLeftRadius: isUser ? 18 : 6,
                  borderTopRightRadius: isUser ? 6 : 18,
                  background: isUser ? "#b54e30" : "#ffffff",
                  color: isUser ? "#f9f5ea" : "#1a1813",
                  fontSize: 15,
                  lineHeight: 1.45,
                  whiteSpace: "pre-wrap",
                  boxShadow: isUser ? "none" : "0 1px 2px rgba(26,24,19,0.04)",
                }}
              >
                {m.content}
              </div>
            </div>
          );
        })}
      </div>

      {/* CTA viral */}
      <section
        style={{
          background: "linear-gradient(135deg,#b54e30 0%,#9c3e24 100%)",
          color: "#f9f5ea",
          padding: "44px 24px",
          textAlign: "center",
        }}
      >
        <h2
          style={{
            fontFamily: "var(--font-fraunces), Georgia, serif",
            fontSize: 28,
            fontWeight: 500,
            margin: "0 0 8px",
          }}
        >
          ¿Te ha gustado lo que ha dicho Lucía?
        </h2>
        <p style={{ fontSize: 15, opacity: 0.92, marginBottom: 20 }}>
          Crea tu cuenta gratis y prueba PACAME GPT 14 días sin tarjeta.
        </p>
        <Link
          href="/pacame-gpt/login"
          style={{
            background: "#f9f5ea",
            color: "#7a2e18",
            padding: "14px 26px",
            borderRadius: 14,
            fontSize: 15,
            fontWeight: 700,
            textDecoration: "none",
            display: "inline-flex",
          }}
        >
          Probar Lucía gratis →
        </Link>
      </section>
    </main>
  );
}
