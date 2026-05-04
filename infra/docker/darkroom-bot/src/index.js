/**
 * DarkRoom Discord bot · thin relay.
 *
 * Responsabilidades:
 *   1. Login al servidor Discord con DARKROOM_DISCORD_BOT_TOKEN.
 *   2. Listener `messageCreate`: cuando alguien escribe en un canal mapeado,
 *      hace POST autenticado a `${VERCEL_BASE}/api/darkroom/community/discord-event`
 *      y si recibe `reply` lo postea de vuelta al canal.
 *   3. Listener `guildMemberAdd`: cuando alguien se une, llama el mismo endpoint
 *      con event=guildMemberAdd y envía DM con la respuesta.
 *   4. Listener `interactionCreate` (futuro): slash commands /status, /lifetime.
 *
 * NO contiene lógica de negocio. Toda la inteligencia (intent + agentes) vive en
 * Vercel/Next.js. Esto facilita iterar sin redeploy del bot.
 *
 * Rate limit/safety:
 *   - Si el endpoint devuelve 5xx, espera 2s y reintenta 1 vez.
 *   - Si hay kill switch (env DARKROOM_COMMUNITY_PAUSE=true), responde solo el
 *     mensaje pre-cocinado y no llama al backend.
 */

import { Client, GatewayIntentBits, Partials, Events } from "discord.js";
import { fetch } from "undici";
import { createHmac } from "node:crypto";

const TOKEN = process.env.DARKROOM_DISCORD_BOT_TOKEN;
const VERCEL_BASE = process.env.DARKROOM_VERCEL_BASE || "https://darkroomcreative.cloud";
const SECRET = process.env.DARKROOM_DISCORD_BOT_SECRET;
const KILL_SWITCH = process.env.DARKROOM_COMMUNITY_PAUSE === "true";

if (!TOKEN || !SECRET) {
  console.error("[darkroom-bot] missing DARKROOM_DISCORD_BOT_TOKEN or DARKROOM_DISCORD_BOT_SECRET");
  process.exit(1);
}

// Mapeo nombre canal Discord → channel_key DarkRoom (debe coincidir con types.ts)
const CHANNEL_NAME_TO_KEY = {
  "bienvenida": "discord:bienvenida",
  "reglas-y-faq": "discord:reglas-y-faq",
  "anuncios": "discord:anuncios",
  "soporte-ai": "discord:soporte-ai",
  "status-stack": "discord:status-stack",
  "stack-tutoriales": "discord:stack-tutoriales",
  "showcase": "discord:showcase",
  "oportunidades": "discord:oportunidades",
  "confesionario": "discord:confesionario",
  "crew-vip": "discord:crew-vip",
  "ofertas-pablo": "discord:ofertas-pablo",
};

const KILLED_MESSAGE = `
DarkRoom · servicio temporalmente en mantenimiento.

Soporte humano: support@darkroomcreative.cloud
`.trim();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.DirectMessages,
  ],
  partials: [Partials.Channel, Partials.Message],
});

function signBody(body) {
  return "sha256=" + createHmac("sha256", SECRET).update(body).digest("hex");
}

async function callBackend(payload, attempt = 0) {
  if (KILL_SWITCH) return { ok: true, reply: KILLED_MESSAGE, silent: false };
  const body = JSON.stringify(payload);
  const sig = signBody(body);
  try {
    const res = await fetch(`${VERCEL_BASE}/api/darkroom/community/discord-event`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-darkroom-signature": sig,
      },
      body,
    });
    if (res.status >= 500 && attempt < 1) {
      await new Promise((r) => setTimeout(r, 2000));
      return callBackend(payload, attempt + 1);
    }
    if (!res.ok) {
      const text = await res.text();
      console.warn("[darkroom-bot] backend error", res.status, text.slice(0, 200));
      return { ok: false };
    }
    return await res.json();
  } catch (err) {
    console.error("[darkroom-bot] fetch failed", err.message);
    return { ok: false };
  }
}

client.once(Events.ClientReady, (c) => {
  console.log(`[darkroom-bot] ready as ${c.user.tag} · kill_switch=${KILL_SWITCH}`);
});

client.on(Events.GuildMemberAdd, async (member) => {
  if (member.user.bot) return;
  const data = await callBackend({
    event: "guildMemberAdd",
    discord_user_id: member.user.id,
    discord_username: member.user.username,
    display_name: member.displayName ?? member.user.globalName ?? null,
  });
  if (data?.dm) {
    try {
      await member.send(data.dm);
    } catch (err) {
      console.warn("[darkroom-bot] DM blocked", err.message);
    }
  }
});

client.on(Events.MessageCreate, async (msg) => {
  if (msg.author.bot) return;
  if (!msg.content || msg.content.trim().length === 0) return;

  // Resolver channel_key
  let channelKey = "discord:dm";
  if (msg.channel?.name) {
    channelKey = CHANNEL_NAME_TO_KEY[msg.channel.name] ?? "discord:dm";
  }

  const data = await callBackend({
    event: "messageCreate",
    discord_user_id: msg.author.id,
    discord_username: msg.author.username,
    display_name: msg.member?.displayName ?? msg.author.globalName ?? null,
    channel_key: channelKey,
    content: msg.content,
  });

  if (!data?.ok || data.silent || !data.reply) return;
  try {
    await msg.reply({ content: data.reply, allowedMentions: { repliedUser: true } });
  } catch (err) {
    console.warn("[darkroom-bot] reply failed", err.message);
  }
});

client.on(Events.Error, (err) => {
  console.error("[darkroom-bot] discord client error", err);
});

process.on("SIGTERM", () => {
  console.log("[darkroom-bot] SIGTERM, shutting down");
  client.destroy().finally(() => process.exit(0));
});

client.login(TOKEN).catch((err) => {
  console.error("[darkroom-bot] login failed", err);
  process.exit(1);
});
