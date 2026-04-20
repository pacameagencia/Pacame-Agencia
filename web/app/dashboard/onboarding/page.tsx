"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase/client";
import { dbCall } from "@/lib/dashboard-db";
import { ClipboardCheck, CheckCircle2, Circle, Plus, X, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ChecklistItem {
  id: string;
  client_id: string;
  item: string;
  category: string;
  completed: boolean;
  completed_at: string | null;
  notes: string;
  created_at: string;
}

interface Client {
  id: string;
  name: string;
  business_name: string;
  status: string;
}

const defaultChecklist = [
  { category: "Datos basicos", items: ["Recopilar datos del negocio", "Obtener acceso a redes sociales", "Recopilar brand guidelines existentes", "Definir persona de contacto"] },
  { category: "Tecnico", items: ["Acceso a dominio y hosting", "Acceso a Google Analytics", "Acceso a Google Search Console", "Configurar acceso a Meta Business"] },
  { category: "Estrategia", items: ["Diagnostico inicial con Sage", "Definir objetivos a 90 dias", "Aprobar propuesta de servicios", "Definir KPIs de seguimiento"] },
  { category: "Marca", items: ["Revisar identidad visual", "Definir tono de comunicacion", "Aprobar paleta y tipografias", "Crear templates de contenido"] },
  { category: "Lanzamiento", items: ["Publicar web/landing", "Configurar embudos", "Primer contenido publicado", "Primer reporte enviado"] },
];

export default function OnboardingPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showClientPicker, setShowClientPicker] = useState(false);
  const [initializingChecklist, setInitializingChecklist] = useState(false);

  useEffect(() => {
    fetchClients();
  }, []);

  useEffect(() => {
    if (selectedClient) fetchChecklist(selectedClient.id);
  }, [selectedClient]);

  async function fetchClients() {
    const { data } = await supabase
      .from("clients")
      .select("id, name, business_name, status")
      .order("created_at", { ascending: false });
    const list = data || [];
    setClients(list);
    // Auto-select first onboarding client or first client
    const onboarding = list.find((c) => c.status === "onboarding");
    if (onboarding) setSelectedClient(onboarding);
    else if (list.length > 0) setSelectedClient(list[0]);
    setLoading(false);
  }

  async function fetchChecklist(clientId: string) {
    const { data } = await supabase
      .from("onboarding_checklist")
      .select("*")
      .eq("client_id", clientId)
      .order("created_at", { ascending: true });
    setChecklist(data || []);
  }

  async function initializeChecklist() {
    if (!selectedClient) return;
    setInitializingChecklist(true);
    const items = defaultChecklist.flatMap((group) =>
      group.items.map((item) => ({
        client_id: selectedClient.id,
        item,
        category: group.category,
      }))
    );
    await dbCall({ table: "onboarding_checklist", op: "insert", data: items });
    await fetchChecklist(selectedClient.id);
    setInitializingChecklist(false);
  }

  async function toggleItem(item: ChecklistItem) {
    const newCompleted = !item.completed;
    await dbCall({
      table: "onboarding_checklist",
      op: "update",
      data: {
        completed: newCompleted,
        completed_at: newCompleted ? new Date().toISOString() : null,
      },
      filter: { column: "id", value: item.id },
    });
    setChecklist((prev) =>
      prev.map((i) =>
        i.id === item.id ? { ...i, completed: newCompleted, completed_at: newCompleted ? new Date().toISOString() : null } : i
      )
    );
  }

  // Group by category
  const groups = new Map<string, ChecklistItem[]>();
  for (const item of checklist) {
    const cat = item.category || "General";
    if (!groups.has(cat)) groups.set(cat, []);
    groups.get(cat)!.push(item);
  }

  const totalItems = checklist.length;
  const completedItems = checklist.filter((i) => i.completed).length;
  const progress = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading font-bold text-2xl text-pacame-white">Onboarding</h1>
          <p className="text-sm text-pacame-white/40 font-body mt-1">
            {loading ? "Cargando..." : `${clients.filter((c) => c.status === "onboarding").length} clientes en onboarding`}
          </p>
        </div>
      </div>

      {/* Client selector */}
      {clients.length > 0 && (
        <div className="relative">
          <button
            onClick={() => setShowClientPicker(!showClientPicker)}
            className="flex items-center gap-3 px-4 py-3 rounded-xl bg-dark-card border border-white/[0.06] hover:border-white/10 transition-all w-full"
          >
            <div className="w-8 h-8 rounded-lg bg-electric-violet/15 flex items-center justify-center">
              <ClipboardCheck className="w-4 h-4 text-electric-violet" />
            </div>
            <div className="text-left flex-1">
              <div className="text-sm font-heading font-semibold text-pacame-white">
                {selectedClient?.business_name || "Seleccionar cliente"}
              </div>
              <div className="text-xs text-pacame-white/40 font-body">{selectedClient?.name}</div>
            </div>
            {selectedClient && totalItems > 0 && (
              <div className="flex items-center gap-2 mr-2">
                <div className="w-24 h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                  <div className="h-full rounded-full bg-lime-pulse transition-all" style={{ width: `${progress}%` }} />
                </div>
                <span className="text-xs font-heading font-bold text-pacame-white/60">{progress}%</span>
              </div>
            )}
            <ChevronDown className={`w-4 h-4 text-pacame-white/30 transition-transform ${showClientPicker ? "rotate-180" : ""}`} />
          </button>

          {showClientPicker && (
            <div className="absolute top-full left-0 right-0 mt-2 rounded-xl bg-dark-card border border-white/[0.08] shadow-2xl z-20 overflow-hidden max-h-64 overflow-y-auto">
              {clients.map((client) => (
                <button
                  key={client.id}
                  onClick={() => { setSelectedClient(client); setShowClientPicker(false); }}
                  className={`flex items-center gap-3 px-4 py-2.5 w-full hover:bg-white/[0.04] transition-colors ${
                    client.id === selectedClient?.id ? "bg-white/[0.06]" : ""
                  }`}
                >
                  <span className="text-sm font-heading font-medium text-pacame-white">{client.business_name}</span>
                  <span className="text-xs text-pacame-white/30 font-body">{client.name}</span>
                  <span
                    className="text-[10px] px-2 py-0.5 rounded-full font-body ml-auto"
                    style={{
                      backgroundColor: client.status === "onboarding" ? "#D9770620" : client.status === "active" ? "#16A34A20" : "#6B728020",
                      color: client.status === "onboarding" ? "#D97706" : client.status === "active" ? "#16A34A" : "#6B7280",
                    }}
                  >
                    {client.status}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* No clients */}
      {!loading && clients.length === 0 && (
        <div className="rounded-2xl bg-dark-card border border-white/[0.06] p-12 text-center">
          <ClipboardCheck className="w-8 h-8 text-pacame-white/20 mx-auto mb-3" />
          <p className="text-sm text-pacame-white/40 font-body">Crea un cliente primero para gestionar su onboarding</p>
        </div>
      )}

      {/* Empty checklist - Initialize */}
      {selectedClient && checklist.length === 0 && !loading && (
        <div className="rounded-2xl bg-dark-card border border-white/[0.06] p-8 text-center">
          <ClipboardCheck className="w-10 h-10 text-pacame-white/20 mx-auto mb-3" />
          <p className="font-heading font-semibold text-pacame-white mb-1">Sin checklist</p>
          <p className="text-sm text-pacame-white/40 font-body mb-4">Inicializa el checklist de onboarding para {selectedClient.business_name}</p>
          <Button variant="gradient" size="sm" onClick={initializeChecklist} disabled={initializingChecklist} className="gap-1.5">
            <Plus className="w-4 h-4" />
            {initializingChecklist ? "Creando..." : "Crear checklist estandar"}
          </Button>
        </div>
      )}

      {/* Checklist groups */}
      {selectedClient && totalItems > 0 && (
        <>
          {/* Progress bar */}
          <div className="rounded-2xl bg-dark-card border border-white/[0.06] p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-heading font-semibold text-pacame-white">Progreso general</span>
              <span className="text-sm font-heading font-bold text-lime-pulse">{completedItems}/{totalItems}</span>
            </div>
            <div className="w-full h-2 rounded-full bg-white/[0.06] overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-electric-violet to-lime-pulse transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Groups */}
          {Array.from(groups.entries()).map(([category, items]) => {
            const groupCompleted = items.filter((i) => i.completed).length;
            return (
              <div key={category} className="rounded-2xl bg-dark-card border border-white/[0.06] overflow-hidden">
                <div className="px-5 py-3 border-b border-white/[0.04] bg-white/[0.02] flex items-center justify-between">
                  <h2 className="font-heading font-semibold text-sm text-pacame-white">{category}</h2>
                  <span className="text-xs text-pacame-white/40 font-body">{groupCompleted}/{items.length}</span>
                </div>
                <div className="divide-y divide-white/[0.04]">
                  {items.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => toggleItem(item)}
                      className="w-full flex items-center gap-3 px-5 py-3 hover:bg-white/[0.02] transition-colors text-left"
                    >
                      {item.completed ? (
                        <CheckCircle2 className="w-5 h-5 text-lime-pulse flex-shrink-0" />
                      ) : (
                        <Circle className="w-5 h-5 text-pacame-white/20 flex-shrink-0" />
                      )}
                      <span className={`text-sm font-body ${item.completed ? "text-pacame-white/30 line-through" : "text-pacame-white/70"}`}>
                        {item.item}
                      </span>
                      {item.completed_at && (
                        <span className="text-[10px] text-pacame-white/20 font-body ml-auto">
                          {new Date(item.completed_at).toLocaleDateString("es-ES")}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </>
      )}
    </div>
  );
}
