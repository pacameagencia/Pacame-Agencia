"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Loader2,
  FileUp,
  Trash2,
  Download,
  Image,
  FileText,
  File,
  Upload,
  Grid3x3,
  List,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import ScrollReveal, { StaggerContainer, StaggerItem } from "@/components/ui/scroll-reveal";
import { useToast } from "@/components/ui/toast";

interface ClientFile {
  id: string;
  filename: string;
  file_url: string;
  file_type: "logo" | "brand_asset" | "content" | "document" | "other";
  file_size: number;
  uploaded_by: string;
  created_at: string;
}

const typeConfig: Record<string, { label: string; color: string; Icon: typeof File }> = {
  logo: { label: "Logo", color: "#E8B730", Icon: Image },
  brand_asset: { label: "Marca", color: "#B54E30", Icon: Image },
  content: { label: "Contenido", color: "#283B70", Icon: FileText },
  document: { label: "Documento", color: "#84CC16", Icon: FileText },
  other: { label: "Otro", color: "#6B7280", Icon: File },
};

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function FilesPage() {
  const { toast } = useToast();
  const [files, setFiles] = useState<ClientFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [dragOver, setDragOver] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchFiles = useCallback(async () => {
    try {
      const res = await fetch("/api/client-files");
      if (!res.ok) throw new Error("Error al cargar archivos");
      const result = (await res.json()) as { files: ClientFile[] };
      setFiles(result.files);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  async function handleUpload(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;
    setUploading(true);
    setError(null);

    try {
      for (const file of Array.from(fileList)) {
        const formData = new FormData();
        formData.append("file", file);

        const res = await fetch("/api/client-files", {
          method: "POST",
          body: formData,
        });

        if (!res.ok) {
          const errData = (await res.json()) as { error?: string };
          throw new Error(errData.error ?? `Error al subir ${file.name}`);
        }
      }
      await fetchFiles();
      toast({
        variant: "success",
        title: fileList.length === 1 ? "Archivo subido" : `${fileList.length} archivos subidos`,
        description: "Tu equipo PACAME ya puede verlo.",
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error al subir";
      setError(msg);
      toast({ variant: "error", title: "Error al subir", description: msg });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleDelete(fileId: string) {
    setDeletingId(fileId);
    try {
      const res = await fetch("/api/client-files", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileId }),
      });
      if (!res.ok) throw new Error("Error al eliminar");
      setFiles((prev) => prev.filter((f) => f.id !== fileId));
      toast({ variant: "success", title: "Archivo eliminado" });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error al eliminar";
      setError(msg);
      toast({ variant: "error", title: "No se pudo eliminar", description: msg });
    } finally {
      setDeletingId(null);
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    handleUpload(e.dataTransfer.files);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-brand-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <ScrollReveal>
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <FileUp className="w-6 h-6 text-cyan-spark" />
              <h1 className="font-heading font-bold text-2xl text-ink">Archivos</h1>
            </div>
            <p className="text-sm text-ink/50 font-body">
              {files.length} archivo{files.length !== 1 ? "s" : ""} subido{files.length !== 1 ? "s" : ""}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-2 rounded-lg transition-colors ${
                viewMode === "grid" ? "bg-white/[0.08] text-ink" : "text-ink/30 hover:text-ink/60"
              }`}
            >
              <Grid3x3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-2 rounded-lg transition-colors ${
                viewMode === "list" ? "bg-white/[0.08] text-ink" : "text-ink/30 hover:text-ink/60"
              }`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </ScrollReveal>

      {/* Upload zone */}
      <ScrollReveal delay={0.05}>
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`relative rounded-2xl border-2 border-dashed p-10 text-center cursor-pointer transition-all duration-300 ${
            dragOver
              ? "border-brand-primary bg-brand-primary/5"
              : "border-ink/[0.1] hover:border-white/[0.2] bg-paper-deep"
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={(e) => handleUpload(e.target.files)}
          />
          {uploading ? (
            <Loader2 className="w-8 h-8 animate-spin text-brand-primary mx-auto" />
          ) : (
            <>
              <Upload className="w-10 h-10 text-ink/20 mx-auto mb-3" />
              <p className="font-heading font-semibold text-sm text-ink mb-1">
                Arrastra archivos aqui o haz clic para subir
              </p>
              <p className="text-[11px] text-ink/30 font-body">
                Logos, documentos, recursos de marca... hasta 10 MB por archivo
              </p>
            </>
          )}
        </div>
      </ScrollReveal>

      {/* Error */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-accent-burgundy-soft/10 border border-accent-burgundy-soft/20 rounded-xl p-3 flex items-center justify-between"
          >
            <p className="text-sm text-accent-burgundy-soft font-body">{error}</p>
            <button onClick={() => setError(null)}>
              <X className="w-4 h-4 text-accent-burgundy-soft/60 hover:text-accent-burgundy-soft" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Files */}
      {files.length === 0 ? (
        <div className="text-center py-16">
          <File className="w-12 h-12 text-ink/10 mx-auto mb-3" />
          <p className="text-sm text-ink/30 font-body">Aun no hay archivos subidos</p>
        </div>
      ) : viewMode === "grid" ? (
        <StaggerContainer className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4" staggerDelay={0.04}>
          {files.map((file) => {
            const cfg = typeConfig[file.file_type] ?? typeConfig.other;
            const FileIcon = cfg.Icon;
            return (
              <StaggerItem key={file.id}>
                <div className="bg-paper-deep border border-ink/[0.06] rounded-2xl p-4 group hover:border-ink/[0.12] transition-colors relative">
                  {/* Type badge */}
                  <span
                    className="absolute top-3 right-3 text-[9px] px-1.5 py-0.5 rounded-full font-body font-medium"
                    style={{ backgroundColor: `${cfg.color}20`, color: cfg.color }}
                  >
                    {cfg.label}
                  </span>
                  {/* Icon or preview */}
                  <div className="flex items-center justify-center h-20 mb-3">
                    {file.file_type === "logo" || file.file_type === "brand_asset" ? (
                      <img
                        src={file.file_url}
                        alt={file.filename}
                        className="max-h-full max-w-full object-contain rounded-lg"
                      />
                    ) : (
                      <FileIcon className="w-10 h-10" style={{ color: cfg.color + "80" }} />
                    )}
                  </div>
                  <p className="text-xs text-ink font-body truncate mb-1" title={file.filename}>
                    {file.filename}
                  </p>
                  <p className="text-[10px] text-ink/30 font-body">
                    {formatFileSize(file.file_size)} · {new Date(file.created_at).toLocaleDateString("es-ES")}
                  </p>
                  {/* Actions */}
                  <div className="flex items-center gap-1 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <a
                      href={file.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-[10px] text-ink/60 font-body transition-colors"
                    >
                      <Download className="w-3 h-3" /> Abrir
                    </a>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDelete(file.id); }}
                      disabled={deletingId === file.id}
                      className="px-2 py-1.5 rounded-lg bg-white/[0.04] hover:bg-accent-burgundy-soft/10 text-ink/30 hover:text-accent-burgundy-soft transition-colors"
                    >
                      {deletingId === file.id ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <Trash2 className="w-3 h-3" />
                      )}
                    </button>
                  </div>
                </div>
              </StaggerItem>
            );
          })}
        </StaggerContainer>
      ) : (
        <div className="bg-paper-deep border border-ink/[0.06] rounded-2xl divide-y divide-white/[0.04]">
          {files.map((file) => {
            const cfg = typeConfig[file.file_type] ?? typeConfig.other;
            const FileIcon = cfg.Icon;
            return (
              <div
                key={file.id}
                className="flex items-center gap-4 px-5 py-3.5 hover:bg-white/[0.02] transition-colors group"
              >
                <FileIcon className="w-5 h-5 flex-shrink-0" style={{ color: cfg.color + "80" }} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-ink font-body truncate">{file.filename}</p>
                  <p className="text-[10px] text-ink/30 font-body">
                    {formatFileSize(file.file_size)} · {new Date(file.created_at).toLocaleDateString("es-ES")}
                  </p>
                </div>
                <span
                  className="text-[9px] px-1.5 py-0.5 rounded-full font-body font-medium flex-shrink-0"
                  style={{ backgroundColor: `${cfg.color}20`, color: cfg.color }}
                >
                  {cfg.label}
                </span>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <a
                    href={file.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 rounded-lg hover:bg-white/[0.06] text-ink/40 hover:text-ink transition-colors"
                  >
                    <Download className="w-4 h-4" />
                  </a>
                  <button
                    onClick={() => handleDelete(file.id)}
                    disabled={deletingId === file.id}
                    className="p-1.5 rounded-lg hover:bg-accent-burgundy-soft/10 text-ink/30 hover:text-accent-burgundy-soft transition-colors"
                  >
                    {deletingId === file.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
