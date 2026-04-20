/**
 * GET /api/docs — sirve la spec OpenAPI 3.1 generada desde los schemas Zod.
 *
 * Cacheado 1h (la spec solo cambia con despliegues). Consumida por la UI
 * Swagger de /docs/api.
 */

import { NextResponse } from "next/server";
import { generateOpenApiDocument } from "@/lib/api/openapi-registry";
// Side-effect import: registra schemas y paths en el registry compartido.
import "@/lib/api/openapi-schemas";

export const revalidate = 3600;

export async function GET() {
  const doc = generateOpenApiDocument();
  return NextResponse.json(doc, {
    headers: {
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
