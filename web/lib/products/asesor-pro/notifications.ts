/**
 * Helpers para notificar al asesor (Telegram) según preferencias guardadas
 * en asesorpro_settings. No lanza errores: falla silenciosamente si Telegram
 * no está configurado o el envío rebota.
 */

import { createServerSupabase } from "@/lib/supabase/server";
import { sendTelegramMessage } from "@/lib/telegram";

type NotifyKey =
  | "notify_new_invoice"
  | "notify_new_expense"
  | "notify_invite_accepted"
  | "notify_call_received";

async function getNotifSettings(asesorId: string) {
  const supabase = createServerSupabase();
  const { data } = await supabase
    .from("asesorpro_settings")
    .select(
      "telegram_chat_id, telegram_enabled, notify_new_invoice, notify_new_expense, notify_invite_accepted, notify_call_received"
    )
    .eq("asesor_user_id", asesorId)
    .maybeSingle();
  return data;
}

async function send(asesorId: string, key: NotifyKey, text: string) {
  const settings = await getNotifSettings(asesorId);
  if (!settings) return false;
  if (!settings.telegram_enabled) return false;
  if (settings[key] === false) return false;
  if (!settings.telegram_chat_id) return false;
  try {
    return await sendTelegramMessage(settings.telegram_chat_id, text, { parse_mode: "HTML" });
  } catch {
    return false;
  }
}

export function notifyExpenseUploaded(input: {
  asesor_user_id: string;
  client_name: string;
  vendor: string;
  total_eur: number;
  confidence: number;
  expense_id: string;
}) {
  const text =
    `🧾 <b>Nuevo gasto · ${input.client_name}</b>\n` +
    `Proveedor: ${input.vendor || "sin nombre"}\n` +
    `Total: ${input.total_eur.toFixed(2)} €\n` +
    `Confianza OCR: ${(input.confidence * 100).toFixed(0)}%\n\n` +
    `Revisa: /app/asesor-pro/gastos`;
  return send(input.asesor_user_id, "notify_new_expense", text);
}

export function notifyInvoiceCreated(input: {
  asesor_user_id: string;
  client_name: string;
  number: string;
  total_eur: number;
}) {
  const text =
    `📄 <b>Nueva factura · ${input.client_name}</b>\n` +
    `Nº ${input.number}\n` +
    `Total: ${input.total_eur.toFixed(2)} €\n\n` +
    `Revisa: /app/asesor-pro/facturas`;
  return send(input.asesor_user_id, "notify_new_invoice", text);
}

export function notifyInviteAccepted(input: {
  asesor_user_id: string;
  client_name: string;
}) {
  const text =
    `🎉 <b>Cliente activo</b>\n` +
    `${input.client_name} ha aceptado la invitación y ya puede facturar.`;
  return send(input.asesor_user_id, "notify_invite_accepted", text);
}
