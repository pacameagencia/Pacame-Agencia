/**
 * Instagram Business API Library
 *
 * - OAuth flow (Instagram Business Login)
 * - Send/receive DMs (Instagram Messaging API)
 * - Publish posts (container-based)
 * - Read insights
 *
 * Token resolution: usa META_SYSTEM_USER_TOKEN si está (permanente) — fallback a
 * INSTAGRAM_ACCESS_TOKEN (long-lived 60d). Ver web/lib/meta-token.ts.
 */

import { getMetaToken } from "./meta-token";

const INSTAGRAM_APP_ID = process.env.INSTAGRAM_APP_ID;
const INSTAGRAM_APP_SECRET = process.env.INSTAGRAM_APP_SECRET;
const GRAPH_API = "https://graph.instagram.com";
const GRAPH_FB_API = "https://graph.facebook.com/v21.0";

// Runtime overrides (set tras OAuth en /api/instagram/callback). Si vacío → fallback a getMetaToken().
let accessTokenOverride = "";
let igAccountId = process.env.INSTAGRAM_ACCOUNT_ID || "";

function resolveToken(): string {
  return accessTokenOverride || getMetaToken("instagram");
}

export const INSTAGRAM_VERIFY_TOKEN = process.env.INSTAGRAM_VERIFY_TOKEN || "pacame_ig_verify_2026";

// ─── OAuth ───────────────────────────────────────────────────────

/**
 * Build the Instagram Business Login authorization URL.
 */
export function getAuthUrl(redirectUri: string): string {
  const params = new URLSearchParams({
    client_id: INSTAGRAM_APP_ID!,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: [
      "instagram_basic",
      "instagram_content_publish",
      "instagram_manage_comments",
      "instagram_manage_insights",
      "instagram_manage_messages",
    ].join(","),
  });
  return `https://www.instagram.com/oauth/authorize?${params}`;
}

/**
 * Exchange the authorization code for a short-lived token, then extend it.
 */
