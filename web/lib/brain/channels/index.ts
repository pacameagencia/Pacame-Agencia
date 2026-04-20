/**
 * Registro central de channel adapters. El router del cerebro consume CHANNELS
 * para decidir el mejor canal por lead.
 */

import { emailChannel } from "./email";
import { whatsappChannel } from "./whatsapp";
import { linkedinChannel } from "./linkedin";
import { voiceChannel } from "./voice";
import type { ChannelAdapter, ChannelSlug } from "./types";

export type { ChannelAdapter, ChannelSlug, ChannelMessage, ChannelSendResult, LeadContext, SendContext } from "./types";

export const CHANNELS: Record<string, ChannelAdapter> = {
  email: emailChannel,
  whatsapp: whatsappChannel,
  linkedin: linkedinChannel,
  voice: voiceChannel,
};

export function getChannel(slug: string): ChannelAdapter | undefined {
  return CHANNELS[slug];
}

export function listChannels(): ChannelAdapter[] {
  return Object.values(CHANNELS);
}
