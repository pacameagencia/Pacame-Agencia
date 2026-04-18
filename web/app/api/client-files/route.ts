import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerSupabase } from "@/lib/supabase/server";
import crypto from "crypto";
import { getLogger } from "@/lib/observability/logger";

async function getAuthClient() {
  const cookieStore = await cookies();
  const token = cookieStore.get("pacame_client_auth")?.value;
  if (!token) return null;
  const supabase = createServerSupabase();
  const { data } = await supabase
    .from("clients")
    .select("*")
    .eq("auth_token", token)
    .gt("auth_token_expires", new Date().toISOString())
    .single();
  return data;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

const MIME_TO_TYPE: Record<string, string> = {
  "image/png": "brand_asset",
  "image/jpeg": "brand_asset",
  "image/svg+xml": "brand_asset",
  "image/webp": "brand_asset",
  "application/pdf": "document",
  "application/msword": "document",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "document",
  "application/vnd.ms-excel": "document",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "document",
  "text/plain": "document",
  "text/csv": "document",
};

/**
 * POST: Upload a file to Supabase Storage + record in client_files
 */
export async function POST(request: NextRequest) {
  const client = await getAuthClient();
  if (!client) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const supabase = createServerSupabase();

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const fileTypeOverride = formData.get("file_type") as string | null;

    if (!file) {
      return NextResponse.json({ error: "No se envio ningun archivo" }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "El archivo supera los 10 MB" }, { status: 400 });
    }

    // Determine file type
    const detectedType = MIME_TO_TYPE[file.type] ?? "other";
    const fileType = fileTypeOverride ?? detectedType;

    // Generate unique path
    const ext = file.name.split(".").pop() ?? "bin";
    const uniqueName = `${client.id}/${crypto.randomUUID()}.${ext}`;

    // Upload to Supabase Storage
    const buffer = Buffer.from(await file.arrayBuffer());
    const { error: uploadError } = await supabase.storage
      .from("client-files")
      .upload(uniqueName, buffer, {
        contentType: file.type,
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      getLogger().error({ err: uploadError }, "Storage upload error");
      return NextResponse.json(
        { error: "Error al subir el archivo al almacenamiento" },
        { status: 500 }
      );
    }

    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from("client-files")
      .getPublicUrl(uniqueName);

    const fileUrl = publicUrlData.publicUrl;

    // Insert record in client_files table
    const { data: fileRecord, error: insertError } = await supabase
      .from("client_files")
      .insert({
        client_id: client.id,
        filename: file.name,
        file_url: fileUrl,
        file_type: fileType,
        file_size: file.size,
        uploaded_by: "client",
      })
      .select()
      .single();

    if (insertError) {
      getLogger().error({ err: insertError }, "DB insert error");
      // Attempt cleanup of uploaded file
      await supabase.storage.from("client-files").remove([uniqueName]);
      return NextResponse.json(
        { error: "Error al registrar el archivo" },
        { status: 500 }
      );
    }

    return NextResponse.json({ file: fileRecord });
  } catch (err) {
    getLogger().error({ err }, "Upload error");
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

/**
 * GET: List files for the authenticated client
 */
export async function GET() {
  const client = await getAuthClient();
  if (!client) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const supabase = createServerSupabase();

  const { data: files, error } = await supabase
    .from("client_files")
    .select("id, filename, file_url, file_type, file_size, uploaded_by, created_at")
    .eq("client_id", client.id)
    .order("created_at", { ascending: false });

  if (error) {
    getLogger().error({ err: error }, "Fetch files error");
    return NextResponse.json({ error: "Error al listar archivos" }, { status: 500 });
  }

  return NextResponse.json({ files: files ?? [] });
}

/**
 * DELETE: Remove a file from storage + DB
 */
export async function DELETE(request: NextRequest) {
  const client = await getAuthClient();
  if (!client) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const supabase = createServerSupabase();

  try {
    const body = (await request.json()) as { fileId?: string };
    const { fileId } = body;

    if (!fileId) {
      return NextResponse.json({ error: "fileId requerido" }, { status: 400 });
    }

    // Verify ownership
    const { data: fileRecord, error: fetchError } = await supabase
      .from("client_files")
      .select("id, file_url")
      .eq("id", fileId)
      .eq("client_id", client.id)
      .single();

    if (fetchError || !fileRecord) {
      return NextResponse.json({ error: "Archivo no encontrado" }, { status: 404 });
    }

    // Extract storage path from URL
    const url = new URL(fileRecord.file_url);
    const pathParts = url.pathname.split("/storage/v1/object/public/client-files/");
    const storagePath = pathParts[1];

    if (storagePath) {
      await supabase.storage.from("client-files").remove([storagePath]);
    }

    // Delete DB record
    const { error: deleteError } = await supabase
      .from("client_files")
      .delete()
      .eq("id", fileId)
      .eq("client_id", client.id);

    if (deleteError) {
      getLogger().error({ err: deleteError }, "Delete DB error");
      return NextResponse.json({ error: "Error al eliminar registro" }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    getLogger().error({ err }, "Delete error");
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
