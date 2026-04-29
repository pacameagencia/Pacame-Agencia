"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft, Globe, Plus, RefreshCw, Send, Check, AlertCircle, ExternalLink,
  Loader2, Server, ShieldAlert, Eraser, FileText, Power, Archive, KeyRound,
} from "lucide-react";

type Client = {
  id: string;
  name: string;
  business_name: string;
  business_type: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  plan: string | null;
  monthly_fee: number | null;
  status: string;
  notes: string | null;
};

type ClientWebsite = {
  id: string;
  client_id: string;
  platform: string;
  base_url: string;
  label: string | null;
  wp_user: string | null;
  seo_plugin: "yoast" | "rankmath" | "none";
  woocommerce_enabled: boolean;
  status: "pending" | "connected" | "error" | "disconnected";
  last_sync_at: string | null;
  last_publish_at: string | null;
  last_error: string | null;
};

type BlogDraft = {
  id: string;
  title: string | null;
  status: string;
  created_at: string;
  external_url: string | null;
  external_id: string | null;
};

type Credential = {
  id: string;
  type: string;
  label: string | null;
  status: "pending" | "active" | "error" | "revoked";
  last_used_at: string | null;
  last_error: string | null;
  metadata: Record<string, unknown>;
};

type Backup = {
  id: string;
  source: string;
  scope: string;
  status: "pending" | "running" | "completed" | "failed";
  storage_url: string | null;
  triggered_by: string | null;
  notes: string | null;
  started_at: string;
  completed_at: string | null;
};

type WebsiteFormState = {
  base_url: string;
  wp_user: string;
  wp_app_password: string;
  seo_plugin: "yoast" | "rankmath" | "none";
  woocommerce_enabled: boolean;
};

type CredentialFormState = {
  type: "hostinger_api" | "sftp" | "ssh" | "mysql" | "generic_api";
  label: string;
  secret: string;
};

const emptyWebsiteForm: WebsiteFormState = {
  base_url: "",
  wp_user: "",
  wp_app_password: "",
  seo_plugin: "none",
  woocommerce_enabled: false,
};

const emptyCredForm: CredentialFormState = {
  type: "hostinger_api",
  label: "",
  secret: "",
};

const statusBadge: Record<ClientWebsite["status"], { label: string; color: string }> = {
  pending: { label: "Pendiente", color: "#D97706" },
  connected: { label: "Conectado", color: "#16A34A" },
  error: { label: "Error", color: "#EF4444" },
  disconnected: { label: "Desconectado", color: "#6B7280" },
};

const credBadge: Record<Credential["status"], { label: string; color: string }> = {
  pending: { label: "Pendiente", color: "#D97706" },
  active: { label: "Activa", color: "#16A34A" },
  error: { label: "Error", color: "#EF4444" },
  revoked: { label: "Revocada", color: "#6B7280" },
};

