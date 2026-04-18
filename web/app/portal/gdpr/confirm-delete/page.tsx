"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";

export default function ConfirmDeletePage() {
  const params = useSearchParams();
  const token = params.get("token");
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "err">("idle");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("err");
      setMessage("Falta el token en la URL.");
      return;
    }
    (async () => {
      setStatus("loading");
      try {
        const res = await fetch("/api/gdpr/delete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "confirm", token }),
        });
        const data = await res.json();
        if (!res.ok) {
          setStatus("err");
          setMessage(data.error || "No se pudo confirmar");
        } else {
          setStatus("ok");
          setMessage(data.message || "Peticion confirmada.");
        }
      } catch {
        setStatus("err");
        setMessage("Error de red");
      }
    })();
  }, [token]);

  return (
    <div className="min-h-screen bg-pacame-black flex items-center justify-center p-6">
      <div className="max-w-md w-full rounded-2xl p-8 bg-dark-card border border-white/[0.06] text-center">
        {status === "loading" && (
          <>
            <Loader2 className="w-12 h-12 text-olympus-gold animate-spin mx-auto mb-6" />
            <h1 className="font-heading font-bold text-2xl text-pacame-white mb-2">
              Confirmando...
            </h1>
          </>
        )}
        {status === "ok" && (
          <>
            <CheckCircle2 className="w-12 h-12 text-green-400 mx-auto mb-6" />
            <h1 className="font-heading font-bold text-2xl text-pacame-white mb-3">
              Peticion confirmada
            </h1>
            <p className="text-pacame-white/70 font-body text-sm mb-6">{message}</p>
            <a
              href="/portal/privacy"
              className="inline-block bg-olympus-gold text-pacame-black font-heading font-semibold px-6 py-3 rounded-xl hover:bg-olympus-gold/90 transition"
            >
              Ir al portal
            </a>
          </>
        )}
        {status === "err" && (
          <>
            <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-6" />
            <h1 className="font-heading font-bold text-2xl text-pacame-white mb-3">
              No se pudo confirmar
            </h1>
            <p className="text-pacame-white/70 font-body text-sm mb-6">{message}</p>
            <a
              href="/portal"
              className="inline-block bg-olympus-gold text-pacame-black font-heading font-semibold px-6 py-3 rounded-xl hover:bg-olympus-gold/90 transition"
            >
              Ir al portal
            </a>
          </>
        )}
      </div>
    </div>
  );
}
