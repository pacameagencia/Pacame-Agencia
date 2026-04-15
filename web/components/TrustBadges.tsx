interface TrustBadgesProps {
  variant?: "footer" | "checkout";
}

const badges = [
  {
    label: "Conexion segura",
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="4" y="9" width="12" height="8" rx="2" />
        <path d="M7 9V6a3 3 0 0 1 6 0v3" />
        <circle cx="10" cy="13" r="1" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
  {
    label: "Pago seguro PCI DSS",
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10 2L3 6v4c0 4.4 3 8.5 7 10 4-1.5 7-5.6 7-10V6l-7-4z" />
        <path d="M7.5 10l2 2 3.5-3.5" />
      </svg>
    ),
  },
  {
    label: "RGPD Conforme",
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10 2L3 6v4c0 4.4 3 8.5 7 10 4-1.5 7-5.6 7-10V6l-7-4z" />
        <path d="M10 7v4" />
        <circle cx="10" cy="13.5" r="0.5" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
  {
    label: "LSSI-CE Conforme",
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 3h10a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z" />
        <path d="M7 7h6M7 10h6M7 13h4" />
      </svg>
    ),
  },
  {
    label: "100% Supervision humana",
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M1.5 10s3.5-6 8.5-6 8.5 6 8.5 6-3.5 6-8.5 6-8.5-6-8.5-6z" />
        <circle cx="10" cy="10" r="3" />
        <circle cx="10" cy="10" r="1" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
];

export default function TrustBadges({ variant = "footer" }: TrustBadgesProps) {
  const isFooter = variant === "footer";

  return (
    <div className={`flex flex-wrap items-center justify-center ${isFooter ? "gap-6 sm:gap-8" : "gap-4 sm:gap-6"}`}>
      {badges.map((badge) => (
        <div
          key={badge.label}
          className={`flex flex-col items-center gap-1.5 group ${
            isFooter ? "text-pacame-white/25 hover:text-pacame-white/45" : "text-pacame-white/35 hover:text-pacame-white/55"
          } transition-colors duration-300`}
        >
          <div className={isFooter ? "text-olympus-gold/30 group-hover:text-olympus-gold/50 transition-colors duration-300" : "text-olympus-gold/40 group-hover:text-olympus-gold/60 transition-colors duration-300"}>
            {badge.icon}
          </div>
          <span className={`font-body leading-tight text-center ${isFooter ? "text-[10px]" : "text-xs"}`}>
            {badge.label}
          </span>
        </div>
      ))}
    </div>
  );
}
