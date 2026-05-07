/**
 * Research Gates · validación research-first ESCALADO por tier (FIX CRITICAL #4 · 2026-05-07).
 *
 * Implementa los gates `noticia` y `trend` que el calendario maestro
 * (strategy/calendario-7may-31may-2026.md) declaraba pero NO existían.
 *
 * Antes: el cron auto generate-brief y compose-stories podían producir
 * contenido SIN verificación research-first. Cualquier carrusel "noticia"
 * podía inventar datos. Cualquier story "trend" podía inventar tendencia.
 *
 * Ahora: cualquier productor de contenido (endpoint, script, subagent)
 * importa este módulo y llama validateNoticiaBrief() o validateTrendStory()
 * ANTES de generar/encolar. Si validación falla, contenido NO se produce.
 *
 * Memoria: feedback_research_first_escalado_por_tier.md
 *
 * Tiers:
 *   - cine    → validado por render-piece.mjs (ya implementado)
 *   - noticia → validado por validateNoticiaBrief() de este módulo
 *   - trend   → validado por validateTrendStory() de este módulo
 *   - tier 0  → si no cumple ninguno → no se produce (saltar slot)
 */

/**
 * Valida un brief de carrusel pilar 1/2/3/4 (tier=noticia).
 *
 * Schema esperado en brief.source:
 * {
 *   research_tier: "noticia",
 *   source: {
 *     source_url: "https://anthropic.com/news/...",         REQUERIDO + reachable HEAD
 *     source_quote: "claim verbatim del anuncio oficial",   REQUERIDO + min 30 chars
 *     source_date: "2026-05-08",                            REQUERIDO + ≤7 días para pilar Tendencia
 *     verification_check: "Apify scrape + manual visit + cross-check con TechCrunch"  REQUERIDO + min 30 chars
 *   },
 *   cited_data: [                                           si slides tienen datos numéricos
 *     { value: "$15/Mtok input", source: "anthropic.com/api/pricing" },
 *     ...
 *   ]
 * }
 *
 * @param {Object} brief - el brief generado (incluye source + slides)
 * @param {Object} options - { verifyUrlReachable: boolean, pilar: 1|2|3|4 }
 * @returns {Promise<{ ok: boolean, errors: string[] }>}
 */
export async function validateNoticiaBrief(brief, options = {}) {
  const errors = [];
  const { verifyUrlReachable = true, pilar = 1 } = options;

  // 1. research_tier debe declararse
  if (brief.research_tier !== "noticia") {
    errors.push(`research_tier debe ser 'noticia' (recibido: '${brief.research_tier}')`);
  }

  const source = brief.source;
  if (!source || typeof source !== "object") {
    errors.push("brief.source ausente o no es object");
    return { ok: false, errors };
  }

  // 2. source_url presente + estructura URL válida
  if (!source.source_url || typeof source.source_url !== "string") {
    errors.push("source.source_url ausente");
  } else {
    try {
      new URL(source.source_url);
    } catch {
      errors.push(`source.source_url no es URL válida: '${source.source_url}'`);
    }
  }

  // 3. source_quote presente + longitud mínima
  if (!source.source_quote || typeof source.source_quote !== "string") {
    errors.push("source.source_quote ausente");
  } else if (source.source_quote.length < 30) {
    errors.push(`source.source_quote demasiado corto (${source.source_quote.length} chars, min 30)`);
  }

  // 4. source_date válida y ≤7 días si es pilar Tendencia (1)
  if (!source.source_date) {
    errors.push("source.source_date ausente");
  } else {
    const sourceDate = new Date(source.source_date);
    if (isNaN(sourceDate.getTime())) {
      errors.push(`source.source_date no parseable: '${source.source_date}'`);
    } else if (pilar === 1) {
      const daysDiff = (Date.now() - sourceDate.getTime()) / (24 * 3600 * 1000);
      if (daysDiff > 7) {
        errors.push(
          `pilar Tendencia (1) requiere noticia ≤7 días viejo · source_date=${source.source_date} (${daysDiff.toFixed(1)} días)`,
        );
      }
    }
  }

  // 5. verification_check presente + longitud mínima
  if (!source.verification_check || typeof source.verification_check !== "string") {
    errors.push("source.verification_check ausente");
  } else if (source.verification_check.length < 30) {
    errors.push(
      `source.verification_check demasiado corto (${source.verification_check.length} chars, min 30 · audit trail)`,
    );
  }

  // 6. HEAD request para verificar source_url reachable (opt-out con verifyUrlReachable=false para tests)
  if (verifyUrlReachable && source.source_url && errors.length === 0) {
    try {
      const ctrl = new AbortController();
      const timeout = setTimeout(() => ctrl.abort(), 10000);
      const r = await fetch(source.source_url, { method: "HEAD", signal: ctrl.signal });
      clearTimeout(timeout);
      if (r.status >= 400) {
        errors.push(`source.source_url devuelve HTTP ${r.status}`);
      }
    } catch (e) {
      errors.push(`source.source_url no reachable: ${e.message}`);
    }
  }

  // 7. cited_data: si brief.slides tiene datos numéricos, deben estar en cited_data
  const slides = brief.slides || [];
  const hasNumeric = slides.some((s) =>
    /\$\d|\d+%|\d+€|\d+\.\d+|\d{2,}\s*(MB|GB|TB|tok|tokens|users|followers|veces)/i.test(JSON.stringify(s)),
  );
  if (hasNumeric) {
    const citedData = brief.cited_data;
    if (!citedData || !Array.isArray(citedData) || citedData.length === 0) {
      errors.push(
        "slides contienen datos numéricos/precios pero brief.cited_data ausente · cada dato debe tener cita",
      );
    } else {
      // Validar estructura de cada cita
      for (const [i, c] of citedData.entries()) {
        if (!c.value || !c.source) {
          errors.push(`cited_data[${i}] sin value o source`);
        }
      }
    }
  }

  return { ok: errors.length === 0, errors };
}

