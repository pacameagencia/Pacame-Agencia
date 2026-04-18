"use client";

import { useEffect } from "react";
import Link from "next/link";
import { RefreshCw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { captureException } from "@/lib/observability/sentry";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  // Report a Sentry con el digest para cross-reference con server logs
  useEffect(() => {
    void captureException(error, {
      tags: { boundary: "app-error" },
      extra: { digest: error.digest },
    });
  }, [error]);

  return (
    <div className="bg-pacame-black min-h-screen flex items-center justify-center relative overflow-hidden">
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[500px] h-[250px] bg-red-500/[0.04] rounded-full blur-[200px] pointer-events-none" />

      <div className="relative z-10 max-w-lg mx-auto px-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center mx-auto mb-6">
          <span className="font-heading font-bold text-2xl text-red-400">!</span>
        </div>

        <h1 className="font-heading font-bold text-2xl text-pacame-white mb-4">
          Algo ha fallado
        </h1>

        <p className="text-pacame-white/50 font-body mb-10 max-w-sm mx-auto">
          Ha ocurrido un error inesperado. Puedes intentarlo de nuevo o volver al inicio.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button variant="gradient" size="lg" onClick={reset} className="group rounded-full">
            <RefreshCw className="w-4 h-4" />
            Intentar de nuevo
          </Button>
          <Button variant="outline" size="lg" asChild className="rounded-full">
            <Link href="/">
              <Home className="w-4 h-4" />
              Ir al inicio
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
