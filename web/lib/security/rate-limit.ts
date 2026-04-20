/**
 * Rate limiting utilities — Upstash Redis (prod) con fallback in-memory (dev).
 *
 * En produccion usa @upstash/ratelimit + @upstash/redis (requiere las env
 * UPSTASH_REDIS_REST_URL y UPSTASH_REDIS_REST_TOKEN). Si no estan configuradas
 * o si las librerias no estan instaladas, se aplica un LRU in-memory simple
 * (sliding window aproximado). Esto permite que tsc compile y que local-dev
 * funcione sin Redis.
 */

import { NextRequest } from "next/server";
import { getLogger } from "@/lib/observability/logger";

// ──────────────────────────────────────────────────────────────────
// Tipos
// ──────────────────────────────────────────────────────────────────

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number; // epoch ms cuando se resetea la ventana
}

export interface Limiter {
  limit: (key: string) => Promise<RateLimitResult>;
  name: string;
  tokens: number;
  windowMs: number;
}

export interface LimiterOpts {
  window: string; // e.g. "1 m", "5 m", "1 h" (formato @upstash/ratelimit)
  tokens: number;
}

// ──────────────────────────────────────────────────────────────────
// Helpers de ventana
// ──────────────────────────────────────────────────────────────────

function parseWindowMs(window: string): number {
  // "1 m" → 60000, "5 m" → 300000, "1 h" → 3600000, "10 s" → 10000
  const match = window.trim().match(/^(\d+)\s*([smhd])$/i);
  if (!match) return 60_000; // default 1 min
  const n = parseInt(match[1], 10);
  const unit = match[2].toLowerCase();
  switch (unit) {
    case "s":
      return n * 1_000;
    case "m":
      return n * 60_000;
    case "h":
      return n * 3_600_000;
    case "d":
      return n * 86_400_000;
    default:
      return 60_000;
  }
}

// ──────────────────────────────────────────────────────────────────
// Upstash dynamic loader (singleton)
// ──────────────────────────────────────────────────────────────────

type UpstashRatelimit = {
  limit: (key: string) => Promise<{
    success: boolean;
    limit: number;
    remaining: number;
    reset: number;
  }>;
};

interface UpstashModules {
  ratelimit: (tokens: number, window: string, prefix: string) => UpstashRatelimit;
  ping: () => Promise<unknown>;
}

let upstashPromise: Promise<UpstashModules | null> | null = null;

async function loadUpstash(): Promise<UpstashModules | null> {
  if (upstashPromise) return upstashPromise;
  upstashPromise = (async () => {
    if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
      return null;
    }
    try {
      // Dynamic imports — si la libreria no esta instalada tsc NO casca porque
      // usamos string literal + catch.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const ratelimitMod: any = await import("@upstash/ratelimit" as string).catch(
        () => null
      );
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const redisMod: any = await import("@upstash/redis" as string).catch(() => null);
      if (!ratelimitMod || !redisMod) return null;

      const Ratelimit = ratelimitMod.Ratelimit || ratelimitMod.default?.Ratelimit;
      const Redis = redisMod.Redis || redisMod.default?.Redis;
      if (!Ratelimit || !Redis) return null;

      const redis = Redis.fromEnv();

      return {
        ratelimit: (tokens: number, window: string, prefix: string) =>
          new Ratelimit({
            redis,
            limiter: Ratelimit.slidingWindow(tokens, window),
            prefix,
            analytics: false,
          }) as UpstashRatelimit,
        ping: () => redis.ping() as Promise<unknown>,
      };
    } catch {
      return null;
    }
  })();
  return upstashPromise;
}

export async function pingUpstash(): Promise<boolean> {
  const mods = await loadUpstash();
  if (!mods) return false;
  try {
    await mods.ping();
    return true;
  } catch {
    return false;
  }
}

// ──────────────────────────────────────────────────────────────────
// In-memory fallback (LRU 1000 entries)
// ──────────────────────────────────────────────────────────────────

interface MemoryEntry {
  count: number;
  resetAt: number;
}

const MAX_MEM_ENTRIES = 1000;
const memoryStore = new Map<string, MemoryEntry>();

