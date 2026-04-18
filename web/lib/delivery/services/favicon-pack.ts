import { BaseDelivery } from "../base";
import { generateImage } from "@/lib/image-generation";
import { createServerSupabase } from "@/lib/supabase/server";
import type { DeliveryContext, DeliveryResult } from "../types";

/**
 * Delivery: Favicon Pack
 * Agente: Nova
 * Output: ZIP con favicon.ico + PNGs (16, 32, 64, 180, 192, 512) + manifest.json + README.
 * SLA: 1h (en practica <2 min).
 *
 * Fuentes aceptadas:
 *   - logo_upload: URL directa de un logo subido por el cliente (client-files)
 *   - logo_express_order: order_id de un deliverable previo (imagen actual del pedido)
 *   - from_scratch: generacion IA con business_name + color
 */

type FaviconInputs = {
  source?: "logo_upload" | "logo_express_order" | "from_scratch";
  logo_upload_url?: string;
  logo_express_order_id?: string;
  business_name?: string;
  color?: string;
};

const FAVICON_SIZES = [
  { name: "favicon-16.png", size: 16 },
  { name: "favicon-32.png", size: 32 },
  { name: "favicon-64.png", size: 64 },
  { name: "favicon-192.png", size: 192 },
  { name: "favicon-512.png", size: 512 },
  { name: "apple-touch-icon.png", size: 180 },
];

const BUCKET = "deliverables";

export class FaviconPackDelivery extends BaseDelivery {
  readonly slug = "favicon-pack";
  readonly name = "Favicon Pack";

  async execute(ctx: DeliveryContext): Promise<DeliveryResult> {
    const inputs = (ctx.inputs || {}) as FaviconInputs;
    const source = inputs.source || "from_scratch";

    await ctx.onProgress(10, "Nova esta preparando tu favicon pack...");

    // 1. Obtener URL de imagen base segun la fuente
    const sourceImageUrl = await this.resolveSourceImage(ctx, inputs, source);
    if (!sourceImageUrl) {
      throw new Error(
        `FaviconPack: no se pudo resolver imagen base (source=${source}).`
      );
    }

    await ctx.onProgress(30, "Descargando imagen base...");

    // 2. Descargar buffer de la imagen base
    const baseBuffer = await this.fetchImageBuffer(sourceImageUrl);

    await ctx.onProgress(60, "Generando variantes (16, 32, 64, 180, 192, 512)...");

    // 3. Generar variantes (sharp si disponible, fallback Pollinations)
    const { files, usedSharp } = await this.generateVariants(
      baseBuffer,
      sourceImageUrl,
      inputs
    );

    // 4. Generar manifest.json + README.txt
    files["manifest.json"] = Buffer.from(this.buildManifest(inputs), "utf8");
    files["README.txt"] = Buffer.from(this.buildReadme(), "utf8");

    // 5. Empaquetar en ZIP con jszip
    await ctx.onProgress(85, "Empaquetando ZIP...");
    const zipBuffer = await this.buildZip(files);

    // 6. Subir a Supabase Storage
    await ctx.onProgress(95, "Subiendo entregable...");
    const storagePath = `favicon-pack/${ctx.orderId}.zip`;
    const { signedUrl, publicPreview } = await this.uploadAndSign(
      storagePath,
      zipBuffer,
      files["favicon-512.png"] || null,
      ctx.orderId
    );

    // Coste estimado: imagen IA ~$0.02 si from_scratch, resto es local
    const imageGenCost = source === "from_scratch" ? 0.02 : 0;
    const sharpFallbackCost = usedSharp ? 0 : 0.02; // si fallback, llamamos N veces a Pollinations
    const totalCost = imageGenCost + sharpFallbackCost;

    return {
      deliverables: [
        {
          kind: "zip",
          title: "Favicon Pack — todos los tamaños + manifest",
          fileUrl: signedUrl,
          storagePath,
          previewUrl: publicPreview || sourceImageUrl,
          meta: {
            cost_usd: totalCost,
            source,
            archivos_incluidos: Object.keys(files),
            used_sharp: usedSharp,
            size_bytes: zipBuffer.length,
          },
        },
      ],
      summary: `Favicon pack listo: ${
        Object.keys(files).length
      } archivos (ICO, PNGs 16/32/64/180/192/512, manifest, README).`,
      costUsd: totalCost,
    };
  }

  // ---------- helpers ----------

