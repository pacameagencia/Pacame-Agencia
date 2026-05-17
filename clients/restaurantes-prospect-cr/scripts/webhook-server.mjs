/**
 * Webhook server Resend → Supabase. Standalone en VPS.
 * Bypassea el Vercel/Next.js mientras está caído.
 *
 * Endpoint: POST /webhooks/resend
 * Health:   GET /webhooks/health
 *
 * Usage: pm2 start webhook-server.mjs --name=webhooks
 */
import { createServer } from 'node:http';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { createRequire } from 'node:module';

const here = dirname(fileURLToPath(import.meta.url));
const localRequire = createRequire(resolve(here, 'package.json'));
const { Client } = localRequire('pg');

// === Env ===
function loadEnvFile(path) {
  try {
    const raw = readFileSync(path, 'utf8');
    for (const line of raw.split('\n')) {
      const m = line.match(/^([A-Z0-9_]+)=["']?([^"'\n]*)["']?$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
    }
  } catch {}
}
loadEnvFile(resolve(here, '.env'));
loadEnvFile(resolve(here, '..', '.env'));

const DATABASE_URL = process.env.DATABASE_URL;
const SECRETS = (process.env.RESEND_WEBHOOK_SECRETS || process.env.RESEND_WEBHOOK_SECRET || '')
  .split(',').map((s) => s.trim()).filter(Boolean);

if (!DATABASE_URL) { console.error('No DATABASE_URL'); process.exit(1); }
if (SECRETS.length === 0) console.warn('[webhooks] WARNING: no RESEND_WEBHOOK_SECRETS configured (signing disabled)');

const PORT = Number(process.env.WEBHOOK_PORT || 3030);

// === Postgres pool ===
const pg = new Client({ connectionString: DATABASE_URL, ssl: { rejectUnauthorized: false } });
await pg.connect();
console.log('[webhooks] pg connected');

// === Telegram notify (speed-to-lead a Pablo) ===
const TG_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';
const TG_CHAT = process.env.TELEGRAM_CHAT_ID || '';
if (!TG_TOKEN || !TG_CHAT) console.warn('[notify] TELEGRAM_BOT_TOKEN/TELEGRAM_CHAT_ID ausente — avisos a Pablo desactivados');
async function notifyPablo(text) {
  if (!TG_TOKEN || !TG_CHAT) return;
  try {
    const r = await fetch(`https://api.telegram.org/bot${TG_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: TG_CHAT, text, parse_mode: 'HTML', disable_web_page_preview: true }),
    });
    if (!r.ok) console.error('[notify] telegram HTTP', r.status);
  } catch (e) { console.error('[notify] telegram error:', e.message); }
}
const esc = (s) => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// === Svix signature verify ===
function verifySvix(rawBody, headers, secrets) {
  const svixId = headers['svix-id'];
  const svixTs = headers['svix-timestamp'];
  const svixSig = headers['svix-signature'];
  if (!svixId || !svixTs || !svixSig) return false;
  const signedContent = `${svixId}.${svixTs}.${rawBody}`;
  const provided = svixSig.split(' ').map((p) => p.split(',')[1]).filter(Boolean);
  if (provided.length === 0) return false;

  for (const secret of secrets) {
    const secretBytes = Buffer.from(secret.replace(/^whsec_/, ''), 'base64');
    const hmac = createHmac('sha256', secretBytes).update(signedContent).digest('base64');
    for (const sig of provided) {
      try {
        const a = Buffer.from(hmac, 'base64');
        const b = Buffer.from(sig, 'base64');
        if (a.length === b.length && timingSafeEqual(a, b)) return true;
      } catch {}
    }
  }
  return false;
}

// === Process event ===
async function processEvent(event) {
  const messageId = event.data?.email_id;
  const slug = event.data?.tags?.find?.((t) => t.name === 'lead_slug')?.value;
  const occurred = event.created_at || new Date().toISOString();
  const eventType = event.type || 'unknown';

  // find lead_id
  let leadId = null;
  if (messageId) {
    const r = await pg.query('select id from prospect_leads where resend_message_id = $1 limit 1', [messageId]);
    if (r.rows[0]) leadId = r.rows[0].id;
  }
  if (!leadId && slug) {
    const r = await pg.query('select id from prospect_leads where slug = $1 limit 1', [slug]);
    if (r.rows[0]) leadId = r.rows[0].id;
  }

  // append event (best-effort dedup via event_type+message_id+occurred_at)
  await pg.query(
    `insert into email_events (lead_id, resend_message_id, event_type, occurred_at, raw, user_agent, ip, link_url, bounce_type, bounce_reason)
     values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
    [
      leadId, messageId, eventType, occurred,
      JSON.stringify(event),
      event.data?.click?.userAgent ?? null,
      event.data?.click?.ipAddress ?? null,
      event.data?.click?.link ?? null,
      event.data?.bounce?.type ?? null,
      event.data?.bounce?.message ?? null,
    ]
  );

  if (!leadId) return { leadId: null, eventType };

  switch (eventType) {
    case 'email.sent':
      await pg.query('update prospect_leads set status=$2, sent_at=coalesce(sent_at,$3) where id=$1',
        [leadId, 'sent', occurred]);
      break;
    case 'email.delivered':
      await pg.query('update prospect_leads set status=$2, delivered_at=coalesce(delivered_at,$3) where id=$1',
        [leadId, 'delivered', occurred]);
      break;
    case 'email.opened':
      await pg.query(`update prospect_leads set
        last_opened_at=$2,
        first_opened_at=coalesce(first_opened_at,$2),
        open_count=open_count+1,
        status=case when status in ('clicked','replied','won') then status else 'opened' end
        where id=$1`, [leadId, occurred]);
      break;
    case 'email.clicked':
      await pg.query(`update prospect_leads set
        last_clicked_at=$2,
        first_clicked_at=coalesce(first_clicked_at,$2),
        click_count=click_count+1,
        status=case when status in ('replied','won') then status else 'clicked' end
        where id=$1`, [leadId, occurred]);
      break;
    case 'email.bounced':
      await pg.query('update prospect_leads set status=$2, bounced_at=$3, bounce_reason=$4 where id=$1',
        [leadId, 'bounced', occurred, event.data?.bounce?.message ?? null]);
      break;
    case 'email.complained':
      await pg.query('update prospect_leads set status=$2, complained_at=$3 where id=$1',
        [leadId, 'complained', occurred]);
      break;
  }

  return { leadId, eventType };
}

// === HTTP server ===
// Guard global: un rechazo/excepción sin capturar NO debe tumbar el server
process.on('unhandledRejection', (r) => console.error('[webhooks] unhandledRejection:', r?.message || r));
process.on('uncaughtException', (e) => console.error('[webhooks] uncaughtException:', e?.message || e));

const PABLO_WA_NUM = '34722669381';

function intentPage({ ok, title, body, waHref }) {
  const cta = waHref
    ? `<a href="${waHref}" style="display:inline-block;margin-top:22px;padding:14px 26px;background:#25d366;color:#fff;border-radius:50px;font-weight:700;text-decoration:none;">📱 Abrir WhatsApp con Pablo</a>`
    : '';
  return `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title></head>
<body style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;background:#f7f5f0;margin:0;color:#222;">
<div style="max-width:520px;margin:0 auto;padding:64px 24px;text-align:center;">
<div style="font-size:48px;line-height:1;margin-bottom:18px;">${ok ? '✅' : '👋'}</div>
<h1 style="font-size:24px;margin:0 0 12px;">${title}</h1>
<p style="font-size:16px;line-height:1.6;color:#444;margin:0;">${body}</p>
${cta}
<p style="margin-top:40px;font-size:12px;color:#999;">PACAME · pacameagencia.com</p>
</div></body></html>`;
}

const server = createServer((req, res) => {
  // GET /intent/<slug>/<yes|no> — captura intención de 1 clic desde el demo
  {
    const m = req.method === 'GET' && req.url.match(/^\/intent\/([a-z0-9-]+)\/(yes|no)\b/);
    if (m) {
      const slug = m[1];
      const decision = m[2];
      const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket.remoteAddress || '';
      const ua = req.headers['user-agent'] || '';
      const isBot = /googlebot|googleimageproxy|prefetch|preview|scanner|crawler|bot\b/i.test(ua);
      (async () => {
        let lead = null;
        try {
          const r = await pg.query('select id, name, phone, city, email from prospect_leads where slug=$1 limit 1', [slug]);
          lead = r.rows[0] || null;
        } catch (e) { console.error('[intent] query error:', e.message); }

        if (decision === 'yes') {
          const name = lead?.name || slug;
          const cityPart = lead?.city ? ` en ${lead.city}` : '';
          const waText = `Hola Pablo, soy de ${name}${cityPart}. Dije que sí en la demo, ¿hablamos?`;
          const waHref = `https://wa.me/${PABLO_WA_NUM}?text=${encodeURIComponent(waText)}`;
          const html = intentPage({
            ok: true,
            title: 'Hecho. Pablo os escribe hoy.',
            body: 'Gracias por decir que sí. Pablo os contacta hoy mismo para contaros cómo dejamos la web vuestra de verdad. Sin compromiso.',
            waHref,
          });
          res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' });
          res.end(html);
          if (lead && !isBot) {
            try {
              await pg.query(
                "update prospect_leads set reply_intent='cta_yes', wa_consent=true, wa_consent_at=now(), wa_consent_source='demo_intent_yes', replied_at=coalesce(replied_at, now()), status=case when status='won' then status else 'replied' end where id=$1",
                [lead.id]
              );
              await pg.query(
                "insert into email_events (lead_id, event_type, occurred_at, raw, user_agent, ip) values ($1, 'demo.intent_yes', now(), $2, $3, $4)",
                [lead.id, JSON.stringify({ slug, decision }), ua, ip]
              );
              console.log(`[intent] ${slug} YES`);
              await notifyPablo(
                `🔥 <b>SÍ en la demo</b>\n<b>${esc(lead.name || slug)}</b>${lead.city ? ' · ' + esc(lead.city) : ''}\n` +
                `📞 ${esc(lead.phone || '—')}\n✉️ ${esc(lead.email || '—')}\n` +
                `🔗 https://demos.pacameagencia.com/${esc(slug)}/\n\nEscríbele YA por WhatsApp.`
              );
            } catch (e) { console.error('[intent] yes update error:', e.message); }
          }
          return;
        }

        // decision === 'no'
        const html = intentPage({
          ok: false,
          title: 'Gracias por decirlo.',
          body: 'Os quitamos de la lista ahora mismo. No recibiréis más correos nuestros. Suerte con el local.',
          waHref: null,
        });
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' });
        res.end(html);
        if (lead && !isBot) {
          try {
            await pg.query(
              "update prospect_leads set reply_intent='stop', do_not_contact=true, do_not_contact_reason='demo: boton no', unsubscribed_at=coalesce(unsubscribed_at, now()), status='unsubscribed' where id=$1",
              [lead.id]
            );
            await pg.query(
              "insert into email_events (lead_id, event_type, occurred_at, raw, user_agent, ip) values ($1, 'demo.intent_no', now(), $2, $3, $4)",
              [lead.id, JSON.stringify({ slug, decision }), ua, ip]
            );
            console.log(`[intent] ${slug} NO`);
            await notifyPablo(`👋 <b>NO en la demo</b> · ${esc(lead.name || slug)}${lead.city ? ' · ' + esc(lead.city) : ''} — fuera de lista.`);
          } catch (e) { console.error('[intent] no update error:', e.message); }
        }
      })();
      return;
    }
  }

  // GET /c/<slug> — click tracking endpoint (registra click + 301 redirect al demo)
  if (req.method === 'GET' && req.url.match(/^\/c\/([a-z0-9-]+)/)) {
    const slug = req.url.match(/^\/c\/([a-z0-9-]+)/)[1];
    const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket.remoteAddress || '';
    const ua = req.headers['user-agent'] || '';
    // 301 redirect inmediato al demo
    res.writeHead(301, { Location: 'https://demos.pacameagencia.com/' + slug + '/' });
    res.end();
    // Async DB
    (async () => {
      try {
        const r = await pg.query('select id, name, city, phone, first_clicked_at from prospect_leads where slug=$1 limit 1', [slug]);
        const lead = r.rows[0];
        if (!lead) return;
        const isBot = /googlebot|googleimageproxy|prefetch|preview|scanner|crawler|bot\b/i.test(ua);
        if (isBot) {
          console.log(`[click] ${slug} bot UA=${ua.slice(0,50)}`);
          return;
        }
        const wasFirstClick = !lead.first_clicked_at;
        await pg.query(
          "insert into email_events (lead_id, event_type, occurred_at, raw, user_agent, ip) values ($1, 'email.clicked', now(), $2, $3, $4)",
          [lead.id, JSON.stringify({ source: 'custom_click', slug, target: '/' + slug + '/' }), ua, ip]
        );
        await pg.query(
          "update prospect_leads set first_clicked_at=coalesce(first_clicked_at,now()), last_clicked_at=now(), click_count=click_count+1, status=case when status in ('replied','won') then status else 'clicked' end where id=$1",
          [lead.id]
        );
        console.log(`[click] ${slug} CLICK tracked`);
        if (wasFirstClick) {
          await notifyPablo(
            `👀 <b>Entró a la demo</b>\n<b>${esc(lead.name || slug)}</b>${lead.city ? ' · ' + esc(lead.city) : ''}\n` +
            `📞 ${esc(lead.phone || '—')}\n🔗 https://demos.pacameagencia.com/${esc(slug)}/\n\nEstá mirándola ahora. Buen momento para un WhatsApp.`
          );
        }
      } catch (e) { console.error('[click] error:', e.message); }
    })();
    return;
  }

  // GET /t/<slug>.gif — open tracking pixel custom (Resend no inyecta el suyo si HTML no tiene <img>)
  if (req.method === 'GET' && req.url.match(/^\/t\/([a-z0-9-]+)\.gif/)) {
    const slug = req.url.match(/^\/t\/([a-z0-9-]+)\.gif/)[1];
    const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket.remoteAddress || '';
    const ua = req.headers['user-agent'] || '';
    // 1x1 transparent GIF (43 bytes)
    const gif = Buffer.from([
      0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 0x01, 0x00, 0x01, 0x00, 0x80, 0x00, 0x00, 0x00, 0x00, 0x00,
      0xff, 0xff, 0xff, 0x21, 0xf9, 0x04, 0x01, 0x00, 0x00, 0x00, 0x00, 0x2c, 0x00, 0x00, 0x00, 0x00,
      0x01, 0x00, 0x01, 0x00, 0x00, 0x02, 0x02, 0x44, 0x01, 0x00, 0x3b
    ]);
    res.writeHead(200, {
      'Content-Type': 'image/gif',
      'Content-Length': gif.length,
      'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0',
      'Pragma': 'no-cache',
      'Expires': '0',
    });
    res.end(gif);
    // Persistir async (no bloquea respuesta)
    (async () => {
      try {
        const r = await pg.query('select id from prospect_leads where slug=$1 limit 1', [slug]);
        const leadId = r.rows[0]?.id;
        if (!leadId) return;
        // Skip si UA es bot conocido (preview Gmail prefetch)
        const isBot = /googlebot|googleimageproxy|prefetch|preview|scanner|crawler/i.test(ua);
        if (isBot) {
          console.log(`[tracker] ${slug} bot prefetch UA=${ua.slice(0,50)}`);
          return;
        }
        await pg.query(
          "insert into email_events (lead_id, event_type, occurred_at, raw, user_agent, ip) values ($1, 'email.opened', now(), $2, $3, $4)",
          [leadId, JSON.stringify({ source: 'custom_pixel', slug }), ua, ip]
        );
        await pg.query(
          "update prospect_leads set first_opened_at=coalesce(first_opened_at,now()), last_opened_at=now(), open_count=open_count+1, status=case when status in ('clicked','replied','won') then status else 'opened' end where id=$1",
          [leadId]
        );
        console.log(`[tracker] ${slug} OPEN tracked`);
      } catch (e) { console.error('[tracker] error:', e.message); }
    })();
    return;
  }

  // GET /contact-pacame?slug=X&type=wa|email — registra consent + redirige
  if (req.method === 'GET' && req.url.startsWith('/contact-pacame')) {
    const u = new URL(req.url, 'http://localhost');
    const slug = u.searchParams.get('slug');
    const type = u.searchParams.get('type') || 'wa';
    const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket.remoteAddress || '';
    const ua = req.headers['user-agent'] || '';
    (async () => {
      let leadName = null;
      let leadId = null;
      let leadCity = null;
      let leadPhone = null;
      let leadEmail = null;
      if (slug) {
        try {
          const r = await pg.query('select id, name, phone, city, email from prospect_leads where slug=$1 limit 1', [slug]);
          if (r.rows[0]) {
            leadId = r.rows[0].id;
            leadName = r.rows[0].name;
            leadCity = r.rows[0].city;
            leadPhone = r.rows[0].phone;
            leadEmail = r.rows[0].email;
          }
        } catch (e) { console.error('[contact] query error:', e.message); }
      }
      // Mensaje con nombre real del lead (no slug)
      const displayName = leadName || (slug || 'PACAME');
      const cityPart = leadCity ? ` en ${leadCity}` : '';
      const waText = `Hola Pablo, soy de ${displayName}${cityPart}. He visto la demo que me mandasteis y me interesa, ¿hablamos?`;
      const emailSubj = `Interesado en demo PACAME — ${displayName}`;
      const emailBody = `Hola Pablo,\n\nHe recibido tu email y visto la demo. Soy responsable de ${displayName}${cityPart}.\n\nMe interesa hablar — cuéntame los siguientes pasos.\n\nGracias.`;

      const dest = type === 'wa'
        ? `https://wa.me/34722669381?text=${encodeURIComponent(waText)}`
        : `mailto:hola@pacameagencia.com?subject=${encodeURIComponent(emailSubj)}&body=${encodeURIComponent(emailBody)}`;
      res.writeHead(302, { Location: dest });
      res.end();

      // DB async (después del redirect, no bloquea UX)
      if (leadId) {
        try {
          await pg.query(
            "update prospect_leads set wa_consent=true, wa_consent_at=now(), wa_consent_source=$2, status=case when status in ('replied','won') then status else 'clicked' end where id=$1",
            [leadId, 'demo_click_' + type]
          );
          await pg.query(
            "insert into email_events (lead_id, event_type, occurred_at, raw, user_agent, ip) values ($1, $2, now(), $3, $4, $5)",
            [leadId, 'demo.cta_click', JSON.stringify({ slug, type, lead_name: leadName }), ua, ip]
          );
          console.log(`[contact] ${slug} <- ${type} click (${leadName})`);
          await notifyPablo(
            `🔥 <b>Abrió ${type === 'wa' ? 'WhatsApp' : 'email'} desde la demo</b>\n` +
            `<b>${esc(leadName || slug)}</b>${leadCity ? ' · ' + esc(leadCity) : ''}\n` +
            `📞 ${esc(leadPhone || '—')}\n✉️ ${esc(leadEmail || '—')}\n` +
            `🔗 https://demos.pacameagencia.com/${esc(slug)}/\n\nLead caliente. Contesta rápido.`
          );
        } catch (e) { console.error('[contact] update error:', e.message); }
      }
    })();
    return;
  }

  if (req.method === 'GET' && req.url === '/webhooks/health') {
    res.writeHead(200, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ ok: true, secrets: SECRETS.length, ts: new Date().toISOString() }));
    return;
  }
  if (req.method !== 'POST' || req.url !== '/webhooks/resend') {
    res.writeHead(404); res.end('not found'); return;
  }

  const chunks = [];
  req.on('data', (c) => chunks.push(c));
  req.on('end', async () => {
    const rawBody = Buffer.concat(chunks).toString('utf8');
    if (SECRETS.length > 0 && !verifySvix(rawBody, req.headers, SECRETS)) {
      console.warn('[webhooks] invalid signature');
      res.writeHead(401, { 'content-type': 'application/json' });
      res.end(JSON.stringify({ error: 'invalid signature' }));
      return;
    }
    let event;
    try { event = JSON.parse(rawBody); }
    catch {
      res.writeHead(400, { 'content-type': 'application/json' });
      res.end(JSON.stringify({ error: 'invalid json' })); return;
    }
    try {
      const result = await processEvent(event);
      console.log(`[webhooks] ${result.eventType} lead=${result.leadId || 'unknown'}`);
      res.writeHead(200, { 'content-type': 'application/json' });
      res.end(JSON.stringify({ ok: true, ...result }));
    } catch (e) {
      console.error('[webhooks] error:', e.message);
      res.writeHead(500, { 'content-type': 'application/json' });
      res.end(JSON.stringify({ error: e.message }));
    }
  });
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`[webhooks] listening on 127.0.0.1:${PORT}`);
  console.log(`[webhooks] configured secrets: ${SECRETS.length}`);
});

const shutdown = async () => {
  console.log('[webhooks] shutting down');
  server.close();
  await pg.end();
  process.exit(0);
};
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
