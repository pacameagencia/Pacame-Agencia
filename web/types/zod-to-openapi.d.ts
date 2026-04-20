/**
 * Ambient declaration minima para @asteasolutions/zod-to-openapi.
 * El paquete esta declarado en package.json pero puede no estar instalado
 * en tiempo de build local; tipamos lo que consumimos en lib/api/*.
 *
 * Cuando el paquete este instalado, los types reales del paquete toman
 * precedencia (tsc prefiere los @types vendorizados).
 */
declare module "@asteasolutions/zod-to-openapi" {
  // eslint-disable-next-line
  type AnyZod = any;

  export interface RouteConfig {
    method: "get" | "post" | "put" | "patch" | "delete" | "head" | "options";
    path: string;
    tags?: string[];
    summary?: string;
    description?: string;
    security?: Array<Record<string, string[]>>;
    request?: {
      params?: AnyZod;
      query?: AnyZod;
      headers?: AnyZod;
      body?: {
        description?: string;
        required?: boolean;
        content: Record<string, { schema: AnyZod }>;
      };
    };
    responses: Record<
      string,
      {
        description: string;
        content?: Record<string, { schema: AnyZod }>;
      }
    >;
  }

  export class OpenAPIRegistry {
    constructor(parents?: OpenAPIRegistry[]);
    definitions: unknown[];
    register(name: string, schema: AnyZod): AnyZod;
    registerPath(config: RouteConfig): void;
    registerComponent(
      type: "securitySchemes" | "parameters" | "headers" | "responses" | "schemas",
      name: string,
      component: Record<string, unknown>
    ): void;
  }

  export interface OpenApiGeneratorOptions {
    openapi: string;
    info: {
      title: string;
      version: string;
      description?: string;
      contact?: { name?: string; email?: string; url?: string };
    };
    servers?: Array<{ url: string; description?: string }>;
    security?: Array<Record<string, string[]>>;
  }

  export class OpenApiGeneratorV31 {
    constructor(definitions: unknown[]);
    generateDocument(options: OpenApiGeneratorOptions): Record<string, unknown>;
  }

  export class OpenApiGeneratorV3 extends OpenApiGeneratorV31 {}

  export function extendZodWithOpenApi(zod: unknown): void;
}

