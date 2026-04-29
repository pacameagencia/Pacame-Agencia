import { NextRequest, NextResponse } from "next/server";
import { z } from "zod/v4";
import { createServerSupabase } from "@/lib/supabase/server";
import { verifyInternalAuth } from "@/lib/api-auth";
import { wpClient, wpCreatePost, wpUpdatePost, wpUploadMedia } from "@/lib/wordpress";

export const runtime = "nodejs";
export const maxDuration = 60;

const bodySchema = z.object({
  content_id: z.uuid(),
  status: z.enum(["draft", "publish", "pending", "future"]).optional(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; wid: string }> }
) {
  const unauth = verifyInternalAuth(request);
  if (unauth) return unauth;

  const { id, wid } = await params;
  const supabase = createServerSupabase();

  const raw = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid input" }, { status: 400 });
  }
  const { content_id, status: targetStatus } = parsed.data;

  // 1. Cargar content row, validar pertenencia al cliente.
  const { data: contentRow, error: contentError } = await supabase
    .from("content")
    .select("id, client_id, platform, content_type, title, body, image_url, hashtags, cta, external_id, external_platform, external_website_id")
    .eq("id", content_id)
    .single();

  if (contentError || !contentRow) {
    return NextResponse.json({ error: "content not found" }, { status: 404 });
  }
  if (contentRow.client_id !== id) {
    return NextResponse.json({ error: "content does not belong to this client" }, { status: 403 });
  }
  if (contentRow.platform !== "blog") {
    return NextResponse.json({ error: `expected platform=blog, got ${contentRow.platform}` }, { status: 400 });
  }
  if (!contentRow.title || !contentRow.body) {
    return NextResponse.json({ error: "content needs both title and body" }, { status: 400 });
  }

  // 2. Cargar website y verificar pertenencia.
  const { data: site, error: siteError } = await supabase
    .from("client_websites")
    .select("id, client_id, platform")
    .eq("id", wid)
    .eq("client_id", id)
    .single();

  if (siteError || !site) {
    return NextResponse.json({ error: "website not found for this client" }, { status: 404 });
  }
  if (site.platform !== "wordpress") {
    return NextResponse.json({ error: "publish currently supports only wordpress" }, { status: 400 });
  }

  try {
    const client = await wpClient(wid);

    // 3. Si hay imagen, subir como featured_media.
    let featuredMediaId: number | undefined;
    if (contentRow.image_url) {
      try {
        const media = await wpUploadMedia(client, contentRow.image_url, contentRow.title || undefined);
        featuredMediaId = media.id;
      } catch (mediaErr) {
        // Imagen es nice-to-have; loguear pero no bloquear publicación.
        console.warn("[wp-publish] media upload failed:", mediaErr instanceof Error ? mediaErr.message : "unknown");
      }
    }

    // 4. Construir el cuerpo del post (HTML + hashtags + CTA al final).
    let postBody = contentRow.body;
    if (contentRow.cta) {
      postBody += `\n\n<p class="pacame-cta"><strong>${contentRow.cta}</strong></p>`;
    }
    if (contentRow.hashtags) {
      postBody += `\n\n<p class="pacame-tags">${contentRow.hashtags}</p>`;
    }

    const wpStatus = targetStatus || "draft";
    const seoDescription = (contentRow.body || "").replace(/<[^>]+>/g, "").trim().slice(0, 155);

    let wpPost;
    let action: "created" | "updated";
    if (contentRow.external_id && contentRow.external_platform === "wordpress" && contentRow.external_website_id === wid) {
      // 5a. Update idempotente.
      wpPost = await wpUpdatePost(client, parseInt(contentRow.external_id, 10), {
        title: contentRow.title,
        content: postBody,
        status: wpStatus,
        featured_media: featuredMediaId,
        pacameContentId: contentRow.id,
        seo: { title: contentRow.title, description: seoDescription },
      });
      action = "updated";
    } else {
      // 5b. Create.
      wpPost = await wpCreatePost(client, {
        title: contentRow.title,
        content: postBody,
        status: wpStatus,
        featured_media: featuredMediaId,
        pacameContentId: contentRow.id,
        seo: { title: contentRow.title, description: seoDescription },
      });
      action = "created";
    }

    // 6. Marcar el content row con las refs externas.
    const nowIso = new Date().toISOString();
    await supabase
      .from("content")
      .update({
        external_id: String(wpPost.id),
        external_url: wpPost.link,
        external_platform: "wordpress",
        external_website_id: wid,
        external_modified_at: nowIso,
        status: wpStatus === "publish" ? "published" : "scheduled",
        published_at: wpStatus === "publish" ? nowIso : null,
      })
      .eq("id", content_id);

    await supabase
      .from("client_websites")
      .update({ last_publish_at: nowIso, status: "connected", last_error: null })
      .eq("id", wid);

    return NextResponse.json({
      ok: true,
      action,
      post: { id: wpPost.id, url: wpPost.link, status: wpPost.status },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown error";
    await supabase
      .from("client_websites")
      .update({ status: "error", last_error: message.slice(0, 500) })
      .eq("id", wid);
    return NextResponse.json({ ok: false, error: message }, { status: 502 });
  }
}
