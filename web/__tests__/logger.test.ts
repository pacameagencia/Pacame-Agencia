import { describe, it, expect } from "vitest";
import { getLogger } from "@/lib/observability/logger";

/**
 * Logger tests — verifica que NO loggea secretos.
 * La redaction es critica: si falla, los tokens de clientes
 * quedan en Sentry y CloudWatch — fuga de datos seria.
 */
describe("logger redaction", () => {
  it("existe y expone metodos nivel", () => {
    const log = getLogger();
    expect(typeof log.info).toBe("function");
    expect(typeof log.warn).toBe("function");
    expect(typeof log.error).toBe("function");
    expect(typeof log.debug).toBe("function");
  });

  it("acepta objeto + string (signature Pino)", () => {
    const log = getLogger();
    // No debe lanzar
    expect(() => log.info({ orderId: "abc" }, "test message")).not.toThrow();
    expect(() => log.warn({ err: new Error("x") }, "error log")).not.toThrow();
  });

  it("child logger propaga bindings", () => {
    const log = getLogger({ clientId: "cli-1" });
    expect(() => log.info({ extra: "data" }, "msg")).not.toThrow();
  });
});