  /** Resuelve la URL de la imagen base segun el tipo de fuente. */
  private async resolveSourceImage(
    ctx: DeliveryContext,
    inputs: FaviconInputs,
    source: string
  ): Promise<string | null> {
    if (source === "logo_upload") {
      if (!inputs.logo_upload_url) {
        throw new Error("FaviconPack: falta logo_upload_url para source=logo_upload");
      }
      return inputs.logo_upload_url;
    }

    if (source === "logo_express_order") {
      if (!inputs.logo_express_order_id) {
        throw new Error(
          "FaviconPack: falta logo_express_order_id para source=logo_express_order"
        );
      }
      const supabase = createServerSupabase();
      const { data, error } = await supabase
        .from("deliverables")
        .select("file_url, preview_url, storage_path")
        .eq("order_id", inputs.logo_express_order_id)
        .eq("kind", "image")
        .eq("is_current", true)
        .limit(1);
      if (error) {
        throw new Error(
          `FaviconPack: error consultando deliverables previos — ${error.message}`
        );
      }
      const row = data?.[0];
      const url = row?.file_url || row?.preview_url;
      if (!url) {
        throw new Error(
          `FaviconPack: no se encontro imagen current para order_id=${inputs.logo_express_order_id}`
        );
      }
      return url;
    }

    // from_scratch → generar con IA
    const businessName = inputs.business_name || "Brand";
    const color = inputs.color || "gold";
    const prompt = `Square icon for ${businessName}, ${color} color, minimalist, vector style, flat design, centered symbol, white background, no text, professional brand mark, clean geometric shape`;
    const url = await generateImage(prompt, "instagram");
    if (!url) {
      throw new Error("FaviconPack: generacion IA de icono fallo en todos los proveedores");
    }
    return url;
  }

  /** Descarga la imagen y devuelve un Buffer. */
  private async fetchImageBuffer(url: string): Promise<Buffer> {
    const res = await fetch(url, { signal: AbortSignal.timeout(20000) });
    if (!res.ok) {
      throw new Error(
        `FaviconPack: fetch imagen base fallo — ${res.status} ${res.statusText}`
      );
    }
    const arr = await res.arrayBuffer();
    return Buffer.from(arr);
  }

