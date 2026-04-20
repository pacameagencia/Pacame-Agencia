// Ambient types minimos para pino / pino-pretty hasta que esten instalados.
// Los tipos reales del paquete (cuando se instale) tendran prioridad gracias
// a node_modules + skipLibCheck.

declare module "pino" {
  export interface LoggerOptions {
    level?: string;
    redact?: { paths: string[]; censor?: string };
    base?: Record<string, unknown> | null;
    timestamp?: boolean | (() => string);
    formatters?: {
      level?: (label: string, number: number) => Record<string, unknown>;
      bindings?: (bindings: Record<string, unknown>) => Record<string, unknown>;
      log?: (obj: Record<string, unknown>) => Record<string, unknown>;
    };
    transport?: unknown;
    messageKey?: string;
    errorKey?: string;
  }

  export interface Logger {
    level: string;
    debug(obj: unknown, msg?: string, ...args: unknown[]): void;
    info(obj: unknown, msg?: string, ...args: unknown[]): void;
    warn(obj: unknown, msg?: string, ...args: unknown[]): void;
    error(obj: unknown, msg?: string, ...args: unknown[]): void;
    fatal(obj: unknown, msg?: string, ...args: unknown[]): void;
    trace(obj: unknown, msg?: string, ...args: unknown[]): void;
    child(bindings: Record<string, unknown>): Logger;
  }

  interface PinoFactory {
    (options?: LoggerOptions): Logger;
    stdTimeFunctions: { isoTime: () => string };
  }

  const pino: PinoFactory;
  export default pino;
}

declare module "pino-pretty";
