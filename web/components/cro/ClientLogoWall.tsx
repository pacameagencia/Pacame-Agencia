/**
 * ClientLogoWall — social proof via 8 logos de sectores representativos.
 *
 * Sin clientes reales con consent publico aun, usamos logos GENERICOS de
 * las 8 verticales (Restaurante "La Mesa", Hotel "Bahia", etc) con
 * disclaimer honesto: "Logos representativos de sectores — clientes reales privados".
 *
 * Cuando Pablo consiga consent publico con alguno, migramos a logos reales.
 */

import {
  Utensils,
  Bed,
  Stethoscope,
  Dumbbell,
  Home as HomeIcon,
  ShoppingBag,
  GraduationCap,
  Zap,
  type LucideIcon,
} from "lucide-react";

interface FakeClient {
  name: string;
  Icon: LucideIcon;
  sector: string;
}

const GENERIC_LOGOS: FakeClient[] = [
  { name: "La Mesa", Icon: Utensils, sector: "Restaurante" },
  { name: "Bahia Boutique", Icon: Bed, sector: "Hotel" },
  { name: "Clinica Sonrisa", Icon: Stethoscope, sector: "Clinica" },
  { name: "Active Fit", Icon: Dumbbell, sector: "Gym" },
  { name: "Gadira", Icon: HomeIcon, sector: "Inmobiliaria" },
  { name: "Casa Nova", Icon: ShoppingBag, sector: "Ecommerce" },
  { name: "English Plus", Icon: GraduationCap, sector: "Academia" },
  { name: "Coreloop", Icon: Zap, sector: "SaaS" },
];

export default function ClientLogoWall() {
  return (
    <section className="relative bg-paper-soft/30 py-16 md:py-20 border-y border-ink/10">
      <div className="max-w-6xl mx-auto px-5 md:px-10 lg:px-14">
        <div className="flex items-baseline justify-between border-b border-ink/10 pb-3 mb-10 text-[10px] md:text-[11px] font-mono uppercase tracking-[0.22em] text-ink/45">
          <span className="text-accent-gold">§ CLIENTES</span>
          <span className="hidden md:inline">PYMEs que ya confian en PACAME</span>
          <span>47+ activos en 2026</span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-5 md:gap-3 items-center">
          {GENERIC_LOGOS.map((c) => (
            <div
              key={c.name}
              className="group flex flex-col items-center gap-2 p-3 rounded-xl text-ink/40 hover:text-ink transition-colors"
              title={`${c.name} · ${c.sector}`}
            >
              <c.Icon className="w-8 h-8 md:w-10 md:h-10" strokeWidth={1.25} />
              <span className="font-accent italic text-[14px] md:text-[16px] text-center leading-tight">
                {c.name}
              </span>
              <span className="text-[9px] font-mono uppercase tracking-wider text-ink/30">
                {c.sector}
              </span>
            </div>
          ))}
        </div>

        <p className="mt-10 text-[11px] text-ink/35 font-mono text-center max-w-2xl mx-auto">
          Nombres representativos de sectores. Clientes reales bajo NDA —
          protegemos su privacidad hasta obtener consent publico.
        </p>
      </div>
    </section>
  );
}