/**
 * Valida un story (tier=trend) basado en daily_trends de Supabase.
 *
 * Schema esperado en story.trend:
 * {
 *   research_tier: "trend",
 *   trend: {
 *     apify_scrape_id: "uuid_de_daily_trends",      REQUERIDO + verificar existe en BD
 *     hashtag_origin: "#nanobananapro",             REQUERIDO
 *     top_post_engagement: 23847,                   REQUERIDO numeric
 *     scraped_at: "2026-05-08T05:00:00Z"            REQUERIDO + ≤24h para frescura
 *   }
 * }
 *
 * @param {Object} story - el story generado
 * @param {Object} options - { supabaseClient, verifyApifyExists: boolean }
 * @returns {Promise<{ ok: boolean, errors: string[] }>}
 */
export async function validateTrendStory(story, options = {}) {
  const errors = [];
  const { supabaseClient, verifyApifyExists = true } = options;

  // 1. research_tier debe declararse
  if (story.research_tier !== "trend") {
    errors.push(`research_tier debe ser 'trend' (recibido: '${story.research_tier}')`);
  }

  const trend = story.trend;
  if (!trend || typeof trend !== "object") {
    errors.push("story.trend ausente o no es object");
    return { ok: false, errors };
  }

  // 2. apify_scrape_id presente
  if (!trend.apify_scrape_id || typeof trend.apify_scrape_id !== "string") {
    errors.push("trend.apify_scrape_id ausente");
  }

  // 3. hashtag_origin presente y formato válido
  if (!trend.hashtag_origin || typeof trend.hashtag_origin !== "string") {
    errors.push("trend.hashtag_origin ausente");
  } else if (!trend.hashtag_origin.startsWith("#")) {
    errors.push(`trend.hashtag_origin debe empezar con '#' (recibido: '${trend.hashtag_origin}')`);
  }

  // 4. top_post_engagement numérico
  if (typeof trend.top_post_engagement !== "number" || trend.top_post_engagement <= 0) {
    errors.push("trend.top_post_engagement debe ser número > 0");
  }

  // 5. scraped_at presente y ≤24h
  if (!trend.scraped_at) {
    errors.push("trend.scraped_at ausente");
  } else {
    const scrapedDate = new Date(trend.scraped_at);
    if (isNaN(scrapedDate.getTime())) {
      errors.push(`trend.scraped_at no parseable: '${trend.scraped_at}'`);
    } else {
      const hoursDiff = (Date.now() - scrapedDate.getTime()) / 3600 / 1000;
      if (hoursDiff > 24) {
        errors.push(
          `trend.scraped_at >24h vieja (${hoursDiff.toFixed(1)}h) · cron Apify debe correr antes de producir stories`,
        );
      }
    }
  }

  // 6. Verificar que apify_scrape_id existe en daily_trends (real check)
  if (verifyApifyExists && supabaseClient && trend.apify_scrape_id && errors.length === 0) {
    const { data, error } = await supabaseClient
      .from("daily_trends")
      .select("id, scraped_at, hashtag")
      .eq("id", trend.apify_scrape_id)
      .single();

    if (error || !data) {
      errors.push(
        `trend.apify_scrape_id='${trend.apify_scrape_id}' NO existe en daily_trends (Apify scrape inválido)`,
      );
    } else {
      // Verificación cruzada: hashtag declarado debe coincidir
      if (data.hashtag !== trend.hashtag_origin) {
        errors.push(
          `trend.hashtag_origin='${trend.hashtag_origin}' no coincide con daily_trends row hashtag='${data.hashtag}'`,
        );
      }
    }
  }

  return { ok: errors.length === 0, errors };
}

/**
 * Throw-style helpers para usarse directamente en cualquier productor:
 *   await assertNoticiaBrief(brief, { pilar: 1 });
 *   await assertTrendStory(story, { supabaseClient });
 *
 * Si validación falla, throw Error con detalles agregados.
 * Mejor saltar slot que publicar sin research.
 */
export async function assertNoticiaBrief(brief, options = {}) {
  const { ok, errors } = await validateNoticiaBrief(brief, options);
  if (!ok) {
    throw new Error(
      `Brief tier=noticia rechazado por research-gate · ${errors.length} errores:\n  - ${errors.join("\n  - ")}\n\nRegla: feedback_research_first_escalado_por_tier.md · NO se produce contenido sin source_url verificable + cita verbatim + verificación cruzada.`,
    );
  }
}

export async function assertTrendStory(story, options = {}) {
  const { ok, errors } = await validateTrendStory(story, options);
  if (!ok) {
    throw new Error(
      `Story tier=trend rechazado por research-gate · ${errors.length} errores:\n  - ${errors.join("\n  - ")}\n\nRegla: feedback_research_first_escalado_por_tier.md · NO se publica story sin Apify scrape ID válido + tendencia <24h + verificación cruzada.`,
    );
  }
}
