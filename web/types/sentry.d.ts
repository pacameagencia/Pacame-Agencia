// Ambient types minimos para @sentry/nextjs hasta que se instale el paquete.
// Cubre solo la superficie de API que usamos en el proyecto.
// Cuando se ejecute `npm install @sentry/nextjs` estos tipos quedan shadow-eados
// por los reales del paquete (skipLibCheck+bundler => no conflicto).

declare module "@sentry/nextjs" {
  export type SeverityLevel =
    | "fatal"
    | "error"
    | "warning"
    | "log"
    | "info"
    | "debug";

  export interface Scope {
    setTag(key: string, value: string | number | boolean): void;
    setExtra(key: string, value: unknown): void;
    setUser(user: { id?: string; email?: string } | null): void;
    setContext(name: string, ctx: Record<string, unknown> | null): void;
  }

  export interface NodeClientOptions {
    dsn?: string;
    environment?: string;
    tracesSampleRate?: number;
    profilesSampleRate?: number;
    integrations?: unknown[];
    beforeSend?: (event: unknown, hint: unknown) => unknown;
    debug?: boolean;
  }

  export function init(options: NodeClientOptions): void;
  export function captureException(err: unknown, context?: unknown): string;
  export function captureMessage(msg: string, level?: SeverityLevel): string;
  export function captureRequestError(
    err: unknown,
    request: unknown,
    context: unknown,
  ): void;
  export function setUser(user: { id?: string; email?: string } | null): void;
  export function withScope(cb: (scope: Scope) => void): void;
  export function flush(timeout?: number): Promise<boolean>;
  export function close(timeout?: number): Promise<boolean>;
  export function httpIntegration(options?: Record<string, unknown>): unknown;
  export function nativeNodeFetchIntegration(
    options?: Record<string, unknown>,
  ): unknown;

  export interface SentryBuildOptions {
    silent?: boolean;
    org?: string;
    project?: string;
    widenClientFileUpload?: boolean;
    tunnelRoute?: string;
    disableLogger?: boolean;
    authToken?: string;
  }

  // Acepta cualquier config de Next (NextConfig) y devuelve NextConfig.
  export function withSentryConfig<T>(config: T, options: SentryBuildOptions): T;
}
