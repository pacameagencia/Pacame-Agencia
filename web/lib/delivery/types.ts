/**
 * Delivery system types — shared contract between the orchestrator
 * (/api/deliveries/start) and individual delivery implementations.
 */

export type DeliverableKind =
  | "image"
  | "pdf"
  | "text"
  | "html"
  | "zip"
  | "json"
  | "audio"
  | "video";

export interface DeliveryContext {
  /** orders.id */
  orderId: string;
  /** orders.service_slug */
  serviceSlug: string;
  /** orders.client_id (may be null for unlinked guests) */
  clientId: string | null;
  /** inputs JSONB — validated against service_catalog.inputs_schema */
  inputs: Record<string, unknown>;
  /** optional client_brand_settings for branded deliveries */
  brandSettings?: {
    primary_color?: string;
    secondary_color?: string;
    font_heading?: string;
    font_body?: string;
    logo_url?: string;
  } | null;
  /** Report progress to orders + order_events (throttled). Safe to call many times. */
  onProgress: (pct: number, message: string) => Promise<void>;
}

export interface GeneratedDeliverable {
  kind: DeliverableKind;
  title?: string;
  /** Public or signed URL to a file in Supabase Storage */
  fileUrl?: string;
  /** Path inside the Storage bucket (for later signed URL regeneration) */
  storagePath?: string;
  /** Preview/thumbnail URL (publicly accessible) */
  previewUrl?: string;
  /** Inline payload for text/json deliverables */
  payload?: unknown;
  /** Extra metadata: cost_usd, model, tokens, dimensions, size_bytes */
  meta?: Record<string, unknown>;
}

export interface DeliveryResult {
  /** One or more deliverables produced by the run */
  deliverables: GeneratedDeliverable[];
  /** Short human-readable summary for the customer email */
  summary: string;
  /** Total USD cost of this run (IA calls + storage + etc.) */
  costUsd: number;
}

export interface ServiceDelivery {
  /** The slug this implementation handles */
  readonly slug: string;
  /** Short display name (for logs + UI) */
  readonly name: string;
  /** Executes the delivery. Throws on unrecoverable errors — orchestrator handles escalation. */
  execute(ctx: DeliveryContext): Promise<DeliveryResult>;
}
