import type { Metadata } from "next";
import Link from "next/link";
import BreadcrumbJsonLd from "@/components/BreadcrumbJsonLd";

// ISR: terminos de servicio — 1h cache
export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Terminos de Servicio — PACAME",
  description: "Terminos y condiciones de contratacion de los servicios de PACAME Agencia Digital.",
  robots: { index: false, follow: false },
};

export default function TerminosServicioPage() {
  return (
    <div className="bg-pacame-black min-h-screen pt-32 pb-20">
      <BreadcrumbJsonLd
        items={[
          { name: "Inicio", url: "https://pacameagencia.com" },
          { name: "Terminos de Servicio", url: "https://pacameagencia.com/terminos-servicio" },
        ]}
      />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="font-heading font-bold text-3xl text-pacame-white mb-8">
          Terminos de Servicio
        </h1>
        <div className="prose prose-invert prose-sm max-w-none font-body text-pacame-white/70 space-y-6">

          <p className="text-pacame-white/60 text-xs">Ultima actualizacion: Abril 2026</p>

          <h2 className="font-heading font-semibold text-lg text-pacame-white">1. Objeto</h2>
          <p>
            Los presentes Terminos de Servicio regulan la contratacion y prestacion de los servicios ofrecidos por
            Pablo Calleja Mena (&quot;PACAME&quot;), con domicilio en Madrid, Espana. PACAME es una agencia digital
            que ofrece servicios de diseno web, SEO, publicidad digital, gestion de redes sociales, branding e
            infraestructura tecnologica, asistidos por agentes de inteligencia artificial especializados y
            supervisados por profesionales humanos.
          </p>
          <p>
            Al contratar cualquier servicio de PACAME, el cliente acepta integramente estos terminos.
          </p>

          <h2 className="font-heading font-semibold text-lg text-pacame-white">2. Uso de Inteligencia Artificial</h2>
          <p>
            PACAME utiliza sistemas de inteligencia artificial como herramientas de asistencia en la creacion de
            contenido, diseno, analisis de datos y automatizacion de procesos. Estos sistemas:
          </p>
          <ul className="list-disc list-inside space-y-1 text-pacame-white/60">
            <li>Actuan bajo la supervision directa de profesionales humanos cualificados.</li>
            <li>No toman decisiones autonomas sobre el resultado final entregado al cliente.</li>
            <li>No utilizan los datos del cliente para entrenar modelos de IA de terceros.</li>
            <li>Todo contenido generado es revisado, verificado y aprobado por el equipo humano antes de su entrega.</li>
          </ul>
          <p>
            El responsable final de todos los entregables es Pablo Calleja Mena, quien supervisa cada proyecto
            personalmente.
          </p>

          <h2 className="font-heading font-semibold text-lg text-pacame-white">3. Proceso de contratacion</h2>
          <p>La contratacion de servicios sigue el siguiente proceso:</p>
          <ol className="list-decimal list-inside space-y-1 text-pacame-white/60">
            <li><strong className="text-pacame-white/80">Consulta inicial gratuita:</strong> reunion de 30 minutos sin compromiso para analizar las necesidades del cliente.</li>
            <li><strong className="text-pacame-white/80">Propuesta personalizada:</strong> presupuesto detallado con alcance, plazos y precio cerrado, entregado en un maximo de 24 horas.</li>
            <li><strong className="text-pacame-white/80">Aceptacion y pago:</strong> el cliente acepta la propuesta y realiza el pago correspondiente a traves de la plataforma segura Stripe.</li>
            <li><strong className="text-pacame-white/80">Ejecucion:</strong> el equipo de agentes IA, supervisado por Pablo Calleja, ejecuta el proyecto segun lo acordado.</li>
            <li><strong className="text-pacame-white/80">Entrega y revision:</strong> el cliente recibe los entregables y dispone de un periodo de revision para solicitar ajustes.</li>
          </ol>

          <h2 className="font-heading font-semibold text-lg text-pacame-white">4. Precios y pagos</h2>
          <ul className="list-disc list-inside space-y-1 text-pacame-white/60">
            <li>Todos los precios se expresan en euros (EUR) e incluyen IVA salvo que se indique lo contrario.</li>
            <li>Los pagos se procesan de forma segura a traves de <strong className="text-pacame-white/80">Stripe</strong>, certificado PCI DSS Level 1.</li>
            <li>Los servicios puntuales requieren el pago completo antes del inicio del trabajo.</li>
            <li>Los servicios recurrentes (mensuales) se facturan al inicio de cada periodo.</li>
            <li>PACAME se reserva el derecho de modificar los precios, notificando al cliente con al menos 30 dias de antelacion para servicios recurrentes.</li>
          </ul>

          <h2 className="font-heading font-semibold text-lg text-pacame-white">5. Plazos de entrega</h2>
          <p>
            Los plazos de entrega se establecen en cada propuesta individualizada. Como referencia general:
          </p>
          <ul className="list-disc list-inside space-y-1 text-pacame-white/60">
            <li>Landing pages: 2-5 dias laborables.</li>
            <li>Webs corporativas: 5-10 dias laborables.</li>
            <li>Proyectos integrales: segun alcance, detallado en la propuesta.</li>
          </ul>
          <p>
            Los plazos pueden verse afectados por la velocidad de respuesta del cliente en la provision de
            materiales, contenidos o aprobaciones necesarias. PACAME se compromete a comunicar cualquier
            retraso de forma proactiva.
          </p>

          <h2 className="font-heading font-semibold text-lg text-pacame-white">6. Propiedad intelectual</h2>
          <ul className="list-disc list-inside space-y-1 text-pacame-white/60">
            <li>Una vez completado el pago integro, todos los derechos de propiedad intelectual de los entregables se transfieren al cliente.</li>
            <li>PACAME conserva el derecho a utilizar los trabajos realizados como referencia en su portfolio y materiales comerciales, salvo que el cliente solicite expresamente lo contrario por escrito.</li>
            <li>Las herramientas, plantillas, frameworks y sistemas propios de PACAME permanecen como propiedad de PACAME y no se transfieren al cliente.</li>
            <li>El cliente garantiza que los materiales proporcionados (textos, imagenes, logos) son de su propiedad o tiene licencia para usarlos.</li>
          </ul>

          <h2 className="font-heading font-semibold text-lg text-pacame-white">7. Responsabilidad y garantias</h2>
          <p>
            PACAME se compromete a entregar un trabajo profesional y de calidad. En caso de que el cliente
            no quede satisfecho con el resultado:
          </p>
          <ul className="list-disc list-inside space-y-1 text-pacame-white/60">
            <li>Se ofrece un periodo de revision con ajustes incluidos segun lo especificado en la propuesta.</li>
            <li>Si tras las revisiones el cliente sigue insatisfecho, se valorara una devolucion parcial o total, evaluando caso por caso de buena fe.</li>
          </ul>
          <p>
            PACAME no se responsabiliza de resultados comerciales especificos (volumen de ventas, posicionamiento
            garantizado, numero de seguidores), ya que estos dependen de multiples factores externos. Si se
            responsabiliza de ejecutar las estrategias acordadas con diligencia profesional.
          </p>

          <h2 className="font-heading font-semibold text-lg text-pacame-white">8. Cancelacion y reembolsos</h2>
          <ul className="list-disc list-inside space-y-1 text-pacame-white/60">
            <li><strong className="text-pacame-white/80">Servicios puntuales:</strong> el cliente puede cancelar antes del inicio del trabajo con devolucion completa. Una vez iniciado el trabajo, se facturara proporcionalmente al trabajo realizado.</li>
            <li><strong className="text-pacame-white/80">Servicios recurrentes:</strong> el cliente puede cancelar en cualquier momento, sin permanencia. La cancelacion sera efectiva al final del periodo ya facturado.</li>
            <li>Las solicitudes de cancelacion deben enviarse a <a href="mailto:hola@pacameagencia.com" className="text-olympus-gold/70 hover:text-olympus-gold underline underline-offset-2">hola@pacameagencia.com</a>.</li>
          </ul>

          <h2 className="font-heading font-semibold text-lg text-pacame-white">9. Proteccion de datos</h2>
          <p>
            PACAME trata los datos personales del cliente conforme al Reglamento General de Proteccion de
            Datos (RGPD) y la Ley Organica de Proteccion de Datos y Garantia de los Derechos Digitales
            (LOPD-GDD). Para mas informacion, consulta nuestra{" "}
            <Link href="/privacidad" className="text-olympus-gold/70 hover:text-olympus-gold underline underline-offset-2">
              Politica de Privacidad
            </Link>.
          </p>

          <h2 className="font-heading font-semibold text-lg text-pacame-white">10. Resolucion de conflictos</h2>
          <p>
            En caso de controversia, ambas partes se comprometen a intentar resolverla de buena fe mediante
            negociacion directa. Si no se alcanza un acuerdo, ambas partes se someten a los juzgados y
            tribunales de Madrid, con aplicacion de la legislacion espanola.
          </p>

          <h2 className="font-heading font-semibold text-lg text-pacame-white">11. Modificaciones</h2>
          <p>
            PACAME se reserva el derecho de modificar estos Terminos de Servicio en cualquier momento. Los
            cambios se comunicaran a los clientes con servicios activos con un minimo de 30 dias de
            antelacion. El uso continuado de los servicios tras la notificacion implica la aceptacion de
            los nuevos terminos.
          </p>

          <h2 className="font-heading font-semibold text-lg text-pacame-white">12. Contacto</h2>
          <p>
            Para cualquier consulta relacionada con estos Terminos de Servicio, puedes contactarnos en:{" "}
            <a href="mailto:hola@pacameagencia.com" className="text-olympus-gold/70 hover:text-olympus-gold underline underline-offset-2">
              hola@pacameagencia.com
            </a>
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
            <Link href="/accesibilidad" className="text-xs text-pacame-white/40 hover:text-pacame-white/70 transition-colors">
              Accesibilidad
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
