import { createServerSupabase } from "@/lib/supabase/server";
import { decryptSecret } from "@/lib/crypto-secrets";

/**
 * WordPress REST API driver. Talks to the standard /wp-json/wp/v2 namespace
 * using application passwords (Basic auth). The plugin MU is optional and
 * only needed for inbound webhooks (Phase 5) — this file covers PACAME → WP.
 */

export type WpClient = {
  websiteId: string;
  baseUrl: string;
  apiBase: string;
  authHeader: string;
  seoPlugin: "yoast" | "rankmath" | "none";
};

export type WpPost = {
  id: number;
  title: { rendered: string };
  link: string;
  status: string;
  modified_gmt: string;
  excerpt?: { rendered: string };
};

export type WpMedia = {
  id: number;
  source_url: string;
  alt_text?: string;
};

const USER_AGENT = "PACAME-Bot/1.0 (+https://pacameagencia.com)";

function joinUrl(base: string, path: string): string {
  const b = base.replace(/\/+$/, "");
  const p = path.replace(/^\/+/, "");
  return `${b}/${p}`;
}

/**
 * Build a WP client for a given client_websites row. Decrypts the app password.
 * Throws if site not found or credentials missing.
 */
export async function wpClient(websiteId: string): Promise<WpClient> {
  const supabase = createServerSupabase();
  const { data, error } = await supabase
    .from("client_websites")
    .select("*")
    .eq("id", websiteId)
    .single();

  if (error || !data) {
    throw new Error(`client_websites ${websiteId} not found: ${error?.message || "no row"}`);
  }
  if (data.platform !== "wordpress") {
    throw new Error(`client_websites ${websiteId} is platform=${data.platform}, expected wordpress`);
  }
  if (!data.wp_user || !data.wp_app_password_ciphertext || !data.wp_app_password_iv || !data.wp_app_password_tag) {
    throw new Error(`client_websites ${websiteId} has incomplete WP credentials`);
  }

  const password = decryptSecret({
    ciphertext: data.wp_app_password_ciphertext,
    iv: data.wp_app_password_iv,
    tag: data.wp_app_password_tag,
  });

  const auth = Buffer.from(`${data.wp_user}:${password}`).toString("base64");

  return {
    websiteId,
    baseUrl: data.base_url,
    apiBase: joinUrl(data.base_url, `wp-json/${data.wp_api_namespace || "wp/v2"}`),
    authHeader: `Basic ${auth}`,
    seoPlugin: (data.seo_plugin as "yoast" | "rankmath" | "none") || "none",
  };
}

async function wpFetch<T>(client: WpClient, path: string, init: RequestInit = {}): Promise<T> {
  const url = path.startsWith("http") ? path : joinUrl(client.apiBase, path);
  const headers = new Headers(init.headers || {});
  headers.set("Authorization", client.authHeader);
  headers.set("User-Agent", USER_AGENT);
  if (init.body && !headers.has("Content-Type") && typeof init.body === "string") {
    headers.set("Content-Type", "application/json");
  }
  const res = await fetch(url, { ...init, headers });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`WP ${init.method || "GET"} ${path} → ${res.status}: ${text.slice(0, 300)}`);
  }
  return res.json() as Promise<T>;
}

/**
 * Generic passthrough to the WP REST API. Lets PACAME drive the client's
 * WordPress for any operation (pages, products, media, custom endpoints, etc.)
 * without adding a dedicated typed wrapper for each case.
 *
 * `path` accepts three shapes:
 *   - "posts/42"            → resolved against client.apiBase (default wp/v2)
 *   - "wp/v2/pages/12"      → namespaced path joined with /wp-json/
 *   - "wc/v3/products"      → custom namespace (WooCommerce, etc.)
 */
export async function wpRequest(
  client: WpClient,
  method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH",
  path: string,
  options: { body?: unknown; query?: Record<string, string | number | boolean | undefined> } = {}
): Promise<unknown> {
  let url: string;
  if (path.startsWith("http")) {
    url = path;
  } else if (/^([a-z0-9-]+)\/v\d+\//i.test(path)) {
    url = joinUrl(client.baseUrl, `wp-json/${path}`);
  } else {
    url = joinUrl(client.apiBase, path);
  }

  if (options.query) {
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(options.query)) {
      if (v === undefined) continue;
      params.set(k, String(v));
    }
    const qs = params.toString();
    if (qs) url += (url.includes("?") ? "&" : "?") + qs;
  }

  const headers: Record<string, string> = {
    Authorization: client.authHeader,
    "User-Agent": USER_AGENT,
  };
  let body: BodyInit | undefined;
  if (options.body !== undefined) {
    body = JSON.stringify(options.body);
    headers["Content-Type"] = "application/json";
  }

  const res = await fetch(url, { method, headers, body });
  const text = await res.text();
  let parsed: unknown;
  try {
    parsed = text ? JSON.parse(text) : null;
  } catch {
    parsed = text;
  }
  if (!res.ok) {
    const detail = typeof parsed === "string" ? parsed : JSON.stringify(parsed);
    throw new Error(`WP ${method} ${path} → ${res.status}: ${detail.slice(0, 500)}`);
  }
  return parsed;
}

