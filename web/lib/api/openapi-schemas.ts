/**
 * Schemas y paths reutilizables del marketplace PACAME, registrados
 * en el OpenAPIRegistry. Se importa con side-effect desde /api/docs.
 *
 * Mantener SOLO endpoints publicos (catalog, orders cliente, gdpr, health).
 * NO documentar rutas internas (dashboard, cron, webhook).
 */

import { openapiRegistry, z } from "./openapi-registry";

// --- Schemas base -----------------------------------------------------------

export const OrderStatusSchema = z
  .enum([
    "pending_inputs",
    "pending_payment",
    "paid",
    "in_progress",
    "awaiting_review",
    "delivered",
    "revision_requested",
    "completed",
    "cancelled",
    "refunded",
  ])
  .openapi("OrderStatus", {
    description: "Estados posibles de un pedido a lo largo de su ciclo de vida.",
  });

export const DeliverableSchema = z
  .object({
    id: z.string().uuid(),
    order_id: z.string().uuid(),
    kind: z.enum(["file", "link", "text"]),
    title: z.string(),
    url: z.string().url().optional(),
    content: z.string().optional(),
    created_at: z.string().datetime(),
  })
  .openapi("Deliverable");

export const RevisionSchema = z
  .object({
    id: z.string().uuid(),
    order_id: z.string().uuid(),
    requested_at: z.string().datetime(),
    reason: z.string(),
    resolved_at: z.string().datetime().nullable(),
  })
  .openapi("Revision");

export const ReviewSchema = z
  .object({
    id: z.string().uuid(),
    order_id: z.string().uuid(),
    rating: z.number().int().min(1).max(5),
    comment: z.string().optional(),
    created_at: z.string().datetime(),
  })
  .openapi("Review");

export const OrderSchema = z
  .object({
    id: z.string().uuid(),
    client_id: z.string().uuid(),
    service_slug: z.string(),
    status: OrderStatusSchema,
    total_cents: z.number().int().nonnegative(),
    currency: z.string().length(3).default("EUR"),
    stripe_session_id: z.string().nullable(),
    inputs: z.record(z.string(), z.unknown()).nullable(),
    created_at: z.string().datetime(),
    updated_at: z.string().datetime(),
    deliverables: z.array(DeliverableSchema).optional(),
    revisions: z.array(RevisionSchema).optional(),
    review: ReviewSchema.nullable().optional(),
  })
  .openapi("Order");

export const PlanSchema = z
  .object({
    id: z.string().uuid(),
    slug: z.string(),
    name: z.string(),
    description: z.string(),
    price_cents: z.number().int().nonnegative(),
    currency: z.string().length(3),
    interval: z.enum(["month", "year"]),
    features: z.array(z.string()),
    active: z.boolean(),
  })
  .openapi("Plan");

export const SubscriptionSchema = z
  .object({
    id: z.string().uuid(),
    client_id: z.string().uuid(),
    plan_id: z.string().uuid(),
    status: z.enum(["active", "past_due", "canceled", "incomplete", "trialing"]),
    current_period_end: z.string().datetime(),
    stripe_subscription_id: z.string().nullable(),
    created_at: z.string().datetime(),
  })
  .openapi("Subscription");

export const AppInstanceSchema = z
  .object({
    id: z.string().uuid(),
    client_id: z.string().uuid(),
    app_slug: z.string(),
    name: z.string(),
    status: z.enum(["provisioning", "ready", "error", "suspended"]),
    config: z.record(z.string(), z.unknown()).nullable(),
    created_at: z.string().datetime(),
  })
  .openapi("AppInstance");

export const CatalogItemSchema = z
  .object({
    slug: z.string(),
    title: z.string(),
    description: z.string(),
    price_cents: z.number().int().nonnegative(),
    currency: z.string().length(3),
    category: z.string(),
    delivery_days: z.number().int().positive().optional(),
    tags: z.array(z.string()).optional(),
  })
  .openapi("CatalogItem");

export const ErrorIssueSchema = z
  .object({
    path: z.array(z.union([z.string(), z.number()])),
    message: z.string(),
    code: z.string().optional(),
  })
  .openapi("ErrorIssue");

export const ErrorResponseSchema = z
  .object({
    error: z.string(),
    issues: z.array(ErrorIssueSchema).optional(),
  })
  .openapi("ErrorResponse");

export const HealthResponseSchema = z
  .object({
    status: z.enum(["ok", "degraded", "down"]),
    timestamp: z.string().datetime(),
    checks: z
      .record(
        z.string(),
        z.object({
          status: z.enum(["ok", "degraded", "down"]),
          latency_ms: z.number().optional(),
          error: z.string().optional(),
        })
      )
      .optional(),
  })
  .openapi("HealthResponse");

