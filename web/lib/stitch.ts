/**
 * Google Stitch SDK integration — AI-powered UI design generation.
 *
 * Generates high-fidelity UI screens from text prompts using Gemini models.
 * Returns screenshots (PNG) and HTML of generated designs.
 *
 * Requires: STITCH_API_KEY (get from stitch.withgoogle.com → Settings → API key)
 * Optional: STITCH_PROJECT_ID (reuse a project, otherwise creates one per generation)
 */

import { stitch } from "@google/stitch-sdk";
import { getLogger } from "@/lib/observability/logger";

const STITCH_API_KEY = process.env.STITCH_API_KEY?.trim();
const STITCH_PROJECT_ID = process.env.STITCH_PROJECT_ID?.trim();

export function isStitchConfigured(): boolean {
  return !!STITCH_API_KEY;
}

type DeviceType = "MOBILE" | "DESKTOP" | "TABLET" | "AGNOSTIC";

interface StitchResult {
  success: boolean;
  imageUrl?: string;
  htmlUrl?: string;
  screenId?: string;
  projectId?: string;
  error?: string;
}

/**
 * Generate a UI design screen from a text prompt.
 * Returns a screenshot URL and optional HTML download URL.
 */
export async function generateDesign(
  prompt: string,
  options: {
    deviceType?: DeviceType;
    projectId?: string;
  } = {}
): Promise<StitchResult> {
  if (!STITCH_API_KEY) {
    return { success: false, error: "STITCH_API_KEY no configurada. Ve a stitch.withgoogle.com → Settings → API key." };
  }

  try {
    const projectId = options.projectId || STITCH_PROJECT_ID;
    let project;

    if (projectId) {
      project = stitch.project(projectId);
    } else {
      // List projects and use the first one, or handle if none exist
      const projects = await stitch.projects();
      if (projects && projects.length > 0) {
        project = stitch.project(projects[0].id);
      } else {
        return { success: false, error: "No hay proyectos en Stitch. Crea uno en stitch.withgoogle.com" };
      }
    }

    // Generate screen from prompt
    const deviceType = options.deviceType || "MOBILE";
    const screen = await project.generate(prompt, deviceType);

    // Get screenshot image
    const imageUrl = await screen.getImage();
    const htmlUrl = await screen.getHtml();

    return {
      success: true,
      imageUrl: imageUrl || undefined,
      htmlUrl: htmlUrl || undefined,
      screenId: screen.id,
      projectId: project.id,
    };
  } catch (err) {
    getLogger().error({ err }, "[Stitch] Error generating design");
    return {
      success: false,
      error: err instanceof Error ? err.message : "Error desconocido de Stitch",
    };
  }
}

/**
 * Edit an existing screen with a text instruction.
 */
export async function editDesign(
  projectId: string,
  screenId: string,
  editPrompt: string
): Promise<StitchResult> {
  if (!STITCH_API_KEY) {
    return { success: false, error: "STITCH_API_KEY no configurada." };
  }

  try {
    const project = stitch.project(projectId);
    const screen = await project.getScreen(screenId);
    const edited = await screen.edit(editPrompt);

    const imageUrl = await edited.getImage();
    const htmlUrl = await edited.getHtml();

    return {
      success: true,
      imageUrl: imageUrl || undefined,
      htmlUrl: htmlUrl || undefined,
      screenId: edited.id,
      projectId,
    };
  } catch (err) {
    getLogger().error({ err }, "[Stitch] Error editing design");
    return {
      success: false,
      error: err instanceof Error ? err.message : "Error desconocido",
    };
  }
}

/**
 * Generate design variants from an existing screen.
 */
export async function generateVariants(
  projectId: string,
  screenId: string,
  prompt: string,
  options: {
    variantCount?: number;
    creativeRange?: "REFINE" | "EXPLORE" | "REIMAGINE";
  } = {}
): Promise<{ success: boolean; variants?: StitchResult[]; error?: string }> {
  if (!STITCH_API_KEY) {
    return { success: false, error: "STITCH_API_KEY no configurada." };
  }

  try {
    const project = stitch.project(projectId);
    const screen = await project.getScreen(screenId);
    const variants = await screen.variants(prompt, {
      variantCount: options.variantCount || 3,
      creativeRange: options.creativeRange || "EXPLORE",
    });

    const results: StitchResult[] = [];
    for (const variant of variants) {
      const imageUrl = await variant.getImage();
      results.push({
        success: true,
        imageUrl: imageUrl || undefined,
        screenId: variant.id,
        projectId,
      });
    }

    return { success: true, variants: results };
  } catch (err) {
    getLogger().error({ err }, "[Stitch] Error generating variants");
    return {
      success: false,
      error: err instanceof Error ? err.message : "Error desconocido",
    };
  }
}
