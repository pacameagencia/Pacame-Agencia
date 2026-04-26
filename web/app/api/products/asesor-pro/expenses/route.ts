/**
 * GET  /api/products/asesor-pro/expenses              listar gastos
 * POST /api/products/asesor-pro/expenses              crear gasto
 *   - Si llega multipart/form-data con file → OCR Gemini Vision primero
 *   - Si llega JSON con campos directos → insert sin OCR
 */

import { NextRequest, NextResponse } from "next/server";
import { getCurrentProductUser } from "@/lib/products/session";
import { createServerSupabase } from "@/lib/supabase/server";
import { getClientContext } from "@/lib/products/asesor-pro/client-queries";
import { extractReceiptOCR } from "@/lib/products/asesor-pro/ocr";
import { notifyExpenseUploaded } from "@/lib/products/asesor-pro/notifications";

export const runtime = "nodejs";
export const maxDuration = 30;

const BUCKET = "client-deployments";

export async function GET() {
  const user = await getCurrentProductUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const supabase = createServerSupabase();

  if (user.role === "client_of") {
    const ctx = await getClientContext(user);
    if (!ctx) return NextResponse.json({ error: "no client context" }, { status: 403 });
    const { data } = await supabase
      .from("asesorpro_expenses")
      .select("*")
      .eq("asesor_client_id", ctx.asesor_client_id)
      .order("expense_date", { ascending: false })
      .limit(200);
    return NextResponse.json({ expenses: data ?? [] });
  }

  // Asesor: ve TODOS los gastos de sus clientes
  const { data } = await supabase
    .from("asesorpro_expenses")
    .select("*")
    .eq("asesor_user_id", user.id)
    .order("expense_date", { ascending: false })
    .limit(200);
  return NextResponse.json({ expenses: data ?? [] });
}

export async function POST(request: NextRequest) {
  const user = await getCurrentProductUser();
  if (!user || user.role !== "client_of") {
    return NextResponse.json({ error: "solo clientes-finales pueden subir gastos" }, { status: 403 });
  }
  const ctx = await getClientContext(user);
  if (!ctx) return NextResponse.json({ error: "no client context" }, { status: 403 });

  const supabase = createServerSupabase();
  const contentType = request.headers.get("content-type") ?? "";

  // ── PATH 1: multipart con foto → OCR + insert ──────────────────────────
  if (contentType.includes("multipart/form-data")) {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "file requerido" }, { status: 400 });
    }
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "imagen máx 5MB" }, { status: 413 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const base64 = buffer.toString("base64");
    const mimeType = file.type || "image/jpeg";

    // Subir foto al bucket
    const ext = mimeType.split("/")[1] ?? "jpg";
    const photoPath = `asesorpro-expenses/${ctx.asesor_client_id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(photoPath, buffer, { contentType: mimeType, upsert: false });
    if (uploadError) {
      return NextResponse.json({ error: `upload: ${uploadError.message}` }, { status: 500 });
    }
    const { data: signed } = await supabase.storage
      .from(BUCKET)
      .createSignedUrl(photoPath, 60 * 60 * 24 * 365); // 1 año
    const photoUrl = signed?.signedUrl ?? null;

    // Llamar OCR
    let ocr;
    try {
      ocr = await extractReceiptOCR({ imageBase64: base64, mimeType });
    } catch (err) {
      // OCR falla pero el gasto se guarda con datos vacíos (cliente puede editar)
      const { data, error } = await supabase
        .from("asesorpro_expenses")
        .insert({
          asesor_client_id: ctx.asesor_client_id,
          asesor_user_id: ctx.asesor_user_id,
          photo_url: photoUrl,
          status: "pending",
          notes: `OCR falló: ${err instanceof Error ? err.message : String(err)}`,
        })
        .select("*")
        .single();
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({
        expense: data,
        ocr_failed: true,
        ocr_error: err instanceof Error ? err.message : String(err),
      });
    }

    // Insert con datos OCR
    const totalCents = ocr.total_cents ?? 0;
    const baseCents = ocr.base_cents ?? Math.round(totalCents / (1 + (ocr.iva_pct ?? 21) / 100));
    const ivaCents = ocr.iva_cents ?? totalCents - baseCents;

    const { data, error } = await supabase
      .from("asesorpro_expenses")
      .insert({
        asesor_client_id: ctx.asesor_client_id,
        asesor_user_id: ctx.asesor_user_id,
        vendor_name: ocr.vendor_name,
        vendor_nif: ocr.vendor_nif,
        expense_date: ocr.expense_date,
        base_cents: baseCents,
        iva_pct: ocr.iva_pct ?? 21,
        iva_cents: ivaCents,
        total_cents: totalCents,
        category: ocr.category,
        photo_url: photoUrl,
        ocr_data: ocr as unknown as Record<string, unknown>,
        ocr_confidence: ocr.confidence,
        status: "pending",
      })
      .select("*")
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Crear alerta para el asesor
    await supabase.from("asesorpro_alerts").insert({
      asesor_user_id: ctx.asesor_user_id,
      asesor_client_id: ctx.asesor_client_id,
      type: "expense_uploaded",
      severity: ocr.confidence < 0.6 ? "warning" : "info",
      title: `Nuevo gasto · ${ocr.vendor_name ?? "sin nombre"}`,
      message: `${(totalCents / 100).toFixed(2)} € · confianza OCR ${(ocr.confidence * 100).toFixed(0)}%`,
      action_url: `/app/asesor-pro/gastos?id=${data.id}`,
    });

    // Telegram al asesor (silencioso si no configurado)
    notifyExpenseUploaded({
      asesor_user_id: ctx.asesor_user_id,
      client_name: ctx.fiscal_name,
      vendor: ocr.vendor_name ?? "",
      total_eur: totalCents / 100,
      confidence: ocr.confidence,
      expense_id: data.id,
    }).catch(() => {});

    return NextResponse.json({ expense: data, ocr });
  }

  // ── PATH 2: JSON directo (sin OCR) ─────────────────────────────────────
  let body: {
    vendor_name?: string;
    vendor_nif?: string;
    expense_date?: string;
    base_cents?: number;
    iva_pct?: number;
    iva_cents?: number;
    total_cents: number;
    category?: string;
    notes?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON" }, { status: 400 });
  }

  if (typeof body.total_cents !== "number" || body.total_cents <= 0) {
    return NextResponse.json({ error: "total_cents requerido > 0" }, { status: 400 });
  }

  const ivaPct = body.iva_pct ?? 21;
  const baseCents = body.base_cents ?? Math.round(body.total_cents / (1 + ivaPct / 100));
  const ivaCents = body.iva_cents ?? body.total_cents - baseCents;

  const { data, error } = await supabase
    .from("asesorpro_expenses")
    .insert({
      asesor_client_id: ctx.asesor_client_id,
      asesor_user_id: ctx.asesor_user_id,
      vendor_name: body.vendor_name ?? null,
      vendor_nif: body.vendor_nif ?? null,
      expense_date: body.expense_date ?? new Date().toISOString().slice(0, 10),
      base_cents: baseCents,
      iva_pct: ivaPct,
      iva_cents: ivaCents,
      total_cents: body.total_cents,
      category: body.category ?? null,
      notes: body.notes ?? null,
      status: "pending",
    })
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ expense: data });
}
