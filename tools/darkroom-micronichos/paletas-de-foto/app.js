/**
 * Paletas desde foto — DarkRoom micronicho
 *
 * Procesado 100% client-side. Ninguna imagen sale del navegador.
 * Algoritmo:
 *   1. Carga imagen en canvas off-screen.
 *   2. Sample uniforme de hasta 20.000 píxeles.
 *   3. K-means (k=8) con inicialización k-means++ para estabilidad.
 *   4. Devuelve los 8 centroides ordenados por luminosidad descendente.
 *
 * Sin dependencias externas. Vanilla JS. Funciona offline tras el primer load.
 */

(() => {
  "use strict";

  const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10 MB
  const SAMPLE_PIXELS = 20000;
  const K = 8;
  const KMEANS_MAX_ITER = 24;
  const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"];

  // ─── DOM ──────────────────────────────────────────────────────────────
  const $ = (id) => document.getElementById(id);
  const dropZone = $("dropZone");
  const fileInput = $("fileInput");
  const dropEmpty = $("dropEmpty");
  const dropPreview = $("dropPreview");
  const previewImg = $("previewImg");
  const resetBtn = $("resetBtn");
  const paletteEmpty = $("paletteEmpty");
  const paletteLoading = $("paletteLoading");
  const paletteResult = $("paletteResult");
  const swatches = $("swatches");
  const exportTextarea = $("exportTextarea");
  const toast = $("toast");
  const exportButtons = document.querySelectorAll(".export-buttons button");

  let currentPalette = []; // array de { hex, rgb: [r,g,b] }

  // ─── Eventos ──────────────────────────────────────────────────────────
  dropZone.addEventListener("click", () => fileInput.click());
  dropZone.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      fileInput.click();
    }
  });
  fileInput.addEventListener("change", (e) => {
    const file = e.target.files && e.target.files[0];
    if (file) handleFile(file);
  });

  dropZone.addEventListener("dragover", (e) => {
    e.preventDefault();
    dropZone.classList.add("dragover");
  });
  dropZone.addEventListener("dragleave", () => dropZone.classList.remove("dragover"));
  dropZone.addEventListener("drop", (e) => {
    e.preventDefault();
    dropZone.classList.remove("dragover");
    const file = e.dataTransfer.files && e.dataTransfer.files[0];
    if (file) handleFile(file);
  });

  resetBtn.addEventListener("click", reset);

  exportButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const fmt = btn.dataset.export;
      const text = formatPalette(fmt, currentPalette);
      exportTextarea.value = text;
      exportTextarea.select();
      try {
        document.execCommand("copy");
        showToast(`Copiado · ${labelOf(fmt)}`);
      } catch (_) {
        // ignore — el usuario puede copiar manualmente
      }
      exportButtons.forEach((b) => b.classList.toggle("active", b === btn));
    });
  });

  // Permite pegar imagen del portapapeles sin clicar
  document.addEventListener("paste", (e) => {
    const items = e.clipboardData && e.clipboardData.items;
    if (!items) return;
    for (const item of items) {
      if (item.type && item.type.startsWith("image/")) {
        const file = item.getAsFile();
        if (file) handleFile(file);
        return;
      }
    }
  });

  // ─── Handlers principales ────────────────────────────────────────────
  function handleFile(file) {
    if (!ALLOWED_TYPES.includes(file.type) && !file.type.startsWith("image/")) {
      showToast("Formato no soportado. Usa jpg, png, webp.", true);
      return;
    }
    if (file.size > MAX_FILE_BYTES) {
      showToast(`Archivo > 10 MB. Reduce el tamaño antes de subirla.`, true);
      return;
    }
    showLoading();

    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = async () => {
      previewImg.src = url;
      dropEmpty.hidden = true;
      dropPreview.hidden = false;
      try {
        const palette = await extractPalette(img);
        renderPalette(palette);
      } catch (err) {
        console.error("[paletas]", err);
        showToast("No se pudo extraer la paleta. Prueba otra imagen.", true);
        showEmpty();
      }
    };
    img.onerror = () => {
      showToast("La imagen no se pudo cargar.", true);
      showEmpty();
    };
    img.src = url;
  }

  function reset() {
    previewImg.removeAttribute("src");
    fileInput.value = "";
    dropPreview.hidden = true;
    dropEmpty.hidden = false;
    showEmpty();
    currentPalette = [];
  }

  function showEmpty() {
    paletteEmpty.hidden = false;
    paletteLoading.hidden = true;
    paletteResult.hidden = true;
  }
  function showLoading() {
    paletteEmpty.hidden = true;
    paletteLoading.hidden = false;
    paletteResult.hidden = true;
  }
  function showResult() {
    paletteEmpty.hidden = true;
    paletteLoading.hidden = true;
    paletteResult.hidden = false;
  }

  // ─── Extracción de paleta ────────────────────────────────────────────
  async function extractPalette(img) {
    // Reduce la imagen para acelerar (máx 400px lado mayor)
    const maxSide = 400;
    const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
    const w = Math.max(1, Math.round(img.width * scale));
    const h = Math.max(1, Math.round(img.height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    ctx.drawImage(img, 0, 0, w, h);

    let imageData;
    try {
      imageData = ctx.getImageData(0, 0, w, h);
    } catch (e) {
      throw new Error("Imagen bloqueada por CORS.");
    }
    const data = imageData.data; // Uint8ClampedArray RGBA

    // Sample uniforme
    const total = w * h;
    const step = Math.max(1, Math.floor(total / SAMPLE_PIXELS));
    const samples = [];
    for (let i = 0; i < total; i += step) {
      const idx = i * 4;
      const a = data[idx + 3];
      if (a < 128) continue; // skip transparente
      samples.push([data[idx], data[idx + 1], data[idx + 2]]);
    }
    if (samples.length < K) throw new Error("Imagen demasiado pequeña.");

    // K-means
    const centroids = kmeansPlusPlusInit(samples, K);
    const finalCentroids = kmeans(samples, centroids, KMEANS_MAX_ITER);

    // Ordenar por luminosidad (más oscuro primero — coherente con la voz DarkRoom)
    finalCentroids.sort((a, b) => luminance(a) - luminance(b));

    return finalCentroids.map((rgb) => ({
      rgb: rgb.map((v) => Math.round(v)),
      hex: rgbToHex(rgb),
    }));
  }

  // ─── Algoritmo K-means ───────────────────────────────────────────────
  function kmeansPlusPlusInit(samples, k) {
    const n = samples.length;
    const centroids = [];
    centroids.push(samples[Math.floor(Math.random() * n)].slice());
    while (centroids.length < k) {
      const distances = samples.map((p) => {
        let min = Infinity;
        for (const c of centroids) {
          const d = sqDist(p, c);
          if (d < min) min = d;
        }
        return min;
      });
      const total = distances.reduce((s, x) => s + x, 0);
      let target = Math.random() * total;
      let chosen = 0;
      for (let i = 0; i < distances.length; i++) {
        target -= distances[i];
        if (target <= 0) { chosen = i; break; }
      }
      centroids.push(samples[chosen].slice());
    }
    return centroids;
  }

  function kmeans(samples, initial, maxIter) {
    let centroids = initial.map((c) => c.slice());
    const k = centroids.length;
    const assignments = new Int32Array(samples.length);
    for (let iter = 0; iter < maxIter; iter++) {
      let changed = false;
      // Asignación
      for (let i = 0; i < samples.length; i++) {
        const p = samples[i];
        let best = 0;
        let bestD = sqDist(p, centroids[0]);
        for (let c = 1; c < k; c++) {
          const d = sqDist(p, centroids[c]);
          if (d < bestD) { bestD = d; best = c; }
        }
        if (assignments[i] !== best) { assignments[i] = best; changed = true; }
      }
      if (!changed && iter > 0) break;
      // Recalcular centroides
      const sums = Array.from({ length: k }, () => [0, 0, 0, 0]);
      for (let i = 0; i < samples.length; i++) {
        const c = assignments[i];
        const p = samples[i];
        sums[c][0] += p[0];
        sums[c][1] += p[1];
        sums[c][2] += p[2];
        sums[c][3] += 1;
      }
      for (let c = 0; c < k; c++) {
        if (sums[c][3] === 0) {
          // Centroide huérfano — re-seedea con un sample aleatorio
          centroids[c] = samples[Math.floor(Math.random() * samples.length)].slice();
        } else {
          centroids[c] = [
            sums[c][0] / sums[c][3],
            sums[c][1] / sums[c][3],
            sums[c][2] / sums[c][3],
          ];
        }
      }
    }
    return centroids;
  }

  function sqDist(a, b) {
    const dr = a[0] - b[0];
    const dg = a[1] - b[1];
    const db = a[2] - b[2];
    return dr * dr + dg * dg + db * db;
  }

  function luminance(rgb) {
    // ITU-R BT.601, suficiente para ordenar visualmente
    return 0.299 * rgb[0] + 0.587 * rgb[1] + 0.114 * rgb[2];
  }

  function rgbToHex(rgb) {
    const toHex = (v) => {
      const n = Math.max(0, Math.min(255, Math.round(v)));
      return n.toString(16).padStart(2, "0").toUpperCase();
    };
    return `#${toHex(rgb[0])}${toHex(rgb[1])}${toHex(rgb[2])}`;
  }

  // ─── Render ──────────────────────────────────────────────────────────
  function renderPalette(palette) {
    currentPalette = palette;
    swatches.innerHTML = "";
    palette.forEach((c, i) => {
      const lum = luminance(c.rgb);
      const textColor = lum > 140 ? "#000" : "#fff";
      const el = document.createElement("button");
      el.type = "button";
      el.className = "swatch";
      el.setAttribute("aria-label", `Copiar ${c.hex}`);
      el.style.background = c.hex;
      el.dataset.hex = c.hex;
      el.innerHTML = `<span class="swatch-hex" style="color:${textColor}; background:${textColor === "#fff" ? "rgba(0,0,0,0.55)" : "rgba(255,255,255,0.55)"};">${c.hex}</span>`;
      el.addEventListener("click", () => copyToClipboard(c.hex));
      swatches.appendChild(el);
    });
    // Reset export panel
    exportTextarea.value = "";
    exportButtons.forEach((b) => b.classList.remove("active"));
    showResult();
  }

  // ─── Export formats ──────────────────────────────────────────────────
  function formatPalette(fmt, palette) {
    if (!palette || !palette.length) return "";
    const hexes = palette.map((c) => c.hex);

    if (fmt === "hex") return hexes.join("\n");

    if (fmt === "css") {
      return [
        ":root {",
        ...hexes.map((h, i) => `  --c-${i + 1}: ${h};`),
        "}",
      ].join("\n");
    }

    if (fmt === "tailwind") {
      const obj = hexes.map((h, i) => `        c${i + 1}: '${h}'`).join(",\n");
      return [
        "// tailwind.config.js",
        "module.exports = {",
        "  theme: {",
        "    extend: {",
        "      colors: {",
        "        // Paleta extraída por DarkRoom",
        obj,
        "      },",
        "    },",
        "  },",
        "}",
      ].join("\n");
    }

    if (fmt === "json") {
      return JSON.stringify(
        {
          source: "paletas.darkroomcreative.cloud",
          generatedAt: new Date().toISOString(),
          colors: palette.map((c) => ({ hex: c.hex, rgb: c.rgb })),
        },
        null,
        2
      );
    }

    return hexes.join("\n");
  }

  function labelOf(fmt) {
    return ({ hex: "hex list", css: "CSS variables", tailwind: "Tailwind config", json: "JSON" })[fmt] || fmt;
  }

  // ─── Utilidades ──────────────────────────────────────────────────────
  function copyToClipboard(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(
        () => showToast(`${text} copiado`),
        () => fallbackCopy(text)
      );
    } else {
      fallbackCopy(text);
    }
  }
  function fallbackCopy(text) {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand("copy"); showToast(`${text} copiado`); }
    catch (_) { showToast(`Copia manual: ${text}`, true); }
    document.body.removeChild(ta);
  }

  let toastTimer = null;
  function showToast(msg, isError = false) {
    toast.textContent = msg;
    toast.style.color = isError ? "var(--warn)" : "var(--ok)";
    toast.classList.add("visible");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("visible"), 2200);
  }
})();
