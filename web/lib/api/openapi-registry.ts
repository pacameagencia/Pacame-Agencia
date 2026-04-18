/**
 * OpenAPI registry central. Importar desde cualquier modulo que quiera
 * registrar paths o schemas. `generateOpenApiDocument()` es invocado
 * por /api/docs para serializar la spec.
 */

import {
  OpenAPIRegistry,
  OpenApiGeneratorV31,
  extendZodWithOpenApi,
} from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

// Extiende zod con el metodo .openapi() — idempotente.
extendZodWithOpenApi(z);

export const openapiRegistry = new OpenAPIRegistry();

// Componentes de seguridad comunes.
openapiRegistry.registerComponent("securitySchemes", "cookieAuth", {
  type: "apiKey",
  in: "cookie",
  name: "pacame_session",
  description: "Sesion de cliente (portal). Emitida en login via /api/portal/login.",
});

openapiRegistry.registerComponent("securitySchemes", "bearerAuth", {
  type: "http",
  scheme: "bearer",
  description: "CRON_SECRET para jobs internos. No usar desde frontend.",
});

export { z };

export function generateOpenApiDocument() {
  const generator = new OpenApiGeneratorV31(openapiRegistry.definitions);
  return generator.generateDocument({
    openapi: "3.1.0",
    info: {
      title: "PACAME Marketplace API",
      version: "1.0.0",
      description:
        "API publica del marketplace PACAME. Auth via cookie (clientes) o Bearer CRON_SECRET (internal).",
      contact: {
        name: "PACAME",
        email: "hola@pacameagencia.com",
        url: "https://pacameagencia.com",
      },
    },
    servers: [
      { url: "https://pacameagencia.com", description: "Production" },
      { url: "http://localhost:3000", description: "Local dev" },
    ],
    security: [{ cookieAuth: [] }],
  });
}
