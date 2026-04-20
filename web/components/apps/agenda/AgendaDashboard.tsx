"use client";

import { useState } from "react";
import {
  Calendar,
  Clock,
  Users,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Copy,
  Plus,
  Edit2,
  Trash2,
  Code,
  Settings,
} from "lucide-react";

interface Booking {
  id: string;
  booking_number: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  scheduled_at: string;
  duration_min: number;
  status: string;
  service_id: string | null;
  agenda_services: { name: string } | null;
}
interface Service {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  duration_min: number;
  buffer_before_min: number;
  buffer_after_min: number;
  price_cents: number | null;
  capacity: number;
  is_active: boolean;
  sort_order: number;
}
interface HourRow {
  id: string;
  weekday: number;
  start_time: string;
  end_time: string;
  is_active: boolean;
}

const WEEKDAYS = ["Dom", "Lun", "Mar", "Mie", "Jue", "Vie", "Sab"];

const statusColors: Record<string, string> = {
  pending: "text-yellow-400 bg-yellow-400/10",
  confirmed: "text-green-400 bg-green-400/10",
  canceled: "text-red-400 bg-red-400/10",
  no_show: "text-orange-400 bg-orange-400/10",
  completed: "text-blue-400 bg-blue-400/10",
  rescheduled: "text-cyan-400 bg-cyan-400/10",
};

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleString("es-ES", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

interface Props {
  instanceId: string;
  businessName: string;
  timezone: string;
  confirmationMode: string;
  bookings: Booking[];
  services: Service[];
  hours: HourRow[];
  stats: {
    total_30d: number;
    confirmed: number;
    completed: number;
    canceled: number;
    no_show: number;
  };
}

export default function AgendaDashboard({
  instanceId,
  businessName,
  timezone,
  confirmationMode,
  bookings: initialBookings,
  services: initialServices,
  hours,
  stats,
}: Props) {
  const [tab, setTab] = useState<"bookings" | "services" | "hours" | "widget">("bookings");
  const [bookings, setBookings] = useState(initialBookings);
  const [services, setServices] = useState(initialServices);
  const [copyMsg, setCopyMsg] = useState<string | null>(null);

  async function updateBookingStatus(id: string, status: string) {
    const res = await fetch(`/api/apps/pacame-agenda/bookings/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      setBookings((bs) => bs.map((b) => (b.id === id ? { ...b, status } : b)));
    }
  }

  async function toggleService(serviceId: string, is_active: boolean) {
    const res = await fetch(`/api/apps/pacame-agenda/services/${serviceId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_active: !is_active }),
    });
    if (res.ok) {
      setServices((ss) =>
        ss.map((s) => (s.id === serviceId ? { ...s, is_active: !is_active } : s))
      );
    }
  }

  async function deleteService(serviceId: string) {
    if (!confirm("¿Eliminar este servicio? Las citas ya existentes mantendran referencia."))
      return;
    const res = await fetch(`/api/apps/pacame-agenda/services/${serviceId}`, {
      method: "DELETE",
    });
    if (res.ok) setServices((ss) => ss.filter((s) => s.id !== serviceId));
  }

  const widgetHtml = `<div data-pacame-agenda="${instanceId}" data-primary="#D4A574"></div>
<script src="https://pacameagencia.com/api/apps/pacame-agenda/widget.js" async></script>`;

  function copyWidget() {
    navigator.clipboard.writeText(widgetHtml);
    setCopyMsg("Codigo copiado");
    setTimeout(() => setCopyMsg(null), 2500);
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <header>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Calendar className="w-7 h-7 text-olympus-gold" />
              Agenda — {businessName}
            </h1>
            <p className="text-pacame-white/60 text-sm mt-1">
              Zona horaria: {timezone} · Modo confirmacion:{" "}
              <span
                className={
                  confirmationMode === "auto"
                    ? "text-green-400"
                    : "text-yellow-400"
                }
              >
                {confirmationMode === "auto" ? "Automatico" : "Manual"}
              </span>
            </p>
          </div>
        </div>
      </header>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Kpi label="Reservas 30d" value={String(stats.total_30d)} icon={<Calendar className="w-4 h-4" />} />
        <Kpi label="Confirmadas" value={String(stats.confirmed)} icon={<CheckCircle2 className="w-4 h-4 text-green-400" />} />
        <Kpi label="Completadas" value={String(stats.completed)} icon={<CheckCircle2 className="w-4 h-4 text-blue-400" />} />
        <Kpi label="Canceladas" value={String(stats.canceled)} icon={<XCircle className="w-4 h-4 text-red-400" />} />
        <Kpi label="No-show" value={String(stats.no_show)} icon={<AlertTriangle className="w-4 h-4 text-orange-400" />} />
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-white/[0.06]">
        {[
          { id: "bookings", label: "Citas", icon: Calendar },
          { id: "services", label: "Servicios", icon: Settings },
          { id: "hours", label: "Horarios", icon: Clock },
          { id: "widget", label: "Widget", icon: Code },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id as typeof tab)}
            className={`inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition ${
              tab === t.id
                ? "border-olympus-gold text-olympus-gold"
                : "border-transparent text-pacame-white/50 hover:text-pacame-white/80"
            }`}
          >
            <t.icon className="w-4 h-4" />
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab: Bookings */}
      {tab === "bookings" && (
        <div>
          {bookings.length === 0 ? (
            <EmptyState
              icon={<Users className="w-12 h-12 text-white/30" />}
              title="Sin citas aun"
              message="Instala el widget en tu web — pestaña Widget."
            />
          ) : (
            <div className="rounded-2xl border border-white/[0.06] overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-white/[0.03] text-xs uppercase text-white/50">
                  <tr>
                    <th className="text-left p-3">Num</th>
                    <th className="text-left p-3">Cliente</th>
                    <th className="text-left p-3">Servicio</th>
                    <th className="text-left p-3">Fecha</th>
                    <th className="text-left p-3">Estado</th>
                    <th className="text-left p-3">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map((b) => (
                    <tr key={b.id} className="border-t border-white/[0.04] hover:bg-white/[0.02]">
                      <td className="p-3 font-mono text-xs text-olympus-gold">{b.booking_number}</td>
                      <td className="p-3">
                        <div className="text-white">{b.customer_name}</div>
                        <div className="text-xs text-white/50">{b.customer_email}</div>
                      </td>
                      <td className="p-3 text-white/70">
                        {b.agenda_services?.name || "—"}
                        <div className="text-xs text-white/40">{b.duration_min} min</div>
                      </td>
                      <td className="p-3 text-white/70">{fmtDate(b.scheduled_at)}</td>
                      <td className="p-3">
                        <span
                          className={`inline-flex text-xs px-2 py-1 rounded-full ${
                            statusColors[b.status] || "text-white/60 bg-white/5"
                          }`}
                        >
                          {b.status}
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-1">
                          {b.status === "pending" && (
                            <button
                              onClick={() => updateBookingStatus(b.id, "confirmed")}
                              className="px-2 py-1 rounded-lg bg-green-500/10 text-green-400 text-xs hover:bg-green-500/20"
                            >
                              Confirmar
                            </button>
                          )}
                          {b.status === "confirmed" && (
                            <button
                              onClick={() => updateBookingStatus(b.id, "completed")}
                              className="px-2 py-1 rounded-lg bg-blue-500/10 text-blue-400 text-xs hover:bg-blue-500/20"
                            >
                              Completar
                            </button>
                          )}
                          {["pending", "confirmed"].includes(b.status) && (
                            <button
                              onClick={() => updateBookingStatus(b.id, "canceled")}
                              className="px-2 py-1 rounded-lg bg-white/[0.04] text-white/60 text-xs hover:bg-red-500/10 hover:text-red-400"
                            >
                              Cancelar
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab: Services */}
      {tab === "services" && (
        <ServicesTab
          instanceId={instanceId}
          services={services}
          onRefresh={async () => {
            const res = await fetch(`/api/apps/pacame-agenda/services?instance_id=${instanceId}`);
            if (res.ok) {
              const d = await res.json();
              if (d.services) setServices(d.services);
            }
          }}
          onToggle={toggleService}
          onDelete={deleteService}
        />
      )}

      {/* Tab: Hours */}
      {tab === "hours" && <HoursTab instanceId={instanceId} initialHours={hours} />}

      {/* Tab: Widget */}
      {tab === "widget" && (
        <div className="space-y-4">
          <div className="rounded-2xl p-5 bg-dark-card border border-white/[0.06]">
            <h2 className="font-heading font-semibold text-lg mb-2">
              Instala el widget en tu web
            </h2>
            <p className="text-sm text-pacame-white/60 font-body mb-4">
              Copia este codigo y pegalo en el HTML de tu web donde quieras que aparezca el
              calendario de reservas.
            </p>
            <div className="relative">
              <pre className="text-xs bg-black/40 border border-white/[0.04] rounded-lg p-4 overflow-x-auto text-pacame-white/80">
                <code>{widgetHtml}</code>
              </pre>
              <button
                onClick={copyWidget}
                className="absolute top-3 right-3 inline-flex items-center gap-1.5 bg-olympus-gold text-black px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-olympus-gold/90"
              >
                <Copy className="w-3.5 h-3.5" />
                Copiar
              </button>
            </div>
            {copyMsg && <p className="text-xs text-green-400 mt-2">{copyMsg}</p>}
          </div>

          <div className="rounded-2xl p-5 bg-white/[0.02] border border-white/[0.04]">
            <h3 className="font-heading font-semibold text-sm mb-2">Vista previa</h3>
            <iframe
              src={`/api/apps/pacame-agenda/embed?instance_id=${instanceId}`}
              className="w-full h-[520px] rounded-lg border border-white/[0.06] bg-white"
              title="Widget preview"
            />
          </div>
        </div>
      )}
    </div>
  );
}

function Kpi({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl p-4 bg-white/[0.03] border border-white/[0.06]">
      <div className="flex items-center gap-2 text-white/50 text-xs mb-1">
        {icon}
        {label}
      </div>
      <div className="font-bold text-2xl text-white">{value}</div>
    </div>
  );
}

function EmptyState({
  icon,
  title,
  message,
}: {
  icon: React.ReactNode;
  title: string;
  message: string;
}) {
  return (
    <div className="rounded-2xl p-12 bg-dark-card border border-white/[0.06] text-center">
      <div className="inline-block mb-4">{icon}</div>
      <h3 className="font-heading font-semibold text-white text-lg mb-1">{title}</h3>
      <p className="text-pacame-white/60 text-sm">{message}</p>
    </div>
  );
}

// ────────── ServicesTab ──────────

function ServicesTab({
  instanceId,
  services,
  onRefresh,
  onToggle,
  onDelete,
}: {
  instanceId: string;
  services: Service[];
  onRefresh: () => Promise<void>;
  onToggle: (id: string, active: boolean) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Service | null>(null);

  function openNew() {
    setEditing(null);
    setShowForm(true);
  }
  function openEdit(s: Service) {
    setEditing(s);
    setShowForm(true);
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="font-heading font-semibold text-lg">Servicios</h2>
        <button
          onClick={openNew}
          className="inline-flex items-center gap-2 bg-olympus-gold text-black font-semibold px-4 py-2 rounded-xl hover:bg-olympus-gold/90"
        >
          <Plus className="w-4 h-4" />
          Nuevo servicio
        </button>
      </div>

      {services.length === 0 ? (
        <EmptyState
          icon={<Settings className="w-12 h-12 text-white/30" />}
          title="Sin servicios configurados"
          message="Crea tu primer servicio para que los clientes puedan reservar."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {services.map((s) => (
            <div
              key={s.id}
              className={`rounded-xl p-4 border ${
                s.is_active
                  ? "bg-dark-card border-white/[0.08]"
                  : "bg-white/[0.01] border-white/[0.04] opacity-60"
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="font-semibold text-white">{s.name}</div>
                  <div className="text-xs text-white/50">
                    {s.duration_min} min · {s.price_cents ? `${s.price_cents / 100}€` : "gratis"}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openEdit(s)}
                    className="p-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08]"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-white/60" />
                  </button>
                  <button
                    onClick={() => onToggle(s.id, s.is_active)}
                    className="text-xs px-2 py-1 rounded-lg bg-white/[0.04] hover:bg-white/[0.08]"
                  >
                    {s.is_active ? "Desactivar" : "Activar"}
                  </button>
                  <button
                    onClick={() => onDelete(s.id)}
                    className="p-1.5 rounded-lg bg-white/[0.04] hover:bg-red-500/10 text-white/60 hover:text-red-400"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              {s.description && (
                <p className="text-xs text-white/50 mb-2 line-clamp-2">{s.description}</p>
              )}
              <div className="text-[10px] text-white/30 font-mono">
                buffer: {s.buffer_before_min}+{s.buffer_after_min} min · capacidad {s.capacity}
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <ServiceForm
          instanceId={instanceId}
          initial={editing}
          onClose={() => {
            setShowForm(false);
            setEditing(null);
          }}
          onSaved={async () => {
            setShowForm(false);
            setEditing(null);
            await onRefresh();
          }}
        />
      )}
    </div>
  );
}

function ServiceForm({
  instanceId,
  initial,
  onClose,
  onSaved,
}: {
  instanceId: string;
  initial: Service | null;
  onClose: () => void;
  onSaved: () => Promise<void>;
}) {
  const [name, setName] = useState(initial?.name || "");
  const [slug, setSlug] = useState(initial?.slug || "");
  const [description, setDescription] = useState(initial?.description || "");
  const [duration, setDuration] = useState(initial?.duration_min || 30);
  const [bufferAfter, setBufferAfter] = useState(initial?.buffer_after_min || 5);
  const [priceEur, setPriceEur] = useState(
    initial?.price_cents ? initial.price_cents / 100 : 0
  );
  const [capacity, setCapacity] = useState(initial?.capacity || 1);
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    const body = {
      instance_id: instanceId,
      name,
      slug: slug || name.toLowerCase().replace(/\s+/g, "-"),
      description: description || null,
      duration_min: duration,
      buffer_after_min: bufferAfter,
      price_cents: priceEur ? Math.round(priceEur * 100) : null,
      capacity,
      is_active: true,
    };
    const url = initial
      ? `/api/apps/pacame-agenda/services/${initial.id}`
      : `/api/apps/pacame-agenda/services`;
    const method = initial ? "PATCH" : "POST";
    await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    await onSaved();
    setSaving(false);
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-dark-card border border-white/[0.08] rounded-2xl p-6 max-w-md w-full space-y-4">
        <h3 className="font-heading font-bold text-xl text-white">
          {initial ? "Editar servicio" : "Nuevo servicio"}
        </h3>

        <Field label="Nombre">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={inputCls}
          />
        </Field>
        <Field label="Slug (URL)">
          <input
            value={slug}
            onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/\s+/g, "-"))}
            placeholder={name.toLowerCase().replace(/\s+/g, "-")}
            className={inputCls}
          />
        </Field>
        <Field label="Descripcion">
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className={inputCls + " min-h-[60px]"}
          />
        </Field>
        <div className="grid grid-cols-3 gap-3">
          <Field label="Duracion (min)">
            <input
              type="number"
              value={duration}
              onChange={(e) => setDuration(parseInt(e.target.value) || 0)}
              className={inputCls}
            />
          </Field>
          <Field label="Buffer post (min)">
            <input
              type="number"
              value={bufferAfter}
              onChange={(e) => setBufferAfter(parseInt(e.target.value) || 0)}
              className={inputCls}
            />
          </Field>
          <Field label="Capacidad">
            <input
              type="number"
              min={1}
              value={capacity}
              onChange={(e) => setCapacity(parseInt(e.target.value) || 1)}
              className={inputCls}
            />
          </Field>
        </div>
        <Field label="Precio (EUR, 0 = gratis)">
          <input
            type="number"
            min={0}
            step={0.01}
            value={priceEur}
            onChange={(e) => setPriceEur(parseFloat(e.target.value) || 0)}
            className={inputCls}
          />
        </Field>

        <div className="flex gap-2 pt-2">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-xl bg-white/[0.04] text-white/70 hover:bg-white/[0.08]"
          >
            Cancelar
          </button>
          <button
            onClick={save}
            disabled={saving || !name}
            className="flex-1 px-4 py-2.5 rounded-xl bg-olympus-gold text-black font-semibold disabled:opacity-50"
          >
            {saving ? "Guardando..." : "Guardar"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ────────── HoursTab ──────────

function HoursTab({
  instanceId,
  initialHours,
}: {
  instanceId: string;
  initialHours: HourRow[];
}) {
  const [hours, setHours] = useState(initialHours);

  async function addHour(weekday: number) {
    const res = await fetch(`/api/apps/pacame-agenda/hours`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        instance_id: instanceId,
        weekday,
        start_time: "09:00",
        end_time: "14:00",
      }),
    });
    if (res.ok) {
      const d = await res.json();
      if (d.hour) setHours((h) => [...h, d.hour]);
    }
  }

  async function deleteHour(id: string) {
    const res = await fetch(`/api/apps/pacame-agenda/hours/${id}`, {
      method: "DELETE",
    });
    if (res.ok) setHours((hs) => hs.filter((h) => h.id !== id));
  }

  return (
    <div className="space-y-3">
      <h2 className="font-heading font-semibold text-lg">Horarios de apertura</h2>
      <div className="rounded-2xl overflow-hidden border border-white/[0.06]">
        {WEEKDAYS.map((name, idx) => {
          const dayHours = hours.filter((h) => h.weekday === idx);
          return (
            <div
              key={idx}
              className="flex items-center gap-3 p-3 border-b border-white/[0.04] last:border-0 hover:bg-white/[0.02]"
            >
              <div className="w-16 text-sm font-semibold text-white">{name}</div>
              <div className="flex-1 flex flex-wrap gap-2">
                {dayHours.length === 0 ? (
                  <span className="text-xs text-white/40">Cerrado</span>
                ) : (
                  dayHours.map((h) => (
                    <span
                      key={h.id}
                      className="inline-flex items-center gap-1.5 bg-olympus-gold/10 text-olympus-gold text-xs px-2 py-1 rounded-full"
                    >
                      {h.start_time.slice(0, 5)} — {h.end_time.slice(0, 5)}
                      <button
                        onClick={() => deleteHour(h.id)}
                        className="hover:text-red-400 ml-1"
                      >
                        ×
                      </button>
                    </span>
                  ))
                )}
              </div>
              <button
                onClick={() => addHour(idx)}
                className="p-1.5 rounded-lg bg-white/[0.04] hover:bg-olympus-gold/10 text-white/60 hover:text-olympus-gold"
                title="Anadir franja"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
      <p className="text-xs text-white/40">
        Puedes anadir multiples franjas por dia (ej. 9-14h + 16-20h).
      </p>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-white/80 mb-1 block">{label}</span>
      {children}
    </label>
  );
}

const inputCls =
  "w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-white focus:border-olympus-gold/50 focus:outline-none text-sm";
