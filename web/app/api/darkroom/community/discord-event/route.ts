/**
 * POST /api/darkroom/community/discord-event
 *
 * Endpoint llamado por el bot Discord (VPS) cada vez que recibe un evento
 * relevante (messageCreate, guildMemberAdd). Devuelve la respuesta del agente
 * IRIS/NIMBO/VECTOR que el bot debe postear de vuelta al canal/DM.
 *
 * Auth: HMAC-SHA256 del body con `DARKROOM_DISCORD_BOT_SECRET` (compartido
 * bot↔Vercel). Header `x-darkroom-signature: sha256=<hex>`.
 *
 * Body (messageCreate):
 *   {
 *     "event": "messageCreate",
 *     "discord_user_id": "1234567890",
 *     "discord_username": "user#0",
 *     "channel_key": "discord:soporte-ai",  // mapeo key → canal nuestro
 *     "content": "no me deja entrar a midjourney",
 *     "display_name": "User Demo"
 *   }
 *
 * Body (guildMemberAdd):
 *   {
 *     "event": "guildMemberAdd",
 *     "discord_user_id": "1234567890",
 *     "discord_username": "user#0",
 *     "display_name": "User Demo"
 *   }
 *
 * Response 200 (messageCreate):
 *   { ok: true, reply: "...", agent: "iris", silent: false }
 * Response 200 (guildMemberAdd):
 *   { ok: true, dm: "Bienvenido...", reply: null }
 */

import { NextRequest, NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "node:crypto";
import { dispatch } from "@/lib/darkroom/community";
import { upsertMember } from "@/lib/darkroom/community/members";
import { recordEvent } from "@/lib/darkroom/community/messages";
import { getLogger } from "@/lib/observability/logger";
import type { DiscordChannel } from "@/lib/darkroom/community/types";

export const runtime = "nodejs";
export const maxDuration = 30;

const VALID_CHANNEL_KEYS: ReadonlySet<DiscordChannel> = new Set([
  "discord:bienvenida",
  "discord:reglas-y-faq",
  "discord:anuncios",
  "discord:soporte-ai",
  "discord:status-stack",
  "discord:stack-tutoriales",
  "discord:showcase",
  "discord:oportunidades",
  "discord:confesionario",
  "discord:crew-vip",
  "discord:ofertas-pablo",
  "discord:dm",
] as const);

function verifySignature(rawBody: string, signature: string | null): boolean {
  if (!signature) return false;
  const secret = process.env.DARKROOM_DISCORD_BOT_SECRET;
  if (!secret) return false;
  const [algo, sig] = signature.split("=", 2);
  if (algo !== "sha256" || !sig) return false;
  const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
  try {
    return timingSafeEqual(Buffer.from(sig, "hex"), Buffer.from(expected, "hex"));
  } catch {
    return false;
  }
}

interface MessageCreatePayload {
  event: "messageCreate";
  discord_user_id: string;
  discord_username?: string;
  channel_key: DiscordChannel;
  content: string;
  display_name?: string;
}

interface GuildMemberAddPayload {
  event: "guildMemberAdd";
  discord_user_id: string;
  discord_username?: string;
  display_name?: string;
}

type Payload = MessageCreatePayload | GuildMemberAddPayload;

export async function POST(request: NextRequest) {
  const raw = await request.text();
  const sig = request.headers.get("x-darkroom-signature");
  if (!verifySignature(raw, sig)) {
    return NextResponse.json({ ok: false, error: "invalid_signature" }, { status: 401 });
  }

  let body: Payload;
  try {
    body = JSON.parse(raw) as Payload;
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  if (body.event === "guildMemberAdd") {
    const member = await upsertMember({
      lookup: { discordUserId: body.discord_user_id },
      patch: {
        discordUsername: body.discord_username,
        displayName: body.display_name,
        tier: "lurker",
      },
    });
    await recordEvent({
      memberId: member.id,
      eventType: "discord:joined",
      payload: { username: body.discord_username },
      deliveredVia: "discord_dm",
      status: "recorded",
    });
    const dm =
      `Hola ${body.display_name || body.discord_username || "creator"}, bienvenido a DarkRoom.\n\n` +
      `Tres cosas en 30s:\n` +
      `1. Pásate por #reglas-y-faq.\n` +
      `2. Salta a #stack-tutoriales y abre el primero.\n` +
      `3. Si tienes preguntas pre-pago, pregúntame aquí 1:1.\n\n` +
      `darkroomcreative.cloud · 14 días gratis sin tarjeta.`;
    return NextResponse.json({ ok: true, dm, reply: null });
  }

  if (body.event === "messageCreate") {
    if (!VALID_CHANNEL_KEYS.has(body.channel_key)) {
      return NextResponse.json(
        { ok: false, error: "invalid_channel_key" },
        { status: 400 },
      );
    }
    if (!body.content || body.content.trim().length === 0) {
      return NextResponse.json({ ok: true, reply: null, silent: true });
    }
    try {
      const result = await dispatch({
        lookup: { discordUserId: body.discord_user_id },
        channel: body.channel_key,
        contentRaw: body.content,
        memberHints: {
          discordUsername: body.discord_username,
          displayName: body.display_name,
        },
      });
      if (result.silent || !result.response) {
        return NextResponse.json({
          ok: true,
          reply: null,
          silent: result.silent,
          reason: result.reason,
        });
      }
      return NextResponse.json({
        ok: true,
        reply: result.response.reply,
        agent: result.response.agent,
        escalated: result.response.escalated,
        silent: false,
      });
    } catch (err) {
      getLogger().error({ err }, "[dr-discord-event] dispatch failed");
      return NextResponse.json({ ok: false, error: "dispatch_failed" }, { status: 500 });
    }
  }

  return NextResponse.json({ ok: false, error: "unknown_event" }, { status: 400 });
}
