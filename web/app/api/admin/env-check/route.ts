import { NextRequest, NextResponse } from "next/server";
import { verifyInternalAuth } from "@/lib/api-auth";
import {
  envRegistry,
  type EnvVarKey,
  type EnvVarMeta,
} from "@/lib/env/registry";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * GET /api/admin/env-check
 *
 * Reporta el estado de cada env var del registry. Nunca devuelve el VALOR
 * (solo si esta set y su longitud aproximada para validar que no esta vacio).
 *
 * Auth: internal HMAC cookie o CRON_SECRET bearer.
 */

interface EnvStatus {
  name: string;
  isSet: boolean;
  length: number;            // ~caracteres del valor (para validar no-vacio)
  valuePreview?: string;     // solo primeros 4 chars + "..." si es NEXT_PUBLIC_
  category: EnvVarMeta["category"];
  description: string;
  provider: string;
  generate_url?: string;
  required_in_prod: boolean;
  required_in_dev: boolean;
  public: boolean;
  status: "ok" | "missing-required" | "missing-optional";
}

export async function GET(request: NextRequest) {
  const authError = verifyInternalAuth(request);
  if (authError) return authError;

  const currentEnv = (process.env.VERCEL_ENV ||
    process.env.NODE_ENV ||
    "development") as "production" | "preview" | "development";

  const entries: EnvStatus[] = (
    Object.entries(envRegistry) as [EnvVarKey, EnvVarMeta][]
  ).map(([name, meta]) => {
    const value = process.env[name];
    const isSet = !!(value && value.trim().length > 0);
    const length = isSet ? (value as string).length : 0;
    const preview =
      isSet && meta.public
        ? `${(value as string).slice(0, 30)}${length > 30 ? "…" : ""}`
        : undefined;

    const required_in_prod = meta.required_in.includes("production");
    const required_in_dev = meta.required_in.includes("development");

    const requiredHere = meta.required_in.includes(currentEnv);

    let status: EnvStatus["status"];
    if (isSet) status = "ok";
    else if (requiredHere) status = "missing-required";
    else status = "missing-optional";

    return {
      name,
      isSet,
      length,
      valuePreview: preview,
      category: meta.category,
      description: meta.description,
      provider: meta.provider,
      generate_url: meta.generate_url,
      required_in_prod,
      required_in_dev,
      public: !!meta.public,
      status,
    };
  });

  const totals = {
    total: entries.length,
    set: entries.filter((e) => e.isSet).length,
    missing_required: entries.filter((e) => e.status === "missing-required").length,
    missing_optional: entries.filter((e) => e.status === "missing-optional").length,
    by_category: {} as Record<string, { total: number; set: number; missing: number }>,
  };

  for (const e of entries) {
    const cat = e.category;
    if (!totals.by_category[cat]) {
      totals.by_category[cat] = { total: 0, set: 0, missing: 0 };
    }
    totals.by_category[cat].total += 1;
    if (e.isSet) totals.by_category[cat].set += 1;
    else totals.by_category[cat].missing += 1;
  }

  return NextResponse.json({
    ok: true,
    current_env: currentEnv,
    checked_at: new Date().toISOString(),
    totals,
    vars: entries,
  });
}
