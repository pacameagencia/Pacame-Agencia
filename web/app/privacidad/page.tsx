import type { Metadata } from "next";
import Link from "next/link";
import BreadcrumbJsonLd from "@/components/BreadcrumbJsonLd";

export const metadata: Metadata = {
  title: "Politica de Privacidad — PACAME",
  description: "Politica de privacidad y proteccion de datos de PACAME, conforme al RGPD.",
  robots: { index: false, follow: false },
};

export default function PrivacidadPage() {
  return (
    <div className="bg-pacame-black min-h-screen pt-32 pb-20">
      <BreadcrumbJsonLd
        items={[
          { name: "Inicio", url: "https://pacameagencia.com" },
          { name: "Privacidad", url: "https://pacameagencia.com/privacidad" },
        ]}
      />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="font-heading font-bold text-3xl text-pacame-white mb-8">
          Politica de Privacidad
        </h1>
        <div className="prose prose-invert prose-sm max-w-none font-body text-pacame-white/70 space-y-6">

          <p className="text-pacame-white/60 text-xs">Ultima actualizacion: Abril 2026</p>

          <h2 className="font-heading font-semibold text-lg text-pacame-white">1. Responsable del tratamiento</h2>
          <p>
            Pablo Calleja (&quot;PACAME&quot;)<br />
            Email: <a href="mailto:hola@pacameagencia.com" className="text-electric-violet hover:underline">hola@pacameagencia.com</a><br />
            Ubicacion: Madrid, Espana
          </p>

          <h2 className="font-heading font-semibold text-lg text-pacame-white">2. Datos que recopilamos</h2>
          <p>Recopilamos los siguientes datos personales cuando utilizas nuestros servicios:</p>
          <ul className="list-disc list-inside space-y-1 text-pacame-white/60">
            <li>Nombre y apellidos</li>
            <li>Direccion de correo electronico</li>
            <li>Numero de telefono (si lo proporcionas)</li>
            <li>Nombre de empresa</li>
            <li>Informacion sobre tu proyecto o necesidades digitales</li>
            <li>Datos de navegacion (cookies analiticas, con tu consentimiento)</li>
          </ul>

          <h2 className="font-heading font-semibold text-lg text-pacame-white">3. Finalidad del tratamiento</h2>
          <p>Utilizamos tus datos para:</p>
          <ul className="list-disc list-inside space-y-1 text-pacame-white/60">
            <li>Responder a tus consultas y solicitudes de presupuesto</li>
            <li>Prestarte los servicios contratados</li>
            <li>Enviarte comunicaciones comerciales (solo con tu consentimiento previo)</li>
            <li>Mejorar nuestros servicios y la experiencia de usuario</li>
          </ul>

          <h2 className="font-heading font-semibold text-lg text-pacame-white">4. Base legal</h2>
          <p>
            El tratamiento de tus datos se basa en tu consentimiento explicito (al enviar el formulario de contacto),
            la ejecucion de un contrato (cuando contratas nuestros servicios), y nuestro interes legitimo en mejorar
            la calidad del servicio.
          </p>

          <h2 className="font-heading font-semibold text-lg text-pacame-white">5. Uso de inteligencia artificial</h2>
          <p>
            PACAME utiliza agentes de inteligencia artificial para gestionar consultas, generar contenido y
            optimizar servicios. Los datos que compartas pueden ser procesados por estos sistemas de IA.
            Toda decision significativa es supervisada por un humano (Pablo Calleja).
            En ningun caso se utilizan tus datos para entrenar modelos de IA de terceros.
          </p>

          <h2 className="font-heading font-semibold text-lg text-pacame-white">6. Almacenamiento y seguridad</h2>
          <p>
            Tus datos se almacenan en Supabase, con servidores en la Union Europea, con encriptacion en transito
            y en reposo. Aplicamos medidas de seguridad tecnicas y organizativas para proteger tus datos.
          </p>

          <h2 className="font-heading font-semibold text-lg text-pacame-white">7. Tus derechos</h2>
          <p>Tienes derecho a:</p>
          <ul className="list-disc list-inside space-y-1 text-pacame-white/60">
            <li><strong className="text-pacame-white/80">Acceso:</strong> solicitar una copia de tus datos personales</li>
            <li><strong className="text-pacame-white/80">Rectificacion:</strong> corregir datos inexactos</li>
            <li><strong className="text-pacame-white/80">Supresion:</strong> solicitar la eliminacion de tus datos</li>
            <li><strong className="text-pacame-white/80">Portabilidad:</strong> recibir tus datos en formato estructurado</li>
            <li><strong className="text-pacame-white/80">Oposicion:</strong> oponerte al tratamiento de tus datos</li>
            <li><strong className="text-pacame-white/80">Limitacion:</strong> restringir el tratamiento en determinadas circunstancias</li>
          </ul>
          <p>
            Para ejercer cualquiera de estos derechos, escribe a{" "}
            <a href="mailto:hola@pacameagencia.com" className="text-electric-violet hover:underline">hola@pacameagencia.com</a>.
            Responderemos en un plazo maximo de 30 dias.
          </p>

          <h2 className="font-heading font-semibold text-lg text-pacame-white">8. Cookies</h2>
          <p>
            Utilizamos cookies estrictamente necesarias para el funcionamiento del sitio.
            Las cookies analiticas solo se activan con tu consentimiento explicito.
            Puedes gestionar tus preferencias de cookies en cualquier momento.
          </p>

          <h2 className="font-heading font-semibold text-lg text-pacame-white">9. Terceros</h2>
          <p>Compartimos datos con los siguientes proveedores, todos conforme al RGPD:</p>
          <ul className="list-disc list-inside space-y-1 text-pacame-white/60">
            <li>Supabase (base de datos — servidores UE)</li>
            <li>Stripe (procesamiento de pagos)</li>
            <li>Anthropic/Claude (procesamiento de IA)</li>
            <li>Vercel (alojamiento web)</li>
          </ul>

          <h2 className="font-heading font-semibold text-lg text-pacame-white">10. Contacto</h2>
          <p>
            Si tienes preguntas sobre esta politica o sobre el tratamiento de tus datos, contacta con nosotros
            en <a href="mailto:hola@pacameagencia.com" className="text-electric-violet hover:underline">hola@pacameagencia.com</a>.
          </p>
          <p>
            Tambien puedes presentar una reclamacion ante la Agencia Espanola de Proteccion de Datos (AEPD)
            en <span className="text-pacame-white/60">www.aepd.es</span>.
          </p>

          <div className="pt-8 border-t border-white/[0.06]">
            <Link href="/" className="text-sm text-electric-violet hover:underline font-body">
              Volver al inicio
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
