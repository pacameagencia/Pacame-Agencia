/**
 * Tests del módulo embed-openai (Sprint v0.10.29).
 *
 * Estos tests NO llaman a OpenAI realmente — usan vi.stubGlobal para
 * mockear fetch. Verifican:
 *   - shape del request enviado a /v1/embeddings
 *   - dim validation (debe matchear EMBED_DIM_OPENAI o 768 default)
 *   - manejo de errores HTTP sin lanzar
 *   - batch nativo OpenAI con chunks de 100 inputs
 *   - toPgVector format
 *   - modelInfo() shape correcta
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Importar dinámicamente para que cada test pueda mockear OPENAI_API_KEY
async function loadModule() {
  vi.resetModules();
  return import("@/lib/embed-openai");
}

describe("embed-openai — embed() single", () => {
  beforeEach(() => {
    process.env.OPENAI_API_KEY = "sk-test-mock-key-1234567890abcdef";
    process.env.EMBED_DIM_OPENAI = "768";
    process.env.EMBED_MODEL_OPENAI = "text-embedding-3-large";
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("devuelve embedding 768-dim cuando OpenAI responde OK", async () => {
    const mockEmbedding = Array.from({ length: 768 }, () => Math.random());
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ data: [{ embedding: mockEmbedding }] }),
      }),
    );

    const { embed } = await loadModule();
    const result = await embed("hola mundo");

    expect(result).not.toBeNull();
    expect(result?.embedding).toHaveLength(768);
    expect(result?.dim).toBe(768);
    expect(result?.model).toBe("text-embedding-3-large");
  });

  it("envía request con model + input + dimensions correctos", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () =>
        Promise.resolve({
          data: [{ embedding: Array.from({ length: 768 }, () => 0.1) }],
        }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const { embed } = await loadModule();
    await embed("test prompt");

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, opts] = fetchMock.mock.calls[0];
    expect(url).toBe("https://api.openai.com/v1/embeddings");
    expect(opts.method).toBe("POST");
    expect(opts.headers.Authorization).toBe("Bearer sk-test-mock-key-1234567890abcdef");

    const body = JSON.parse(opts.body as string);
    expect(body.model).toBe("text-embedding-3-large");
    expect(body.input).toBe("test prompt");
    expect(body.dimensions).toBe(768);
  });

  it("trunca texto a 8000 chars antes de enviar", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () =>
        Promise.resolve({
          data: [{ embedding: Array.from({ length: 768 }, () => 0.1) }],
        }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const { embed } = await loadModule();
    await embed("x".repeat(10_000));

    const body = JSON.parse(fetchMock.mock.calls[0][1].body as string);
    expect(body.input).toHaveLength(8000);
  });

  it("devuelve null si texto vacío (sin llamar fetch)", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const { embed } = await loadModule();
    expect(await embed("")).toBeNull();
    expect(await embed("   ")).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("devuelve null si OPENAI_API_KEY no configurada (no lanza)", async () => {
    delete process.env.OPENAI_API_KEY;
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const { embed } = await loadModule();
    const result = await embed("hola");
    expect(result).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("devuelve null si OpenAI responde HTTP 500 (no lanza)", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        text: () => Promise.resolve("internal error"),
      }),
    );

    const { embed } = await loadModule();
    const result = await embed("hola");
    expect(result).toBeNull();
  });

  it("devuelve null si dim no matchea EMBED_DIM (mismatch)", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: () =>
          Promise.resolve({
            data: [{ embedding: Array.from({ length: 1024 }, () => 0.1) }], // 1024 ≠ 768
          }),
      }),
    );

    const { embed } = await loadModule();
    const result = await embed("hola");
    expect(result).toBeNull();
  });

  it("devuelve null si fetch lanza network error (no propaga)", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("ECONNREFUSED")));

    const { embed } = await loadModule();
    const result = await embed("hola");
    expect(result).toBeNull();
  });
});

describe("embed-openai — embedBatch()", () => {
  beforeEach(() => {
    process.env.OPENAI_API_KEY = "sk-test-mock-key-1234567890abcdef";
    process.env.EMBED_DIM_OPENAI = "768";
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("array vacío devuelve []", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const { embedBatch } = await loadModule();
    expect(await embedBatch([])).toEqual([]);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("3 inputs → 1 sola request HTTP (batch nativo)", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () =>
        Promise.resolve({
          data: [
            { embedding: Array.from({ length: 768 }, () => 0.1), index: 0 },
            { embedding: Array.from({ length: 768 }, () => 0.2), index: 1 },
            { embedding: Array.from({ length: 768 }, () => 0.3), index: 2 },
          ],
        }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const { embedBatch } = await loadModule();
    const result = await embedBatch(["a", "b", "c"]);

    expect(fetchMock).toHaveBeenCalledTimes(1); // batch nativo
    expect(result).toHaveLength(3);
    expect(result[0]).toHaveLength(768);
    expect(result[1]).toHaveLength(768);
    expect(result[2]).toHaveLength(768);
  });

  it("150 inputs → 2 requests (chunks de 100)", async () => {
    const fetchMock = vi.fn().mockImplementation(() => {
      const items = Array.from({ length: 100 }, (_, idx) => ({
        embedding: Array.from({ length: 768 }, () => idx * 0.001),
        index: idx,
      }));
      return Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ data: items.slice(0, 100) }),
      });
    });
    vi.stubGlobal("fetch", fetchMock);

    const { embedBatch } = await loadModule();
    const inputs = Array.from({ length: 150 }, (_, i) => `text-${i}`);
    const result = await embedBatch(inputs);

    expect(fetchMock).toHaveBeenCalledTimes(2); // 100 + 50
    expect(result).toHaveLength(150);
  });

  it("si HTTP 500 en un chunk, deja nulls en ese rango pero sigue", async () => {
    // Primer chunk falla, segundo ok
    let callCount = 0;
    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return Promise.resolve({
            ok: false,
            status: 500,
            text: () => Promise.resolve("oops"),
          });
        }
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () =>
            Promise.resolve({
              data: Array.from({ length: 50 }, (_, idx) => ({
                embedding: Array.from({ length: 768 }, () => 0.5),
                index: idx,
              })),
            }),
        });
      }),
    );

    const { embedBatch } = await loadModule();
    const inputs = Array.from({ length: 150 }, (_, i) => `t-${i}`);
    const result = await embedBatch(inputs);

    expect(result).toHaveLength(150);
    // Primeros 100 (chunk fallido) → null
    expect(result.slice(0, 100).every((r) => r === null)).toBe(true);
    // 50 siguientes (chunk OK) → embedding
    expect(result.slice(100).every((r) => Array.isArray(r) && r.length === 768)).toBe(true);
  });

  it("sin OPENAI_API_KEY devuelve todos null", async () => {
    delete process.env.OPENAI_API_KEY;
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const { embedBatch } = await loadModule();
    const result = await embedBatch(["a", "b", "c"]);

    expect(result).toEqual([null, null, null]);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe("embed-openai — toPgVector()", () => {
  it("convierte array a literal pgvector", async () => {
    const { toPgVector } = await loadModule();
    expect(toPgVector([1, 2, 3])).toBe("[1,2,3]");
    expect(toPgVector([0.1, 0.2])).toBe("[0.1,0.2]");
    expect(toPgVector([])).toBe("[]");
  });
});

describe("embed-openai — modelInfo()", () => {
  beforeEach(() => {
    process.env.EMBED_MODEL_OPENAI = "text-embedding-3-large";
    process.env.EMBED_DIM_OPENAI = "768";
  });

  it("devuelve metadata del modelo", async () => {
    const { modelInfo } = await loadModule();
    const info = modelInfo();
    expect(info).toEqual({
      provider: "openai",
      model: "text-embedding-3-large",
      dim: 768,
      pricing_per_1m_tokens: "$0.13",
    });
  });

  it("respeta override env de modelo y dim", async () => {
    process.env.EMBED_MODEL_OPENAI = "text-embedding-3-small";
    process.env.EMBED_DIM_OPENAI = "1536";
    const { modelInfo } = await loadModule();
    const info = modelInfo();
    expect(info.model).toBe("text-embedding-3-small");
    expect(info.dim).toBe(1536);
  });
});
