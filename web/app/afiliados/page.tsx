import Link from "next/link";
import { EarningsCalculator } from "./_components/EarningsCalculator";

export default function AfiliadosPage() {
  return (
    <main>
      {/* Hero */}
      <section className="border-b border-ink/10 bg-paper">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <span className="inline-block rounded-sm bg-mustard-500/20 px-3 py-1 text-xs uppercase tracking-wider text-ink">
            Programa de afiliados PACAME · 2026
          </span>
          <h1 className="mt-4 max-w-3xl font-heading text-5xl leading-tight md:text-6xl">
            Vive de recomendar <span className="text-terracotta-500">PACAME</span>.
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-ink/70">
            Cobra <strong>20 % de comisión durante 12 meses</strong> por cada
            cliente que pague gracias a ti. Sin permanencia, sin tope de
            ingresos, con material de venta ya hecho. Webs, SEO, ads, redes
            sociales, branding — todo lo que vendes son cosas que las PYMEs
            necesitan sí o sí.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-ink/70">
            <span className="inline-flex items-center gap-1.5">
              <span className="text-emerald-700">✓</span> Cero riesgo · 0 € de inversión
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="text-emerald-700">✓</span> Registro en 30 segundos
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="text-emerald-700">✓</span> Pago directo a tu IBAN, PayPal o Bizum
            </span>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/afiliados/registro"
              className="rounded-sm bg-terracotta-500 px-6 py-3 text-paper hover:bg-terracotta-600"
            >
              Quiero empezar a ganar dinero →
            </Link>
            <Link
              href="#calculadora"
              className="rounded-sm border border-ink/15 px-6 py-3 text-ink hover:bg-ink/5"
            >
              Calcular cuánto puedo ganar
            </Link>
          </div>
          <p className="mt-4 text-xs text-ink/50">
            Sin tarjeta · sin permanencia · panel pro incluido
          </p>
        </div>
      </section>

      {/* Social proof — números reales del programa */}
      <section className="border-b border-ink/10 bg-ink text-paper">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-6 px-6 py-10 md:grid-cols-4">
          <ProofStat number="20%" label="comisión recurrente" />
          <ProofStat number="12 meses" label="por cada cliente" />
          <ProofStat number="9 servicios" label="que puedes vender" />
          <ProofStat number="30 días" label="de cookie tracking" />
        </div>
      </section>

      {/* Beneficios */}
      <section className="border-b border-ink/10 bg-paper">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <div className="grid gap-6 md:grid-cols-3">
            <Benefit
              kicker="20%"
              title="recurrente · 12 meses"
              text="No es un pago único. Cada vez que tu cliente paga su suscripción, tú cobras. Hasta 12 meses por cliente, sin tope de cuántos clientes traes."
            />
            <Benefit
              kicker="48 h"
              title="comisión confirmada"
              text="Se ven en tu panel al instante. Pasan a ‘aprobado’ a los 30 días para cubrir refunds. Después: pago directo a tu IBAN, PayPal, Bizum, Revolut o Wise."
            />
            <Benefit
              kicker="0 €"
              title="material de venta hecho"
              text="Tienes biblioteca lista: emails, copys de WhatsApp, posts LinkedIn, banners, scripts. Solo cambias {NOMBRE} y envías."
            />
          </div>
        </div>
      </section>

      {/* Cómo funciona */}
      <section className="border-b border-ink/10 bg-paper">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <h2 className="font-heading text-3xl">Cómo funciona en 3 pasos</h2>
          <div className="mt-10 grid gap-8 md:grid-cols-3">
            <Step n={1} title="Te registras gratis">
              En 30 segundos tienes tu enlace único{" "}
              <code className="rounded-sm bg-ink/5 px-1 text-xs">pacameagencia.com/?ref=TUCODIGO</code>{" "}
              y acceso al panel pro.
            </Step>
            <Step n={2} title="Compartes y vendes">
              Usa nuestros emails, posts y scripts ya escritos. O monta tu
              propio funnel. Cookie de 30 días: si tu prospect compra dentro
              de un mes, la comisión es tuya.
            </Step>
            <Step n={3} title="Cobras cada mes">
              Cada pago de tu cliente genera una comisión. A los 30 días
              pasa a aprobada y la pagamos en tu medio elegido. Reporting
              total en tu panel.
            </Step>
          </div>
        </div>
      </section>

      {/* Perfiles tipo: para quién encaja */}
      <section className="border-b border-ink/10 bg-paper">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <h2 className="font-heading text-3xl">Para quién es esto</h2>
          <p className="mt-2 max-w-2xl text-sm text-ink/60">
            Si te dedicas a algo de esto, ya tienes audiencia que necesita PACAME. Solo tienes
            que mandarles tu enlace.
          </p>
          <div className="mt-8 grid gap-5 md:grid-cols-3">
            <Profile
              role="Freelance digital"
              metric="3 webs/mes"
              monthly="480 €/mes"
              annual="5 760 €/año"
              text="Ya recomiendas servicios a tus clientes. Ahora cobras por hacerlo. Tu trabajo: enviar 1 email a tu lista."
            />
            <Profile
              role="Consultor de negocios"
              metric="2 SEO + 2 Redes"
              monthly="198 €/mes recurrente"
              annual="2 376 €/año mes 1"
              text="Tus clientes preguntan ‘¿quién me lleva la web?’ cada semana. Una respuesta = 198 €/mes en tu cuenta."
            />
            <Profile
              role="Creador de contenido"
              metric="5 ventas/mes"
              monthly="800 €/mes recurrente"
              annual="9 600 €/año"
              text="Tu audiencia confía en ti. Una mención por semana en historias / hilos / vídeos = ingresos pasivos reales."
            />
          </div>
        </div>
      </section>

      {/* Calculadora */}
      <section id="calculadora" className="border-b border-ink/10 bg-paper">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <h2 className="font-heading text-3xl">¿Cuánto puedes ganar al mes?</h2>
          <p className="mt-2 text-sm text-ink/60">
            Mueve los sliders. La cifra anual cuenta solo el primer mes
            recurrente para no inflar — los meses 2-12 son adicionales.
          </p>
          <div className="mt-8">
            <EarningsCalculator />
          </div>
        </div>
      </section>

      {/* Productos */}
      <section className="border-b border-ink/10 bg-paper">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <h2 className="font-heading text-3xl">Qué vendes (y qué cobras)</h2>
          <p className="mt-2 text-sm text-ink/60">
            Comisión 20% sobre el precio pagado. En suscripciones cobras
            cada mes durante 12 meses.
          </p>
          <div className="mt-8 overflow-hidden rounded-md border border-ink/10">
            <table className="w-full text-sm">
              <thead className="bg-ink/5">
                <tr className="text-left">
                  <th className="px-4 py-3">Servicio</th>
                  <th className="px-4 py-3">Precio</th>
                  <th className="px-4 py-3 text-right">Tu comisión</th>
                  <th className="px-4 py-3 text-right">12 meses</th>
                </tr>
              </thead>
              <tbody>
                <ProductRow name="Landing Page" price="300 €" once kind="(único)" oneTime={60} months12={60} />
                <ProductRow name="Web Corporativa" price="800 €" once kind="(único)" oneTime={160} months12={160} />
                <ProductRow name="Plan Redes Sociales" price="197 €/mes" recurring oneTime={39.4} months12={472.8} />
                <ProductRow name="Plan SEO" price="297 €/mes" recurring oneTime={59.4} months12={712.8} />
                <ProductRow name="Pack Web + Redes" price="800 € + 167 €/mes" recurring oneTime={193.4} months12={1560.8} />
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Material */}
      <section className="border-b border-ink/10 bg-paper">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <h2 className="font-heading text-3xl">Material de venta listo</h2>
          <p className="mt-2 text-sm text-ink/60">
            Dentro del panel tienes una biblioteca con todo esto y va creciendo cada semana.
          </p>
          <ul className="mt-6 grid gap-3 md:grid-cols-2">
            <Asset>📧 Plantillas de email frío para PYMEs locales sin web</Asset>
            <Asset>📱 Mensajes de WhatsApp listos para enviar a contactos</Asset>
            <Asset>💼 Posts pre-redactados para LinkedIn y X/Twitter</Asset>
            <Asset>🎨 Banners 1200×630 para blog y redes</Asset>
            <Asset>📞 Scripts de presentación corta para llamadas y reuniones</Asset>
            <Asset>🧾 Copy CTA para meter en tus newsletters o blogs</Asset>
          </ul>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-paper">
        <div className="mx-auto max-w-3xl px-6 py-16">
          <h2 className="font-heading text-3xl">Preguntas frecuentes</h2>
          <div className="mt-8 space-y-4">
            <Faq q="¿Tengo que ser cliente de PACAME para ser afiliado?">
              No. Cualquier persona se registra gratis y al instante tiene
              acceso al panel y a su enlace único.
            </Faq>
            <Faq q="¿Cuándo cobro la comisión?">
              Cada pago de tu referido genera una comisión “pendiente”. A los
              30 días pasa a “aprobada” (para cubrir posibles refunds) y la
              pagamos en tu siguiente ciclo de payout.
            </Faq>
            <Faq q="¿Cómo cobro?">
              Eliges en tu perfil: IBAN (transferencia SEPA), PayPal, Bizum,
              Revolut o Wise.
            </Faq>
            <Faq q="¿Y si el cliente pide reembolso?">
              La comisión correspondiente se anula automáticamente. Justo —
              ni tú ni nosotros perdemos.
            </Faq>
            <Faq q="¿Puedo recomendar a alguien que ya conoce PACAME?">
              Sí, si llega por tu enlace o usa tu código en el checkout cuenta
              como tuyo. Si una persona viene primero por otro afiliado, gana
              quien le envió el link más reciente (last-click).
            </Faq>
            <Faq q="¿Hay tope o permanencia?">
              No. Cuantos más clientes traes, más cobras. Y puedes salir
              cuando quieras.
            </Faq>
            <Faq q="¿Tengo que facturar la comisión?">
              Sí. Eres autónomo o empresa fiscal — añade tu NIF/CIF en el
              perfil y emite factura mensual a PACAME por las comisiones
              aprobadas.
            </Faq>
          </div>
        </div>
      </section>

      {/* Garantía + transparencia */}
      <section className="border-b border-ink/10 bg-mustard-500/10">
        <div className="mx-auto max-w-4xl px-6 py-12 text-center">
          <h3 className="font-heading text-2xl">Cero riesgo. Cero letra pequeña.</h3>
          <p className="mt-3 text-sm text-ink/75">
            No necesitas tarjeta. No firmas permanencia. Si en 90 días no has cobrado nada,
            simplemente cierras la cuenta y no debes nada — esto no es para todo el mundo y
            lo sabemos. Si vendes, cobras lo prometido al céntimo.
          </p>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-4 text-xs text-ink/60">
            <span>📍 PACAME · Madrid · CIF español</span>
            <span>📞 +34 722 669 381</span>
            <span>✉️ hola@pacameagencia.com</span>
          </div>
        </div>
      </section>

      {/* CTA final */}
      <section className="bg-terracotta-500 text-paper">
        <div className="mx-auto max-w-4xl px-6 py-16 text-center">
          <h2 className="font-heading text-4xl">Tu próximo cliente entra hoy.</h2>
          <p className="mt-4 text-paper/85">
            Activa tu enlace en 30 segundos y empieza a recomendar PACAME ya.
          </p>
          <Link
            href="/afiliados/registro"
            className="mt-6 inline-block rounded-sm bg-paper px-6 py-3 text-ink hover:bg-paper/90"
          >
            Crear mi cuenta gratis →
          </Link>
          <p className="mt-3 text-xs text-paper/70">
            Tienes acceso al panel y a tu enlace en menos de 1 minuto.
          </p>
        </div>
      </section>
    </main>
  );
}

