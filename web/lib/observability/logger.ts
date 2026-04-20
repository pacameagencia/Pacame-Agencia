// Logger estructurado central.
// Reglas de diseno:
//  - En Node runtime: pino con redaction + (opcional) pino-pretty en dev.
//  - En Edge runtime: Pino v9 no tiene adaptador fiable en todos los workers.
//    Usamos un shim que escribe JSON por console.log con el mismo shape
//    (level, time, msg, service, env, requestId, ...bindings). Respetamos
//    redaction via una mascara manual antes de serializar.
//  - En error/fatal: capturamos en Sentry (fire-and-forget) anadiendo
//    el contexto logico que el caller haya pasado.

import { captureException, captureMessage } from "./sentry";

// ─── Keys que hay que redactar ───────────────────────────────────────────
const REDACT_PATHS: string[] = [
  "password",
  "password_hash",
  "authorization",
  "cookie",
  "stripe-signature",
  "x-webhook-signature",
  "auth_token",
  "secrets",
  "secrets.*",
  "*.token",
  "*.api_key",
  "*.password",
  "*.private_key",
];

// Version simple de los paths para el shim edge (sin glob completo).
// Matchea por sufijo/prefijo ("*.token" => cualquier key === "token").
const REDACT_SET = new Set<string>([
  "password",
  "password_hash",
  "authorization",
  "cookie",
  "stripe-signature",
  "x-webhook-signature",
  "auth_token",
  "secrets",
  "token",
  "api_key",
  "private_key",
]);

const REDACTED = "***REDACTED***";

// ─── Campos base ─────────────────────────────────────────────────────────
interface BaseContext {
  service: string;
  env: string;
  requestId?: string;
  clientId?: string;
  orderId?: string;
  userId?: string;
}

function baseContext(): BaseContext {
  return {
    service: "pacame-web",
    env: process.env.VERCEL_ENV || process.env.NODE_ENV || "dev",
  };
}

// ─── Interfaz comun ──────────────────────────────────────────────────────
export type LogLevel = "debug" | "info" | "warn" | "error" | "fatal";

export interface Logger {
  level: string;
  debug(obj: unknown, msg?: string): void;
  info(obj: unknown, msg?: string): void;
  warn(obj: unknown, msg?: string): void;
  error(obj: unknown, msg?: string): void;
  fatal(obj: unknown, msg?: string): void;
  child(bindings: Record<string, unknown>): Logger;
}

// ─── Detectar runtime ────────────────────────────────────────────────────
function isEdgeRuntime(): boolean {
  // NEXT_RUNTIME esta seteado por Next en server bundles.
  // En edge => "edge". En node => "nodejs". En ausencia, asumimos node.
  return process.env.NEXT_RUNTIME === "edge";
}

function isDev(): boolean {
  return (process.env.NODE_ENV || "development") !== "production";
}

function defaultLevel(): LogLevel {
  if (process.env.LOG_LEVEL) {
    return process.env.LOG_LEVEL as LogLevel;
  }
  return isDev() ? "debug" : "info";
}

// ─── Shim edge: JSON a console con mascara manual ────────────────────────
const LEVEL_ORDER: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
  fatal: 50,
};

function maskObject(input: unknown, depth = 0): unknown {
  if (depth > 6) return input;
  if (input == null || typeof input !== "object") return input;

  if (Array.isArray(input)) {
    return input.map((v) => maskObject(v, depth + 1));
  }

  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(input as Record<string, unknown>)) {
    if (REDACT_SET.has(key.toLowerCase())) {
      out[key] = REDACTED;
    } else if (value && typeof value === "object") {
      out[key] = maskObject(value, depth + 1);
    } else {
      out[key] = value;
    }
  }
  return out;
}

function makeEdgeLogger(bindings: Record<string, unknown>, level: LogLevel): Logger {
  const activeLevel = LEVEL_ORDER[level];

  function emit(lvl: LogLevel, obj: unknown, msg?: string) {
    if (LEVEL_ORDER[lvl] < activeLevel) return;

    let extra: Record<string, unknown> = {};
    let message: string | undefined = msg;

    if (typeof obj === "string" && msg === undefined) {
      message = obj;
    } else if (obj && typeof obj === "object") {
      extra = maskObject(obj) as Record<string, unknown>;
    }

    const payload = {
      level: lvl,
      time: new Date().toISOString(),
      ...bindings,
      ...extra,
      msg: message,
    };

    // En edge solo tenemos console.*.
    // eslint-disable-next-line no-console
    const fn = (lvl === "error" || lvl === "fatal")
      // eslint-disable-next-line no-console
      ? console.error
      // eslint-disable-next-line no-console
      : (lvl === "warn" ? console.warn : console.log);
    fn(JSON.stringify(payload));
  }

  const logger: Logger = {
    level,
    debug: (o, m) => emit("debug", o, m),
    info: (o, m) => emit("info", o, m),
    warn: (o, m) => emit("warn", o, m),
    error: (o, m) => {
      emit("error", o, m);
      // fire-and-forget hacia Sentry
      if (o instanceof Error) {
        void captureException(o, bindings);
      } else if (m) {
        void captureMessage(m, "error");
      }
    },
    fatal: (o, m) => {
      emit("fatal", o, m);
      if (o instanceof Error) {
        void captureException(o, bindings);
      } else if (m) {
        void captureMessage(m, "fatal");
      }
    },
    child: (b) => makeEdgeLogger({ ...bindings, ...b }, level),
  };

  return logger;
}

