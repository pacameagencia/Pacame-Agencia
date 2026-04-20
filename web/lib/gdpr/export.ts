/**
 * GDPR export helper — genera un ZIP con TODOS los datos del cliente.
 *
 * Diseño:
 *  - Fire-and-forget: el endpoint crea la fila en `gdpr_export_requests`
 *    con status='processing' y llama a `generateExport` sin await.
 *  - El helper actualiza la fila a 'ready' (con signed URL) o 'failed'.
 *  - Bucket privado `gdpr-exports` en Supabase Storage. Se crea on-demand
 *    la primera vez.
 *  - Signed URL de 24h. El cliente refresca el portal hasta verla.
 */

import JSZip from "jszip";
import { createServerSupabase } from "@/lib/supabase/server";
import { getLogger } from "@/lib/observability/logger";
import { sendEmail, wrapEmailTemplate } from "@/lib/resend";
import { auditLog } from "@/lib/security/audit";

const BUCKET = "gdpr-exports";
const SIGNED_URL_TTL_SECONDS = 60 * 60 * 24; // 24h

/** Campos que NUNCA se exportan por seguridad. */
const CLIENT_SECRET_FIELDS = ["password_hash", "auth_token", "auth_token_expires"];
const APP_INSTANCE_SECRET_FIELDS = ["secrets", "secrets_ciphertext"];

interface ExportBundle {
  metadata: {
    exported_at: string;
    client_id: string;
    request_id: string;
    tables: string[];
  };
  tables: Record<string, unknown[]>;
}

/**
 * Asegura que el bucket `gdpr-exports` existe (privado). Idempotente.
 */
async function ensureBucket(): Promise<void> {
  const supabase = createServerSupabase();
  try {
    // createBucket devuelve error si ya existe — lo ignoramos.
    await supabase.storage.createBucket(BUCKET, {
      public: false,
      fileSizeLimit: 100 * 1024 * 1024, // 100MB
    });
  } catch {
    // No-op: bucket ya existe o sin permisos (fallback: suponemos creado manualmente).
  }
}

/**
 * Recoge todas las filas del cliente en las distintas tablas.
 */
async function collectClientData(clientId: string): Promise<ExportBundle["tables"]> {
  const supabase = createServerSupabase();
  const tables: ExportBundle["tables"] = {};

  // 1. clients (sin secretos)
  const { data: clientRow } = await supabase
    .from("clients")
    .select("*")
    .eq("id", clientId)
    .maybeSingle();
  if (clientRow) {
    const sanitized: Record<string, unknown> = { ...clientRow };
    for (const k of CLIENT_SECRET_FIELDS) delete sanitized[k];
    tables.clients = [sanitized];
  } else {
    tables.clients = [];
  }

  // 2. orders + hijos
  const { data: orders } = await supabase
    .from("orders")
    .select("*")
    .eq("client_id", clientId);
  tables.orders = orders || [];

  const orderIds = (orders || []).map((o: { id: string }) => o.id);

  if (orderIds.length > 0) {
    const { data: deliverables } = await supabase
      .from("deliverables")
      .select("*")
      .in("order_id", orderIds);
    tables.deliverables = deliverables || [];

    const { data: orderEvents } = await supabase
      .from("order_events")
      .select("*")
      .in("order_id", orderIds);
    tables.order_events = orderEvents || [];

    const { data: revisions } = await supabase
      .from("delivery_revisions")
      .select("*")
      .in("order_id", orderIds);
    tables.delivery_revisions = revisions || [];
  } else {
    tables.deliverables = [];
    tables.order_events = [];
    tables.delivery_revisions = [];
  }

  // 3. client_messages
  const { data: messages } = await supabase
    .from("client_messages")
    .select("*")
    .eq("client_id", clientId);
  tables.client_messages = messages || [];

  // 4. client_files — metadata + signed URLs 24h
  const { data: files } = await supabase
    .from("client_files")
    .select("*")
    .eq("client_id", clientId);
  tables.client_files = files || [];

  // 5. subscriptions — join con plan
  const { data: subs } = await supabase
    .from("subscriptions")
    .select("*, plan:subscription_plans(*)")
    .eq("client_id", clientId);
  tables.subscriptions = subs || [];

  // 6. app_instances (sin secrets)
  const { data: instances } = await supabase
    .from("app_instances")
    .select("*")
    .eq("client_id", clientId);
  tables.app_instances = (instances || []).map((row: Record<string, unknown>) => {
    const clean = { ...row };
    for (const k of APP_INSTANCE_SECRET_FIELDS) delete clean[k];
    return clean;
  });

  // 7. conversations
  const { data: conversations } = await supabase
    .from("conversations")
    .select("*")
    .eq("client_id", clientId);
  tables.conversations = conversations || [];

  // 8. finances
  const { data: finances } = await supabase
    .from("finances")
    .select("*")
    .eq("client_id", clientId);
  tables.finances = finances || [];

  // 9. client_brand_settings
  const { data: brand } = await supabase
    .from("client_brand_settings")
    .select("*")
    .eq("client_id", clientId);
  tables.client_brand_settings = brand || [];

  // 10. project_milestones
  const { data: milestones } = await supabase
    .from("project_milestones")
    .select("*")
    .eq("client_id", clientId);
  tables.project_milestones = milestones || [];

  // 11. app_leads / app_messages (si el cliente tiene apps con leads)
  const { data: appLeads } = await supabase
    .from("app_leads")
    .select("*")
    .eq("client_id", clientId);
  tables.app_leads = appLeads || [];

  const { data: appMessages } = await supabase
    .from("app_messages")
    .select("*")
    .eq("client_id", clientId);
  tables.app_messages = appMessages || [];

  return tables;
}

