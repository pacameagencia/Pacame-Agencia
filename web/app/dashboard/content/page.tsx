"use client";

import { useState } from "react";
import {
  FileText, Check, X, Eye, Instagram, Linkedin, Facebook,
  Twitter, Clock, Bot, ChevronDown, Image,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const platformIcons: Record<string, React.ComponentType<{ className?: string; style?: React.CSSProperties }>> = {
  instagram: Instagram,
  linkedin: Linkedin,
  facebook: Facebook,
  twitter: Twitter,
};

const platformColors: Record<string, string> = {
  instagram: "#EC4899",
  linkedin: "#2563EB",
  facebook: "#3B82F6",
  twitter: "#06B6D4",
  blog: "#16A34A",
};

// Mock data
const mockContent = [
  {
    id: "1",
    client_name: "Clinica Dental Sol",
    platform: "instagram",
    content_type: "carousel",
    title: "5 senales de que necesitas un implante dental",
    body: "¿Sabias que el 30% de los adultos en Espana tiene al menos un diente perdido? 🦷\n\nEstas son las 5 senales de que podrias necesitar un implante:\n\n1. Dificultad para masticar\n2. Dolor al morder\n3. Espacios visibles\n4. Encías inflamadas\n5. Mandibula hundida\n\n¿Te identificas con alguna? Pide cita y te hacemos un diagnostico gratuito.\n\n📍 Clinica Dental Sol, Madrid\n📞 Enlace en bio",
    hashtags: "#implantesdentales #clinicadental #saludbucal #madrid #odontologia",
    image_prompt: "Professional dental clinic setting, modern and clean, close-up of a confident smile, warm lighting, medical but friendly atmosphere",
    status: "pending_review",
    quality_score: 4.2,
    subagents_used: ["pulse.instagram", "copy.social", "nova.artdirection"],
    scheduled_for: "2026-04-07T10:00:00Z",
    created_at: "2026-04-05T08:00:00Z",
  },
  {
    id: "2",
    client_name: "Clinica Dental Sol",
    platform: "instagram",
    content_type: "reel",
    title: "Antes y despues: blanqueamiento dental",
    body: "El cambio es real. ✨\n\nBlanqueamiento profesional en 45 minutos.\nResultados que duran hasta 2 anos.\n\n¿Cuanto cuesta? Desde 199€.\n\n🎬 Mira el antes y despues de nuestra paciente Laura.\n\n#blanqueamientodental #sonrisaperfecta #antesydespues #clinicadentalmadrid",
    hashtags: "#blanqueamientodental #sonrisaperfecta #clinicadental",
    image_prompt: "Before and after dental whitening, split screen, professional lighting, real results, warm tones",
    status: "pending_review",
    quality_score: 3.8,
    subagents_used: ["pulse.instagram", "copy.social"],
    scheduled_for: "2026-04-08T18:00:00Z",
    created_at: "2026-04-05T08:00:00Z",
  },
  {
    id: "3",
    client_name: "Restaurante El Patio",
    platform: "instagram",
    content_type: "post",
    title: "Menu del dia: jueves especial",
    body: "Hoy toca disfrutar. 🍽️\n\nMenu del jueves:\n🥗 Ensalada templada de queso de cabra\n🥘 Arroz meloso de bogavante\n🍮 Tarta de queso casera\n\nTodo por 14,90€. Con pan, bebida y café.\n\n📍 C/ Mayor 23, Albacete\n⏰ De 13:00 a 16:00\n📲 Reserva en el enlace de bio\n\n#menudeldia #restaurantealbacete #comidacasera #arrozmeloso",
    hashtags: "#menudeldia #restaurantealbacete #comidacasera",
    image_prompt: "Overhead shot of Spanish restaurant menu del dia, rice dish with lobster, warm natural light, rustic table setting",
    status: "pending_review",
    quality_score: 4.5,
    subagents_used: ["pulse.instagram", "copy.social", "nova.artdirection"],
    scheduled_for: "2026-04-07T11:30:00Z",
    created_at: "2026-04-05T08:15:00Z",
  },
];

export default function ContentReviewPage() {
  const [items, setItems] = useState(mockContent);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  function approve(id: string) {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, status: "approved" } : i)));
  }

  function reject(id: string) {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, status: "rejected" } : i)));
  }

  const pending = items.filter((i) => i.status === "pending_review");
  const reviewed = items.filter((i) => i.status !== "pending_review");

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="font-heading font-bold text-2xl text-pacame-white">Revisión de contenido</h1>
        <p className="text-sm text-pacame-white/40 font-body mt-1">
          {pending.length} pendiente{pending.length !== 1 ? "s" : ""} de aprobación
        </p>
      </div>

      {/* Pending review */}
      {pending.length === 0 ? (
        <div className="rounded-2xl bg-dark-card border border-white/[0.06] p-12 text-center">
          <Check className="w-10 h-10 text-lime-pulse mx-auto mb-3" />
          <p className="font-heading font-semibold text-pacame-white">Todo revisado</p>
          <p className="text-sm text-pacame-white/40 font-body mt-1">No hay contenido pendiente</p>
        </div>
      ) : (
        <div className="space-y-4">
          {pending.map((item) => {
            const PlatformIcon = platformIcons[item.platform] || FileText;
            const pColor = platformColors[item.platform] || "#7C3AED";
            const isExpanded = expandedId === item.id;

            return (
              <div
                key={item.id}
                className="rounded-2xl bg-dark-card border border-white/[0.06] overflow-hidden"
              >
                {/* Header */}
                <div className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center"
                          style={{ backgroundColor: `${pColor}20` }}
                        >
                          <PlatformIcon className="w-4 h-4" style={{ color: pColor }} />
                        </div>
                        <div>
                          <span className="text-xs text-pacame-white/40 font-body">{item.client_name}</span>
                          <div className="flex items-center gap-2">
                            <h3 className="font-heading font-semibold text-pacame-white text-sm">{item.title}</h3>
                            <span className="text-[10px] px-2 py-0.5 rounded-full font-body" style={{ backgroundColor: `${pColor}15`, color: pColor }}>
                              {item.content_type}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Body preview */}
                      <div className="mt-3 p-4 rounded-xl bg-white/[0.03] border border-white/[0.04]">
                        <p className="text-sm text-pacame-white/70 font-body whitespace-pre-line leading-relaxed">
                          {isExpanded ? item.body : item.body.slice(0, 200) + (item.body.length > 200 ? "..." : "")}
                        </p>
                        {item.body.length > 200 && (
                          <button
                            onClick={() => setExpandedId(isExpanded ? null : item.id)}
                            className="text-xs text-electric-violet hover:underline font-body mt-2 flex items-center gap-1"
                          >
                            {isExpanded ? "Ver menos" : "Ver todo"}
                            <ChevronDown className={`w-3 h-3 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                          </button>
                        )}
                      </div>

                      {/* Hashtags */}
                      {item.hashtags && (
                        <p className="text-xs text-electric-violet/50 font-body mt-2">{item.hashtags}</p>
                      )}

                      {/* Image prompt */}
                      {item.image_prompt && (
                        <div className="flex items-start gap-2 mt-3 p-2.5 rounded-lg bg-white/[0.02]">
                          <Image className="w-3.5 h-3.5 text-pacame-white/30 mt-0.5 flex-shrink-0" />
                          <p className="text-[11px] text-pacame-white/30 font-body">{item.image_prompt}</p>
                        </div>
                      )}

                      {/* Meta */}
                      <div className="flex items-center gap-4 mt-3">
                        <span className="flex items-center gap-1 text-[11px] text-pacame-white/30 font-body">
                          <Clock className="w-3 h-3" />
                          {new Date(item.scheduled_for).toLocaleDateString("es-ES", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                        </span>
                        <span className="flex items-center gap-1 text-[11px] text-pacame-white/30 font-body">
                          <Bot className="w-3 h-3" />
                          {item.subagents_used.join(" → ")}
                        </span>
                        <span className="text-[11px] font-body" style={{ color: item.quality_score >= 4 ? "#16A34A" : item.quality_score >= 3 ? "#D97706" : "#EF4444" }}>
                          QA: {item.quality_score}/5
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 px-5 py-3 border-t border-white/[0.04] bg-white/[0.02]">
                  <Button
                    size="sm"
                    variant="gradient"
                    onClick={() => approve(item.id)}
                    className="gap-1.5"
                  >
                    <Check className="w-3.5 h-3.5" />
                    Aprobar
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => reject(item.id)}
                    className="gap-1.5 text-red-400 border-red-400/30 hover:bg-red-400/10"
                  >
                    <X className="w-3.5 h-3.5" />
                    Rechazar
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Reviewed */}
      {reviewed.length > 0 && (
        <div>
          <h2 className="font-heading font-semibold text-lg text-pacame-white mb-3">Ya revisado</h2>
          <div className="space-y-2">
            {reviewed.map((item) => (
              <div key={item.id} className="flex items-center gap-3 p-3 rounded-xl bg-dark-card border border-white/[0.06] opacity-60">
                {item.status === "approved" ? (
                  <Check className="w-4 h-4 text-lime-pulse" />
                ) : (
                  <X className="w-4 h-4 text-red-400" />
                )}
                <span className="text-sm text-pacame-white/60 font-body">{item.client_name} — {item.title}</span>
                <span className="text-xs text-pacame-white/30 font-body ml-auto capitalize">{item.status === "approved" ? "Aprobado" : "Rechazado"}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
