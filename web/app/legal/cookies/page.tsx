/**
 * DarkRoom · /legal/cookies — Política de Cookies.
 *
 * Cumple LSSI 22.2 y RGPD. Documenta cookies técnicas, analíticas y
 * funcionales con detalle. Cero trackers de publicidad de terceros.
 */

import { ensureDarkRoomHost } from "@/lib/darkroom/host-guard";
import LegalDocument, {
  LegalSection,
  LegalP,
  LegalUL,
  LegalTable,
} from "@/components/darkroom/LegalDocument";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Política de Cookies · DarkRoom",
  description: "Política de cookies del servicio DarkRoom.",
};

export default async function CookiesPage() {
  await ensureDarkRoomHost();

  return (
    <LegalDocument
      title="Política de Cookies"
      meta="Versión 1.0 · pendiente de fecha de entrada en vigor"
    >
      <LegalSection number={1} title="¿Qué son las cookies?">
        <LegalP>
          Las cookies son pequeños archivos de texto que un sitio web instala en el dispositivo del usuario al navegarlo. Permiten reconocer al usuario, recordar sus preferencias y mejorar su experiencia de uso. Algunas cookies son esenciales para el funcionamiento básico del sitio; otras tienen finalidades analíticas o de marketing.
        </LegalP>
      </LegalSection>

      <LegalSection number={2} title="¿Qué cookies utiliza Dark Room?">
        <LegalP>
          Dark Room utiliza únicamente <strong>cookies estrictamente necesarias</strong> y <strong>cookies analíticas anonimizadas</strong> para mejorar el Servicio. <strong>No se utilizan cookies publicitarias de terceros.</strong>
        </LegalP>

        <h3 style={{ fontSize: 15, fontWeight: 600, margin: "20px 0 8px" }}>
          2.1 Cookies estrictamente necesarias (sin consentimiento previo, art. 22.2 LSSI)
        </h3>
        <LegalTable
          headers={["Nombre", "Proveedor", "Finalidad", "Duración"]}
          rows={[
            ["sb-access-token", "Dark Room (Supabase Auth)", "Autenticación de sesión", "Sesión"],
            ["sb-refresh-token", "Dark Room (Supabase Auth)", "Renovación segura del token", "7 días"],
            ["__darkroom_csrf", "Dark Room", "Protección CSRF en formularios", "Sesión"],
            ["darkroom_consent", "Dark Room", "Almacena la preferencia de consentimiento", "12 meses"],
          ]}
        />

        <h3 style={{ fontSize: 15, fontWeight: 600, margin: "20px 0 8px" }}>
          2.2 Cookies de proveedores de pago (esenciales para procesar transacciones)
        </h3>
        <LegalTable
          headers={["Nombre", "Proveedor", "Finalidad", "Duración"]}
          rows={[
            ["__stripe_mid", "Stripe", "Detección antifraude en el flujo de pago", "12 meses"],
            ["__stripe_sid", "Stripe", "Identificador de sesión de pago", "30 minutos"],
          ]}
        />

        <h3 style={{ fontSize: 15, fontWeight: 600, margin: "20px 0 8px" }}>
          2.3 Cookies analíticas (requieren consentimiento)
        </h3>
        <LegalTable
          headers={["Nombre", "Proveedor", "Finalidad", "Duración"]}
          rows={[
            [
              "_pa",
              "Plausible Analytics (sin IP, agregado)",
              "Analítica anónima de uso",
              "30 días",
            ],
          ]}
        />
        <LegalP>
          Plausible es un sistema de analítica respetuoso con la privacidad: <strong>no usa identificadores personales, no rastrea entre sitios y cumple RGPD por diseño</strong>. Aun así, se solicita consentimiento como buena práctica.
        </LegalP>
      </LegalSection>

      <LegalSection number={3} title="Cookies de terceros con fines publicitarios">
        <LegalP>
          <strong>Dark Room no instala cookies publicitarias de terceros</strong> (Google Ads, Meta Pixel, TikTok Pixel, LinkedIn Insight u otros). Esta política puede actualizarse en el futuro si se incorporan canales de marketing pagado, en cuyo caso se notificará a los usuarios y se solicitará consentimiento expreso.
        </LegalP>
      </LegalSection>

      <LegalSection number={4} title="Gestión del consentimiento">
        <LegalP>
          La primera vez que el usuario accede a la Plataforma, se muestra un banner de consentimiento que le permite:
        </LegalP>
        <LegalUL>
          <li><strong>Aceptar todas las cookies.</strong></li>
          <li><strong>Rechazar todas las no esenciales.</strong></li>
          <li><strong>Personalizar</strong> preferencias por categoría.</li>
        </LegalUL>
        <LegalP>
          El consentimiento se conserva durante 12 meses desde la última acción del usuario. Pasado ese plazo, el banner reaparece para renovar el consentimiento.
        </LegalP>
      </LegalSection>

      <LegalSection number={5} title="¿Cómo bloquear o eliminar cookies?">
        <LegalP>
          El usuario puede configurar su navegador para bloquear, eliminar o aceptar selectivamente las cookies. La forma de hacerlo varía según el navegador:
        </LegalP>
        <LegalUL>
          <li><strong>Chrome</strong>: <code>chrome://settings/cookies</code></li>
          <li><strong>Firefox</strong>: <code>about:preferences#privacy</code></li>
          <li><strong>Safari</strong>: Preferencias → Privacidad</li>
          <li><strong>Edge</strong>: <code>edge://settings/content/cookies</code></li>
        </LegalUL>
        <LegalP>
          Bloquear las cookies estrictamente necesarias puede impedir el correcto funcionamiento del Servicio (en particular, la autenticación y el procesamiento de pagos).
        </LegalP>
      </LegalSection>

      <LegalSection number={6} title="Modificaciones de la Política">
        <LegalP>
          Dark Room se reserva el derecho a modificar la presente Política de Cookies. Cualquier cambio significativo se notificará al usuario mediante el banner de consentimiento, requiriendo su renovación.
        </LegalP>
      </LegalSection>

      <LegalSection number={7} title="Contacto">
        <LegalP>
          Para cualquier consulta sobre esta Política de Cookies: <code>support@darkroomcreative.cloud</code>
        </LegalP>
      </LegalSection>
    </LegalDocument>
  );
}
