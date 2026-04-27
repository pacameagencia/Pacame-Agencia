import Link from "next/link";
import { EarningsCalculator } from "./_components/EarningsCalculator";
import { BrandsShowcase } from "./_components/BrandsShowcase";

type SearchParams = Promise<{ brand?: string }>;

export default async function AfiliadosPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;
  const initialBrand = sp.brand || "pacame";

  return (
    <main>
      {/* Hero */}
      <section className="border-b border-ink/10 bg-paper">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <span className="inline-block rounded-sm bg-mustard-500/20 px-3 py-1 text-xs uppercase tracking-wider text-ink">
            Programa de afiliados · 2026
          </span>
          <h1 className="mt-4 max-w-3xl font-heading text-5xl leading-tight md:text-6xl">
            Vive de recomendar lo que <span className="text-terracotta-500">mejor sabes vender</span>.
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-ink/70">
            Comisión fija en € por cada cliente que cierres. Sin permanencia, sin
            tope de ingresos, sin tarjeta. Eliges la marca que conoces (PACAME,
            SaaS o Dark Room) y compartes tu enlace — nosotros te pagamos en cuanto
            tu cliente paga.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-ink/70">
            <span className="inline-flex items-center gap-1.5">
              <span className="text-emerald-700">✓</span> Cero riesgo · 0 € de inversión
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="text-emerald-700">✓</span> Registro en 30 segundos
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="text-emerald-700">✓</span> Cobro 1-click vía Stripe a tu IBAN
            </span>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href={`/afiliados/registro?brand=${initialBrand}`}
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

      {/* Brands disponibles */}
      <section className="border-b border-ink/10 bg-ink text-paper">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <h2 className="font-heading text-3xl">Elige qué quieres vender</h2>
          <p className="mt-2 max-w-2xl text-paper/70">
            Cada marca tiene su público y su contenido propio. Si te registras
            como afiliado de Dark Room, solo verás material de Dark Room. Lo
            mismo con PACAME y con SaaS.
          </p>
          <div className="mt-8">
            <BrandsShowcase />
          </div>
        </div>
      </section>

      {/* Cómo funciona */}
      <section className="border-b border-ink/10 bg-paper">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <h2 className="font-heading text-3xl">Cómo funciona en 3 pasos</h2>
          <div className="mt-10 grid gap-8 md:grid-cols-3">
            <Step n={1} title="Te registras gratis y eliges una marca">
              En 30 segundos tienes tu enlace único{" "}
              <code className="rounded-sm bg-ink/5 px-1 text-xs">/?ref=TUCODIGO</code>{" "}
              y acceso a la biblioteca de contenido de tu marca.
            </Step>
            <Step n={2} title="Compartes y cierras ventas">
              Usa nuestros emails, posts y scripts ya escritos. Cookie de 30 días:
              si tu prospect compra dentro de un mes, la comisión es tuya.
            </Step>
            <Step n={3} title="Cobras automático en tu IBAN">
              Cada venta cerrada genera comisión fija. Cuando se aprueba, en 1 click
              te transferimos al IBAN o tarjeta que conectaste con Stripe.
            </Step>
          </div>
        </div>
      </section>

      {/* Perfiles */}
      <section className="border-b border-ink/10 bg-paper">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <h2 className="font-heading text-3xl">Para quién es esto</h2>
          <p className="mt-2 max-w-2xl text-sm text-ink/60">
            Si te dedicas a algo de esto, ya tienes audiencia que necesita lo
            que vendemos. Solo tienes que mandarles tu enlace.
          </p>
          <div className="mt-8 grid gap-5 md:grid-cols-3">
            <Profile
              role="Freelance digital"
              metric="3 webs PACAME/mes"
              monthly="360 €/mes"
              annual="4 320 €/año"
              text="Tus clientes te preguntan ¿quién me hace una web? Una respuesta cada semana = 3 ventas/mes."
            />
            <Profile
              role="Creador de contenido"
              metric="10 ventas SaaS/mes"
              monthly="60-150 €/mes"
              annual="recurrente si VIP"
              text="Tu audiencia confía en ti. Una recomendación de PacameGPT o Asesor Pro = comisión fija inmediata."
            />
            <Profile
              role="Comunidad Dark Room"
              metric="20 suscriptores/mes"
              monthly="100 €/mes"
              annual="1 200 €/año"
              text="5 € fijos por cada suscripción Dark Room de 24,99 €/mes que traigas. Sin tope, sin permanencia."
            />
          </div>
        </div>
      </section>

      {/* Calculadora honesta */}
      <section id="calculadora" className="border-b border-ink/10 bg-paper">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <h2 className="font-heading text-3xl">¿Cuánto puedes ganar al mes?</h2>
          <p className="mt-2 max-w-2xl text-sm text-ink/60">
            Cifra honesta: el ingreso del mes depende de las ventas del mes.
            <strong> Cada mes empiezas el contador desde cero</strong>. La gracia
            es que con un buen ritmo tienes ingresos previsibles cada mes.
          </p>
          <div className="mt-8">
            <EarningsCalculator defaultBrandSlug={initialBrand} />
          </div>
        </div>
      </section>

      {/* Garantía + transparencia */}
      <section className="border-b border-ink/10 bg-mustard-500/10">
        <div className="mx-auto max-w-4xl px-6 py-12 text-center">
          <h3 className="font-heading text-2xl">Cero riesgo. Cero letra pequeña.</h3>
          <p className="mt-3 text-sm text-ink/75">
            No necesitas tarjeta. No firmas permanencia. Si en 90 días no has cobrado nada,
            simplemente cierras la cuenta y no debes nada. Si vendes, cobras
            tu comisión fija al céntimo y el dinero llega a tu IBAN automáticamente
            vía Stripe (sin retenciones manuales).
          </p>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-4 text-xs text-ink/60">
            <span>📍 PACAME · Madrid · CIF español</span>
            <span>📞 +34 604 190 129</span>
            <span>✉️ hola@pacameagencia.com</span>
            <Link href="/afiliados/terminos" className="underline hover:no-underline">
              Términos del programa
            </Link>
          </div>
        </div>
      </section>

      {/* CTA final */}
      <section className="bg-terracotta-500 text-paper">
        <div className="mx-auto max-w-4xl px-6 py-16 text-center">
          <h2 className="font-heading text-4xl">Tu próximo cliente entra hoy.</h2>
          <p className="mt-4 text-paper/85">
            Activa tu enlace en 30 segundos y empieza a recomendar la marca
            que mejor encajes.
          </p>
          <Link
            href={`/afiliados/registro?brand=${initialBrand}`}
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

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="font-heading text-5xl text-terracotta-500/30">{String(n).padStart(2, "0")}</div>
      <h3 className="mt-2 font-heading text-xl">{title}</h3>
      <p className="mt-2 text-sm text-ink/70">{children}</p>
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
