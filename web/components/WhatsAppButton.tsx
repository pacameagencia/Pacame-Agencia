"use client";

import { MessageCircle } from "lucide-react";

const WHATSAPP_NUMBER = "34722669381";
const DEFAULT_MESSAGE = "Hola Pablo! Me interesa saber mas sobre los servicios de PACAME.";

export default function WhatsAppButton() {
  const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(DEFAULT_MESSAGE)}`;

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Contactar por WhatsApp"
      className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-[#25D366] text-white flex items-center justify-center shadow-lg shadow-[#25D366]/30 hover:scale-110 hover:shadow-xl hover:shadow-[#25D366]/40 transition-all duration-200 group"
    >
      <MessageCircle className="w-6 h-6 group-hover:scale-110 transition-transform" />
      {/* Tooltip */}
      <span className="absolute right-full mr-3 px-3 py-1.5 rounded-lg bg-dark-card border border-white/10 text-xs text-pacame-white font-body whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
        Escríbenos por WhatsApp
      </span>
    </a>
  );
}
