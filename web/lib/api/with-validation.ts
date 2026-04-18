/**
 * withValidation — middleware helper para parsear y validar body/query con Zod.
 *
 * Devuelve 400 con issues si falla la validacion. En caso de exito inyecta
 * body + query tipados en el context.
 */

import { NextRequest, NextResponse } from "next/server";
// Tipo minimo que cubre zod v3 y v4 — evitamos depender de exports especificos.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyZodSchema = { safeParse: (input: unknown) => { success: true; data: any } | { success: false; error: { issues: unknown[] } } };

export interface Validated<TBody = unknown, TQuery = unknown> {
  body: TBody;
  query: TQuery;
  request: NextRequest;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyHandler = (...args: any[]) => Promise<NextResponse> | NextResponse;

export function withValidation<TBody = unknown, TQuery = unknown>(
  opts: { body?: AnyZodSchema; query?: AnyZodSchema },
  handler: (
    ctx: Validated<TBody, TQuery>,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ...rest: any[]
  ) => Promise<NextResponse> | NextResponse
): AnyHandler {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return async (request: NextRequest, ...rest: any[]) => {
    let body: unknown = undefined;
    if (opts.body) {
      try {
        const method = request.method.toUpperCase();
        const json =
          method === "GET" || method === "HEAD" || method === "DELETE"
            ? {}
            : await request.json();
        const parsed = opts.body.safeParse(json);
        if (!parsed.success) {
          return NextResponse.json(
            { error: "Validation failed", issues: parsed.error.issues },
            { status: 400 }
          );
        }
        body = parsed.data;
      } catch {
        return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
      }
    }

    let query: unknown = undefined;
    if (opts.query) {
      const entries = Object.fromEntries(request.nextUrl.searchParams.entries());
      const parsed = opts.query.safeParse(entries);
      if (!parsed.success) {
        return NextResponse.json(
          { error: "Validation failed", issues: parsed.error.issues },
          { status: 400 }
        );
      }
      query = parsed.data;
    }

    return handler(
      {
        body: body as TBody,
        query: query as TQuery,
        request,
      },
      ...rest
    );
  };
}