export async function exchangeCodeForToken(
  code: string,
  redirectUri: string
): Promise<{ accessToken: string; userId: string; expiresIn: number }> {
  // Step 1: short-lived token
  const shortRes = await fetch(`${GRAPH_API}/oauth/access_token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: INSTAGRAM_APP_ID!,
      client_secret: INSTAGRAM_APP_SECRET!,
      grant_type: "authorization_code",
      redirect_uri: redirectUri,
      code,
    }),
  });

  if (!shortRes.ok) {
    const err = await shortRes.json();
    throw new Error(err.error_message || `OAuth short token failed: ${shortRes.status}`);
  }

  const shortData = (await shortRes.json()) as {
    access_token: string;
    user_id: string;
  };

  // Step 2: exchange for long-lived token (60 days)
  const longRes = await fetch(
    `${GRAPH_API}/access_token?` +
      new URLSearchParams({
        grant_type: "ig_exchange_token",
        client_secret: INSTAGRAM_APP_SECRET!,
        access_token: shortData.access_token,
      })
  );

  if (!longRes.ok) {
    const err = await longRes.json();
    throw new Error(err.error_message || `OAuth long token failed: ${longRes.status}`);
  }

  const longData = (await longRes.json()) as {
    access_token: string;
    token_type: string;
    expires_in: number;
  };

  // Update runtime values
  accessTokenOverride = longData.access_token;
  igAccountId = shortData.user_id;

  return {
    accessToken: longData.access_token,
    userId: shortData.user_id,
    expiresIn: longData.expires_in,
  };
}

/**
 * Refresh a long-lived token (call every ~50 days via cron).
 * Solo necesario si NO se usa META_SYSTEM_USER_TOKEN (permanente).
 */
export async function refreshToken(): Promise<{
  accessToken: string;
  expiresIn: number;
}> {
  const current = resolveToken();
  const res = await fetch(
    `${GRAPH_API}/refresh_access_token?` +
      new URLSearchParams({
        grant_type: "ig_refresh_token",
        access_token: current,
      })
  );

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error_message || `Token refresh failed: ${res.status}`);
  }

  const data = (await res.json()) as {
    access_token: string;
    token_type: string;
    expires_in: number;
  };

  accessTokenOverride = data.access_token;

  return { accessToken: data.access_token, expiresIn: data.expires_in };
}

// ─── Messaging (DMs) ────────────────────────────────────────────

/**
 * Send a DM reply to an Instagram user.
 * Note: Can only reply to users who messaged first (Meta policy).
 */
export async function sendInstagramDM(
  recipientId: string,
  text: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const res = await fetch(`${GRAPH_FB_API}/${igAccountId}/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${resolveToken()}`,
      },
      body: JSON.stringify({
        recipient: { id: recipientId },
        message: { text },
      }),
    });

    if (!res.ok) {
      const err = await res.json();
      return { success: false, error: err.error?.message || `HTTP ${res.status}` };
    }

    const data = (await res.json()) as { message_id?: string };
    return { success: true, messageId: data.message_id };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

// ─── Publishing ─────────────────────────────────────────────────

interface PublishOptions {
  imageUrl: string;
  caption: string;
  hashtags?: string;
}

interface CarouselItem {
  imageUrl: string;
}

/**
 * Publish a single image post.
 */
export async function publishPost(
  options: PublishOptions
): Promise<{ success: boolean; postId?: string; error?: string }> {
  const caption = [options.caption, options.hashtags].filter(Boolean).join("\n\n");

  try {
    // Step 1: Create media container
    const containerRes = await fetch(`${GRAPH_FB_API}/${igAccountId}/media`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        image_url: options.imageUrl,
        caption,
        access_token: resolveToken(),
      }),
    });

    if (!containerRes.ok) {
      const err = await containerRes.json();
      return { success: false, error: err.error?.message || "Container failed" };
    }

    const container = (await containerRes.json()) as { id: string };

    // Step 2: Publish
    const pubRes = await fetch(`${GRAPH_FB_API}/${igAccountId}/media_publish`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        creation_id: container.id,
        access_token: resolveToken(),
      }),
    });

    if (!pubRes.ok) {
      const err = await pubRes.json();
      return { success: false, error: err.error?.message || "Publish failed" };
    }

    const published = (await pubRes.json()) as { id: string };
    return { success: true, postId: published.id };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

/**
 * Publish a carousel (2-10 images).
 */
export async function publishCarousel(
  items: CarouselItem[],
  caption: string,
  hashtags?: string
): Promise<{ success: boolean; postId?: string; error?: string }> {
  const fullCaption = [caption, hashtags].filter(Boolean).join("\n\n");

  try {
    // Step 1: Create child containers
    const childIds: string[] = [];
    for (const item of items) {
      const res = await fetch(`${GRAPH_FB_API}/${igAccountId}/media`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image_url: item.imageUrl,
          is_carousel_item: true,
          access_token: resolveToken(),
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        return { success: false, error: err.error?.message || "Carousel child failed" };
      }

      const data = (await res.json()) as { id: string };
      childIds.push(data.id);
    }

    // Step 2: Create carousel container
    const carouselRes = await fetch(`${GRAPH_FB_API}/${igAccountId}/media`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        media_type: "CAROUSEL",
        caption: fullCaption,
        children: childIds,
        access_token: resolveToken(),
      }),
    });

    if (!carouselRes.ok) {
      const err = await carouselRes.json();
      return { success: false, error: err.error?.message || "Carousel container failed" };
    }

    const carousel = (await carouselRes.json()) as { id: string };

    // Step 3: Publish
    const pubRes = await fetch(`${GRAPH_FB_API}/${igAccountId}/media_publish`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        creation_id: carousel.id,
        access_token: resolveToken(),
      }),
    });

    if (!pubRes.ok) {
      const err = await pubRes.json();
      return { success: false, error: err.error?.message || "Carousel publish failed" };
    }

    const published = (await pubRes.json()) as { id: string };
    return { success: true, postId: published.id };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

// ─── Insights ───────────────────────────────────────────────────

interface InsightsData {
  followers: number;
  reach: number;
  impressions: number;
  profileViews: number;
}

/**
 * Get account insights for the last 7 days.
 */
export async function getInsights(): Promise<{
  success: boolean;
  data?: InsightsData;
  error?: string;
}> {
  try {
    const metrics = "follower_count,reach,impressions,profile_views";
    const res = await fetch(
      `${GRAPH_FB_API}/${igAccountId}/insights?` +
        new URLSearchParams({
          metric: metrics,
          period: "day",
          access_token: resolveToken(),
        })
    );

    if (!res.ok) {
      const err = await res.json();
      return { success: false, error: err.error?.message || `HTTP ${res.status}` };
    }

    const json = (await res.json()) as {
      data: Array<{ name: string; values: Array<{ value: number }> }>;
    };

    const getValue = (name: string) =>
      json.data.find((d) => d.name === name)?.values?.[0]?.value || 0;

    return {
      success: true,
      data: {
        followers: getValue("follower_count"),
        reach: getValue("reach"),
        impressions: getValue("impressions"),
        profileViews: getValue("profile_views"),
      },
    };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

/**
 * Get recent media with engagement metrics.
 */
export async function getRecentMedia(limit = 10): Promise<{
  success: boolean;
  posts?: Array<{
    id: string;
    caption: string;
    mediaType: string;
    timestamp: string;
    likeCount: number;
    commentsCount: number;
  }>;
  error?: string;
}> {
  try {
    const res = await fetch(
      `${GRAPH_FB_API}/${igAccountId}/media?` +
        new URLSearchParams({
          fields: "id,caption,media_type,timestamp,like_count,comments_count",
          limit: String(limit),
          access_token: resolveToken(),
        })
    );

    if (!res.ok) {
      const err = await res.json();
      return { success: false, error: err.error?.message || `HTTP ${res.status}` };
    }

    const json = (await res.json()) as {
      data: Array<{
        id: string;
        caption: string;
        media_type: string;
        timestamp: string;
        like_count: number;
        comments_count: number;
      }>;
    };

    return {
      success: true,
      posts: json.data.map((p) => ({
        id: p.id,
        caption: p.caption || "",
        mediaType: p.media_type,
        timestamp: p.timestamp,
        likeCount: p.like_count || 0,
        commentsCount: p.comments_count || 0,
      })),
    };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

// ─── Comments ───────────────────────────────────────────────────

/**
 * Reply to a comment on a post.
 */
export async function replyToComment(
  commentId: string,
  text: string
): Promise<{ success: boolean; commentId?: string; error?: string }> {
  try {
    const res = await fetch(`${GRAPH_FB_API}/${commentId}/replies`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: text,
        access_token: resolveToken(),
      }),
    });

    if (!res.ok) {
      const err = await res.json();
      return { success: false, error: err.error?.message || `HTTP ${res.status}` };
    }

    const data = (await res.json()) as { id: string };
    return { success: true, commentId: data.id };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

// ─── Helpers ────────────────────────────────────────────────────

export function isConfigured(): boolean {
  return !!(resolveToken() && igAccountId);
}

export function getAccountId(): string {
  return igAccountId;
}

export function getAccessToken(): string {
  return resolveToken();
}

export function setCredentials(token: string, accountId: string): void {
  accessTokenOverride = token;
  igAccountId = accountId;
}
