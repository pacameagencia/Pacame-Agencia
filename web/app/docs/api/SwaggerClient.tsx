"use client";

/**
 * Cliente que carga Swagger UI desde CDN (jsdelivr) para evitar bundle bloat.
 * Render side-only: no requiere SSR, se hidrata contra /api/docs.
 */

import { useEffect, useRef } from "react";

declare global {
  interface Window {
    SwaggerUIBundle?: unknown;
  }
}

export default function SwaggerUIPage() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href =
      "https://cdn.jsdelivr.net/npm/swagger-ui-dist@5.18.2/swagger-ui.css";
    document.head.appendChild(link);

    const script = document.createElement("script");
    script.src =
      "https://cdn.jsdelivr.net/npm/swagger-ui-dist@5.18.2/swagger-ui-bundle.js";
    script.async = true;
    script.onload = () => {
      // eslint-disable-next-line
      const bundle = (window as any).SwaggerUIBundle;
      if (typeof bundle === "function") {
        bundle({
          url: "/api/docs",
          dom_id: "#swagger-ui",
          deepLinking: true,
          docExpansion: "list",
          defaultModelsExpandDepth: 1,
        });
      }
    };
    document.body.appendChild(script);

    return () => {
      if (link.parentNode) link.parentNode.removeChild(link);
      if (script.parentNode) script.parentNode.removeChild(script);
    };
  }, []);

  return (
    <div
      id="swagger-ui"
      ref={ref}
      style={{ minHeight: "100vh", background: "white" }}
    />
  );
}