// --- Request bodies ---------------------------------------------------------

const CheckoutRequestSchema = z
  .object({
    service_slug: z.string(),
    plan_slug: z.string().optional(),
    app_slug: z.string().optional(),
    return_url: z.string().url().optional(),
  })
  .openapi("CheckoutRequest");

const CheckoutResponseSchema = z
  .object({
    url: z.string().url(),
    session_id: z.string(),
  })
  .openapi("CheckoutResponse");

const OrderInputsRequestSchema = z
  .object({
    inputs: z.record(z.string(), z.unknown()),
  })
  .openapi("OrderInputsRequest");

const RevisionRequestSchema = z
  .object({
    reason: z.string().min(10).max(2000),
  })
  .openapi("RevisionRequest");

const ReviewRequestSchema = z
  .object({
    rating: z.number().int().min(1).max(5),
    comment: z.string().max(2000).optional(),
  })
  .openapi("ReviewRequest");

const GdprExportResponseSchema = z
  .object({
    job_id: z.string().uuid(),
    status: z.enum(["queued", "processing", "ready", "failed"]),
    download_url: z.string().url().optional(),
    expires_at: z.string().datetime().optional(),
  })
  .openapi("GdprExportResponse");

const GdprDeleteRequestSchema = z
  .object({
    confirmation: z.literal("DELETE"),
  })
  .openapi("GdprDeleteRequest");

// --- Helpers ----------------------------------------------------------------

const errorResponse = (description: string) => ({
  description,
  content: { "application/json": { schema: ErrorResponseSchema } },
});

// --- Paths ------------------------------------------------------------------

openapiRegistry.registerPath({
  method: "get",
  path: "/api/marketplace/catalog",
  tags: ["Marketplace"],
  summary: "Lista el catalogo publico de servicios.",
  responses: {
    200: {
      description: "Lista de servicios activos.",
      content: {
        "application/json": { schema: z.array(CatalogItemSchema) },
      },
    },
  },
});

openapiRegistry.registerPath({
  method: "get",
  path: "/api/marketplace/catalog/{slug}",
  tags: ["Marketplace"],
  summary: "Detalle de un servicio por slug.",
  request: {
    params: z.object({ slug: z.string() }),
  },
  responses: {
    200: {
      description: "Servicio encontrado.",
      content: { "application/json": { schema: CatalogItemSchema } },
    },
    404: errorResponse("Servicio no encontrado."),
  },
});

openapiRegistry.registerPath({
  method: "get",
  path: "/api/marketplace/plans",
  tags: ["Marketplace"],
  summary: "Lista de planes de suscripcion.",
  responses: {
    200: {
      description: "Planes activos.",
      content: { "application/json": { schema: z.array(PlanSchema) } },
    },
  },
});

openapiRegistry.registerPath({
  method: "get",
  path: "/api/marketplace/apps",
  tags: ["Marketplace"],
  summary: "Lista de aplicaciones desplegables.",
  responses: {
    200: {
      description: "Apps disponibles.",
      content: {
        "application/json": {
          schema: z.array(
            z.object({
              slug: z.string(),
              name: z.string(),
              description: z.string(),
              price_cents: z.number().int().nonnegative(),
              currency: z.string().length(3),
            })
          ),
        },
      },
    },
  },
});

openapiRegistry.registerPath({
  method: "post",
  path: "/api/stripe/checkout",
  tags: ["Checkout"],
  summary: "Crea una sesion de Stripe Checkout para servicio/plan/app.",
  security: [{ cookieAuth: [] }],
  request: {
    body: {
      required: true,
      content: { "application/json": { schema: CheckoutRequestSchema } },
    },
  },
  responses: {
    200: {
      description: "Sesion creada.",
      content: { "application/json": { schema: CheckoutResponseSchema } },
    },
    400: errorResponse("Payload invalido."),
    401: errorResponse("Se requiere autenticacion."),
  },
});

openapiRegistry.registerPath({
  method: "get",
  path: "/api/orders/{id}",
  tags: ["Orders"],
  summary: "Detalle de un pedido del cliente autenticado.",
  security: [{ cookieAuth: [] }],
  request: { params: z.object({ id: z.string().uuid() }) },
  responses: {
    200: {
      description: "Pedido encontrado.",
      content: { "application/json": { schema: OrderSchema } },
    },
    401: errorResponse("Se requiere autenticacion."),
    404: errorResponse("Pedido no encontrado o sin permiso."),
  },
});

