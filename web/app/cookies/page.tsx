import type { Metadata } from "next";
import Link from "next/link";
import BreadcrumbJsonLd from "@/components/BreadcrumbJsonLd";

// ISR: politica de cookies — 1h cache
export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Politica de Cookies — PACAME",
  description:
    "Informacion detallada sobre las cookies utilizadas por pacameagencia.com, conforme a la LSSI-CE, el RGPD y las directrices de la AEPD. Lista, finalidad y duracion.",
  alternates: { canonical: "https://pacameagencia.com/cookies" },
  robots: { index: true, follow: true },
};

export default function CookiesPage() {
  return (
    <div className="bg-paper min-h-screen pt-32 pb-20">
      <BreadcrumbJsonLd
        items={[
          { name: "Inicio", url: "https://pacameagencia.com" },
          { name: "Cookies", url: "https://pacameagencia.com/cookies" },
        ]}
      />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Hero */}
        <header className="mb-12">
          <h1 className="font-heading font-bold text-4xl text-ink mb-3">
            Politica de Cookies
          </h1>
          <p className="text-ink/60 text-sm">
            Ultima actualizacion: 19 abril 2026
          </p>
        </header>

        <div className="prose prose-invert prose-sm max-w-none font-body text-ink/80 space-y-8 leading-relaxed">
          <p>
            Esta politica explica que son las cookies, cuales utiliza
            pacameagencia.com, con que finalidad y como el usuario puede aceptarlas,
            rechazarlas o gestionarlas. Se ajusta a la Ley 34/2002 (LSSI-CE), al
            Reglamento (UE) 2016/679 (RGPD) y a la Guia de cookies de la AEPD.
          </p>

          {/* 1 */}
          <section>
            <h2 className="font-heading font-semibold text-2xl text-accent-gold mb-4">
              1. Que son las cookies
            </h2>
            <p>
              Las cookies son pequenos ficheros que los sitios web descargan en el
              dispositivo del usuario (ordenador, movil, tablet) al navegar. Se
              utilizan para recordar preferencias, gestionar sesiones de usuario,
              medir trafico, personalizar contenido o permitir la ejecucion de
              servicios de terceros. Tecnologias equivalentes incluyen el
              localStorage y el sessionStorage.
            </p>
          </section>

          {/* 2 */}
          <section>
            <h2 className="font-heading font-semibold text-2xl text-accent-gold mb-4">
              2. Tipos de cookies que utiliza PACAME
            </h2>
            <p>
              Atendiendo a su finalidad, PACAME utiliza cookies de las siguientes
              categorias:
            </p>

            {/* 2.1 Tecnicas */}
            <h3 className="font-heading font-medium text-lg text-ink mt-6 mb-2">
              2.1. Cookies tecnicas (estrictamente necesarias)
            </h3>
            <p>
              Imprescindibles para el funcionamiento del sitio. Estan exentas del
              deber de consentimiento previo conforme al art. 22.2 LSSI-CE.
            </p>
            <div className="overflow-x-auto my-4">
              <table className="w-full text-sm border border-ink/[0.06]">
                <thead>
                  <tr className="border-b border-ink/[0.06] bg-white/[0.02]">
                    <th className="text-left py-2 px-3 text-ink/90 font-medium">
                      Nombre
                    </th>
                    <th className="text-left py-2 px-3 text-ink/90 font-medium">
                      Duracion
                    </th>
                    <th className="text-left py-2 px-3 text-ink/90 font-medium">
                      Proposito
                    </th>
                    <th className="text-left py-2 px-3 text-ink/90 font-medium">
                      Proveedor
                    </th>
                  </tr>
                </thead>
                <tbody className="text-ink/70">
                  <tr className="border-b border-white/[0.04]">
                    <td className="py-2 px-3">pacame_auth</td>
                    <td className="py-2 px-3">Sesion / 30 dias</td>
                    <td className="py-2 px-3">
                      Autenticacion del panel administrativo
                    </td>
                    <td className="py-2 px-3">PACAME (propia)</td>
                  </tr>
                  <tr className="border-b border-white/[0.04]">
                    <td className="py-2 px-3">pacame_client_auth</td>
                    <td className="py-2 px-3">Sesion / 30 dias</td>
                    <td className="py-2 px-3">
                      Autenticacion del portal del cliente
                    </td>
                    <td className="py-2 px-3">PACAME (propia)</td>
                  </tr>
                  <tr className="border-b border-white/[0.04]">
                    <td className="py-2 px-3">pacame_csrf</td>
                    <td className="py-2 px-3">Sesion</td>
                    <td className="py-2 px-3">
                      Proteccion contra ataques CSRF en formularios
                    </td>
                    <td className="py-2 px-3">PACAME (propia)</td>
                  </tr>
                  <tr className="border-b border-white/[0.04]">
                    <td className="py-2 px-3">sb-*-auth-token</td>
                    <td className="py-2 px-3">30 dias</td>
                    <td className="py-2 px-3">
                      Sesion de usuario gestionada por Supabase Auth
                    </td>
                    <td className="py-2 px-3">Supabase (encargado)</td>
                  </tr>
                  <tr className="border-b border-white/[0.04]">
                    <td className="py-2 px-3">__vercel_*</td>
                    <td className="py-2 px-3">1 ano</td>
                    <td className="py-2 px-3">
                      Enrutamiento, rendimiento y mitigacion de ataques
                    </td>
                    <td className="py-2 px-3">Vercel (encargado)</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* 2.2 Funcionalidad */}
            <h3 className="font-heading font-medium text-lg text-ink mt-6 mb-2">
              2.2. Cookies de funcionalidad y preferencias
            </h3>
            <p>
              Permiten recordar las elecciones del usuario, como la aceptacion de
              cookies o las preferencias de idioma.
            </p>
            <div className="overflow-x-auto my-4">
              <table className="w-full text-sm border border-ink/[0.06]">
                <thead>
                  <tr className="border-b border-ink/[0.06] bg-white/[0.02]">
                    <th className="text-left py-2 px-3 text-ink/90 font-medium">
                      Nombre
                    </th>
                    <th className="text-left py-2 px-3 text-ink/90 font-medium">
                      Duracion
                    </th>
                    <th className="text-left py-2 px-3 text-ink/90 font-medium">
                      Proposito
                    </th>
                    <th className="text-left py-2 px-3 text-ink/90 font-medium">
                      Proveedor
                    </th>
                  </tr>
                </thead>
                <tbody className="text-ink/70">
                  <tr className="border-b border-white/[0.04]">
                    <td className="py-2 px-3">CookieConsent</td>
                    <td className="py-2 px-3">12 meses</td>
                    <td className="py-2 px-3">
                      Registro de las preferencias de consentimiento del usuario
                    </td>
                    <td className="py-2 px-3">PACAME (propia)</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* 2.3 Analiticas */}
            <h3 className="font-heading font-medium text-lg text-ink mt-6 mb-2">
              2.3. Cookies analiticas
            </h3>
            <p>
              Permiten medir el trafico y analizar el comportamiento de los usuarios
              de forma agregada y anonimizada. Se activan unicamente tras el
              consentimiento explicito del usuario.
            </p>
            <div className="overflow-x-auto my-4">
              <table className="w-full text-sm border border-ink/[0.06]">
                <thead>
                  <tr className="border-b border-ink/[0.06] bg-white/[0.02]">
                    <th className="text-left py-2 px-3 text-ink/90 font-medium">
                      Nombre
                    </th>
                    <th className="text-left py-2 px-3 text-ink/90 font-medium">
                      Duracion
                    </th>
                    <th className="text-left py-2 px-3 text-ink/90 font-medium">
                      Proposito
                    </th>
                    <th className="text-left py-2 px-3 text-ink/90 font-medium">
                      Proveedor
                    </th>
                  </tr>
                </thead>
                <tbody className="text-ink/70">
                  <tr className="border-b border-white/[0.04]">
                    <td className="py-2 px-3">_ga</td>
                    <td className="py-2 px-3">2 anos</td>
                    <td className="py-2 px-3">
                      Distincion de usuarios unicos (Google Analytics 4)
                    </td>
                    <td className="py-2 px-3">Google (tercero)</td>
                  </tr>
                  <tr className="border-b border-white/[0.04]">
                    <td className="py-2 px-3">_ga_*</td>
                    <td className="py-2 px-3">2 anos</td>
                    <td className="py-2 px-3">
                      Persistencia del estado de sesion (GA4)
                    </td>
                    <td className="py-2 px-3">Google (tercero)</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* 2.4 Terceros */}
            <h3 className="font-heading font-medium text-lg text-ink mt-6 mb-2">
              2.4. Cookies de terceros
            </h3>
            <p>
              Algunas paginas concretas pueden cargar servicios de terceros que
              instalan sus propias cookies sujetas a sus respectivas politicas:
            </p>
            <ul className="list-disc pl-6 space-y-1 text-ink/70">
              <li>
                <strong className="text-ink">Stripe Checkout</strong>{" "}
                (pasarela de pagos) durante el proceso de compra.
              </li>
              <li>
                <strong className="text-ink">Meta / Facebook</strong>{" "}
                (pixel de remarketing) si y cuando este activo, previo
                consentimiento.
              </li>
            </ul>
          </section>

          {/* 3 */}
          <section>
            <h2 className="font-heading font-semibold text-2xl text-accent-gold mb-4">
              3. Como aceptar, rechazar o gestionar las cookies
            </h2>
            <p>
              Al acceder por primera vez al sitio se muestra un banner de
              consentimiento con las opciones{" "}
              <strong className="text-ink">Aceptar todas</strong>,{" "}
              <strong className="text-ink">Rechazar no esenciales</strong>{" "}
              y <strong className="text-ink">Configurar</strong>. El
              usuario puede cambiar su decision en cualquier momento desde el mismo
              banner (que reaparece al eliminar la cookie CookieConsent) o
              configurando su navegador:
            </p>
            <ul className="list-disc pl-6 space-y-1 text-ink/70">
              <li>
                <strong className="text-ink">Chrome:</strong> Ajustes &gt;
                Privacidad y seguridad &gt; Cookies y otros datos de sitios.
              </li>
              <li>
                <strong className="text-ink">Firefox:</strong> Opciones
                &gt; Privacidad &amp; Seguridad &gt; Cookies y datos del sitio.
              </li>
              <li>
                <strong className="text-ink">Safari:</strong> Preferencias
                &gt; Privacidad.
              </li>
              <li>
                <strong className="text-ink">Edge:</strong> Configuracion
                &gt; Cookies y permisos del sitio.
              </li>
            </ul>
            <p>
              Advertencia: la desactivacion de cookies tecnicas puede impedir el
              correcto funcionamiento del portal del cliente y de las apps.
            </p>
          </section>

          {/* 4 */}
          <section>
            <h2 className="font-heading font-semibold text-2xl text-accent-gold mb-4">
              4. Transferencias internacionales
            </h2>
            <p>
              Algunos proveedores (Google, Meta, Stripe) pueden procesar datos
              fuera del EEE. En todos los casos las transferencias estan amparadas
              por las Clausulas Contractuales Tipo de la Comision Europea o por
              certificaciones equivalentes (EU-US Data Privacy Framework). Mas
              informacion en la{" "}
              <Link
                href="/privacidad"
                className="text-accent-gold/80 hover:text-accent-gold underline underline-offset-2"
              >
                Politica de Privacidad
              </Link>
              .
            </p>
          </section>

          {/* 5 */}
          <section>
            <h2 className="font-heading font-semibold text-2xl text-accent-gold mb-4">
              5. Actualizaciones de esta politica
            </h2>
            <p>
              PACAME puede actualizar esta politica cuando se incorporen nuevos
              servicios o cambien los actuales. La version vigente siempre estara
              publicada en esta URL con su fecha de ultima actualizacion. Si se
              introducen cookies nuevas de categoria no esencial, se solicitara un
              nuevo consentimiento al usuario.
            </p>
          </section>

          {/* 6 */}
          <section>
            <h2 className="font-heading font-semibold text-2xl text-accent-gold mb-4">
              6. Contacto
            </h2>
            <p>
              Si tienes preguntas sobre el uso de cookies o quieres ejercer tus
              derechos, contacta con nosotros en{" "}
              <a
                href="mailto:hola@pacameagencia.com"
                className="text-accent-gold/80 hover:text-accent-gold underline underline-offset-2"
              >
                hola@pacameagencia.com
              </a>
              .
            </p>
          </section>

          {/* Cross-links */}
          <div className="pt-10 border-t border-ink/[0.06] flex flex-wrap gap-4">
            <Link
              href="/privacidad"
              className="text-xs text-ink/50 hover:text-ink/80 transition-colors"
            >
              Politica de Privacidad
            </Link>
            <Link
              href="/aviso-legal"
              className="text-xs text-ink/50 hover:text-ink/80 transition-colors"
            >
              Aviso Legal
            </Link>
            <Link
              href="/terminos-servicio"
              className="text-xs text-ink/50 hover:text-ink/80 transition-colors"
            >
              Terminos de Servicio
            </Link>
            <Link
              href="/accesibilidad"
              className="text-xs text-ink/50 hover:text-ink/80 transition-colors"
            >
              Accesibilidad
            </Link>
            <Link
              href="/"
              className="text-xs text-ink/50 hover:text-ink/80 transition-colors"
            >
              Volver al inicio
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
