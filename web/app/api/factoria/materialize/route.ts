/**
 * POST /api/factoria/materialize
 *
 * FASE E — Convierte una plantilla sector + datos cliente en archivos
 * físicos (env, business-config.ts, vapi assistant, n8n workflows, SQL seed,
 * README) y los sube a Supabase Storage bucket `client-deployments/<slug>/`.
 *
 * Request body:
 *   {
 *     deployment_id?: uuid,           // si se pasa, actualiza el row existente
 *     template_id: 'hosteleria-v1',
 *     client: { business_name, city, ... },
 *     plan?: object                    // plan SAGE para incluir en README
 *   }
 *
 * Response:
 *   { ok, slug, deployment_id, files: [{ path, signed_url, bytes }], missing_vars, warnings }
 */

import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { materializeClient, type ClientInput } from "@/lib/factoria/client-materializer";
import { verifyInternalAuth } from "@/lib/api-auth";

export const runtime = "nodejs";
export const maxDuration = 60;

const BUCKET = "client-deployments";
const SIGNED_URL_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 días

interface MaterializeRequest {
  deployment_id?: string;
  template_id: string;
  client: ClientInput;
  plan?: unknown;
}

export async function POST(request: NextRequest) {
  const unauthorized = verifyInternalAuth(request);
  if (unauthorized) return unauthorized;

  let body: MaterializeRequest;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON body" }, { status: 400 });
  }

  const { deployment_id, template_id, client, plan } = body;
  if (!template_id || !client?.business_name || !client?.city) {
    return NextResponse.json(
      { error: "template_id, client.business_name and client.city required" },
      { status: 400 }
    );
  }

  // 1. Materializar archivos en memoria
  let materialization;
  try {
    materialization = await materializeClient({ template_id, client, plan });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }

  const { files, slug, missing_vars, warnings } = materialization;
  const supabase = createServerSupabase();

  // 2. Subir cada archivo a Supabase Storage
  const uploadedFiles: { path: string; signed_url: string; bytes: number; content_type: string }[] = [];
  const uploadErrors: { path: string; error: string }[] = [];

  for (const file of files) {
    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(file.path, file.content, {
        contentType: file.contentType,
        upsert: true,
      });

    if (uploadError) {
      uploadErrors.push({ path: file.path, error: uploadError.message });
      continue;
    }

    const { data: signed, error: signedError } = await supabase.storage
      .from(BUCKET)
      .createSignedUrl(file.path, SIGNED_URL_TTL_SECONDS);

    if (signedError || !signed) {
      uploadErrors.push({ path: file.path, error: signedError?.message ?? "no signed url" });
      continue;
    }

    uploadedFiles.push({
      path: file.path,
      signed_url: signed.signedUrl,
      bytes: file.bytes,
      content_type: file.contentType,
    });
  }

  if (uploadErrors.length > 0) {
    return NextResponse.json(
      {
        ok: false,
        error: "some files failed to upload",
        upload_errors: uploadErrors,
        uploaded: uploadedFiles.length,
      },
      { status: 502 }
    );
  }

  // 3. Persistir / actualizar client_deployments
  let finalDeploymentId = deployment_id;
  const materialized_at = new Date().toISOString();

  // Si no nos pasaron deployment_id pero ya existe un deployment con este slug,
  // lo reusamos (UPSERT por slug). Esto permite re-materializar al cliente sin
  // chocar con el unique constraint y sin crear duplicados.
  if (!deployment_id) {
    const { data: existing } = await supabase
      .from("client_deployments")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();
    if (existing?.id) {
      finalDeploymentId = existing.id;
    }
  }

  if (finalDeploymentId) {
    const { error: updateError } = await supabase
      .from("client_deployments")
      .update({
        template_id,
        business_name: client.business_name,
        city: client.city,
        client_data: client,
        plan: plan ?? {},
        slug,
        materialized_files: uploadedFiles,
        materialized_at,
        missing_vars,
        warnings,
      })
      .eq("id", finalDeploymentId);

    if (updateError) {
      return NextResponse.json(
        { error: `update failed: ${updateError.message}`, slug, files: uploadedFiles },
        { status: 500 }
      );
    }
  } else {
    const { data: inserted, error: insertError } = await supabase
      .from("client_deployments")
      .insert({
        template_id,
        business_name: client.business_name,
        city: client.city,
        client_data: client,
        plan: plan ?? {},
        slug,
        materialized_files: uploadedFiles,
        materialized_at,
        missing_vars,
        warnings,
        status: "planned",
      })
      .select("id")
      .single();

    if (insertError) {
      return NextResponse.json(
        { error: `insert failed: ${insertError.message}`, slug, files: uploadedFiles },
        { status: 500 }
      );
    }
    finalDeploymentId = inserted.id;
  }

  return NextResponse.json({
    ok: true,
    deployment_id: finalDeploymentId,
    slug,
    template_id,
    files: uploadedFiles,
    missing_vars,
    warnings,
    materialized_at,
  });
}

export async function GET(request: NextRequest) {
  const unauthorized = verifyInternalAuth(request);
  if (unauthorized) return unauthorized;

  const supabase = createServerSupabase();
  const url = new URL(request.url);
  const deploymentId = url.searchParams.get("deployment_id");

  let query = supabase
    .from("client_deployments")
    .select("id, slug, template_id, business_name, city, status, materialized_at, materialized_files, zip_url, missing_vars, warnings, created_at")
    .order("created_at", { ascending: false });

  if (deploymentId) {
    query = query.eq("id", deploymentId);
  } else {
    query = query.not("materialized_at", "is", null).limit(50);
  }

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    count: data?.length ?? 0,
    deployments: data ?? [],
  });
}