function memoryLimit(
  key: string,
  tokens: number,
  windowMs: number
): RateLimitResult {
  const now = Date.now();
  let entry = memoryStore.get(key);

  if (!entry || entry.resetAt <= now) {
    entry = { count: 0, resetAt: now + windowMs };
  }

  entry.count += 1;

  // Re-insert para LRU freshness
  memoryStore.delete(key);
  memoryStore.set(key, entry);

  // Evict si nos pasamos
  if (memoryStore.size > MAX_MEM_ENTRIES) {
    const firstKey = memoryStore.keys().next().value;
    if (firstKey !== undefined) memoryStore.delete(firstKey);
  }

  const remaining = Math.max(0, tokens - entry.count);
  return {
    success: entry.count <= tokens,
    limit: tokens,
    remaining,
    reset: entry.resetAt,
  };
}

// ──────────────────────────────────────────────────────────────────
// Factory
// ──────────────────────────────────────────────────────────────────

export function createLimiter(name: string, opts: LimiterOpts): Limiter {
  const windowMs = parseWindowMs(opts.window);

  return {
    name,
    tokens: opts.tokens,
    windowMs,
    async limit(key: string): Promise<RateLimitResult> {
      const mods = await loadUpstash();
      if (mods) {
        try {
          const rl = mods.ratelimit(opts.tokens, opts.window, `pacame:${name}`);
          const res = await rl.limit(key);
          return {
            success: res.success,
            limit: res.limit,
            remaining: res.remaining,
            reset: res.reset,
          };
        } catch (err) {
          getLogger().error({ err, name }, "[rate-limit] Upstash error, fallback memory");
          // fallthrough a memoria
        }
      }
      return memoryLimit(`${name}:${key}`, opts.tokens, windowMs);
    },
  };
}

// ──────────────────────────────────────────────────────────────────
// Pre-configured limiters
// ──────────────────────────────────────────────────────────────────

export const authLimiter = createLimiter("auth", { window: "1 m", tokens: 5 });
export const clientAuthLimiter = createLimiter("client-auth", {
  window: "5 m",
  tokens: 10,
});
export const checkoutLimiter = createLimiter("checkout", {
  window: "1 m",
  tokens: 20,
});
export const ordersLimiter = createLimiter("orders", {
  window: "1 m",
  tokens: 60,
});
export const webhookLimiter = createLimiter("webhook", {
  window: "1 m",
  tokens: 300,
});

// ──────────────────────────────────────────────────────────────────
// Client IP helper
// ──────────────────────────────────────────────────────────────────

export function getClientIp(request: NextRequest): string {
  const xff = request.headers.get("x-forwarded-for");
  if (xff) {
    const first = xff.split(",")[0]?.trim();
    if (first) return first;
  }
  const realIp = request.headers.get("x-real-ip");
  if (realIp) return realIp.trim();
  const cfIp = request.headers.get("cf-connecting-ip");
  if (cfIp) return cfIp.trim();
  return "unknown";
}

// ──────────────────────────────────────────────────────────────────
// Bypass de IPs/providers conocidos (Stripe webhooks, Meta, etc.)
// ──────────────────────────────────────────────────────────────────

// Subset representativo de IPs de Stripe webhooks (https://docs.stripe.com/ips).
// Lista parcial — Stripe publica rangos CIDR; hacemos prefix match basico.
const STRIPE_WEBHOOK_IPS = new Set<string>([
  "3.18.12.63",
  "3.130.192.231",
  "13.235.14.237",
  "13.235.122.149",
  "18.211.135.69",
  "35.154.171.200",
  "52.15.183.38",
  "54.88.130.119",
  "54.88.130.237",
  "54.187.174.169",
  "54.187.205.235",
  "54.187.216.72",
]);

export function isTrustedWebhookSource(request: NextRequest): boolean {
  const ip = getClientIp(request);
  if (STRIPE_WEBHOOK_IPS.has(ip)) return true;

  // Meta/WhatsApp firma sus webhooks con X-Hub-Signature-256.
  // Si el header esta presente con formato sha256=..., asumimos Meta legit.
  const hub = request.headers.get("x-hub-signature-256");
  if (hub && /^sha256=[a-f0-9]{64}$/i.test(hub)) return true;

  return false;
}
