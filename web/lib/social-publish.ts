/**
 * Social Media Publishing Library
 *
 * Supports:
 * - Meta Graph API (Instagram + Facebook) — usa META_SYSTEM_USER_TOKEN si está
 * - LinkedIn API
 * - Buffer API (fallback for all platforms)
 *
 * Priority: Direct API > Buffer
 */

import { getMetaToken, hasMetaToken } from "@/lib/meta-token";

const META_PAGE_ID = process.env.META_PAGE_ID;
const INSTAGRAM_ACCOUNT_ID = process.env.INSTAGRAM_ACCOUNT_ID;
const LINKEDIN_ACCESS_TOKEN = process.env.LINKEDIN_ACCESS_TOKEN;
const LINKEDIN_ORG_ID = process.env.LINKEDIN_ORG_ID;
const BUFFER_ACCESS_TOKEN = process.env.BUFFER_ACCESS_TOKEN;

const GRAPH_API = "https://graph.facebook.com/v21.0";

interface PublishResult {
  success: boolean;
  post_id?: string;
  platform: string;
  method: "direct" | "buffer";
  error?: string;
}

interface PublishOptions {
  platform: "instagram" | "facebook" | "linkedin" | "twitter" | "tiktok";
  text: string;
  imageUrl?: string;
  hashtags?: string;
  link?: string;
  scheduledFor?: string; // ISO date for Buffer scheduling
}

/**
 * Check which platforms are configured for direct publishing.
 */
export function getConfiguredPlatforms(): Record<string, boolean> {
  const hasFb = hasMetaToken("page");
  const hasIg = hasMetaToken("instagram");
  return {
    facebook: !!(hasFb && META_PAGE_ID),
    instagram: !!(hasIg && INSTAGRAM_ACCOUNT_ID),
    linkedin: !!(LINKEDIN_ACCESS_TOKEN && LINKEDIN_ORG_ID),
    buffer: !!BUFFER_ACCESS_TOKEN,
  };
}

/**
 * Publish content to a platform. Tries direct API first, falls back to Buffer.
 */
export async function publishContent(options: PublishOptions): Promise<PublishResult> {
  const { platform } = options;

  // Try direct API first
  switch (platform) {
    case "facebook":
      if (hasMetaToken("page") && META_PAGE_ID) {
        return publishToFacebook(options);
      }
      break;
    case "instagram":
      if (hasMetaToken("instagram") && INSTAGRAM_ACCOUNT_ID) {
        return publishToInstagram(options);
      }
      break;
    case "linkedin":
      if (LINKEDIN_ACCESS_TOKEN && LINKEDIN_ORG_ID) {
        return publishToLinkedIn(options);
      }
      break;
  }

  // Fallback to Buffer
  if (BUFFER_ACCESS_TOKEN) {
    return publishViaBuffer(options);
  }

  return {
    success: false,
    platform,
    method: "direct",
    error: `No API configured for ${platform}. Set up direct API or Buffer.`,
  };
}

// --- Facebook (Meta Graph API) ---
async function publishToFacebook(options: PublishOptions): Promise<PublishResult> {
  const { text, imageUrl, link, hashtags } = options;
  const fullText = [text, hashtags].filter(Boolean).join("\n\n");
  const pageToken = getMetaToken("page");

  try {
    let endpoint = `${GRAPH_API}/${META_PAGE_ID}/feed`;
    const params: Record<string, string> = {
      access_token: pageToken,
      message: fullText,
    };

    if (imageUrl) {
      endpoint = `${GRAPH_API}/${META_PAGE_ID}/photos`;
      params.url = imageUrl;
      params.caption = fullText;
      delete params.message;
    } else if (link) {
      params.link = link;
    }

    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    });

    if (!res.ok) {
      const err = await res.json();
      return { success: false, platform: "facebook", method: "direct", error: err.error?.message || `HTTP ${res.status}` };
    }

    const data = await res.json() as { id?: string; post_id?: string };
    return { success: true, platform: "facebook", method: "direct", post_id: data.id || data.post_id };
  } catch (err) {
    return { success: false, platform: "facebook", method: "direct", error: err instanceof Error ? err.message : "Unknown error" };
  }
}

// --- Instagram (Meta Graph API — Container-based publishing) ---
async function publishToInstagram(options: PublishOptions): Promise<PublishResult> {
  const { text, imageUrl, hashtags } = options;

  if (!imageUrl) {
    return { success: false, platform: "instagram", method: "direct", error: "Instagram requires an image URL" };
  }

  const caption = [text, hashtags].filter(Boolean).join("\n\n");
  const igToken = getMetaToken("instagram");

  try {
    // Step 1: Create media container
    const containerRes = await fetch(
      `${GRAPH_API}/${INSTAGRAM_ACCOUNT_ID}/media`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image_url: imageUrl,
          caption,
          access_token: igToken,
        }),
      }
    );

    if (!containerRes.ok) {
      const err = await containerRes.json();
      return { success: false, platform: "instagram", method: "direct", error: err.error?.message || "Container creation failed" };
    }

    const container = await containerRes.json() as { id: string };

    // Step 2: Publish the container
    const publishRes = await fetch(
      `${GRAPH_API}/${INSTAGRAM_ACCOUNT_ID}/media_publish`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          creation_id: container.id,
          access_token: igToken,
        }),
      }
    );

    if (!publishRes.ok) {
      const err = await publishRes.json();
      return { success: false, platform: "instagram", method: "direct", error: err.error?.message || "Publish failed" };
    }

    const published = await publishRes.json() as { id: string };
    return { success: true, platform: "instagram", method: "direct", post_id: published.id };
  } catch (err) {
    return { success: false, platform: "instagram", method: "direct", error: err instanceof Error ? err.message : "Unknown error" };
  }
}

