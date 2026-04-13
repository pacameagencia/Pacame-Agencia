import Link from "next/link";
import { ArrowRight, Home, Search } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="bg-pacame-black min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Ambient glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[500px] h-[250px] bg-electric-violet/[0.06] rounded-full blur-[200px] pointer-events-none" />

      <div className="relative z-10 max-w-lg mx-auto px-6 text-center">
        {/* 404 number */}
        <p className="font-heading font-bold text-[8rem] leading-none gradient-text mb-2">
          404
        </p>

        <h1 className="font-heading font-bold text-2xl text-pacame-white mb-4">
          Pagina no encontrada
        </h1>

        <p className="text-pacame-white/50 font-body mb-10 max-w-sm mx-auto">
          La pagina que buscas no existe o ha sido movida.
          Vuelve al inicio o explora nuestros servicios.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button variant="gradient" size="lg" asChild className="group rounded-full">
            <Link href="/">
              <Home className="w-4 h-4" />
              Volver al inicio
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </Button>
          <Button variant="outline" size="lg" asChild className="rounded-full">
            <Link href="/servicios">
              <Search className="w-4 h-4" />
              Ver servicios
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
