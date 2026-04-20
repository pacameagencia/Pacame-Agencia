import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { getLogger } from "@/lib/observability/logger";
import { createHmac, timingSafeEqual } from "node:crypto";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * POST /api/resend/webhook
 *
 * Recibe eventos de Resend (Svix protocol):
 *  - email.delivered
 *  - email.opened        → setea opened_at en lifecycle_emails_sent
 *  - email.clicked       → setea clicked_at (si opened_at null, tambien)
 *  - email.bounced / email.complained → log + marca invalido
 *
 * Aceptamos 2 modos:
 *  1. Svix signature (cabeceras svix-id / svix-timestamp / svix-signature)
 *     con secret = RESEND_WEBHOOK_SECRET (format "whsec_xxx" base64)
 *  2. Modo legacy con header shared secret x-webhook-secret = RESEND_WEBHOOK_SHARED
 *
 * Safety: si no hay secret configurado, rechazamos todo (ningun passthrough).
 */

const WEBHOOK_TOLERANCE_SEC = 60 * 5; // 5 min

interface ResendEvent {
  type: string;
  created_at?: string;
  data?: {
    email_id?: string;
    to?: string[];
    from?: string;
    subject?: string;
    tags?: Array<{ name: string; value: string }>;
    click?: { link?: string };
  };
}

function verifySvix(
  rawBody: string,
  headers: {
    svixId: string | null;
    svixTs: string | null;
    svixSig: string | null;
  },
  secret: string
): boolean {
  const { svixId, svixTs, svixSig } = headers;
  if (!svixId || !svixTs || !svixSig) return false;

  // Timestamp tolerance
  const tsNum = Number(svixTs);
  if (!Number.isFinite(tsNum)) return false;
  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - tsNum) > WEBHOOK_TOLERANCE_SEC) return false;

  // Secret format: "whsec_BASE64" o crudo. Usamos el base64 si empieza con whsec_.
  const key = secret.startsWith("whsec_")
    ? Buffer.from(secret.slice(6), "base64")
    : Buffer.from(secret, "utf8");

  const toSign = `${svixId}.${svixTs}.${rawBody}`;
  const expected = createHmac("sha256", key).update(toSign).digest("base64");

  // Svix envia "v1,<base64> v1,<base64>" (lista, por rotacion de keys)
  const pieces = svixSig.split(" ");
  for (const p of pieces) {
    const [version, sig] = p.split(",");
    if (version !== "v1" || !sig) continue;
    try {
      const sigBuf = Buffer.from(sig, "base64");
      const expectedBuf = Buffer.from(expected, "base64");
      if (
        sigBuf.length === expectedBuf.length &&
        timingSafeEqual(sigBuf, expectedBuf)
      ) {
        return true;
      }
    } catch {
      // ignore
    }
  }
  return false;
}

export async function POST(req: NextRequest) {
  const log = getLogger();
  const rawBody = await req.text();

  const svixSecret = process.env.RESEND_WEBHOOK_SECRET;
  const sharedSecret = process.env.RESEND_WEBHOOK_SHARED;

  // Verify auth
  let authed = false;
  if (svixSecret) {
    authed = verifySvix(
      rawBody,
      {
        svixId: req.headers.get("svix-id"),
        svixTs: req.headers.get("svix-timestamp"),
        svixSig: req.headers.get("svix-signature"),
      },
      svixSecret
    );
  }
  if (!authed && sharedSecret) {
    const sent = req.headers.get("x-webhook-secret") || "";
    authed =
      sent.length === sharedSecret.length &&
      timingSafeEqual(Buffer.from(sent), Buffer.from(sharedSecret));
  }
  if (!authed) {
    log.warn({ ip: req.headers.get("x-forwarded-for") }, "[resend-wh] unauthorized");
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let evt: ResendEvent;
  try {
    evt = JSON.parse(rawBody) as ResendEvent;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const type = evt.type || "";
  const emailId = evt.data?.email_id;
  const tags = evt.data?.tags || [];
  const clientIdTag = tags.find((t) => t.name === "client_id")?.value;
  const lifecycleType = tags.find((t) => t.name === "lifecycle_type")?.value;
  const kindTag = tags.find((t) => t.name === "type")?.value;

  const supabase = createServerSupabase();

  try {
    // Solo actuamos sobre emails lifecycle (tag type=lifecycle) — ignoramos upsell/otros aqui
    if (kindTag === "lifecycle" && clientIdTag && lifecycleType) {
      const nowIso = new Date().toISOString();

      if (type === "email.opened") {
        await supabase
          .from("lifecycle_emails_sent")
          .update({ opened_at: nowIso })
          .eq("client_id", clientIdTag)
          .eq("email_type", lifecycleType)
          .is("opened_at", null);
      } else if (type === "email.clicked") {
        // Click implica open si no estaba marcado
        await supabase
          .from("lifecycle_emails_sent")
          .update({ clicked_at: nowIso })
          .eq("client_id", clientIdTag)
          .eq("email_type", lifecycleType)
          .is("clicked_at", null);
        await supabase
          .from("lifecycle_emails_sent")
          .update({ opened_at: nowIso })
          .eq("client_id", clientIdTag)
          .eq("email_type", lifecycleType)
          .is("opened_at", null);
      } else if (type === "email.bounced" || type === "email.complained") {
        log.warn(
          { clientId: clientIdTag, lifecycleType, type, emailId },
          "[resend-wh] bounce/complaint"
        );
      }
    } else {
      // Tracking generico de emails no-lifecycle para telemetry futura
      log.info({ type, emailId, kindTag }, "[resend-wh] event (no-lifecycle)");
    }
  } catch (err) {
    log.error({ err, type, emailId }, "[resend-wh] handler fallo");
    // Resend reintenta si 500 → devolvemos 200 para eventos mal-formados, 500 para fallos DB
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, type });
}

// Resend envia GET de health check ocasionalmente
export async function GET() {
  return NextResponse.json({ ok: true, service: "resend-webhook" });
}