/**
 * Construye el README humano-legible del ZIP.
 */
function buildReadme(metadata: ExportBundle["metadata"]): string {
  return [
    "PACAME — Exportacion GDPR de tus datos",
    "========================================",
    "",
    `Fecha de exportacion: ${metadata.exported_at}`,
    `ID de cliente: ${metadata.client_id}`,
    `ID de peticion: ${metadata.request_id}`,
    "",
    "Ficheros incluidos:",
    ...metadata.tables.map((t) => `  - ${t}.json`),
    "",
    "Derechos GDPR aplicables (Art. 15-22 RGPD):",
    " - Derecho de acceso: este ZIP materializa tu derecho de acceso.",
    " - Derecho de rectificacion: escribenos a hola@pacameagencia.com.",
    " - Derecho de supresion: en tu portal, seccion 'Privacidad' > 'Eliminar",
    "   mi cuenta'. Plazo de ejecucion: 30 dias desde la confirmacion.",
    " - Derecho de portabilidad: los ficheros .json son formato estructurado,",
    "   legible por maquina.",
    " - Derecho de oposicion y limitacion: contacta con hola@pacameagencia.com.",
    "",
    "Datos NO incluidos (por motivos de seguridad):",
    " - Hash de contrasena y tokens de sesion.",
    " - Secretos cifrados de tus integraciones (API keys, etc.).",
    "",
    "Este enlace de descarga es valido 24h. Si necesitas otra copia, solicita",
    "una nueva exportacion desde el portal.",
    "",
    "PACAME — hola@pacameagencia.com — pacameagencia.com",
  ].join("\n");
}

/**
 * Genera el ZIP, lo sube y actualiza la request.
 */
export async function generateExport(
  clientId: string,
  requestId: string
): Promise<void> {
  const log = getLogger({ clientId, requestId, scope: "gdpr.export" });
  const supabase = createServerSupabase();

  try {
    await ensureBucket();

    const tablesData = await collectClientData(clientId);
    const tableNames = Object.keys(tablesData).sort();

    const metadata: ExportBundle["metadata"] = {
      exported_at: new Date().toISOString(),
      client_id: clientId,
      request_id: requestId,
      tables: tableNames,
    };

    // Construir ZIP
    const zip = new JSZip();
    zip.file("README.txt", buildReadme(metadata));
    zip.file("metadata.json", JSON.stringify(metadata, null, 2));
    for (const name of tableNames) {
      zip.file(`${name}.json`, JSON.stringify(tablesData[name], null, 2));
    }

    const zipBuffer = await zip.generateAsync({
      type: "uint8array",
      compression: "DEFLATE",
    });

    const path = `exports/${clientId}/${requestId}.zip`;

    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(path, zipBuffer, {
        contentType: "application/zip",
        upsert: true,
      });

    if (uploadError) {
      throw new Error(`Upload failed: ${uploadError.message}`);
    }

    const { data: signedData, error: signedError } = await supabase.storage
      .from(BUCKET)
      .createSignedUrl(path, SIGNED_URL_TTL_SECONDS);

    if (signedError || !signedData?.signedUrl) {
      throw new Error(`SignedUrl failed: ${signedError?.message || "no url"}`);
    }

    const expiresAt = new Date(Date.now() + SIGNED_URL_TTL_SECONDS * 1000).toISOString();

    await supabase
      .from("gdpr_export_requests")
      .update({
        status: "ready",
        file_url: signedData.signedUrl,
        file_size_bytes: zipBuffer.byteLength,
        completed_at: new Date().toISOString(),
        expires_at: expiresAt,
      })
      .eq("id", requestId);

    // Email al cliente
    const { data: clientRow } = await supabase
      .from("clients")
      .select("email, name")
      .eq("id", clientId)
      .maybeSingle();

    if (clientRow?.email) {
      const firstName = (clientRow.name as string | null)?.split(" ")[0] || "cliente";
      await sendEmail({
        to: clientRow.email as string,
        subject: "Tu exportacion GDPR esta lista",
        html: wrapEmailTemplate(
          `Hola ${firstName},\n\n` +
            `Tu exportacion de datos esta lista para descargar.\n\n` +
            `Entra en tu portal, seccion 'Privacidad', y pulsa en el enlace de descarga.\n\n` +
            `El enlace caduca en 24 horas. Si pierdes esa ventana, puedes solicitar una nueva exportacion.`,
          {
            cta: "Ir a mi portal",
            ctaUrl: "https://pacameagencia.com/portal/privacy",
            preheader: "Tu exportacion GDPR esta lista — descarga valida 24h",
          }
        ),
        tags: [{ name: "type", value: "gdpr_export_ready" }],
      });
    }

    await auditLog({
      actor: { type: "system", id: null },
      action: "gdpr.export_ready",
      resource: { type: "gdpr_export_request", id: requestId },
      metadata: {
        client_id: clientId,
        file_size_bytes: zipBuffer.byteLength,
        tables: tableNames.length,
      },
    });

    log.info({ bytes: zipBuffer.byteLength, tables: tableNames.length }, "gdpr export ready");
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    log.error({ err }, "gdpr export failed");

    await supabase
      .from("gdpr_export_requests")
      .update({
        status: "failed",
        error: msg.slice(0, 500),
        completed_at: new Date().toISOString(),
      })
      .eq("id", requestId);

    await auditLog({
      actor: { type: "system", id: null },
      action: "gdpr.export_failed",
      resource: { type: "gdpr_export_request", id: requestId },
      metadata: { client_id: clientId, error: msg.slice(0, 300) },
    });
  }
}
