import Link from "next/link";

export const metadata = {
  title: "Términos del Programa de Afiliados PACAME",
  description: "Reglas, comisiones, política de pagos, GDPR y causales de suspensión del programa de afiliados PACAME.",
};

export default function TerminosPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="font-heading text-4xl">Términos del Programa de Afiliados</h1>
      <p className="mt-2 text-sm text-ink/60">
        Última actualización: 27 de abril de 2026 · PACAME, Madrid (España)
      </p>

      <section className="mt-10 space-y-6 text-sm leading-relaxed text-ink/85">
        <Article id="1" title="¿Quién puede ser afiliado?">
          <p>
            Cualquier persona física o jurídica con email válido y método de
            cobro (IBAN, PayPal, Bizum, Revolut o Wise) puede registrarse en{" "}
            <Link href="/afiliados/registro" className="underline">/afiliados/registro</Link>.
          </p>
        </Article>

        <Article id="2" title="Marcas disponibles y comisiones">
          <p>
            Al registrarte eliges una marca: <strong>PACAME Agencia</strong>,
            <strong> SaaS Pablo</strong> o <strong>Dark Room</strong>. Solo verás
            material de venta y cobrarás comisiones de esa marca. Puedes pedir
            acceso a otras marcas desde tu panel.
          </p>
          <p className="mt-2">
            La <strong>comisión es fija en € por venta</strong>, no porcentaje.
            Cada producto tiene su importe definido en el panel admin (visible
            en tu calculadora). Por defecto cobras una sola vez por cliente
            cerrado. Si llegas a top seller, el admin puede subirte a tier
            VIP con comisión recurrente durante varios meses.
          </p>
        </Article>

        <Article id="3" title="Atribución (cookie)">
          <p>
            Atribución <strong>last-click</strong>: gana la comisión el último
            afiliado cuyo enlace usó el cliente antes de comprar. Cookie de
            <strong> 30 días</strong>: si tu prospect compra dentro de ese
            margen, la venta es tuya.
          </p>
        </Article>

        <Article id="4" title="Cómo se confirma una venta">
          <ol className="ml-5 list-decimal space-y-1.5">
            <li>Tu prospect llega por <code>?ref=TUCODIGO</code> y se le marca con cookie.</li>
            <li>Cuando paga vía Stripe, queda registrada la venta en tu panel.</li>
            <li>Pasa a <em>aprobada</em> a los 30 días (período de seguridad por refund).</li>
            <li>El admin procesa el pago en 1 click vía Stripe Connect a tu cuenta.</li>
          </ol>
        </Article>

        <Article id="5" title="Cómo cobras">
          <p>
            Conectas tu cuenta a través de <strong>Stripe Connect Express</strong>
            (formulario de Stripe que pide DNI, IBAN y datos fiscales). Stripe se
            encarga de la verificación KYC y de la retención fiscal aplicable
            según tu país de residencia. PACAME no retiene IRPF manualmente;
            Stripe lo gestiona automáticamente cuando es exigible.
          </p>
          <p className="mt-2">
            <strong>Pago mínimo: 1 €</strong>. Los importes inferiores se
            acumulan al siguiente ciclo. No hay coste por payout para el
            afiliado (PACAME asume las comisiones de Stripe).
          </p>
        </Article>

        <Article id="6" title="Refunds, chargebacks y comisiones anuladas">
          <p>
            Si tu cliente pide un refund o se da de baja antes del período de
            seguridad (60 días post-pago), la comisión correspondiente se
            <strong> anula automáticamente</strong>. Las comisiones ya pagadas
            que sufran un chargeback posterior se descuentan del siguiente
            payout del afiliado.
          </p>
        </Article>

        <Article id="7" title="Causales de suspensión inmediata">
          <ul className="ml-5 list-disc space-y-1.5">
            <li><strong>Self-referral</strong>: usar tu propio enlace para comprarte a ti mismo.</li>
            <li><strong>Cookie stuffing / iframes ocultos / clicks automáticos</strong>.</li>
            <li><strong>Múltiples cuentas</strong> del mismo titular para inflar comisiones.</li>
            <li>
              <strong>Claims falsos</strong>: prometer "garantizado", "sin
              riesgo", "dinero seguro" o cualquier afirmación sin base. España
              prohíbe estos mensajes (LGCU, AEPD).
            </li>
            <li>
              <strong>Spam de bajo nivel</strong>: links en comentarios de blogs,
              foros, mensajes masivos sin consentimiento del receptor.
            </li>
            <li><strong>Imagen de marca dañada</strong>: usar copys o creatividades modificadas que no aprobamos.</li>
          </ul>
          <p className="mt-2">
            La suspensión implica anulación de comisiones pendientes y bloqueo
            del panel. Las pagadas no se reembolsan salvo evidencia de fraude
            con perjuicio claro a PACAME.
          </p>
        </Article>

        <Article id="8" title="GDPR · cookies y datos personales">
          <p>
            El sistema usa cookies httpOnly de tracking de 30 días con base
            legal de "interés legítimo del programa de afiliados". El visitante
            tiene derecho a oponerse desde el banner de cookies de la web
            destino. PACAME guarda IP, user-agent y email del afiliado bajo
            las obligaciones GDPR — el afiliado puede solicitar acceso, rectificación
            o borrado escribiendo a <a href="mailto:hola@pacameagencia.com" className="underline">hola@pacameagencia.com</a>.
          </p>
        </Article>

        <Article id="9" title="Modificación de los términos">
          <p>
            PACAME puede actualizar estos términos. Notificaremos por email
            cualquier cambio sustancial con 7 días de antelación. Si no estás de
            acuerdo, puedes cerrar tu cuenta y se respetan tus comisiones
            aprobadas pendientes.
          </p>
        </Article>

        <Article id="10" title="Cierre de cuenta">
          <p>
            Puedes cerrar tu cuenta cuando quieras escribiendo a
            {" "}<a href="mailto:hola@pacameagencia.com" className="underline">hola@pacameagencia.com</a>.
            Las comisiones aprobadas se pagan en el siguiente ciclo. Las
            pendientes se anulan. Si en 90 días no has cobrado nada y cierras,
            no debes nada.
          </p>
        </Article>

        <Article id="11" title="Jurisdicción">
          <p>
            Estos términos se rigen por la legislación española. Cualquier
            disputa se somete a los tribunales de Madrid.
          </p>
        </Article>
      </section>

      <p className="mt-10 text-xs text-ink/55">
        PACAME · CIF español · Madrid · contacto: hola@pacameagencia.com · WhatsApp +34 604 190 129
      </p>
    </main>
  );
}

function Article({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <article id={id}>
      <h2 className="font-heading text-xl text-ink">{id}. {title}</h2>
      <div className="mt-2 space-y-2">{children}</div>
    </article>
  );
}