  /**
   * Genera las variantes a todos los tamaños.
   * Preferimos sharp (local, rapido). Si no esta instalado, caemos a Pollinations.
   */
  private async generateVariants(
    baseBuffer: Buffer,
    sourceUrl: string,
    inputs: FaviconInputs
  ): Promise<{ files: Record<string, Buffer>; usedSharp: boolean }> {
    const files: Record<string, Buffer> = {};

    // Intentar sharp (dynamic import — si no esta instalado, cae al fallback).
    // Tipado como `any` porque los tipos solo existen si la dep esta instalada.
    let sharp: any = null;
    try {
      const sharpMod = (await import("sharp")) as any;
      sharp = sharpMod.default || sharpMod;
    } catch {
      sharp = null;
    }

    if (sharp) {
      for (const variant of FAVICON_SIZES) {
        try {
          const png = await sharp(baseBuffer)
            .resize(variant.size, variant.size, {
              fit: "contain",
              background: { r: 255, g: 255, b: 255, alpha: 0 },
            })
            .png()
            .toBuffer();
          files[variant.name] = png;
        } catch (err) {
          throw new Error(
            `FaviconPack: sharp fallo en ${variant.name} — ${(err as Error).message}`
          );
        }
      }
      // favicon.ico — sharp no soporta nativamente .ico. Degradamos a PNG 32x32
      // renombrado como .ico (la mayoria de navegadores aceptan PNG en favicon.ico).
      try {
        const icoBuf = await sharp(baseBuffer)
          .resize(32, 32, { fit: "contain", background: { r: 255, g: 255, b: 255, alpha: 0 } })
          .png()
          .toBuffer();
        files["favicon.ico"] = icoBuf;
      } catch {
        // Si falla, reutiliza el PNG 32
        if (files["favicon-32.png"]) files["favicon.ico"] = files["favicon-32.png"];
      }
      return { files, usedSharp: true };
    }

    // Fallback sin sharp: pedir a Pollinations cada tamaño
    const businessName = inputs.business_name || "Brand";
    const color = inputs.color || "gold";
    const basePrompt = `Square icon for ${businessName}, ${color}, minimalist, vector style, flat design, centered symbol, white background, no text`;
    for (const variant of FAVICON_SIZES) {
      const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(
        basePrompt + `, resized to ${variant.size}x${variant.size}`
      )}?width=${variant.size}&height=${variant.size}&nologo=true`;
      try {
        const res = await fetch(url, { signal: AbortSignal.timeout(30000) });
        if (!res.ok) {
          throw new Error(`pollinations ${res.status}`);
        }
        const buf = Buffer.from(await res.arrayBuffer());
        files[variant.name] = buf;
      } catch (err) {
        // Ultimo fallback: reutilizar el baseBuffer como esta
        console.warn(`[favicon-pack] fallback failed for ${variant.name}:`, err);
        files[variant.name] = baseBuffer;
      }
    }
    // favicon.ico en fallback: reutilizamos el 32x32
    files["favicon.ico"] = files["favicon-32.png"] || baseBuffer;
    return { files, usedSharp: false };
  }

  /** manifest.json PWA estandar. */
  private buildManifest(inputs: FaviconInputs): string {
    const name = inputs.business_name || "Brand";
    const manifest = {
      name,
      short_name: name.split(" ")[0] || name,
      icons: [
        { src: "/favicon-192.png", sizes: "192x192", type: "image/png" },
        { src: "/favicon-512.png", sizes: "512x512", type: "image/png" },
      ],
      theme_color: inputs.color || "#0A0A0A",
      background_color: "#ffffff",
      display: "standalone",
    };
    return JSON.stringify(manifest, null, 2);
  }

  /** README con instrucciones de instalacion HTML / WP / Next.js. */
  private buildReadme(): string {
    return `FAVICON PACK — PACAME
=======================

Contenido:
- favicon.ico              → compatibilidad legacy (IE, Edge)
- favicon-16.png           → barra del navegador
- favicon-32.png           → tab / pestana
- favicon-64.png           → Windows tiles
- favicon-192.png          → Android home screen (PWA)
- favicon-512.png          → splash screen PWA
- apple-touch-icon.png     → iOS home screen (180x180)
- manifest.json            → manifest PWA

-----------------------------------------------
INSTALACION (HTML estandar)
-----------------------------------------------
Sube todos los archivos a la raiz de tu web (/) y anade al <head>:

<link rel="icon" href="/favicon.ico" sizes="any">
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32.png">
<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16.png">
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">
<link rel="manifest" href="/manifest.json">

-----------------------------------------------
INSTALACION (WordPress)
-----------------------------------------------
1. Sube los archivos via FTP a la raiz de tu WP (mismo nivel que wp-config.php).
2. Apariencia > Personalizar > Identidad del sitio > Icono del sitio: sube favicon-512.png.
3. WP generara automaticamente el resto. Si quieres control manual, usa un plugin tipo "Insert Headers and Footers" y pega el snippet HTML de arriba.

-----------------------------------------------
INSTALACION (Next.js 13+ App Router)
-----------------------------------------------
Copia los archivos a /app:
- /app/favicon.ico
- /app/icon.png           (renombra favicon-512.png)
- /app/apple-icon.png     (renombra apple-touch-icon.png)

Next.js los detecta y anade los <link> automaticamente. Para el manifest:
- /app/manifest.ts o /app/manifest.json

-----------------------------------------------
SOPORTE
-----------------------------------------------
PACAME — pacameagencia.com
hola@pacameagencia.com
`;
  }

  /** Empaqueta los archivos en un ZIP con jszip. */
  private async buildZip(files: Record<string, Buffer>): Promise<Buffer> {
    let JSZipCtor: any;
    try {
      const mod = (await import("jszip")) as any;
      JSZipCtor = mod.default || mod;
    } catch (err) {
      throw new Error(
        `FaviconPack: jszip no instalado — anade a package.json y vuelve a desplegar. (${
          (err as Error).message
        })`
      );
    }
    const zip = new JSZipCtor();
    for (const [name, buf] of Object.entries(files)) {
      zip.file(name, buf);
    }
    const buf = await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" });
    return buf as Buffer;
  }

  /** Sube a Supabase Storage y genera signed URL 30 dias. */
  private async uploadAndSign(
    storagePath: string,
    zipBuffer: Buffer,
    previewBuffer: Buffer | null,
    orderId: string
  ): Promise<{ signedUrl: string; publicPreview: string | null }> {
    const supabase = createServerSupabase();

    const { error: upErr } = await supabase.storage
      .from(BUCKET)
      .upload(storagePath, zipBuffer, {
        contentType: "application/zip",
        cacheControl: "3600",
        upsert: true,
      });
    if (upErr) {
      throw new Error(`FaviconPack: upload ZIP fallo — ${upErr.message}`);
    }

    // Signed URL 30 dias
    const { data: signed, error: sigErr } = await supabase.storage
      .from(BUCKET)
      .createSignedUrl(storagePath, 60 * 60 * 24 * 30);
    if (sigErr || !signed?.signedUrl) {
      throw new Error(
        `FaviconPack: signed URL fallo — ${sigErr?.message || "sin URL"}`
      );
    }

    // Preview opcional: subir el favicon-512 como imagen visible (signed tambien)
    let publicPreview: string | null = null;
    if (previewBuffer) {
      const previewPath = `favicon-pack/${orderId}-preview.png`;
      const { error: pErr } = await supabase.storage
        .from(BUCKET)
        .upload(previewPath, previewBuffer, {
          contentType: "image/png",
          cacheControl: "3600",
          upsert: true,
        });
      if (!pErr) {
        const { data: pSigned } = await supabase.storage
          .from(BUCKET)
          .createSignedUrl(previewPath, 60 * 60 * 24 * 30);
        publicPreview = pSigned?.signedUrl || null;
      }
    }

    return { signedUrl: signed.signedUrl, publicPreview };
  }
}
