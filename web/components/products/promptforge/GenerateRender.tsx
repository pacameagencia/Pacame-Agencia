"use client";

import { useEffect, useState } from "react";
import { Image as ImageIcon, Volume2, Loader2, Download, AlertCircle } from "lucide-react";
import { useToast } from "@/components/ui/toast";

const IMAGE_TARGETS = ["midjourney", "dall-e", "ideogram", "flux", "sdxl", "image", "stable-diffusion"];
const AUDIO_TARGETS = ["elevenlabs", "voiceover-elevenlabs", "audio"];

interface Props {
  prompt: string;
  promptId?: string | null;
  modality: string;
  target: string;
}

interface ImageGen {
  id: string;
  status: "processing" | "completed" | "failed";
  urls: string[];
  error?: string;
}

export function GenerateRender({ prompt, promptId, modality, target }: Props) {
  const { toast } = useToast();
  const [imgGen, setImgGen] = useState<ImageGen | null>(null);
  const [imgLoading, setImgLoading] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioLoading, setAudioLoading] = useState(false);

  const supportsImage = modality === "image" || IMAGE_TARGETS.some((t) => target?.toLowerCase().includes(t));
  const supportsAudio = modality === "audio" || AUDIO_TARGETS.some((t) => target?.toLowerCase().includes(t));

  async function generateImage() {
    setImgLoading(true);
    try {
      const res = await fetch("/api/products/promptforge/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          prompt_id: promptId ?? undefined,
          aspect_ratio: "square_1_1",
          model: "realism",
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        toast({
          variant: "error",
          title: "Generación falló",
          description: json.error === "monthly_limit_reached"
            ? `Límite del mes alcanzado (${json.limit}). Sube de plan en /plan.`
            : (json.detail ?? json.error ?? "Error desconocido"),
        });
        setImgLoading(false);
        return;
      }
      setImgGen({ id: json.generation_id, status: "processing", urls: [] });
    } catch (err) {
      toast({ variant: "error", title: "Error de red", description: err instanceof Error ? err.message : String(err) });
      setImgLoading(false);
    }
  }

  // Polling
  useEffect(() => {
    if (!imgGen || imgGen.status !== "processing") return;
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/products/promptforge/generate-image/${imgGen.id}`);
        const json = await res.json();
        if (json.status === "completed") {
          setImgGen({ id: imgGen.id, status: "completed", urls: json.urls ?? [] });
          setImgLoading(false);
          toast({ variant: "success", title: "Imagen lista", description: `${(json.urls ?? []).length} render(s) generado(s).` });
          clearInterval(interval);
        } else if (json.status === "failed") {
          setImgGen({ id: imgGen.id, status: "failed", urls: [], error: json.error });
          setImgLoading(false);
          toast({ variant: "error", title: "Generación falló", description: json.error ?? "Freepik devolvió error." });
          clearInterval(interval);
        }
      } catch {
        // sigue intentando
      }
    }, 4000);
    return () => clearInterval(interval);
  }, [imgGen, toast]);

  async function generateAudio() {
    setAudioLoading(true);
    try {
      const res = await fetch("/api/products/promptforge/audio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: prompt, prompt_id: promptId ?? undefined }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        toast({ variant: "error", title: "TTS falló", description: json.detail ?? json.error ?? "Error desconocido" });
        return;
      }
      if (json.url) {
        setAudioUrl(json.url);
      } else if (json.audio_base64) {
        setAudioUrl(`data:audio/mpeg;base64,${json.audio_base64}`);
      }
      toast({ variant: "success", title: "Audio listo", description: "Pulsa play para escucharlo." });
    } catch (err) {
      toast({ variant: "error", title: "Error de red", description: err instanceof Error ? err.message : String(err) });
    } finally {
      setAudioLoading(false);
    }
  }

  if (!supportsImage && !supportsAudio) return null;

  return (
    <div className="border-t-2 border-ink/10 pt-3 mt-3 space-y-3">
      <div className="flex flex-wrap gap-2">
        {supportsImage && (
          <button
            onClick={generateImage}
            disabled={imgLoading}
            className="inline-flex items-center gap-2 px-3 py-1.5 bg-paper border-2 border-ink text-ink text-[12px] font-sans hover:bg-ink hover:text-paper transition-colors disabled:opacity-60"
          >
            {imgLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ImageIcon className="w-3.5 h-3.5" />}
            {imgLoading ? "Generando…" : "Generar imagen real (Freepik Mystic)"}
          </button>
        )}
        {supportsAudio && (
          <button
            onClick={generateAudio}
            disabled={audioLoading}
            className="inline-flex items-center gap-2 px-3 py-1.5 bg-paper border-2 border-ink text-ink text-[12px] font-sans hover:bg-ink hover:text-paper transition-colors disabled:opacity-60"
          >
            {audioLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Volume2 className="w-3.5 h-3.5" />}
            {audioLoading ? "Sintetizando…" : "Generar audio (ElevenLabs)"}
          </button>
        )}
      </div>

      {imgGen?.status === "processing" && (
        <p className="font-mono text-[11px] text-ink-mute flex items-center gap-2">
          <Loader2 className="w-3 h-3 animate-spin" /> Freepik está renderizando — suele tardar 20-60 segundos.
        </p>
      )}

      {imgGen?.status === "completed" && imgGen.urls.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {imgGen.urls.map((url, i) => (
            <a key={i} href={url} target="_blank" rel="noreferrer" className="block group">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt={`Render ${i + 1}`} className="w-full aspect-square object-cover border-2 border-ink/20 group-hover:border-ink" />
              <span className="block text-center text-[10px] font-mono uppercase tracking-[0.15em] text-ink-mute mt-1">
                <Download className="inline w-3 h-3 mr-1" />
                Render {i + 1}
              </span>
            </a>
          ))}
        </div>
      )}

      {imgGen?.status === "failed" && (
        <p className="font-mono text-[11px] text-rose-alert flex items-center gap-2">
          <AlertCircle className="w-3 h-3" /> {imgGen.error ?? "Falló."}
        </p>
      )}

      {audioUrl && (
        // eslint-disable-next-line jsx-a11y/media-has-caption
        <audio controls src={audioUrl} className="w-full" />
      )}
    </div>
  );
}
