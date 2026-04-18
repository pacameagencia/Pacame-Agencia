/**
 * withRateLimit — middleware helper que aplica un limiter a un handler.
 *
 * keyFn recibe el request (+ cualquier arg extra como params) y devuelve la
 * clave por la que rate-limitar. Ejemplo:
 *   withRateLimit(authLimiter, (req) => getClientIp(req))
 */

import { NextRequest, NextResponse } from "next/server";
import type { Limiter } from "../security/rate-limit";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyHandler = (request: NextRequest, ...rest: any[]) => Promise<NextResponse> | NextResponse;

export function withRateLimit(
  limiter: Limiter,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  keyFn: (request: NextRequest, ...rest: any[]) => string | Promise<string>,
  opts?: { bypass?: (request: NextRequest) => boolean | Promise<boolean> }
) {
  return (handler: AnyHandler): AnyHandler => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return async (request: NextRequest, ...rest: any[]) => {
      if (opts?.bypass) {
        const skip = await opts.bypass(request);
        if (skip) return handler(request, ...rest);
      }

      const key = await keyFn(request, ...rest);
      const res = await limiter.limit(key);
      if (!res.success) {
        const retrySec = Math.max(1, Math.ceil((res.reset - Date.now()) / 1000));
        return NextResponse.json(
          { error: "Too many requests", retry_after: retrySec },
          {
            status: 429,
            headers: {
              "Retry-After": String(retrySec),
              "X-RateLimit-Limit": String(res.limit),
              "X-RateLimit-Remaining": String(res.remaining),
              "X-RateLimit-Reset": String(Math.ceil(res.reset / 1000)),
            },
          }
        );
      }
      return handler(request, ...rest);
    };
  };
}
