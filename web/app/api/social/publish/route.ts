import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { verifyInternalAuth } from "@/lib/api-auth";
import { logAgentActivity } from "@/lib/agent-logger";
import { publishContent, publishToMultiple, getConfiguredPlatforms } from "@/lib/social-publish";

const supabase = createServerSupabase();

/**
 * Social Media Publishing API
 *
 * Actions:
 * - publish: Publish a single content piece to a platform
 * - publish_approved: Publish all approved content waiting to be published
 * - status: Check which platforms are configured
 */
export async function POST(request: NextRequest) {
  const authError = verifyInternalAuth(request);
  if (authError) return authError;

  const body = await request.json();
  const { action } = body;

  // --- Check platform configuration ---
  if (action === "status") {
    return NextResponse.json({ platforms: getConfiguredPlatforms() });
  }

  // --- Publish a single content piece ---
  if (action === "publish") {
    const { content_id, platform } = body;
    if (!content_id) return NextResponse.json({ error: "content_id required" }, { status: 400 });

    const { data: content } = await supabase
      .from("content")
      .select("*")
      .eq("id", content_id)
      .single();

    if (!content) return NextResponse.json({ error: "Content not found" }, { status: 404 });

    const targetPlatform = platform || content.platform;

    const result = await publishContent({
      platform: targetPlatform,
      text: content.body || content.title || "",
      imageUrl: content.image_url || undefined,
      hashtags: content.hashtags || undefined,
      link: content.link || undefined,
    });

    if (result.success) {
      await supabase.from("content").update({
        status: "published",
        published_at: new Date().toISOString(),
        engagement_data: {
          ...(content.engagement_data as Record<string, unknown> || {}),
          platform_post_id: result.post_id,
          published_via: result.method,
          published_platform: result.platform,
        },
      }).eq("id", content_id);

      logAgentActivity({
        agentId: "pulse",
        type: "delivery",
        title: `Publicado en ${targetPlatform}`,
        description: `"${(content.title || "").slice(0, 60)}" publicado via ${result.method}.`,
        metadata: { content_id, platform: targetPlatform, post_id: result.post_id },
      });
    }

    return NextResponse.json({
      ok: result.success,
      platform: result.platform,
      method: result.method,
      post_id: result.post_id,
      error: result.error,
    });
  }

  // --- Publish all approved content ---
  if (action === "publish_approved") {
    const { data: approved } = await supabase
      .from("content")
      .select("*")
      .eq("status", "approved")
      .order("created_at", { ascending: true })
      .limit(10);

    if (!approved?.length) {
      return NextResponse.json({ ok: true, published: 0, message: "No content to publish" });
    }

    let published = 0;
    let failed = 0;
    const results: Array<{ content_id: string; platform: string; success: boolean; error?: string }> = [];

    for (const content of approved) {
      const platform = content.platform || "instagram";

      const result = await publishContent({
        platform,
        text: content.body || content.title || "",
        imageUrl: content.image_url || undefined,
        hashtags: content.hashtags || undefined,
        link: content.link || undefined,
      });

      if (result.success) {
        published++;
        await supabase.from("content").update({
          status: "published",
          published_at: new Date().toISOString(),
          engagement_data: {
            ...(content.engagement_data as Record<string, unknown> || {}),
            platform_post_id: result.post_id,
            published_via: result.method,
          },
        }).eq("id", content.id);
      } else {
        failed++;
      }

      results.push({
        content_id: content.id,
        platform,
        success: result.success,
        error: result.error,
      });

      // Small delay between publishes
      await new Promise((r) => setTimeout(r, 1000));
    }

    if (published > 0) {
      logAgentActivity({
        agentId: "pulse",
        type: "task_completed",
        title: `Publicacion batch completada`,
        description: `${published} publicados, ${failed} fallidos.`,
        metadata: { published, failed, results },
      });
    }

    return NextResponse.json({ ok: true, published, failed, results });
  }

  // --- Cross-post: publish one content to multiple platforms ---
  if (action === "crosspost") {
    const { content_id, platforms } = body;
    if (!content_id || !platforms?.length) {
      return NextResponse.json({ error: "content_id and platforms[] required" }, { status: 400 });
    }

    const { data: content } = await supabase
      .from("content")
      .select("*")
      .eq("id", content_id)
      .single();

    if (!content) return NextResponse.json({ error: "Content not found" }, { status: 404 });

    const results = await publishToMultiple(platforms, {
      text: content.body || content.title || "",
      imageUrl: content.image_url || undefined,
      hashtags: content.hashtags || undefined,
      link: content.link || undefined,
    });

    const successCount = results.filter((r) => r.success).length;

    if (successCount > 0) {
      await supabase.from("content").update({
        status: "published",
        published_at: new Date().toISOString(),
        engagement_data: {
          ...(content.engagement_data as Record<string, unknown> || {}),
          crosspost_results: results,
        },
      }).eq("id", content_id);
    }

    return NextResponse.json({ ok: successCount > 0, results });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
