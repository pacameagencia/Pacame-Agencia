/**
 * Module augmentation — anade el metodo .openapi() al prototipo de ZodType.
 *
 * `extendZodWithOpenApi(z)` muta el prototipo en runtime; este d.ts
 * refleja esa mutacion para TypeScript. Es un archivo "module" (gracias
 * al `export {}` final), lo que convierte `declare module "zod"` en
 * augmentation y no en redefinicion.
 */
declare module "zod" {
  interface ZodType {
    // eslint-disable-next-line
    openapi(refId: string, metadata?: Record<string, unknown>): any;
    // eslint-disable-next-line
    openapi(metadata: Record<string, unknown>): any;
  }
}

export {};
