import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Politica de Cookies — PACAME",
  description: "Politica de cookies del sitio web pacameagencia.com, conforme al RGPD y la LSSI-CE.",
  robots: { index: false, follow: false },
};

export default function CookiesPage() {
  return (
    <div className="bg-pacame-black min-h-screen pt-36 pb-20">
      <div className="max-w-3xl mx-auto px-6">
        <h1 className="font-heading font-bold text-3xl text-pacame-white mb-8">
          Politica de Cookies
        </h1>
        <div className="prose prose-invert prose-sm max-w-none font-body text-pacame-white/70 space-y-6">
          <p className="text-pacame-white/50 text-xs">Ultima actualizacion: Abril 2026</p>

          <h2 className="font-heading font-semibold text-lg text-pacame-white">1. Que son las cookies</h2>
          <p>
            Las cookies son pequenos archivos de texto que los sitios web almacenan en tu dispositivo
            cuando los visitas. Se utilizan para recordar tus preferencias, mejorar la experiencia de
            navegacion y recopilar informacion estadistica.
          </p>

          <h2 className="font-heading font-semibold text-lg text-pacame-white">2. Cookies que utilizamos</h2>

          <h3 className="font-heading font-medium text-base text-pacame-white/90">Cookies estrictamente necesarias</h3>
          <p>
            Son imprescindibles para el funcionamiento del sitio web. No requieren tu consentimiento.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  <th className="text-left py-2 text-pacame-white/80 font-medium">Cookie</th>
                  <th className="text-left py-2 text-pacame-white/80 font-medium">Proveedor</th>
                  <th className="text-left py-2 text-pacame-white/80 font-medium">Finalidad</th>
                  <th className="text-left py-2 text-pacame-white/80 font-medium">Duracion</th>
                </tr>
              </thead>
              <tbody className="text-pacame-white/60">
                <tr className="border-b border-white/[0.04]">
                  <td className="py-2">sb-*-auth-token</td>
                  <td className="py-2">Supabase</td>
                  <td className="py-2">Autenticacion del usuario</td>
                  <td className="py-2">Sesion</td>
                </tr>
                <tr className="border-b border-white/[0.04]">
                  <td className="py-2">__vercel_*</td>
                  <td className="py-2">Vercel</td>
                  <td className="py-2">Enrutamiento y rendimiento</td>
                  <td className="py-2">Sesion</td>
                </tr>
              </tbody>
            </table>
          </div>

          <h3 className="font-heading font-medium text-base text-pacame-white/90">Cookies analiticas</h3>
          <p>
            Nos permiten medir el trafico del sitio web y analizar el comportamiento de los visitantes.
            Solo se activan con tu consentimiento previo.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  <th className="text-left py-2 text-pacame-white/80 font-medium">Cookie</th>
                  <th className="text-left py-2 text-pacame-white/80 font-medium">Proveedor</th>
                  <th className="text-left py-2 text-pacame-white/80 font-medium">Finalidad</th>
                  <th className="text-left py-2 text-pacame-white/80 font-medium">Duracion</th>
                </tr>
              </thead>
              <tbody className="text-pacame-white/60">
                <tr className="border-b border-white/[0.04]">
                  <td className="py-2">_ga, _ga_*</td>
                  <td className="py-2">Google Analytics</td>
                  <td className="py-2">Estadisticas de uso</td>
                  <td className="py-2">2 anos</td>
                </tr>
              </tbody>
            </table>
          </div>

          <h2 className="font-heading font-semibold text-lg text-pacame-white">3. Como gestionar las cookies</h2>
          <p>
            Puedes configurar tu navegador para bloquear o eliminar cookies. Ten en cuenta que desactivar
            las cookies necesarias puede afectar al funcionamiento del sitio web.
          </p>
          <ul className="list-disc list-inside space-y-1 text-pacame-white/60">
            <li><strong className="text-pacame-white/80">Chrome:</strong> Configuracion &gt; Privacidad y seguridad &gt; Cookies</li>
            <li><strong className="text-pacame-white/80">Firefox:</strong> Opciones &gt; Privacidad &gt; Cookies</li>
            <li><strong className="text-pacame-white/80">Safari:</strong> Preferencias &gt; Privacidad &gt; Cookies</li>
            <li><strong className="text-pacame-white/80">Edge:</strong> Configuracion &gt; Cookies y permisos del sitio</li>
          </ul>

          <h2 className="font-heading font-semibold text-lg text-pacame-white">4. Actualizaciones de esta politica</h2>
          <p>
            PACAME puede actualizar esta politica de cookies en cualquier momento para adaptarla a
            novedades legislativas o cambios en el sitio web. Te recomendamos revisarla periodicamente.
          </p>

          <h2 className="font-heading font-semibold text-lg text-pacame-white">5. Contacto</h2>
          <p>
            Si tienes preguntas sobre nuestra politica de cookies, contactanos en{" "}
            <a href="mailto:hola@pacameagencia.com" className="text-electric-violet hover:underline">hola@pacameagencia.com</a>.
          </p>

          <div className="pt-8 border-t border-white/[0.06] flex items-center gap-4">
            <Link href="/privacidad" className="text-sm text-electric-violet hover:underline font-body">
              Politica de privacidad
            </Link>
            <Link href="/aviso-legal" className="text-sm text-electric-violet hover:underline font-body">
              Aviso legal
            </Link>
            <Link href="/" className="text-sm text-pacame-white/40 hover:text-pacame-white/60 font-body">
              Volver al inicio
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
