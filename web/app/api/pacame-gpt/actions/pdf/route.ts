/**
 * GET /api/pacame-gpt/actions/pdf?messageId=...
 *
 * Devuelve un HTML imprimible con estilos Spanish Modernism del mensaje
 * de Lucía indicado. El navegador lo abre en una pestaña nueva; el usuario
 * usa "Imprimir → Guardar como PDF" (zero-deps, universal).
 *
 * Por qué HTML y no PDF binario: añadir una librería PDF (PDFKit, jsPDF,
 * puppeteer) son ~MBs de bundle o un Chromium server. HTML imprimible
 * cumple el 99% del caso uso para texto plano de chat.
 *
 * Auth: cookie pacame_product_session. Cada GET incrementa el rate-limit
 * diario (50/día) y registra en pacame_gpt_action_log.
 */

import { NextRequest, NextResponse } from "next/server";
import { getCurrentProductUser } from "@/lib/products/session";
import { checkActionRateLimit, loadOwnedMessage, logAction } from "@/lib/lucia/actions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const user = await getCurrentProductUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const messageId = req.nextUrl.searchParams.get("messageId");
  if (!messageId) {
    return NextResponse.json({ error: "messageId requerido" }, { status: 400 });
  }

  const rl = await checkActionRateLimit(user, "pdf");
  if (!rl.ok) {
    return NextResponse.json(
      {
        error: "daily_limit",
        message: `Has hecho ya ${rl.used} PDFs hoy. Límite ${rl.limit}/día.`,
      },
      { status: 429 }
    );
  }

  const msg = await loadOwnedMessage(user, messageId);
  if (!msg) {
    return NextResponse.json({ error: "message_not_found" }, { status: 404 });
  }
  if (msg.role !== "assistant") {
    return NextResponse.json(
      { error: "only_assistant_messages" },
      { status: 400 }
    );
  }

  const html = renderPrintableHtml(msg.content, msg.created_at);
  await logAction({
    user_id: user.id,
    conversation_id: msg.conversationId,
    message_id: msg.id,
    action: "pdf",
    details: { length: msg.content.length },
  });

  return new NextResponse(html, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Renderiza el contenido como HTML printable. Estilo Spanish Modernism:
 *   - Fondo paper, tipografía serif Fraunces para títulos, sans para body.
 *   - Cabecera con avatar Lucía + nombre + fecha.
 *   - @page y @media print para PDF limpio.
 *   - window.print() automático tras 600ms (con escape para que no
 *     bloquee si el user solo quiere leerlo).
 */
function renderPrintableHtml(content: string, createdAt: string): string {
  const fecha = new Date(createdAt).toLocaleString("es-ES", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
  // Markdown muy básico → HTML: párrafos + listas con * o -
  const safe = escapeHtml(content);
  const blocks = safe.split(/\n{2,}/).map((block) => {
    const trimmed = block.trim();
    if (/^[-*•]\s/m.test(trimmed)) {
      const items = trimmed.split("\n").map((l) => l.replace(/^[-*•]\s+/, "").trim()).filter(Boolean);
      return `<ul>${items.map((i) => `<li>${i}</li>`).join("")}</ul>`;
    }
    return `<p>${trimmed.replace(/\n/g, "<br>")}</p>`;
  });

  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8">
<title>Lucía · ${fecha}</title>
<style>
  @page { margin: 18mm 16mm; }
  * { box-sizing: border-box; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif;
    background: #f4efe3;
    color: #1a1813;
    margin: 0;
    padding: 32px 24px;
    line-height: 1.55;
    font-size: 16px;
  }
  .sheet {
    max-width: 720px;
    margin: 0 auto;
    background: #ffffff;
    padding: 38px 44px 48px;
    border-radius: 14px;
    box-shadow: 0 8px 24px rgba(26,24,19,0.06);
  }
  header {
    display: flex;
    align-items: center;
    gap: 14px;
    border-bottom: 1px solid rgba(26,24,19,0.1);
    padding-bottom: 18px;
    margin-bottom: 24px;
  }
  .avatar {
    width: 48px; height: 48px; border-radius: 50%;
    background: linear-gradient(135deg,#b54e30,#e8b730);
    color: #f4efe3;
    display: flex; align-items: center; justify-content: center;
    font-family: Georgia, serif;
    font-weight: 600; font-size: 22px;
  }
  .who { line-height: 1.1; }
  .who .name {
    font-family: Georgia, serif;
    font-size: 22px;
    font-weight: 600;
    color: #1a1813;
  }
  .who .date {
    color: #6e6858;
    font-size: 13px;
    margin-top: 2px;
  }
  main p { margin: 0 0 14px; }
  main ul { margin: 0 0 14px 20px; padding: 0; }
  main li { margin: 0 0 6px; }
  footer {
    margin-top: 32px;
    border-top: 1px solid rgba(26,24,19,0.1);
    padding-top: 14px;
    color: #6e6858;
    font-size: 12px;
    display: flex;
    justify-content: space-between;
  }
  .printbtn {
    position: fixed;
    bottom: 24px;
    right: 24px;
    background: #1a1813;
    color: #f4efe3;
    border: none;
    padding: 12px 18px;
    border-radius: 12px;
    font-size: 14px;
    cursor: pointer;
    box-shadow: 0 6px 16px rgba(26,24,19,0.18);
    font-family: inherit;
  }
  @media print {
    body { background: #fff; padding: 0; }
    .sheet { box-shadow: none; padding: 0; border-radius: 0; }
    .printbtn { display: none; }
  }
</style>
</head>
<body>
<article class="sheet">
  <header>
    <div class="avatar">L</div>
    <div class="who">
      <div class="name">Lucía</div>
      <div class="date">PACAME GPT · ${fecha}</div>
    </div>
  </header>
  <main>${blocks.join("\n")}</main>
  <footer>
    <span>pacameagencia.com/pacame-gpt</span>
    <span>Lucía es una IA. Pablo la supervisa.</span>
  </footer>
</article>
<button class="printbtn" onclick="window.print()">Guardar como PDF</button>
<script>
  // Lanza el diálogo de impresión automáticamente al cargar para guiar al user.
  // Si no quiere, cancela y se queda con la vista web del documento.
  setTimeout(function () { try { window.print(); } catch (e) {} }, 800);
</script>
</body>
</html>`;
}