// ─── Factory pino (node) ─────────────────────────────────────────────────
type PinoLogger = {
  level: string;
  debug(obj: unknown, msg?: string): void;
  info(obj: unknown, msg?: string): void;
  warn(obj: unknown, msg?: string): void;
  error(obj: unknown, msg?: string): void;
  fatal(obj: unknown, msg?: string): void;
  child(bindings: Record<string, unknown>): PinoLogger;
};

let pinoRoot: PinoLogger | null = null;

function getPinoRoot(): PinoLogger | null {
  if (pinoRoot) return pinoRoot;

  try {
    // Import sincrono tolerante: si pino no esta disponible, fallback al shim.
    // Usamos require para no bloquear con await en la ruta caliente.
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const pinoMod = require("pino") as unknown;
    const pino =
      (pinoMod && typeof pinoMod === "object" && "default" in (pinoMod as Record<string, unknown>)
        ? (pinoMod as { default: unknown }).default
        : pinoMod) as (opts?: Record<string, unknown>) => PinoLogger;

    const options: Record<string, unknown> = {
      level: defaultLevel(),
      base: baseContext(),
      redact: {
        paths: REDACT_PATHS,
        censor: REDACTED,
      },
      messageKey: "msg",
      errorKey: "err",
    };

    if (isDev()) {
      options.transport = {
        target: "pino-pretty",
        options: { colorize: true, singleLine: false, translateTime: "HH:MM:ss.l" },
      };
    }

    pinoRoot = pino(options);
    return pinoRoot;
  } catch {
    // Sin pino disponible -> caller usara edge shim.
    return null;
  }
}

// Envuelve un logger pino (o shim) para captar errores a Sentry en error/fatal.
function wrapWithSentry(inner: Logger | PinoLogger, bindings: Record<string, unknown>): Logger {
  const wrapped: Logger = {
    level: inner.level,
    debug: (o, m) => inner.debug(o, m),
    info: (o, m) => inner.info(o, m),
    warn: (o, m) => inner.warn(o, m),
    error: (o, m) => {
      inner.error(o, m);
      if (o instanceof Error) {
        void captureException(o, bindings);
      } else if (typeof o === "object" && o !== null && (o as { err?: unknown }).err instanceof Error) {
        void captureException((o as { err: Error }).err, bindings);
      } else if (m) {
        void captureMessage(m, "error");
      }
    },
    fatal: (o, m) => {
      inner.fatal(o, m);
      if (o instanceof Error) {
        void captureException(o, bindings);
      } else if (typeof o === "object" && o !== null && (o as { err?: unknown }).err instanceof Error) {
        void captureException((o as { err: Error }).err, bindings);
      } else if (m) {
        void captureMessage(m, "fatal");
      }
    },
    child: (b) => wrapWithSentry(inner.child({ ...bindings, ...b }) as PinoLogger, { ...bindings, ...b }),
  };
  return wrapped;
}

// ─── API publica ─────────────────────────────────────────────────────────
let rootLogger: Logger | null = null;

function initRoot(): Logger {
  if (rootLogger) return rootLogger;

  if (isEdgeRuntime()) {
    rootLogger = makeEdgeLogger(baseContext() as unknown as Record<string, unknown>, defaultLevel());
  } else {
    const pino = getPinoRoot();
    if (pino) {
      rootLogger = wrapWithSentry(pino, baseContext() as unknown as Record<string, unknown>);
    } else {
      // Fallback final: shim tambien en node si pino falta.
      rootLogger = makeEdgeLogger(baseContext() as unknown as Record<string, unknown>, defaultLevel());
    }
  }

  return rootLogger;
}

/** Logger root compartido — evita re-init por request. */
export const logger: Logger = initRoot();

/**
 * Devuelve un child logger con contexto adicional mergeado.
 * Equivalente a `logger.child(context)` pero tolerante a undefined.
 */
export function getLogger(context?: Record<string, unknown>): Logger {
  const root = initRoot();
  if (!context || Object.keys(context).length === 0) {
    return root;
  }
  return root.child(context);
}

export default logger;
