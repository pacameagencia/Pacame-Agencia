/**
 * Client-side helper for dashboard Supabase writes.
 * All mutations (insert/update/delete/upsert) flow through
 * /api/dashboard/db so the HMAC-signed cookie is verified and
 * service-role access is used server-side.
 */

export type DbOp = "insert" | "update" | "delete" | "upsert";

export interface DbCallParams {
  table: string;
  op: DbOp;
  data?: unknown;
  filter?: { column: string; value: string | number | boolean | null };
  filterIn?: { column: string; values: (string | number)[] };
  select?: string;
  single?: boolean;
  onConflict?: string;
}

export interface DbCallResult<T = unknown> {
  ok: boolean;
  data: T | null;
  error?: string;
}

export async function dbCall<T = unknown>(params: DbCallParams): Promise<DbCallResult<T>> {
  try {
    const res = await fetch("/api/dashboard/db", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(params),
    });

    const json = (await res.json().catch(() => ({ error: "Respuesta no valida" }))) as {
      ok?: boolean;
      data?: T;
      error?: string;
    };

    if (!res.ok) {
      return { ok: false, data: null, error: json.error || `HTTP ${res.status}` };
    }

    return { ok: true, data: (json.data ?? null) as T | null };
  } catch (err) {
    return {
      ok: false,
      data: null,
      error: err instanceof Error ? err.message : "Network error",
    };
  }
}