function ProofStat({ number, label }: { number: string; label: string }) {
  return (
    <div className="text-center">
      <div className="font-heading text-3xl text-mustard-500 md:text-4xl">{number}</div>
      <div className="mt-1 text-xs uppercase tracking-wider text-paper/70">{label}</div>
    </div>
  );
}

function Profile({
  role, metric, monthly, annual, text,
}: {
  role: string; metric: string; monthly: string; annual: string; text: string;
}) {
  return (
    <article className="rounded-md border border-ink/10 bg-paper p-5">
      <div className="text-xs uppercase tracking-wider text-ink/50">{role}</div>
      <div className="mt-2 font-heading text-xl text-ink">{metric}</div>
      <div className="mt-3 flex items-baseline gap-2">
        <span className="font-heading text-2xl text-terracotta-500">{monthly}</span>
        <span className="text-xs text-ink/50">{annual}</span>
      </div>
      <p className="mt-3 text-sm text-ink/70">{text}</p>
    </article>
  );
}

function Benefit({ kicker, title, text }: { kicker: string; title: string; text: string }) {
  return (
    <div className="rounded-md border border-ink/10 bg-paper p-6">
      <div className="font-heading text-3xl text-terracotta-500">{kicker}</div>
      <h3 className="mt-1 text-sm uppercase tracking-wide text-ink/60">{title}</h3>
      <p className="mt-3 text-sm text-ink/80">{text}</p>
    </div>
  );
}

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="font-heading text-5xl text-terracotta-500/30">{String(n).padStart(2, "0")}</div>
      <h3 className="mt-2 font-heading text-xl">{title}</h3>
      <p className="mt-2 text-sm text-ink/70">{children}</p>
    </div>
  );
}

