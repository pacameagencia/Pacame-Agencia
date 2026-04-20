import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { getDelivery } from "@/lib/delivery/registry";
import { buildRunner } from "@/lib/delivery/runners";
import type { DeliveryContext, ServiceDelivery } from "@/lib/delivery/types";
import { sendEmail, notifyPablo, wrapEmailTemplate } from "@/lib/resend";
import { notifyPayment } from "@/lib/telegram";
import { reviewDeliverable } from "@/lib/delivery/qa";
import { escalationQARejected } from "@/lib/email-templates/escalation";
import { getLogger } from "@/lib/observability/logger";

// Allow long-running deliveries (image generation via Freepik can take ~2 min)
export const maxDuration = 300;
export const dynamic = "force-dynamic";

const supabase = createServerSupabase();

/**
 * POST /api/deliveries/start
 * Dispatches an order to its delivery agent.
 * Called (fire-and-forget) from /api/orders/[id]/inputs when the client submits the brief.
 * Also called by recovery-cron for stuck orders.
 *
 * Body: { order_id: string }
 * Requires internal auth OR the order must be in 'processing'/'inputs_pending' state
 * with inputs already submitted.
 */
export async function POST(request: NextRequest) {
  let orderId: string | null = null;
  try {
    const body = await request.json();
    orderId = body.order_id as string;
    if (!orderId) {
      return NextResponse.json({ error: "order_id required" }, { status: 400 });
    }

    // Load order + catalog (incluye runner_type + runner_config para dispatch)
    const { data: order, error: orderErr } = await supabase
      .from("orders")
      .select(
        "*, service_catalog:service_catalog_id(slug, name, inputs_schema, delivery_sla_hours, runner_type, runner_config, qa_enabled, qa_threshold)"
      )
      .eq("id", orderId)
      .maybeSingle();

    if (orderErr || !order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Idempotency: if already delivered or escalated, return early
    if (order.status === "delivered" || order.status === "escalated") {
      return NextResponse.json({ ok: true, skipped: order.status });
    }

    // Must have inputs to work with
    if (!order.inputs || Object.keys(order.inputs).length === 0) {
      return NextResponse.json(
        { error: "Order has no inputs yet", status: order.status },
        { status: 400 }
      );
    }

    // Load brand settings if client exists
    let brandSettings = null;
    if (order.client_id) {
      const { data: bs } = await supabase
        .from("client_brand_settings")
        .select("primary_color, secondary_color, font_heading, font_body, logo_url")
        .eq("client_id", order.client_id)
        .maybeSingle();
      brandSettings = bs || null;
    }

    // ====== DISPATCH: runner generico vs custom ======
    const catalog = (order as unknown as { service_catalog?: { slug: string; name: string; runner_type?: string; runner_config?: Record<string, unknown> } }).service_catalog;
    const runnerType = catalog?.runner_type || "custom";
    const runnerConfig = catalog?.runner_config || {};
    const displayName = catalog?.name || order.service_slug;

    let delivery: ServiceDelivery | null = null;

    if (runnerType !== "custom") {
      // Generic declarative runner — no code needed for this product
      delivery = buildRunner(order.service_slug, displayName, runnerType, runnerConfig);
      if (!delivery) {
        getLogger().warn(
          { runnerType },
          "[orchestrator] runner_type no soportado aun, fallback a registry",
        );
      }
    }
    if (!delivery) {
      // Fallback: custom TypeScript implementation
      delivery = getDelivery(order.service_slug);
    }

    if (!delivery) {
      // No registered delivery — escalate to Pablo
      await supabase
        .from("orders")
        .update({
          status: "escalated",
          escalated_to_pablo: true,
          escalation_reason: `No hay delivery implementado para ${order.service_slug} (runner_type=${runnerType})`,
          escalated_at: new Date().toISOString(),
        })
        .eq("id", orderId);

      await supabase.from("order_events").insert({
        order_id: orderId,
        event_type: "escalated",
        title: "Escalado a Pablo",
        message: `Producto ${order.service_slug} aun no tiene delivery automatico.`,
      });

      await notifyPablo(
        `Order escalada: ${order.service_slug}`,
        `Order ${order.order_number || orderId} no tiene delivery implementado y requiere entrega manual.`
      );
      return NextResponse.json({ ok: true, escalated: true });
    }

    // Mark as processing + log start event
    await supabase
      .from("orders")
      .update({
        status: "processing",
        assigned_agent: delivery.slug.split("-")[0] || "agent",
        progress_pct: 5,
        progress_message: `${delivery.name} arrancando...`,
      })
      .eq("id", orderId);

    await supabase.from("order_events").insert({
      order_id: orderId,
      event_type: "agent_started",
      title: `${delivery.name} — agente activado`,
      message: "Procesando tu brief y generando entregable.",
    });

    // Throttle progress updates: min 800ms between writes
    let lastProgressAt = 0;
    const onProgress = async (pct: number, message: string) => {
      const now = Date.now();
      if (now - lastProgressAt < 800 && pct < 100) return;
      lastProgressAt = now;
      await supabase
        .from("orders")
        .update({ progress_pct: Math.max(5, Math.min(99, pct)), progress_message: message })
        .eq("id", orderId);
      await supabase.from("order_events").insert({
        order_id: orderId,
        event_type: "progress",
        title: `${pct}%`,
        message,
      });
    };

    const ctx: DeliveryContext = {
      orderId,
      serviceSlug: order.service_slug,
      clientId: order.client_id || null,
      inputs: order.inputs || {},
      brandSettings,
      onProgress,
    };

    // ===== EXECUTE =====
    let result;
    try {
      result = await delivery.execute(ctx);
    } catch (deliveryErr) {
      const errMsg =
        deliveryErr instanceof Error ? deliveryErr.message : String(deliveryErr);

      await supabase
        .from("orders")
        .update({
          status: "escalated",
          escalated_to_pablo: true,
          escalation_reason: `Delivery failure: ${errMsg.slice(0, 400)}`,
          escalated_at: new Date().toISOString(),
          progress_message: "Error en generacion — escalado a Pablo",
        })
        .eq("id", orderId);

      await supabase.from("order_events").insert({
        order_id: orderId,
        event_type: "delivery_failure",
        title: "Fallo en la generacion",
        message: errMsg.slice(0, 400),
        payload: { error: errMsg.slice(0, 1000) },
      });

      await notifyPablo(
        `Delivery fallo: ${order.order_number || orderId}`,
        `Servicio: ${order.service_slug}. Error: ${errMsg.slice(0, 500)}`
      );

      return NextResponse.json(
        { ok: false, error: "Delivery failed, escalated to Pablo" },
        { status: 500 }
      );
    }

    // ===== PERSIST DELIVERABLES =====
    const deliverableRows = result.deliverables.map((d) => ({
      order_id: orderId,
      version: 1,
      kind: d.kind,
      title: d.title || null,
      file_url: d.fileUrl || null,
      storage_path: d.storagePath || null,
      preview_url: d.previewUrl || null,
      payload: d.payload ?? null,
      meta: d.meta || {},
      is_current: true,
    }));

    const { error: delErr } = await supabase.from("deliverables").insert(deliverableRows);
    if (delErr) {
      getLogger().error({ err: delErr }, "[deliveries/start] insert deliverables failed");
    }

    // ===== AUTO-QA REVIEWER =====
    // Si el producto tiene qa_enabled=true, el entregable pasa por un reviewer
    // LLM antes de marcarse como 'delivered'. Si score < threshold, escala a Pablo.
    const qaEnabled = (order.service_catalog as { qa_enabled?: boolean } | null)?.qa_enabled === true;
    if (qaEnabled) {
      try {
        const qa = await reviewDeliverable(
          {
            id: orderId,
            order_number: order.order_number,
            service_slug: order.service_slug,
            inputs: (order.inputs as Record<string, unknown> | null) || {},
          },
          result.deliverables,
          {
            name: catalog?.name,
            qa_threshold: (order.service_catalog as { qa_threshold?: number } | null)?.qa_threshold ?? 7,
          }
        );

        if (!qa.passed) {
          await supabase
            .from("orders")
            .update({
              status: "processing",
              qa_score: qa.score,
              qa_passed: false,
              qa_feedback: qa.feedback,
              escalated_to_pablo: true,
              escalation_reason: `QA rechazo: score ${qa.score}/10 — ${qa.feedback.slice(0, 200)}`,
              escalated_at: new Date().toISOString(),
              progress_message: "QA rechazo — revision manual en curso",
              cost_usd: (result.costUsd || 0) + qa.costUsd,
            })
            .eq("id", orderId);

          await supabase.from("order_events").insert({
            order_id: orderId,
            event_type: "escalated",
            title: `QA rechazo (score ${qa.score}/10)`,
            message: qa.feedback.slice(0, 400),
            payload: {
              reason: "qa_failed",
              score: qa.score,
              concerns: qa.concerns,
              strengths: qa.strengths,
              model: qa.modelUsed,
            },
          });

          const qaEmail = escalationQARejected({
            orderNumber: order.order_number || orderId,
            serviceSlug: order.service_slug,
            score: qa.score,
            feedback: qa.feedback,
            orderUrl: `https://pacameagencia.com/dashboard/orders/${orderId}`,
          });
          await notifyPablo(qaEmail.subject.replace(/^\[PACAME\]\s*/, ""), qaEmail.html);

          return NextResponse.json({
            ok: false,
            qa_failed: true,
            qa_score: qa.score,
            escalated: true,
          });
        }

        // passed=true — graba qa_score/qa_passed/qa_feedback en orders y continua
        await supabase
          .from("orders")
          .update({
            qa_score: qa.score,
            qa_passed: true,
            qa_feedback: qa.feedback,
          })
          .eq("id", orderId);

        // Sumar coste QA al coste total
        result.costUsd = (result.costUsd || 0) + qa.costUsd;
      } catch (qaErr) {
        // Si el QA mismo falla, logueamos pero seguimos con la entrega
        // (el reviewer ya tiene su propio fallback interno).
        getLogger().error({ err: qaErr }, "[deliveries/start] QA review crashed");
      }
    }

    // Also expose as client_files so they show up in the portal's /files page
    if (order.client_id) {
      const fileRows = result.deliverables
        .filter((d) => d.fileUrl)
        .map((d) => ({
          client_id: order.client_id as string,
          filename: `${d.title || delivery.name}.${d.kind}`,
          file_url: d.fileUrl as string,
          file_type:
            d.kind === "image" ? "brand_asset" :
            d.kind === "pdf" ? "document" :
            d.kind === "zip" ? "brand_asset" :
            "document",
          uploaded_by: "team",
        }));
      if (fileRows.length > 0) {
        await supabase.from("client_files").insert(fileRows);
      }
    }

    // ===== MARK DELIVERED =====
    // cost_usd acumulado (revenue split se calcula en trigger SQL)
    await supabase
      .from("orders")
      .update({
        status: "delivered",
        progress_pct: 100,
        progress_message: "Entregado",
        delivered_at: new Date().toISOString(),
        cost_usd: result.costUsd,
      })
      .eq("id", orderId);

    await supabase.from("order_events").insert([
      {
        order_id: orderId,
        event_type: "draft_ready",
        title: "Entregable listo",
        message: result.summary,
      },
      {
        order_id: orderId,
        event_type: "delivered",
        title: "Entrega completada",
        message: result.summary,
        payload: { cost_usd: result.costUsd, deliverables_count: result.deliverables.length },
      },
    ]);

    // ===== NOTIFY CUSTOMER =====
    const customerEmail = order.customer_email;
    if (customerEmail) {
      sendEmail({
        to: customerEmail,
        subject: `Tu ${delivery.name} esta listo`,
        html: wrapEmailTemplate(
          `Hola,\n\n` +
            `Tu <strong>${delivery.name}</strong> ya esta entregado.\n\n` +
            `${result.summary}\n\n` +
            `Puedes verlo y descargarlo en tu portal de cliente. Tienes ${order.service_catalog?.delivery_sla_hours ? "2 revisiones" : "revisiones"} incluidas si quieres ajustarlo.\n\n` +
            `Gracias por confiar en PACAME.`,
          {
            cta: "Ver mi entregable",
            ctaUrl: `https://pacameagencia.com/portal/orders/${orderId}`,
            preheader: "Tu entregable PACAME esta listo",
          }
        ),
        tags: [
          { name: "type", value: "delivery_ready" },
          { name: "order_id", value: orderId },
          { name: "service", value: order.service_slug },
        ],
      });
    }

    // Notify Pablo (no-await notifyPayment since orchestrator is already in flight)
    notifyPayment(order.customer_name || "cliente", (order.amount_cents || 0) / 100, `DELIVERED ${order.service_slug}`).catch(() => {});

    return NextResponse.json({
      ok: true,
      order_id: orderId,
      deliverables_count: result.deliverables.length,
      cost_usd: result.costUsd,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Internal error";
    getLogger().error({ err }, "[deliveries/start] fatal error");
    if (orderId) {
      await supabase
        .from("pending_reconciliation")
        .insert({
          source: "deliveries_start",
          reference_id: orderId,
          error_message: msg.slice(0, 500),
          payload: { order_id: orderId },
        })
        .then(() => {}, () => {});
    }
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