export default function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  const [client, setClient] = useState<Client | null>(null);
  const [websites, setWebsites] = useState<ClientWebsite[]>([]);
  const [drafts, setDrafts] = useState<BlogDraft[]>([]);
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [backups, setBackups] = useState<Backup[]>([]);
  const [loading, setLoading] = useState(true);

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<WebsiteFormState>(emptyWebsiteForm);
  const [saving, setSaving] = useState(false);

  const [showCredForm, setShowCredForm] = useState(false);
  const [credForm, setCredForm] = useState<CredentialFormState>(emptyCredForm);
  const [savingCred, setSavingCred] = useState(false);

  const [busyId, setBusyId] = useState<string | null>(null);
  const [busyDraftId, setBusyDraftId] = useState<string | null>(null);
  const [supportBusy, setSupportBusy] = useState<string | null>(null);
  const [supportOutput, setSupportOutput] = useState<{ kind: "ok" | "err"; data: unknown } | null>(null);
  const [feedback, setFeedback] = useState<{ kind: "ok" | "err"; message: string } | null>(null);

  useEffect(() => {
    void loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function loadAll() {
    setLoading(true);
    const [clientRes, draftsRes] = await Promise.all([
      supabase.from("clients").select("*").eq("id", id).maybeSingle(),
      supabase
        .from("content")
        .select("id, title, status, created_at, external_url, external_id")
        .eq("client_id", id)
        .eq("platform", "blog")
        .in("status", ["draft", "approved", "scheduled", "published"])
        .order("created_at", { ascending: false })
        .limit(20),
    ]);
    setClient((clientRes.data as Client | null) ?? null);
    setDrafts((draftsRes.data as BlogDraft[] | null) ?? []);
    await Promise.all([refreshWebsites(), refreshCredentials(), refreshBackups()]);
    setLoading(false);
  }

  async function refreshWebsites() {
    const res = await fetch(`/api/clients/${id}/websites`, { credentials: "include" });
    const json = await res.json().catch(() => ({}));
    setWebsites((json.websites as ClientWebsite[] | undefined) ?? []);
  }

  async function refreshCredentials() {
    const res = await fetch(`/api/clients/${id}/credentials`, { credentials: "include" });
    const json = await res.json().catch(() => ({}));
    setCredentials((json.credentials as Credential[] | undefined) ?? []);
  }

  async function refreshBackups() {
    const res = await fetch(`/api/clients/${id}/backups`, { credentials: "include" });
    const json = await res.json().catch(() => ({}));
    setBackups((json.backups as Backup[] | undefined) ?? []);
  }

  // --- WordPress ---
  async function handleConnect(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setFeedback(null);
    try {
      const createRes = await fetch(`/api/clients/${id}/websites`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          platform: "wordpress",
          base_url: form.base_url,
          wp_user: form.wp_user,
          wp_app_password: form.wp_app_password,
          seo_plugin: form.seo_plugin,
          woocommerce_enabled: form.woocommerce_enabled,
        }),
      });
      const created = await createRes.json();
      if (!createRes.ok) throw new Error(created.error || `HTTP ${createRes.status}`);
      const newId = created.website?.id as string;

      const testRes = await fetch(`/api/clients/${id}/websites/${newId}/test`, {
        method: "POST",
        credentials: "include",
      });
      const testJson = await testRes.json();
      if (!testRes.ok || testJson.ok === false) {
        throw new Error(`Conexión falló: ${testJson.error || "credenciales rechazadas"}`);
      }
      setFeedback({ kind: "ok", message: `Conectado como ${testJson.user?.name || form.wp_user}` });
      setForm(emptyWebsiteForm);
      setShowForm(false);
      await refreshWebsites();
    } catch (err) {
      setFeedback({ kind: "err", message: err instanceof Error ? err.message : "Error desconocido" });
    } finally {
      setSaving(false);
    }
  }

  async function handleTest(websiteId: string) {
    setBusyId(websiteId);
    setFeedback(null);
    try {
      const res = await fetch(`/api/clients/${id}/websites/${websiteId}/test`, {
        method: "POST",
        credentials: "include",
      });
      const json = await res.json();
      if (!res.ok || json.ok === false) throw new Error(json.error || "test failed");
      setFeedback({ kind: "ok", message: `OK · ${json.user?.name || "auth correcta"}` });
      await refreshWebsites();
    } catch (err) {
      setFeedback({ kind: "err", message: err instanceof Error ? err.message : "Error" });
      await refreshWebsites();
    } finally {
      setBusyId(null);
    }
  }

  async function handlePublish(websiteId: string, contentId: string, status: "draft" | "publish") {
    setBusyDraftId(contentId);
    setFeedback(null);
    try {
      const res = await fetch(`/api/clients/${id}/websites/${websiteId}/publish`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content_id: contentId, status }),
      });
      const json = await res.json();
      if (!res.ok || json.ok === false) throw new Error(json.error || "publish failed");
      setFeedback({
        kind: "ok",
        message: `${json.action === "created" ? "Publicado" : "Actualizado"} → ${json.post?.url || "sin URL"}`,
      });
      await loadAll();
    } catch (err) {
      setFeedback({ kind: "err", message: err instanceof Error ? err.message : "Error" });
    } finally {
      setBusyDraftId(null);
    }
  }

  // --- Credentials ---
  async function handleAddCredential(e: React.FormEvent) {
    e.preventDefault();
    setSavingCred(true);
    setFeedback(null);
    try {
      const res = await fetch(`/api/clients/${id}/credentials`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: credForm.type,
          label: credForm.label || undefined,
          secret: credForm.secret,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
      setFeedback({ kind: "ok", message: `Credencial ${credForm.type} guardada cifrada` });
      setCredForm(emptyCredForm);
      setShowCredForm(false);
      await refreshCredentials();
    } catch (err) {
      setFeedback({ kind: "err", message: err instanceof Error ? err.message : "Error" });
    } finally {
      setSavingCred(false);
    }
  }

  // --- Soporte: acciones rápidas Hostinger ---
  async function callHostinger(crid: string, method: "GET" | "POST", path: string) {
    setSupportBusy(`hostinger:${path}`);
    setSupportOutput(null);
    try {
      const res = await fetch(`/api/clients/${id}/credentials/${crid}/hostinger`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ method, path }),
      });
      const json = await res.json();
      if (!res.ok || json.ok === false) throw new Error(json.error || "hostinger call failed");
      setSupportOutput({ kind: "ok", data: json.data });
      await refreshCredentials();
    } catch (err) {
      setSupportOutput({ kind: "err", data: err instanceof Error ? err.message : "Error" });
    } finally {
      setSupportBusy(null);
    }
  }

  // --- Soporte: acciones rápidas Plugin MU ---
  async function callMu(wid: string, method: "GET" | "POST", path: string) {
    setSupportBusy(`mu:${path}`);
    setSupportOutput(null);
    try {
      const res = await fetch(`/api/clients/${id}/websites/${wid}/mu`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ method, path }),
      });
      const json = await res.json();
      if (!res.ok || json.ok === false) throw new Error(json.error || "MU call failed");
      setSupportOutput({ kind: "ok", data: json.data });
    } catch (err) {
      setSupportOutput({ kind: "err", data: err instanceof Error ? err.message : "Error" });
    } finally {
      setSupportBusy(null);
    }
  }

  async function registerManualBackup() {
    setSupportBusy("backup:register");
    setFeedback(null);
    try {
      const res = await fetch(`/api/clients/${id}/backups`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source: "manual_pablo",
          scope: "full",
          status: "completed",
          triggered_by: "pablo",
          notes: "Backup hecho manualmente en hPanel antes de operación PACAME",
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "no se pudo registrar backup");
      setFeedback({ kind: "ok", message: `Backup registrado · id=${json.backup?.id}` });
      await refreshBackups();
    } catch (err) {
      setFeedback({ kind: "err", message: err instanceof Error ? err.message : "Error" });
    } finally {
      setSupportBusy(null);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 text-pacame-white/30 animate-spin" />
      </div>
    );
  }

  if (!client) {
    return (
      <div className="space-y-4 max-w-3xl">
        <Link href="/dashboard/clients" className="inline-flex items-center gap-2 text-xs text-pacame-white/50 hover:text-pacame-white/70 font-body">
          <ArrowLeft className="w-3.5 h-3.5" /> Volver a clientes
        </Link>
        <div className="rounded-2xl bg-dark-card border border-white/[0.06] p-8 text-center">
          <p className="text-sm text-pacame-white/50 font-body">Cliente no encontrado.</p>
        </div>
      </div>
    );
  }

  const connectedWebsite = websites.find((w) => w.platform === "wordpress" && w.status === "connected");
  const hostingerCred = credentials.find((c) => c.type === "hostinger_api" && c.status !== "revoked");
  const recentBackup = backups.find((b) => b.status === "completed" && (Date.now() - new Date(b.completed_at!).getTime()) < 24 * 60 * 60 * 1000);

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/dashboard/clients" className="inline-flex items-center gap-2 text-xs text-pacame-white/50 hover:text-pacame-white/70 font-body mb-2">
            <ArrowLeft className="w-3.5 h-3.5" /> Volver a clientes
          </Link>
          <h1 className="font-heading font-bold text-2xl text-pacame-white">{client.business_name}</h1>
          <p className="text-sm text-pacame-white/40 font-body mt-1">
            {client.name} · {client.business_type || "sin sector"} · {client.plan || "sin plan"}
          </p>
        </div>
      </div>

      {feedback && (
        <div
          className={`rounded-lg p-3 text-sm font-body flex items-start gap-2 ${
            feedback.kind === "ok" ? "bg-lime-pulse/10 text-lime-pulse" : "bg-red-500/10 text-red-400"
          }`}
        >
          {feedback.kind === "ok" ? <Check className="w-4 h-4 mt-0.5 shrink-0" /> : <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* AVISO BACKUP */}
      <div className={`rounded-xl p-3 text-xs font-body flex items-start gap-2 border ${recentBackup ? "bg-lime-pulse/5 border-lime-pulse/20 text-lime-pulse" : "bg-amber-500/5 border-amber-500/20 text-amber-400/90"}`}>
        <ShieldAlert className="w-3.5 h-3.5 mt-0.5 shrink-0" />
        <div>
          <strong>Backup &lt; 24h:</strong>{" "}
          {recentBackup
            ? `OK (${new Date(recentBackup.completed_at!).toLocaleString("es-ES")} · ${recentBackup.source})`
            : "no hay. Operaciones de escritura están bloqueadas hasta registrar uno."}{" "}
          <button onClick={registerManualBackup} disabled={supportBusy === "backup:register"} className="underline hover:no-underline">
            Registrar backup manual
          </button>
        </div>
      </div>

      {/* SECCIÓN WORDPRESS */}
      <section className="rounded-2xl bg-dark-card border border-white/[0.06] p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-electric-violet" />
            <h2 className="font-heading font-semibold text-pacame-white">Sitio WordPress</h2>
          </div>
          {websites.length === 0 && !showForm && (
            <Button variant="gradient" size="sm" onClick={() => setShowForm(true)} className="gap-1.5">
              <Plus className="w-4 h-4" /> Conectar WP
            </Button>
          )}
        </div>

        {showForm && (
          <form onSubmit={handleConnect} className="space-y-3 p-4 rounded-xl bg-white/[0.02] border border-electric-violet/20">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input required placeholder="https://web-cliente.com" value={form.base_url} onChange={(e) => setForm({ ...form, base_url: e.target.value })}
                className="px-3 py-2 rounded-lg bg-white/[0.05] border border-white/[0.08] text-sm text-pacame-white font-body placeholder:text-pacame-white/30 focus:border-electric-violet/50 outline-none" />
              <input required placeholder="usuario WP (admin)" value={form.wp_user} onChange={(e) => setForm({ ...form, wp_user: e.target.value })}
                className="px-3 py-2 rounded-lg bg-white/[0.05] border border-white/[0.08] text-sm text-pacame-white font-body placeholder:text-pacame-white/30 focus:border-electric-violet/50 outline-none" />
              <input required placeholder="application password (xxxx xxxx xxxx xxxx xxxx xxxx)" value={form.wp_app_password} onChange={(e) => setForm({ ...form, wp_app_password: e.target.value })}
                className="px-3 py-2 rounded-lg bg-white/[0.05] border border-white/[0.08] text-sm text-pacame-white font-body placeholder:text-pacame-white/30 focus:border-electric-violet/50 outline-none md:col-span-2" />
              <select value={form.seo_plugin} onChange={(e) => setForm({ ...form, seo_plugin: e.target.value as WebsiteFormState["seo_plugin"] })}
                className="px-3 py-2 rounded-lg bg-white/[0.05] border border-white/[0.08] text-sm text-pacame-white font-body focus:border-electric-violet/50 outline-none">
                <option value="none" className="bg-dark-bg">Sin plugin SEO</option>
                <option value="yoast" className="bg-dark-bg">Yoast SEO</option>
                <option value="rankmath" className="bg-dark-bg">Rank Math</option>
              </select>
              <label className="flex items-center gap-2 text-sm text-pacame-white/70 font-body">
                <input type="checkbox" checked={form.woocommerce_enabled} onChange={(e) => setForm({ ...form, woocommerce_enabled: e.target.checked })} className="rounded" />
                WooCommerce activo
              </label>
            </div>
            <p className="text-xs text-pacame-white/40 font-body">
              Crea una application password en wp-admin → Usuarios → Tu perfil → Application Passwords. La guardaremos cifrada (AES-256-GCM).
            </p>
            <div className="flex gap-2">
              <Button type="submit" variant="gradient" size="sm" disabled={saving}>{saving ? "Conectando..." : "Conectar y verificar"}</Button>
              <button type="button" onClick={() => { setShowForm(false); setForm(emptyWebsiteForm); }} className="text-xs text-pacame-white/40 hover:text-pacame-white/60 font-body">Cancelar</button>
            </div>
          </form>
        )}

        {websites.length === 0 && !showForm && (
          <p className="text-sm text-pacame-white/40 font-body">Conecta el WordPress de {client.business_name} para que PACAME pueda publicar artículos en su blog directamente.</p>
        )}

        {websites.map((site) => {
          const badge = statusBadge[site.status];
          return (
            <div key={site.id} className="rounded-xl border border-white/[0.06] p-4 space-y-2">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <a href={site.base_url} target="_blank" rel="noopener noreferrer" className="text-sm font-heading text-pacame-white hover:text-electric-violet">{site.base_url.replace(/^https?:\/\//, "")}</a>
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-body font-medium" style={{ backgroundColor: `${badge.color}20`, color: badge.color }}>{badge.label}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/[0.05] text-pacame-white/50 font-body uppercase">{site.platform}</span>
                  </div>
                  <div className="text-xs text-pacame-white/50 font-body flex flex-wrap gap-x-3 gap-y-1">
                    <span>user: {site.wp_user || "—"}</span>
                    <span>SEO: {site.seo_plugin}</span>
                    {site.woocommerce_enabled && <span className="text-electric-violet/70">Woo</span>}
                    {site.last_sync_at && <span>último sync: {new Date(site.last_sync_at).toLocaleString("es-ES")}</span>}
                  </div>
                  {site.last_error && (<p className="text-xs text-red-400/80 font-body mt-1 truncate" title={site.last_error}>Error: {site.last_error}</p>)}
                </div>
                <div className="flex gap-2 shrink-0">
                  <button onClick={() => handleTest(site.id)} disabled={busyId === site.id}
                    className="text-xs px-3 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-pacame-white/70 font-body flex items-center gap-1 disabled:opacity-50">
                    {busyId === site.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />} Verificar
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </section>

      {/* SECCIÓN BLOG DRAFTS */}
      {connectedWebsite && (
        <section className="rounded-2xl bg-dark-card border border-white/[0.06] p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-heading font-semibold text-pacame-white">Artículos blog · listos para WP</h2>
            <span className="text-xs text-pacame-white/40 font-body">{drafts.length} en cola</span>
          </div>
          {drafts.length === 0 && (
            <p className="text-sm text-pacame-white/40 font-body">ATLAS aún no ha generado artículos para este cliente.</p>
          )}
          {drafts.map((draft) => (
            <div key={draft.id} className="rounded-xl border border-white/[0.06] p-3 flex items-center justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm text-pacame-white font-heading truncate">{draft.title || "(sin título)"}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/[0.05] text-pacame-white/50 font-body">{draft.status}</span>
                  {draft.external_url && (
                    <a href={draft.external_url} target="_blank" rel="noopener noreferrer" className="text-[10px] text-electric-violet/80 hover:text-electric-violet flex items-center gap-1 font-body">
                      <ExternalLink className="w-3 h-3" /> en WP
                    </a>
                  )}
                </div>
                <span className="text-xs text-pacame-white/40 font-body">creado {new Date(draft.created_at).toLocaleDateString("es-ES")}</span>
              </div>
              <div className="flex gap-2 shrink-0">
                <button onClick={() => handlePublish(connectedWebsite.id, draft.id, "draft")} disabled={busyDraftId === draft.id}
                  className="text-xs px-3 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-pacame-white/70 font-body flex items-center gap-1 disabled:opacity-50" title="Subir a WP como draft">
                  {busyDraftId === draft.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />} Draft
                </button>
                <button onClick={() => handlePublish(connectedWebsite.id, draft.id, "publish")} disabled={busyDraftId === draft.id}
                  className="text-xs px-3 py-1.5 rounded-lg bg-electric-violet/20 hover:bg-electric-violet/30 text-electric-violet font-body flex items-center gap-1 disabled:opacity-50" title="Publicar al blog del cliente">
                  {busyDraftId === draft.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />} Publicar
                </button>
              </div>
            </div>
          ))}
        </section>
      )}

      {/* SECCIÓN CREDENCIALES INFRA */}
      <section className="rounded-2xl bg-dark-card border border-white/[0.06] p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-electric-violet" />
            <h2 className="font-heading font-semibold text-pacame-white">Credenciales infra</h2>
          </div>
          {!showCredForm && (
            <Button variant="gradient" size="sm" onClick={() => setShowCredForm(true)} className="gap-1.5">
              <Plus className="w-4 h-4" /> Añadir credencial
            </Button>
          )}
        </div>

        {showCredForm && (
          <form onSubmit={handleAddCredential} className="space-y-3 p-4 rounded-xl bg-white/[0.02] border border-electric-violet/20">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <select value={credForm.type} onChange={(e) => setCredForm({ ...credForm, type: e.target.value as CredentialFormState["type"] })}
                className="px-3 py-2 rounded-lg bg-white/[0.05] border border-white/[0.08] text-sm text-pacame-white font-body focus:border-electric-violet/50 outline-none">
                <option value="hostinger_api" className="bg-dark-bg">Hostinger API</option>
                <option value="sftp" className="bg-dark-bg">SFTP</option>
                <option value="ssh" className="bg-dark-bg">SSH</option>
                <option value="mysql" className="bg-dark-bg">MySQL</option>
                <option value="generic_api" className="bg-dark-bg">Otra API</option>
              </select>
              <input placeholder="Etiqueta (ej: 'Hostinger principal')" value={credForm.label} onChange={(e) => setCredForm({ ...credForm, label: e.target.value })}
                className="px-3 py-2 rounded-lg bg-white/[0.05] border border-white/[0.08] text-sm text-pacame-white font-body placeholder:text-pacame-white/30 focus:border-electric-violet/50 outline-none" />
              <textarea required placeholder="Token / password / llave privada (se cifra AES-256-GCM al guardar)" value={credForm.secret} onChange={(e) => setCredForm({ ...credForm, secret: e.target.value })}
                rows={3}
                className="px-3 py-2 rounded-lg bg-white/[0.05] border border-white/[0.08] text-sm text-pacame-white font-body placeholder:text-pacame-white/30 focus:border-electric-violet/50 outline-none md:col-span-2 font-mono" />
            </div>
            <div className="flex gap-2">
              <Button type="submit" variant="gradient" size="sm" disabled={savingCred}>{savingCred ? "Guardando..." : "Guardar cifrada"}</Button>
              <button type="button" onClick={() => { setShowCredForm(false); setCredForm(emptyCredForm); }} className="text-xs text-pacame-white/40 hover:text-pacame-white/60 font-body">Cancelar</button>
            </div>
          </form>
        )}

        {credentials.length === 0 && !showCredForm && (
          <p className="text-sm text-pacame-white/40 font-body">Sin credenciales aún. Añade la API key de Hostinger del cliente para gestionar su infra.</p>
        )}

        {credentials.map((c) => {
          const b = credBadge[c.status];
          return (
            <div key={c.id} className="rounded-xl border border-white/[0.06] p-3 flex items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm text-pacame-white font-heading">{c.label || c.type}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-body font-medium" style={{ backgroundColor: `${b.color}20`, color: b.color }}>{b.label}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/[0.05] text-pacame-white/50 font-body uppercase">{c.type}</span>
                </div>
                {c.last_used_at && <span className="text-xs text-pacame-white/40 font-body">último uso: {new Date(c.last_used_at).toLocaleString("es-ES")}</span>}
                {c.last_error && <p className="text-xs text-red-400/80 font-body mt-1 truncate" title={c.last_error}>Error: {c.last_error}</p>}
              </div>
            </div>
          );
        })}
      </section>

      {/* SECCIÓN SOPORTE — ACCIONES RÁPIDAS */}
      {(hostingerCred || connectedWebsite) && (
        <section className="rounded-2xl bg-dark-card border border-white/[0.06] p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Server className="w-4 h-4 text-electric-violet" />
            <h2 className="font-heading font-semibold text-pacame-white">Soporte rápido</h2>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400/80 font-body">solo lectura por defecto</span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {hostingerCred && (
              <>
                <SupportBtn icon={<Globe className="w-3.5 h-3.5" />} label="Listar dominios" busy={supportBusy === "hostinger:domains/v1/portfolio"}
                  onClick={() => callHostinger(hostingerCred.id, "GET", "domains/v1/portfolio")} />
                <SupportBtn icon={<Server className="w-3.5 h-3.5" />} label="Listar servicios" busy={supportBusy === "hostinger:billing/v1/subscriptions"}
                  onClick={() => callHostinger(hostingerCred.id, "GET", "billing/v1/subscriptions")} />
                <SupportBtn icon={<Server className="w-3.5 h-3.5" />} label="Listar VPS" busy={supportBusy === "hostinger:vps/v1/virtual-machines"}
                  onClick={() => callHostinger(hostingerCred.id, "GET", "vps/v1/virtual-machines")} />
              </>
            )}
            {connectedWebsite && (
              <>
                <SupportBtn icon={<FileText className="w-3.5 h-3.5" />} label="System info WP" busy={supportBusy === "mu:system/info"}
                  onClick={() => callMu(connectedWebsite.id, "GET", "system/info")} />
                <SupportBtn icon={<FileText className="w-3.5 h-3.5" />} label="Logs PHP" busy={supportBusy === "mu:logs/php"}
                  onClick={() => callMu(connectedWebsite.id, "GET", "logs/php")} />
                <SupportBtn icon={<Power className="w-3.5 h-3.5" />} label="Listar plugins" busy={supportBusy === "mu:plugins"}
                  onClick={() => callMu(connectedWebsite.id, "GET", "plugins")} />
                <SupportBtn icon={<Eraser className="w-3.5 h-3.5" />} label="Limpiar cachés" busy={supportBusy === "mu:cache/clear"}
                  onClick={() => callMu(connectedWebsite.id, "POST", "cache/clear")} />
              </>
            )}
          </div>

          {supportOutput && (
            <div className={`rounded-xl p-3 ${supportOutput.kind === "ok" ? "bg-lime-pulse/5 border border-lime-pulse/20" : "bg-red-500/5 border border-red-500/20"}`}>
              <pre className="text-[11px] font-mono text-pacame-white/80 overflow-x-auto max-h-80 whitespace-pre-wrap">
                {typeof supportOutput.data === "string" ? supportOutput.data : JSON.stringify(supportOutput.data, null, 2)}
              </pre>
            </div>
          )}
        </section>
      )}

      {/* SECCIÓN BACKUPS */}
      <section className="rounded-2xl bg-dark-card border border-white/[0.06] p-6 space-y-3">
        <div className="flex items-center gap-2">
          <Archive className="w-4 h-4 text-electric-violet" />
          <h2 className="font-heading font-semibold text-pacame-white">Backups</h2>
        </div>
        {backups.length === 0 && <p className="text-sm text-pacame-white/40 font-body">Sin backups registrados.</p>}
        {backups.map((b) => (
          <div key={b.id} className="rounded-xl border border-white/[0.06] p-3 text-xs font-body text-pacame-white/70 flex items-center justify-between gap-3">
            <div>
              <span className="text-pacame-white">{b.source}</span> · {b.scope} · <span style={{ color: b.status === "completed" ? "#16A34A" : b.status === "failed" ? "#EF4444" : "#D97706" }}>{b.status}</span>
              {b.notes && <span className="block text-pacame-white/40 mt-0.5">{b.notes}</span>}
            </div>
            <span className="text-pacame-white/40">{new Date(b.started_at).toLocaleString("es-ES")}</span>
          </div>
        ))}
      </section>
    </div>
  );
}

function SupportBtn({ icon, label, busy, onClick }: { icon: React.ReactNode; label: string; busy: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} disabled={busy}
      className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-xs text-pacame-white/80 font-body transition-colors disabled:opacity-50">
      {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : icon}
      <span className="truncate">{label}</span>
    </button>
  );
}
