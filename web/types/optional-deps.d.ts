/**
 * Declaraciones ambient para dependencias opcionales del sistema de delivery.
 *
 * Estas dependencias se cargan via `await import(...)` en tiempo de ejecucion.
 * Si aun no estan instaladas, TypeScript no deberia fallar la compilacion —
 * el runtime capturara el error y lanzara un mensaje claro al usuario.
 *
 * Una vez se ejecute `npm install jszip @react-pdf/renderer`, estas
 * declaraciones seran sobreescritas por los tipos reales del paquete.
 */

declare module "jszip" {
  // Tipado laxo intencional — se reemplaza por los tipos reales cuando el paquete
  // esta instalado. Marcamos la forma minima que usa el delivery favicon-pack.
  interface JSZipInstance {
    file(name: string, data: Buffer | Uint8Array | string): JSZipInstance;
    generateAsync(options: {
      type: "nodebuffer" | "uint8array" | "blob" | "base64";
      compression?: "STORE" | "DEFLATE";
    }): Promise<Buffer>;
  }

  interface JSZipConstructor {
    new (): JSZipInstance;
    (): JSZipInstance;
  }

  const JSZip: JSZipConstructor;
  export default JSZip;
}

declare module "@react-pdf/renderer" {
  import * as React from "react";

  export const Document: React.FC<{
    title?: string;
    author?: string;
    children?: React.ReactNode;
  }>;
  export const Page: React.FC<{
    size?: string;
    style?: unknown;
    children?: React.ReactNode;
  }>;
  export const Text: React.FC<{
    style?: unknown;
    children?: React.ReactNode;
    fixed?: boolean;
    render?: (args: { pageNumber: number; totalPages: number }) => string;
  }>;
  export const View: React.FC<{ style?: unknown; children?: React.ReactNode }>;
  export const StyleSheet: {
    create<T extends Record<string, unknown>>(styles: T): T;
  };
  export const Font: {
    register(options: { family: string; src: string }): void;
  };

  export function renderToBuffer(element: React.ReactElement): Promise<Buffer>;
  export function renderToStream(
    element: React.ReactElement
  ): Promise<NodeJS.ReadableStream>;
}
