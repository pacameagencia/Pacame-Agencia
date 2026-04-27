interface SigilProps {
  className?: string;
  color?: string;
  size?: number;
}

/** Nova — Starburst/creative spark */
export function NovaSigil({ className = "", color = "#B54E30", size = 24 }: SigilProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M12 2L13.5 9.5L20 8L14.5 12L20 16L13.5 14.5L12 22L10.5 14.5L4 16L9.5 12L4 8L10.5 9.5L12 2Z" stroke={color} strokeWidth="1.5" fill={`${color}15`} />
      <circle cx="12" cy="12" r="2" fill={color} />
    </svg>
  );
}

/** Atlas — Compass/globe */
export function AtlasSigil({ className = "", color = "#2563EB", size = 24 }: SigilProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="12" cy="12" r="9" stroke={color} strokeWidth="1.5" />
      <ellipse cx="12" cy="12" rx="4" ry="9" stroke={color} strokeWidth="1" opacity="0.5" />
      <line x1="3" y1="12" x2="21" y2="12" stroke={color} strokeWidth="1" opacity="0.5" />
      <path d="M12 3L14 10L12 12L10 10L12 3Z" fill={color} opacity="0.6" />
    </svg>
  );
}

/** Nexus — Flame/upward arrow */
export function NexusSigil({ className = "", color = "#EA580C", size = 24 }: SigilProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M12 2L6 14C6 14 8 20 12 22C16 20 18 14 18 14L12 2Z" stroke={color} strokeWidth="1.5" fill={`${color}15`} />
      <path d="M12 8L9 14C9.5 17 11 19 12 20C13 19 14.5 17 15 14L12 8Z" fill={color} opacity="0.3" />
      <circle cx="12" cy="14" r="1.5" fill={color} />
    </svg>
  );
}

/** Pixel — Grid/layout */
export function PixelSigil({ className = "", color = "#283B70", size = 24 }: SigilProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <rect x="3" y="3" width="7" height="7" rx="1.5" stroke={color} strokeWidth="1.5" fill={`${color}10`} />
      <rect x="14" y="3" width="7" height="7" rx="1.5" stroke={color} strokeWidth="1.5" fill={`${color}10`} />
      <rect x="3" y="14" width="7" height="7" rx="1.5" stroke={color} strokeWidth="1.5" fill={`${color}10`} />
      <rect x="14" y="14" width="7" height="7" rx="1.5" stroke={color} strokeWidth="1.5" fill={`${color}20`} />
      <circle cx="17.5" cy="17.5" r="1.5" fill={color} />
    </svg>
  );
}

/** Core — Foundation/shield */
export function CoreSigil({ className = "", color = "#16A34A", size = 24 }: SigilProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M12 2L4 6V12C4 17 8 21 12 22C16 21 20 17 20 12V6L12 2Z" stroke={color} strokeWidth="1.5" fill={`${color}10`} />
      <path d="M12 6L8 8V12C8 15.5 10 18.5 12 19.5C14 18.5 16 15.5 16 12V8L12 6Z" fill={`${color}20`} />
      <circle cx="12" cy="12" r="2" fill={color} />
    </svg>
  );
}

/** Pulse — Heart/ripple waves */
export function PulseSigil({ className = "", color = "#EC4899", size = 24 }: SigilProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="12" cy="12" r="3" fill={color} opacity="0.4" />
      <circle cx="12" cy="12" r="6" stroke={color} strokeWidth="1" opacity="0.3" />
      <circle cx="12" cy="12" r="9" stroke={color} strokeWidth="1" opacity="0.15" />
      <circle cx="12" cy="12" r="1.5" fill={color} />
      {/* Heartbeat line */}
      <path d="M2 12H7L9 8L12 16L15 10L17 12H22" stroke={color} strokeWidth="1.5" opacity="0.5" />
    </svg>
  );
}

/** Sage — Eye/oracle */
export function SageSigil({ className = "", color = "#D97706", size = 24 }: SigilProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M2 12C4 7 8 4 12 4C16 4 20 7 22 12C20 17 16 20 12 20C8 20 4 17 2 12Z" stroke={color} strokeWidth="1.5" fill={`${color}08`} />
      <circle cx="12" cy="12" r="4" stroke={color} strokeWidth="1.5" fill={`${color}15`} />
      <circle cx="12" cy="12" r="1.5" fill={color} />
      {/* Light rays */}
      <line x1="12" y1="1" x2="12" y2="3" stroke={color} strokeWidth="1" opacity="0.4" />
      <line x1="19" y1="4" x2="18" y2="5.5" stroke={color} strokeWidth="1" opacity="0.4" />
      <line x1="5" y1="4" x2="6" y2="5.5" stroke={color} strokeWidth="1" opacity="0.4" />
    </svg>
  );
}

/** Map agent ID to sigil component */
export function AgentSigil({ agentId, ...props }: SigilProps & { agentId: string }) {
  switch (agentId) {
    case "nova": return <NovaSigil {...props} />;
    case "atlas": return <AtlasSigil {...props} />;
    case "nexus": return <NexusSigil {...props} />;
    case "pixel": return <PixelSigil {...props} />;
    case "core": return <CoreSigil {...props} />;
    case "pulse": return <PulseSigil {...props} />;
    case "sage": return <SageSigil {...props} />;
    default: return <NovaSigil {...props} />;
  }
}