// --- LinkedIn ---
async function publishToLinkedIn(options: PublishOptions): Promise<PublishResult> {
  const { text, hashtags, link } = options;
  const fullText = [text, hashtags].filter(Boolean).join("\n\n");

  try {
    const shareData: Record<string, unknown> = {
      author: `urn:li:organization:${LINKEDIN_ORG_ID}`,
      lifecycleState: "PUBLISHED",
      specificContent: {
        "com.linkedin.ugc.ShareContent": {
          shareCommentary: { text: fullText },
          shareMediaCategory: link ? "ARTICLE" : "NONE",
          ...(link
            ? {
                media: [
                  {
                    status: "READY",
                    originalUrl: link,
                  },
                ],
              }
            : {}),
        },
      },
      visibility: {
        "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC",
      },
    };

    const res = await fetch("https://api.linkedin.com/v2/ugcPosts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${LINKEDIN_ACCESS_TOKEN}`,
        "X-Restli-Protocol-Version": "2.0.0",
      },
      body: JSON.stringify(shareData),
    });

    if (!res.ok) {
      const err = await res.json();
      return { success: false, platform: "linkedin", method: "direct", error: err.message || `HTTP ${res.status}` };
    }

    const postId = res.headers.get("x-restli-id") || "";
    return { success: true, platform: "linkedin", method: "direct", post_id: postId };
  } catch (err) {
    return { success: false, platform: "linkedin", method: "direct", error: err instanceof Error ? err.message : "Unknown error" };
  }
}

// --- Buffer (universal fallback) ---
async function publishViaBuffer(options: PublishOptions): Promise<PublishResult> {
  const { platform, text, imageUrl, hashtags, scheduledFor } = options;
  const fullText = [text, hashtags].filter(Boolean).join("\n\n");

  try {
    // Get Buffer profiles to find the right one for this platform
    const profilesRes = await fetch("https://api.bufferapp.com/1/profiles.json", {
      headers: { Authorization: `Bearer ${BUFFER_ACCESS_TOKEN}` },
    });

    if (!profilesRes.ok) {
      return { success: false, platform, method: "buffer", error: "Failed to fetch Buffer profiles" };
    }

    const profiles = await profilesRes.json() as Array<{ id: string; service: string; formatted_service: string }>;
    const platformMap: Record<string, string> = {
      instagram: "instagram",
      facebook: "facebook",
      linkedin: "linkedin",
      twitter: "twitter",
      tiktok: "tiktok",
    };

    const profile = profiles.find((p) => p.service === platformMap[platform]);
    if (!profile) {
      return { success: false, platform, method: "buffer", error: `No Buffer profile found for ${platform}` };
    }

    // Create Buffer update
    const updateData: Record<string, unknown> = {
      profile_ids: [profile.id],
      text: fullText,
      now: !scheduledFor,
    };

    if (scheduledFor) {
      updateData.scheduled_at = scheduledFor;
    }

    if (imageUrl) {
      updateData.media = { photo: imageUrl };
    }

    const createRes = await fetch("https://api.bufferapp.com/1/updates/create.json", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${BUFFER_ACCESS_TOKEN}`,
      },
      body: JSON.stringify(updateData),
    });

    if (!createRes.ok) {
      const err = await createRes.json();
      return { success: false, platform, method: "buffer", error: err.message || "Buffer create failed" };
    }

    const update = await createRes.json() as { updates?: Array<{ id: string }> };
    const updateId = update.updates?.[0]?.id;

    return { success: true, platform, method: "buffer", post_id: updateId };
  } catch (err) {
    return { success: false, platform, method: "buffer", error: err instanceof Error ? err.message : "Unknown error" };
  }
}

/**
 * Publish content to multiple platforms at once.
 */
export async function publishToMultiple(
  platforms: PublishOptions["platform"][],
  content: Omit<PublishOptions, "platform">
): Promise<PublishResult[]> {
  const results = await Promise.allSettled(
    platforms.map((platform) => publishContent({ ...content, platform }))
  );

  return results.map((r, i) =>
    r.status === "fulfilled"
      ? r.value
      : { success: false, platform: platforms[i], method: "direct" as const, error: "Promise rejected" }
  );
}