openapiRegistry.registerPath({
  method: "post",
  path: "/api/orders/{id}/inputs",
  tags: ["Orders"],
  summary: "Envia los inputs del brief para arrancar el pedido.",
  security: [{ cookieAuth: [] }],
  request: {
    params: z.object({ id: z.string().uuid() }),
    body: {
      required: true,
      content: { "application/json": { schema: OrderInputsRequestSchema } },
    },
  },
  responses: {
    200: {
      description: "Inputs guardados.",
      content: { "application/json": { schema: OrderSchema } },
    },
    400: errorResponse("Payload invalido."),
    401: errorResponse("Se requiere autenticacion."),
    404: errorResponse("Pedido no encontrado."),
  },
});

openapiRegistry.registerPath({
  method: "post",
  path: "/api/orders/{id}/revision",
  tags: ["Orders"],
  summary: "Solicita una revision de un entregable.",
  security: [{ cookieAuth: [] }],
  request: {
    params: z.object({ id: z.string().uuid() }),
    body: {
      required: true,
      content: { "application/json": { schema: RevisionRequestSchema } },
    },
  },
  responses: {
    201: {
      description: "Revision creada.",
      content: { "application/json": { schema: RevisionSchema } },
    },
    400: errorResponse("Payload invalido."),
    401: errorResponse("Se requiere autenticacion."),
    404: errorResponse("Pedido no encontrado."),
  },
});

openapiRegistry.registerPath({
  method: "post",
  path: "/api/orders/{id}/review",
  tags: ["Orders"],
  summary: "Publica una review tras completar el pedido.",
  security: [{ cookieAuth: [] }],
  request: {
    params: z.object({ id: z.string().uuid() }),
    body: {
      required: true,
      content: { "application/json": { schema: ReviewRequestSchema } },
    },
  },
  responses: {
    201: {
      description: "Review publicada.",
      content: { "application/json": { schema: ReviewSchema } },
    },
    400: errorResponse("Payload invalido."),
    401: errorResponse("Se requiere autenticacion."),
    404: errorResponse("Pedido no encontrado."),
  },
});

openapiRegistry.registerPath({
  method: "get",
  path: "/api/orders/by-session/{session_id}",
  tags: ["Orders"],
  summary: "Resuelve un pedido a partir del session_id de Stripe Checkout.",
  security: [{ cookieAuth: [] }],
  request: { params: z.object({ session_id: z.string() }) },
  responses: {
    200: {
      description: "Pedido encontrado.",
      content: { "application/json": { schema: OrderSchema } },
    },
    401: errorResponse("Se requiere autenticacion."),
    404: errorResponse("Sesion no encontrada o aun no procesada."),
  },
});

openapiRegistry.registerPath({
  method: "get",
  path: "/api/gdpr/export",
  tags: ["GDPR"],
  summary: "Consulta el estado del ultimo export de datos solicitado.",
  security: [{ cookieAuth: [] }],
  responses: {
    200: {
      description: "Estado del job.",
      content: { "application/json": { schema: GdprExportResponseSchema } },
    },
    401: errorResponse("Se requiere autenticacion."),
  },
});

openapiRegistry.registerPath({
  method: "post",
  path: "/api/gdpr/export",
  tags: ["GDPR"],
  summary: "Solicita un export completo de los datos del cliente.",
  security: [{ cookieAuth: [] }],
  responses: {
    202: {
      description: "Job encolado.",
      content: { "application/json": { schema: GdprExportResponseSchema } },
    },
    401: errorResponse("Se requiere autenticacion."),
    429: errorResponse("Demasiadas solicitudes, intentalo mas tarde."),
  },
});

openapiRegistry.registerPath({
  method: "post",
  path: "/api/gdpr/delete",
  tags: ["GDPR"],
  summary: "Solicita borrado completo de la cuenta (derecho al olvido).",
  security: [{ cookieAuth: [] }],
  request: {
    body: {
      required: true,
      content: { "application/json": { schema: GdprDeleteRequestSchema } },
    },
  },
  responses: {
    202: {
      description: "Solicitud recibida; borrado en proceso.",
      content: {
        "application/json": {
          schema: z.object({ ok: z.literal(true), scheduled_for: z.string().datetime() }),
        },
      },
    },
    400: errorResponse("Confirmacion invalida."),
    401: errorResponse("Se requiere autenticacion."),
  },
});

openapiRegistry.registerPath({
  method: "get",
  path: "/api/health",
  tags: ["Health"],
  summary: "Health check publico de la API.",
  responses: {
    200: {
      description: "Sistema operativo.",
      content: { "application/json": { schema: HealthResponseSchema } },
    },
    503: {
      description: "Sistema degradado.",
      content: { "application/json": { schema: HealthResponseSchema } },
    },
  },
});
