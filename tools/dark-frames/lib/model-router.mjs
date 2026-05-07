/**
 * Model Router · DARK_FRAMES
 *
 * Decide qué modelo Higgsfield usar según el tier declarado en el concept JSON
 * y el tipo de generación (video / image). Aplica las reglas de memoria:
 *
 *   - feedback_calidad_top_aprovecha_unlimited.md: tier=top usa SOTA, tier=standard
 *     usa unlimited del plan Plus, tier=cheap usa fast/free.
 *   - feedback_doble_aprobacion_videos.md: modelos premium requieren cost-guard token.
 *   - feedback_no_video_auto.md (revisada): generación autorizada solo si concept_id
 *     existe (no prompts ad-hoc).
 *
 * Catálogo basado en .claude/skills/higgsfield-generate/references/model-catalog.md
 */

/**
 * Mapping tier → modelos por categoría.
 *
 * `top`      = SOTA absoluta · cuesta créditos · requiere doble aprobación si premium.
 * `standard` = unlimited del plan Plus · cero coste extra · default para piezas con ambición media.
 * `cheap`    = más barato/rápido · para batch/funcional/relleno.
 */
export const TIER_MODELS = {
  video: {
    top: {
      primary: "cinema_studio_video_3_0",
      fallback: "seedance_2_0",
      cli_id_primary: "higgsfield/cinema-studio-video-3.0/text-to-video",
      cli_id_fallback: "bytedance/seedance-2.0/text-to-video",
      requires_cost_guard: true,
      requires_pablo_approval: true,
      use_for: "DARK_FRAMES, hero pieces, viral cinematic content",
    },
    standard: {
      primary: "kling_v3_pro",
      fallback: "kling_v3",
      cli_id_primary: "kwaivgi/kling-v3.0-pro/text-to-video",
      cli_id_fallback: "kwaivgi/kling-v3.0/text-to-video",
      requires_cost_guard: false,
      requires_pablo_approval: false,
      use_for: "carousel auto, story cuidada, post informativo bueno (UNLIMITED en plan Plus)",
    },
    cheap: {
      primary: "minimax_hailuo",
      fallback: "wan_2_6",
      cli_id_primary: "minimax/hailuo/text-to-video",
      cli_id_fallback: "wan/wan-2.6/text-to-video",
      requires_cost_guard: false,
      requires_pablo_approval: false,
      use_for: "noticia rápida, story relleno, batch funcional",
    },
  },
  image: {
    top: {
      primary: "soul_cinema",
      fallback: "cinema_studio_image_2_5",
      cli_id_primary: "higgsfield/soul-cinema/text-to-image",
      cli_id_fallback: "higgsfield/cinema-studio-image-2.5/text-to-image",
      requires_cost_guard: false,
      requires_pablo_approval: false,
      use_for: "anchors hero DARK_FRAMES, cinematic stills",
    },
    standard: {
      primary: "gpt_image_2",
      fallback: "soul_v2",
      cli_id_primary: "openai/gpt-image-2/text-to-image",
      cli_id_fallback: "higgsfield/soul-2.0/text-to-image",
      requires_cost_guard: false,
      requires_pablo_approval: false,
      use_for: "carruseles, posts informativos (UNLIMITED en plan Plus)",
    },
    cheap: {
      primary: "z_image",
      fallback: "nano_banana_2",
      cli_id_primary: "tongyi-mai/z-image/text-to-image",
      cli_id_fallback: "google/nano-banana-2/text-to-image",
      requires_cost_guard: false,
      requires_pablo_approval: false,
      use_for: "drafts, iteración rápida, LoRA work, story relleno",
    },
  },
};

/**
 * Resolver el modelo correcto para un shot/imagen concreto.
 *
 * @param {Object} params
 * @param {'video'|'image'} params.kind - tipo de generación
 * @param {'top'|'standard'|'cheap'} params.tier - tier declarado en concept
 * @param {string} [params.override] - modelo específico forzado (escape hatch)
 * @returns {{ model: string, cli_id: string, requires_cost_guard: boolean, requires_pablo_approval: boolean, use_for: string }}
 */
export function resolveModel({ kind, tier, override }) {
  if (!["video", "image"].includes(kind)) {
    throw new Error(`kind inválido: '${kind}' (esperado 'video'|'image')`);
  }
  if (!["top", "standard", "cheap"].includes(tier)) {
    throw new Error(`tier inválido: '${tier}' (esperado 'top'|'standard'|'cheap')`);
  }

  const config = TIER_MODELS[kind][tier];

  if (override) {
    // El usuario forzó un modelo específico — devolvemos override pero mantenemos
    // las flags de cost-guard según si el override es premium.
    const isPremium = ["cinema_studio_video_3_0", "seedance_2_0", "veo_3_1", "soul_cinema_studio_3_0"].includes(override);
    return {
      model: override,
      cli_id: null, // resolver con `higgsfield model list --json` en runtime
      requires_cost_guard: isPremium,
      requires_pablo_approval: isPremium,
      use_for: `override manual: ${override}`,
    };
  }

  return {
    model: config.primary,
    cli_id: config.cli_id_primary,
    requires_cost_guard: config.requires_cost_guard,
    requires_pablo_approval: config.requires_pablo_approval,
    use_for: config.use_for,
  };
}

/**
 * Validar antes de render que cada shot tiene cost-guard token + aprobación
 * Pablo si su tier resuelve a modelo premium.
 *
 * @param {Object} concept - JSON del concept con array shots[]
 * @param {{ approvedByPablo: boolean, costGuardToken: string|null }} flags
 * @returns {{ ok: boolean, errors: string[] }}
 */
export function validateConceptForRender(concept, flags) {
  const errors = [];
  const tier = concept.tier || "top"; // default top para DARK_FRAMES

  for (const shot of concept.shots || []) {
    const kind = shot.kind || "video";
    const shotTier = shot.tier || tier;
    const override = shot.model_override || null;

    const resolved = resolveModel({ kind, tier: shotTier, override });

    if (resolved.requires_pablo_approval && !flags.approvedByPablo) {
      errors.push(
        `shot ${shot.shot} (tier=${shotTier} kind=${kind}) usa modelo premium '${resolved.model}' — requiere --approved-by-pablo`,
      );
    }
    if (resolved.requires_cost_guard) {
      if (!flags.costGuardToken || flags.costGuardToken.length < 16) {
        errors.push(
          `shot ${shot.shot} (tier=${shotTier} kind=${kind}) usa modelo premium '${resolved.model}' — requiere --cost-guard-token (≥16 chars)`,
        );
      }
    }
  }

  return { ok: errors.length === 0, errors };
}

/**
 * Pretty-print del plan de modelos para un concept (usado en --dry-run).
 */
export function explainConcept(concept) {
  const lines = [];
  const tier = concept.tier || "top";
  lines.push(`Concept tier: ${tier}`);
  lines.push("");

  for (const shot of concept.shots || []) {
    const kind = shot.kind || "video";
    const shotTier = shot.tier || tier;
    const override = shot.model_override || null;
    const resolved = resolveModel({ kind, tier: shotTier, override });
    lines.push(
      `  shot ${shot.shot}: ${kind}/${shotTier} → ${resolved.model}${
        resolved.requires_cost_guard ? " [PREMIUM · requiere cost-guard]" : ""
      }`,
    );
  }
  return lines.join("\n");
}
