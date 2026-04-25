/**
 * GET /api/factoria/materialize/[id]/zip
 *
 * FASE E — descarga el despliegue completo como ZIP.
 *
 * Lee los archivos materializados de Supabase Storage (bucket
 * client-deployments/<slug>/), los empaqueta en un ZIP en memoria, sube el
 * ZIP al mismo bucket bajo `<slug>/_archive/<slug>.zip`, persiste la
 * signed URL en client_deployments.zip_url y la devuelve.
 *
 * Si ya existe un ZIP reciente (<24h), reusa esa URL.
 */

import { NextRequest, NextResponse } from "next/server";
import JSZip from "jszip";
import { createServerSupabase } from "@/lib/supabase/server";
import { verifyInternalAuth } from "@/lib/api-auth";

export const runtime = "nodejs";
export const maxDuration = 60;

const BUCKET = "client-deployments";
const ZIP_SIGNED_TTL_SECONDS = 60 * 60 * 24 * 7; // 7d
const ZIP_CACHE_MAX_AGE_HOURS = 24;

interface MaterializedFileRecord {
  path: string;
  signed_url: string;
  bytes: number;
  content_type: string;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const unauthorized = verifyInternalAuth(request);
  if (unauthorized) return unauthorized;

  const { id } = await params;
  const supabase = createServerSupabase();

  // 1. Cargar deployment
  const { data: deployment, error } = await supabase
    .from("client_deployments")
    .select("id, slug, business_name, materialized_files, zip_url, zip_generated_at")
    .eq("id", id)
    .single();

  if (error || !deployment) {
    return NextResponse.json({ error: "deployment not found" }, { status: 404 });
  }

  if (!deployment.slug || !deployment.materialized_files || deployment.materialized_files.length === 0) {
    return NextResponse.json(
      { error: "deployment has no materialized files. Call /api/factoria/materialize first." },
      { status: 400 }
    );
  }

  // 2. Reusar ZIP cached si tiene <24h
  if (deployment.zip_url && deployment.zip_generated_at) {
    const ageHours = (Date.now() - new Date(deployment.zip_generated_at).getTime()) / (1000 * 60 * 60);
    if (ageHours < ZIP_CACHE_MAX_AGE_HOURS) {
      // Verificamos que la signed URL sigue valida (TTL 7 días).
      return NextResponse.json({
        ok: true,
        zip_url: deployment.zip_url,
        cached: true,
        generated_at: deployment.zip_generated_at,
      });
    }
  }

  // 3. Descargar archivos del bucket y meterlos en el ZIP
  const zip = new JSZip();
  const files = deployment.materialized_files as MaterializedFileRecord[];
  const downloadErrors: { path: string; error: string }[] = [];

  for (const file of files) {
    const { data: blob, error: downloadError } = await supabase.storage
      .from(BUCKET)
      .download(file.path);

    if (downloadError || !blob) {
      downloadErrors.push({ path: file.path, error: downloadError?.message ?? "unknown" });
      continue;
    }

    const buffer = Buffer.from(await blob.arrayBuffer());
    // Strip prefix slug/ del path para que el ZIP tenga estructura limpia
    const slugPrefix = `${deployment.slug}/`;
    const relativePath = file.path.startsWith(slugPrefix)
      ? file.path.slice(slugPrefix.length)
      : file.path;
    zip.file(relativePath, buffer);
  }

  if (downloadErrors.length > 0) {
    return NextResponse.json(
      { error: "some files failed to download", download_errors: downloadErrors },
      { status: 502 }
    );
  }

  // 4. Generar buffer del ZIP
  const zipBuffer = await zip.generateAsync({
    type: "nodebuffer",
    compression: "DEFLATE",
    compressionOptions: { level: 6 },
  });

  // 5. Subir al bucket y crear signed URL
  const zipPath = `${deployment.slug}/_archive/${deployment.slug}.zip`;
  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(zipPath, zipBuffer, {
      contentType: "application/zip",
      upsert: true,
    });

  if (uploadError) {
    return NextResponse.json(
      { error: `zip upload failed: ${uploadError.message}` },
      { status: 502 }
    );
  }

  const { data: signed, error: signedError } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(zipPath, ZIP_SIGNED_TTL_SECONDS);

  if (signedError || !signed) {
    return NextResponse.json(
      { error: `signed url failed: ${signedError?.message ?? "unknown"}` },
      { status: 502 }
    );
  }

  const generatedAt = new Date().toISOString();

  // 6. Persistir en client_deployments
  await supabase
    .from("client_deployments")
    .update({
      zip_url: signed.signedUrl,
      zip_generated_at: generatedAt,
    })
    .eq("id", id);

  return NextResponse.json({
    ok: true,
    zip_url: signed.signedUrl,
    zip_path: zipPath,
    file_count: files.length,
    zip_size_bytes: zipBuffer.length,
    generated_at: generatedAt,
    cached: false,
  });
}
