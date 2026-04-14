import { NextRequest, NextResponse } from "next/server";
import { verifyInternalAuth } from "@/lib/api-auth";
import { logAgentActivity } from "@/lib/agent-logger";
import {
  publishPost,
  publishCarousel,
  sendInstagramDM,
  getInsights,
  getRecentMedia,
  replyToComment,
  refreshToken,
  getAuthUrl,
  isConfigured,
} from "@/lib/instagram";

/**
 * Instagram Actions API
 *
 * Actions:
 * - auth_url     → Get OAuth authorization URL
 * - publish      → Publish a single image post
 * - carousel     → Publish a carousel (2-10 images)
 * - send_dm      → Send a DM reply
 * - reply_comment → Reply to a comment
 * - insights     → Get account insights
 * - media        → Get recent media with metrics
 * - refresh      → Refresh access token
 * - status       → Check configuration status
 */
export async function POST(request: NextRequest) {
  const authError = verifyInternalAuth(request);
  if (authError) return authError;

  const body = await request.json();
  const { action } = body;

  // --- Auth URL (no token needed) ---
  if (action === "auth_url") {
    const redirectUri = `${request.nextUrl.origin}/api/instagram/callback`;
    const url = getAuthUrl(redirectUri);
    return NextResponse.json({ url });
  }

  // --- Status check ---
  if (action === "status") {
    return NextResponse.json({
      configured: isConfigured(),
      hasAppCredentials: !!(process.env.INSTAGRAM_APP_ID && process.env.INSTAGRAM_APP_SECRET),
    });
  }

  // All other actions require a configured token
  if (!isConfigured()) {
    return NextResponse.json(
      { error: "Instagram not configured. Complete OAuth first." },
      { status: 400 }
    );
  }

  // --- Publish single image ---
  if (action === "publish") {
    const { imageUrl, caption, hashtags } = body;
    if (!imageUrl || !caption) {
      return NextResponse.json({ error: "imageUrl and caption required" }, { status: 400 });
    }

    const result = await publishPost({ imageUrl, caption, hashtags });

    if (result.success) {
      logAgentActivity({
        agentId: "pulse",
        type: "delivery",
        title: "Post publicado en Instagram",
        description: caption.slice(0, 100),
        metadata: { post_id: result.postId },
      });
    }

    return NextResponse.json(result);
  }

  // --- Publish carousel ---
  if (action === "carousel") {
    const { items, caption, hashtags } = body;
    if (!items?.length || !caption) {
      return NextResponse.json({ error: "items[] and caption required" }, { status: 400 });
    }

    const result = await publishCarousel(items, caption, hashtags);

    if (result.success) {
      logAgentActivity({
        agentId: "pulse",
        type: "delivery",
        title: "Carrusel publicado en Instagram",
        description: `${items.length} imagenes — ${caption.slice(0, 80)}`,
        metadata: { post_id: result.postId },
      });
    }

    return NextResponse.json(result);
  }

  // --- Send DM ---
  if (action === "send_dm") {
    const { recipientId, text } = body;
    if (!recipientId || !text) {
      return NextResponse.json({ error: "recipientId and text required" }, { status: 400 });
    }

    const result = await sendInstagramDM(recipientId, text);
    return NextResponse.json(result);
  }

  // --- Reply to comment ---
  if (action === "reply_comment") {
    const { commentId, text } = body;
    if (!commentId || !text) {
      return NextResponse.json({ error: "commentId and text required" }, { status: 400 });
    }

    const result = await replyToComment(commentId, text);
    return NextResponse.json(result);
  }

  // --- Insights ---
  if (action === "insights") {
    const result = await getInsights();
    return NextResponse.json(result);
  }

  // --- Recent media ---
  if (action === "media") {
    const limit = body.limit || 10;
    const result = await getRecentMedia(limit);
    return NextResponse.json(result);
  }

  // --- Refresh token ---
  if (action === "refresh") {
    try {
      const result = await refreshToken();
      return NextResponse.json({
        success: true,
        expiresIn: result.expiresIn,
        message: `Token renovado. Expira en ${Math.round(result.expiresIn / 86400)} dias.`,
      });
    } catch (err) {
      return NextResponse.json({
        success: false,
        error: err instanceof Error ? err.message : "Refresh failed",
      });
    }
  }

  return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
}