function ProductRow({
  name, price, once, recurring, kind, oneTime, months12,
}: {
  name: string; price: string; once?: boolean; recurring?: boolean;
  kind?: string; oneTime: number; months12: number;
}) {
  return (
    <tr className="border-t border-ink/10">
      <td className="px-4 py-3 text-ink">{name}</td>
      <td className="px-4 py-3 text-ink/80">
        {price} {kind && <span className="text-xs text-ink/50">{kind}</span>}
      </td>
      <td className="px-4 py-3 text-right text-terracotta-500">
        {oneTime.toFixed(0)} €{recurring && "/mes"}
      </td>
      <td className="px-4 py-3 text-right font-medium">
        {months12.toFixed(0)} €{once && " (único)"}
      </td>
    </tr>
  );
}

function Asset({ children }: { children: React.ReactNode }) {
  return <li className="rounded-sm border border-ink/10 bg-paper p-3 text-sm text-ink/80">{children}</li>;
}

function Faq({ q, children }: { q: string; children: React.ReactNode }) {
  return (
    <details className="rounded-md border border-ink/10 bg-paper p-4">
      <summary className="cursor-pointer font-medium text-ink">{q}</summary>
      <p className="mt-3 text-sm text-ink/70">{children}</p>
    </details>
  );
}
