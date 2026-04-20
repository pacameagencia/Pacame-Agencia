import { NextRequest, NextResponse } from "next/server";
import { z } from "zod/v4";
import { createServerSupabase } from "@/lib/supabase/server";
import { verifyInternalAuth } from "@/lib/api-auth";

/**
 * POST /api/dashboard/db
 *
 * Auth-gated proxy for dashboard Supabase writes. Replaces direct
 * browser-side calls with anon key (which bypass middleware and rely
 * only on RLS — currently permissive). All writes from the dashboard
 * UI must flow through here so the HMAC cookie check + service-role
 * client can enforce access.
 */

const ALLOWED_TABLES = new Set([
  "clients",
  "leads",
  "conversations",
  "notifications",
  "config",
  "finances",
  "onboarding_checklist",
  "ad_campaigns",
  "content",
  "agent_activities",
  "proposals",
]);

const ALLOWED_OPS = ["insert", "update", "delete", "upsert"] as const;

const bodySchema = z.object({
  table: z.string().min(1).max(64),
  op: z.enum(ALLOWED_OPS),
  data: z.unknown().optional(),
  filter: z
    .object({
      column: z.string().min(1).max(64),
      value: z.union([z.string(), z.number(), z.boolean(), z.null()]),
    })
    .optional(),
  filterIn: z
    .object({
      column: z.string().min(1).max(64),
      values: z.array(z.union([z.string(), z.number()])).max(1000),
    })
    .optional(),
  select: z.string().max(500).optional(),
  single: z.boolean().optional(),
  onConflict: z.string().max(64).optional(),
});

export async function POST(request: NextRequest) {
  const authError = verifyInternalAuth(request);
  if (authError) return authError;

  const raw = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(raw);
  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message || "Body invalido";
    return NextResponse.json({ error: firstError }, { status: 400 });
  }

  const { table, op, data, filter, filterIn, select, single, onConflict } = parsed.data;

  if (!ALLOWED_TABLES.has(table)) {
    return NextResponse.json(
      { error: `Tabla no permitida: ${table}` },
      { status: 403 }
    );
  }

  // Safety: mutating ops without any filter are dangerous. For delete/update
  // we require a filter to avoid wiping tables.
  if ((op === "delete" || op === "update") && !filter && !filterIn) {
    return NextResponse.json(
      { error: `op '${op}' requiere filter o filterIn para evitar wipes` },
      { status: 400 }
    );
  }

  const supabase = createServerSupabase();
  // Supabase returns different builder shapes per op. We intentionally use
  // `any` here to thread a single chain through filter/select/single without
  // juggling union types across 4 paths.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query: any = supabase.from(table);

  switch (op) {
    case "insert": {
      if (data === undefined) {
        return NextResponse.json({ error: "data requerido para insert" }, { status: 400 });
      }
      query = query.insert(data);
      break;
    }
    case "update": {
      if (data === undefined) {
        return NextResponse.json({ error: "data requerido para update" }, { status: 400 });
      }
      query = query.update(data);
      break;
    }
    case "delete": {
      query = query.delete();
      break;
    }
    case "upsert": {
      if (data === undefined) {
        return NextResponse.json({ error: "data requerido para upsert" }, { status: 400 });
      }
      query = onConflict ? query.upsert(data, { onConflict }) : query.upsert(data);
      break;
    }
  }

  if (filter) query = query.eq(filter.column, filter.value);
  if (filterIn) query = query.in(filterIn.column, filterIn.values);
  if (select) query = query.select(select);
  if (single) query = query.single();

  const { data: result, error } = await query;

  if (error) {
    return NextResponse.json(
      { error: error.message, code: error.code, details: error.details },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true, data: result });
}
