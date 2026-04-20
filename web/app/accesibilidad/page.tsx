import type { Metadata } from "next";
import Link from "next/link";
import BreadcrumbJsonLd from "@/components/BreadcrumbJsonLd";

// ISR: pagina estatica legal/accesibilidad — 1h cache
export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Declaracion de Accesibilidad — PACAME",
  description: "Compromiso de accesibilidad web de PACAME. Conformidad con WCAG 2.1 nivel AA.",
  robots: { index: false, follow: false },
};

export default function AccesibilidadPage() {
  return (
    <div className="bg-pacame-black min-h-screen pt-32 pb-20">
      <BreadcrumbJsonLd
        items={[
          { name: "Inicio", url: "https://pacameagencia.com" },
          { name: "Accesibilidad", url: "https://pacameagencia.com/accesibilidad" },
        ]}
      />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="font-heading font-bold text-3xl text-pacame-white mb-8">
          Declaracion de Accesibilidad
        </h1>
        <div className="prose prose-invert prose-sm max-w-none font-body text-pacame-white/70 space-y-6">

          <p className="text-pacame-white/60 text-xs">Ultima revision: Abril 2026</p>

          <h2 className="font-heading font-semibold text-lg text-pacame-white">1. Compromiso con la accesibilidad</h2>
          <p>
            PACAME se compromete a garantizar que su sitio web sea accesible para todas las personas,
            independientemente de sus capacidades o del dispositivo que utilicen. Trabajamos para cumplir con
            las{" "}
            <strong className="text-pacame-white/80">
              Pautas de Accesibilidad para el Contenido Web (WCAG) 2.1, nivel AA
            </strong>
            , conforme a la norma europea EN 301 549 y al Real Decreto 1112/2018 de accesibilidad de los
            sitios web del sector publico en Espana.
          </p>
          <p>
            Aunque nuestro sitio es de naturaleza privada, adoptamos voluntariamente estos estandares como
            parte de nuestro compromiso con la inclusion y la calidad.
          </p>

          <h2 className="font-heading font-semibold text-lg text-pacame-white">2. Medidas adoptadas</h2>
          <p>Hemos implementado las siguientes medidas para garantizar la accesibilidad:</p>
          <ul className="list-disc list-inside space-y-1 text-pacame-white/60">
            <li><strong className="text-pacame-white/80">HTML semantico:</strong> uso correcto de encabezados (h1-h6), landmarks (header, nav, main, footer), listas y formularios etiquetados.</li>
            <li><strong className="text-pacame-white/80">Atributos ARIA:</strong> etiquetas aria-label, aria-expanded, aria-live y roles semanticos en componentes interactivos.</li>
            <li><strong className="text-pacame-white/80">Navegacion por teclado:</strong> todos los elementos interactivos son accesibles mediante teclado con indicadores de enfoque visibles.</li>
            <li><strong className="text-pacame-white/80">Contraste de color:</strong> ratios de contraste que cumplen o superan el minimo de 4.5:1 para texto y 3:1 para componentes de interfaz (WCAG AA).</li>
            <li><strong className="text-pacame-white/80">Enlace &quot;Saltar al contenido&quot;:</strong> disponible en todas las paginas para facilitar la navegacion rapida.</li>
            <li><strong className="text-pacame-white/80">Movimiento reducido:</strong> respetamos la preferencia del sistema operativo &quot;prefers-reduced-motion&quot;, desactivando animaciones y efectos visuales complejos.</li>
            <li><strong className="text-pacame-white/80">Diseno responsive:</strong> el sitio se adapta a todos los tamanos de pantalla y es compatible con zoom hasta el 200%.</li>
            <li><strong className="text-pacame-white/80">Formularios accesibles:</strong> campos con etiquetas claras, mensajes de error descriptivos y validacion accesible.</li>
          </ul>

          <h2 className="font-heading font-semibold text-lg text-pacame-white">3. Limitaciones conocidas</h2>
          <p>
            A pesar de nuestros esfuerzos, somos conscientes de que algunas areas pueden presentar
            limitaciones de accesibilidad:
          </p>
          <ul className="list-disc list-inside space-y-1 text-pacame-white/60">
            <li><strong className="text-pacame-white/80">Widgets de terceros:</strong> el widget de chat (SageChatWidget) y el boton de WhatsApp dependen de tecnologias externas cuya accesibilidad no controlamos completamente.</li>
            <li><strong className="text-pacame-white/80">Contenido dinamico:</strong> algunas animaciones canvas (particulas, gradientes) son decorativas y se desactivan con &quot;prefers-reduced-motion&quot;, pero pueden no ser interpretadas por todos los lectores de pantalla.</li>
            <li><strong className="text-pacame-white/80">PDFs y documentos:</strong> documentos generados por terceros pueden no cumplir completamente los estandares de accesibilidad.</li>
          </ul>
          <p>
            Trabajamos continuamente para identificar y resolver estas limitaciones.
          </p>

          <h2 className="font-heading font-semibold text-lg text-pacame-white">4. Tecnologias utilizadas</h2>
          <p>
            Este sitio web ha sido desarrollado con las siguientes tecnologias, seleccionadas por su
            compatibilidad con los estandares de accesibilidad:
          </p>
          <ul className="list-disc list-inside space-y-1 text-pacame-white/60">
            <li><strong className="text-pacame-white/80">Next.js 15</strong> y <strong className="text-pacame-white/80">React 19</strong> — framework con soporte nativo para server-side rendering y HTML semantico.</li>
            <li><strong className="text-pacame-white/80">TypeScript</strong> — tipado estatico que reduce errores y mejora la robustez del codigo.</li>
            <li><strong className="text-pacame-white/80">TailwindCSS</strong> — sistema de diseno con utilities de accesibilidad integradas (sr-only, focus-visible).</li>
            <li><strong className="text-pacame-white/80">Framer Motion</strong> — libreria de animaciones con soporte para &quot;prefers-reduced-motion&quot;.</li>
            <li><strong className="text-pacame-white/80">WAI-ARIA 1.2</strong> — practicas de accesibilidad para aplicaciones web enriquecidas.</li>
          </ul>

          <h2 className="font-heading font-semibold text-lg text-pacame-white">5. Fecha de conformidad</h2>
          <p>
            Esta declaracion fue preparada el <strong className="text-pacame-white/80">15 de abril de 2026</strong>, basandose
            en una autoevaluacion realizada por el equipo de desarrollo de PACAME. La proxima revision esta
            programada para julio de 2026.
          </p>

          <h2 className="font-heading font-semibold text-lg text-pacame-white">6. Contacto para problemas de accesibilidad</h2>
          <p>
            Si encuentras alguna barrera de accesibilidad en nuestro sitio web, te invitamos a contactarnos.
            Nos comprometemos a responder en un plazo maximo de <strong className="text-pacame-white/80">5 dias laborables</strong> y
            a trabajar para resolver el problema lo antes posible.
          </p>
          <ul className="list-disc list-inside space-y-1 text-pacame-white/60">
            <li>Email: <a href="mailto:hola@pacameagencia.com" className="text-olympus-gold/70 hover:text-olympus-gold underline underline-offset-2">hola@pacameagencia.com</a></li>
            <li>Asunto sugerido: &quot;Problema de accesibilidad — [descripcion breve]&quot;</li>
            <li>Incluye, si es posible: la URL de la pagina, el navegador y dispositivo utilizados, y una descripcion del problema encontrado.</li>
          </ul>

          <h2 className="font-heading font-semibold text-lg text-pacame-white">7. Procedimiento de aplicacion</h2>
          <p>
            Si consideras que nuestra respuesta no es satisfactoria, puedes dirigir una reclamacion al{" "}
            <strong className="text-pacame-white/80">Ministerio de Asuntos Economicos y Transformacion Digital</strong> de
            Espana, a traves del procedimiento de reclamacion establecido en el Real Decreto 1112/2018.
          </p>
          <p>
            Mas informacion en:{" "}
            <span className="text-pacame-white/50">administracion.gob.es</span>
          </p>

          {/* Cross-links */}
          <div className="pt-8 border-t border-white/[0.06] flex flex-wrap gap-4">
            <Link href="/privacidad" className="text-xs text-pacame-white/40 hover:text-pacame-white/70 transition-colors">
              Politica de Privacidad
            </Link>
            <Link href="/aviso-legal" className="text-xs text-pacame-white/40 hover:text-pacame-white/70 transition-colors">
              Aviso Legal
            </Link>
            <Link href="/cookies" className="text-xs text-pacame-white/40 hover:text-pacame-white/70 transition-colors">
              Politica de Cookies
            </Link>
            <Link href="/terminos-servicio" className="text-xs text-pacame-white/40 hover:text-pacame-white/70 transition-colors">
              Terminos de Servicio
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
