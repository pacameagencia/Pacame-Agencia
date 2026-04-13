import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Aviso Legal — PACAME",
  description: "Aviso legal e informacion sobre el titular de pacameagencia.com.",
  robots: { index: false, follow: false },
};

export default function AvisoLegalPage() {
  return (
    <div className="bg-pacame-black min-h-screen pt-36 pb-20">
      <div className="max-w-3xl mx-auto px-6">
        <h1 className="font-heading font-bold text-3xl text-pacame-white mb-8">
          Aviso Legal
        </h1>
        <div className="prose prose-invert prose-sm max-w-none font-body text-pacame-white/70 space-y-6">
          <p className="text-pacame-white/50 text-xs">Ultima actualizacion: Abril 2026</p>

          <h2 className="font-heading font-semibold text-lg text-pacame-white">1. Datos identificativos</h2>
          <p>
            En cumplimiento del articulo 10 de la Ley 34/2002, de 11 de julio, de Servicios de la Sociedad
            de la Informacion y de Comercio Electronico (LSSI-CE), se informa al usuario de los siguientes datos:
          </p>
          <ul className="list-disc list-inside space-y-1 text-pacame-white/60">
            <li><strong className="text-pacame-white/80">Titular:</strong> Pablo Calleja (&quot;PACAME&quot;)</li>
            <li><strong className="text-pacame-white/80">Domicilio:</strong> Madrid, Espana</li>
            <li><strong className="text-pacame-white/80">Email:</strong>{" "}
              <a href="mailto:hola@pacameagencia.com" className="text-electric-violet hover:underline">hola@pacameagencia.com</a>
            </li>
            <li><strong className="text-pacame-white/80">Telefono:</strong> +34 722 669 381</li>
            <li><strong className="text-pacame-white/80">Sitio web:</strong> pacameagencia.com</li>
          </ul>

          <h2 className="font-heading font-semibold text-lg text-pacame-white">2. Objeto</h2>
          <p>
            El presente sitio web tiene como finalidad proporcionar informacion sobre los servicios de
            marketing digital, diseno web, SEO, publicidad online y estrategia digital ofrecidos por PACAME.
          </p>

          <h2 className="font-heading font-semibold text-lg text-pacame-white">3. Propiedad intelectual e industrial</h2>
          <p>
            Todos los contenidos del sitio web (textos, imagenes, disenos, logotipos, codigo fuente, marcas)
            son propiedad de Pablo Calleja / PACAME o de sus respectivos titulares, y estan protegidos por
            las leyes de propiedad intelectual e industrial. Queda prohibida su reproduccion, distribucion,
            comunicacion publica o transformacion sin autorizacion expresa.
          </p>

          <h2 className="font-heading font-semibold text-lg text-pacame-white">4. Uso de inteligencia artificial</h2>
          <p>
            PACAME utiliza sistemas de inteligencia artificial como herramienta de trabajo para la prestacion
            de sus servicios. Los contenidos generados por IA son revisados y supervisados por personas fisicas.
            El uso de IA no exime al titular de su responsabilidad sobre los servicios prestados.
          </p>

          <h2 className="font-heading font-semibold text-lg text-pacame-white">5. Condiciones de uso</h2>
          <p>
            El usuario se compromete a utilizar el sitio web de conformidad con la ley, el presente aviso legal
            y las buenas costumbres. En particular, se compromete a no utilizar el sitio web con fines ilicitos
            o que puedan danar los derechos e intereses de terceros.
          </p>

          <h2 className="font-heading font-semibold text-lg text-pacame-white">6. Exclusion de responsabilidad</h2>
          <p>
            PACAME no se responsabiliza de los danos o perjuicios derivados de: errores u omisiones en los
            contenidos del sitio web, la falta de disponibilidad del sitio web, la transmision de virus a
            traves del sitio web, ni de los contenidos de sitios web de terceros enlazados desde este sitio.
          </p>

          <h2 className="font-heading font-semibold text-lg text-pacame-white">7. Enlaces a terceros</h2>
          <p>
            Este sitio web puede contener enlaces a sitios web de terceros. PACAME no se hace responsable del
            contenido, politicas de privacidad ni practicas de dichos sitios. El acceso a los mismos es bajo
            la exclusiva responsabilidad del usuario.
          </p>

          <h2 className="font-heading font-semibold text-lg text-pacame-white">8. Legislacion aplicable y jurisdiccion</h2>
          <p>
            Las presentes condiciones se rigen por la legislacion espanola. Para la resolucion de cualquier
            controversia, las partes se someten a los juzgados y tribunales de Madrid, salvo que la ley
            establezca otro fuero imperativo.
          </p>

          <h2 className="font-heading font-semibold text-lg text-pacame-white">9. Contacto</h2>
          <p>
            Para cualquier consulta sobre este aviso legal, puedes contactarnos en{" "}
            <a href="mailto:hola@pacameagencia.com" className="text-electric-violet hover:underline">hola@pacameagencia.com</a>.
          </p>

          <div className="pt-8 border-t border-white/[0.06] flex items-center gap-4">
            <Link href="/privacidad" className="text-sm text-electric-violet hover:underline font-body">
              Politica de privacidad
            </Link>
            <Link href="/cookies" className="text-sm text-electric-violet hover:underline font-body">
              Politica de cookies
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