/**
 * Validates credentials by fetching the authenticated user.
 * Returns user info on success, throws on auth failure.
 */
export async function wpPing(client: WpClient): Promise<{ id: number; name: string; roles?: string[] }> {
  return wpFetch(client, "users/me?context=edit");
}

/**
 * List pages of the connected WP. Returns the raw WP page payload.
 */
export async function wpListPages(client: WpClient, opts: { perPage?: number; status?: string } = {}): Promise<unknown[]> {
  const params = new URLSearchParams();
  params.set("per_page", String(opts.perPage ?? 20));
  if (opts.status) params.set("status", opts.status);
  return wpFetch(client, `pages?${params.toString()}`);
}

/**
 * Update an existing WP page (idempotent).
 */
export async function wpUpdatePage(client: WpClient, pageId: number, payload: Record<string, unknown>): Promise<unknown> {
  return wpFetch(client, `pages/${pageId}`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

/**
 * List media library entries.
 */
export async function wpListMedia(client: WpClient, opts: { perPage?: number; search?: string } = {}): Promise<unknown[]> {
  const params = new URLSearchParams();
  params.set("per_page", String(opts.perPage ?? 30));
  if (opts.search) params.set("search", opts.search);
  return wpFetch(client, `media?${params.toString()}`);
}

/**
 * List recent posts for the connected WP. Used to show an overview in the dashboard.
 */
export async function wpListPosts(client: WpClient, opts: { perPage?: number; search?: string; status?: string } = {}): Promise<WpPost[]> {
  const params = new URLSearchParams();
  params.set("per_page", String(opts.perPage ?? 10));
  params.set("orderby", "modified");
  params.set("order", "desc");
  params.set("status", opts.status || "publish,draft,future");
  if (opts.search) params.set("search", opts.search);
  return wpFetch(client, `posts?${params.toString()}`);
}

/**
 * Upload an image (from a public URL) to WP media library.
 * Returns the media id and the canonical source_url to use as featured_media.
 */
export async function wpUploadMedia(client: WpClient, imageUrl: string, alt?: string): Promise<WpMedia> {
  const res = await fetch(imageUrl, { headers: { "User-Agent": USER_AGENT } });
  if (!res.ok) throw new Error(`Cannot fetch source image ${imageUrl}: ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  const contentType = res.headers.get("content-type") || "image/jpeg";
  const ext = contentType.includes("png") ? "png" : contentType.includes("webp") ? "webp" : "jpg";
  const filename = `pacame-${Date.now()}.${ext}`;

  const headers = new Headers();
  headers.set("Authorization", client.authHeader);
  headers.set("User-Agent", USER_AGENT);
  headers.set("Content-Type", contentType);
  headers.set("Content-Disposition", `attachment; filename="${filename}"`);

  const upRes = await fetch(joinUrl(client.apiBase, "media"), { method: "POST", headers, body: buf });
  if (!upRes.ok) {
    const text = await upRes.text().catch(() => "");
    throw new Error(`WP media upload failed: ${upRes.status} ${text.slice(0, 300)}`);
  }
  const media = await upRes.json() as WpMedia;
  if (alt) {
    await wpFetch(client, `media/${media.id}`, {
      method: "POST",
      body: JSON.stringify({ alt_text: alt }),
    });
  }
  return media;
}

export type WpCreatePostInput = {
  title: string;
  content: string;
  excerpt?: string;
  status?: "publish" | "draft" | "pending" | "future";
  featured_media?: number;
  pacameContentId: string;
  seo?: { title?: string; description?: string };
};

/**
 * Create a new WP post. Stores `pacame_uuid` in post meta for inverse correlation.
 * Returns the created post id and URL.
 */
export async function wpCreatePost(client: WpClient, input: WpCreatePostInput): Promise<WpPost> {
  const meta: Record<string, string> = { pacame_uuid: input.pacameContentId };
  if (input.seo) {
    if (client.seoPlugin === "yoast") {
      if (input.seo.title) meta._yoast_wpseo_title = input.seo.title;
      if (input.seo.description) meta._yoast_wpseo_metadesc = input.seo.description;
    } else if (client.seoPlugin === "rankmath") {
      if (input.seo.title) meta.rank_math_title = input.seo.title;
      if (input.seo.description) meta.rank_math_description = input.seo.description;
    }
  }
  return wpFetch(client, "posts", {
    method: "POST",
    body: JSON.stringify({
      title: input.title,
      content: input.content,
      excerpt: input.excerpt,
      status: input.status || "draft",
      featured_media: input.featured_media,
      meta,
    }),
  });
}

/**
 * Idempotent update of an existing WP post (when content.external_id is set).
 */
export async function wpUpdatePost(client: WpClient, postId: number, payload: Partial<WpCreatePostInput>): Promise<WpPost> {
  const meta: Record<string, string> = {};
  if (payload.pacameContentId) meta.pacame_uuid = payload.pacameContentId;
  if (payload.seo) {
    if (client.seoPlugin === "yoast") {
      if (payload.seo.title) meta._yoast_wpseo_title = payload.seo.title;
      if (payload.seo.description) meta._yoast_wpseo_metadesc = payload.seo.description;
    } else if (client.seoPlugin === "rankmath") {
      if (payload.seo.title) meta.rank_math_title = payload.seo.title;
      if (payload.seo.description) meta.rank_math_description = payload.seo.description;
    }
  }
  return wpFetch(client, `posts/${postId}`, {
    method: "POST",
    body: JSON.stringify({
      title: payload.title,
      content: payload.content,
      excerpt: payload.excerpt,
      status: payload.status,
      featured_media: payload.featured_media,
      meta: Object.keys(meta).length ? meta : undefined,
    }),
  });
}

// =============================================================================
//  WooCommerce helpers (REST v3)
// =============================================================================

/**
 * Update a single WC product. Auth con la misma application password.
 * WC acepta basic auth de admin con app password en la mayoría de instalaciones.
 */
export async function wcUpdateProduct(
  client: WpClient,
  productId: number,
  payload: Record<string, unknown>
): Promise<unknown> {
  return wpRequest(client, "POST", `wc/v3/products/${productId}`, { body: payload });
}

/**
 * Batch update / create / delete de productos en una sola llamada.
 * Body: { update: [{id, field}, ...], create: [...], delete: [id, ...] }
 */
export async function wcBatchProducts(
  client: WpClient,
  ops: { update?: Array<{ id: number } & Record<string, unknown>>; create?: Record<string, unknown>[]; delete?: number[] }
): Promise<unknown> {
  return wpRequest(client, "POST", "wc/v3/products/batch", { body: ops });
}

/**
 * List atributos globales (Marca, Movimiento, Material caja, etc.)
 */
export async function wcListAttributes(client: WpClient): Promise<unknown> {
  return wpRequest(client, "GET", "wc/v3/products/attributes");
}

/**
 * Crear atributo global (slug, name).
 */
export async function wcCreateAttribute(
  client: WpClient,
  payload: { name: string; slug: string; type?: "select" | "text"; has_archives?: boolean; order_by?: "menu_order" | "name" | "name_num" | "id" }
): Promise<unknown> {
  return wpRequest(client, "POST", "wc/v3/products/attributes", { body: payload });
}

// =============================================================================
//  Elementor bridge (requires plugin MU pacame-connect.php with /reset-to-gutenberg)
// =============================================================================

/**
 * Reescribe una página de WP que actualmente usa Elementor (`_elementor_data` post meta)
 * borrando ese meta y poniendo `post_content` Gutenberg/HTML estándar.
 *
 * IMPORTANTE: requiere plugin MU `pacame-connect.php` instalado en el sitio cliente y
 * webhook_secret configurado. El endpoint custom `/wp-json/pacame/v1/page/{id}/reset-to-gutenberg`
 * vacía el meta de Elementor y purga la caché LiteSpeed.
 *
 * Esta función NO la llama directamente — se invoca desde el endpoint pasarela
 * `/api/clients/[id]/websites/[wid]/mu` con `path = "page/{id}/reset-to-gutenberg"`.
 * Se exporta como helper documental para uso desde scripts y tests locales.
 */
export type ResetToGutenbergInput = {
  pageId: number;
  content: string;
  title?: string;
  excerpt?: string;
  status?: "publish" | "draft" | "pending";
  removeElementor?: boolean;
};

export function buildResetToGutenbergPayload(input: ResetToGutenbergInput) {
  return {
    method: "POST" as const,
    path: `page/${input.pageId}/reset-to-gutenberg`,
    body: {
      content: input.content,
      title: input.title,
      excerpt: input.excerpt,
      status: input.status || "publish",
      remove_elementor: input.removeElementor !== false,
    },
  };
}
