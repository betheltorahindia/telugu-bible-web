'use client'

import { SOCIAL_LINKS } from "../../lib/social/social-data";

const items = [
  {
    key: "instagram",
    href: SOCIAL_LINKS.instagram,
    label: "Instagram",
    glow: "oklch(0.68 0.22 12)",
    icon: (
      <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="1.8">
        <rect x="3" y="3" width="18" height="18" rx="5" />
        <circle cx="12" cy="12" r="4" />
        <circle cx="17.3" cy="6.7" r="1.1" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
  {
    key: "facebook",
    href: SOCIAL_LINKS.facebook,
    label: "Facebook",
    glow: "oklch(0.62 0.19 258)",
    icon: (
      <svg viewBox="0 0 24 24" className="h-7 w-7" fill="currentColor">
        <path d="M13.5 21v-8h2.7l.4-3.1h-3.1V7.9c0-.9.25-1.5 1.55-1.5H16.7V3.6c-.3 0-1.3-.13-2.47-.13-2.45 0-4.13 1.5-4.13 4.24V9.9H7.4V13h2.7v8z" />
      </svg>
    ),
  },
  {
    key: "whatsapp",
    href: SOCIAL_LINKS.whatsapp,
    label: "WhatsApp",
    glow: "oklch(0.75 0.18 152)",
    icon: (
      <svg viewBox="0 0 24 24" className="h-7 w-7" fill="currentColor">
        <path d="M12.04 2a9.9 9.9 0 0 0-8.5 14.96L2 22l5.2-1.5A9.9 9.9 0 1 0 12.04 2m0 1.9a8 8 0 1 1-4.1 14.86l-.3-.18-3.06.88.9-2.98-.2-.31A8 8 0 0 1 12.04 3.9m4.6 10.2c-.24-.13-1.44-.72-1.66-.8s-.39-.12-.55.12-.63.8-.77.96-.28.18-.52.06a6.5 6.5 0 0 1-3.25-2.85c-.24-.42.25-.39.7-1.3.08-.16.04-.3-.02-.42s-.55-1.33-.76-1.82c-.2-.47-.4-.4-.55-.41h-.47a.9.9 0 0 0-.65.3 2.73 2.73 0 0 0-.86 2.05 4.76 4.76 0 0 0 1 2.52 10.9 10.9 0 0 0 4.18 3.7c1.55.67 2.16.73 2.94.61a2.5 2.5 0 0 0 1.65-1.17 2.05 2.05 0 0 0 .14-1.16c-.06-.11-.22-.18-.46-.3" />
      </svg>
    ),
  },
];

export function SocialOrbs() {
  return (
    <div className="flex items-center justify-center gap-7 sm:gap-10">
      {items.map((item, i) => (
        <a
          key={item.key}
          href={item.href}
          target="_blank"
          rel="noreferrer noopener"
          aria-label={item.label}
          title={item.label}
          className="group relative grid h-16 w-16 place-items-center rounded-2xl sm:h-[74px] sm:w-[74px]"
          style={{
            transformStyle: "preserve-3d",
            animation: `sw-float 5s ease-in-out ${i * 0.5}s infinite`,
          }}
        >
          <span
            className="absolute inset-0 rounded-2xl opacity-0 blur-xl transition-opacity duration-500 group-hover:opacity-90"
            style={{ background: item.glow }}
          />
          <span
            className="absolute inset-0 rounded-2xl border transition-all duration-500 group-hover:-translate-y-1"
            style={{
              borderColor: "oklch(1 0 0 / 14%)",
              background:
                "linear-gradient(155deg, oklch(1 0 0 / 14%), oklch(1 0 0 / 3%) 55%, oklch(1 0 0 / 9%))",
              boxShadow:
                "inset 0 1px 0 oklch(1 0 0 / 25%), 0 20px 34px -20px oklch(0 0 0 / 90%)",
              backdropFilter: "blur(14px)",
            }}
          />
          <span
            className="relative transition-transform duration-500 group-hover:-translate-y-1 group-hover:scale-110"
            style={{ color: item.glow, filter: "drop-shadow(0 6px 10px oklch(0 0 0 / 55%))" }}
          >
            {item.icon}
          </span>
          <span className="pointer-events-none absolute -bottom-7 text-[11px] tracking-[0.2em] uppercase opacity-0 transition-opacity duration-300 group-hover:opacity-70">
            {item.label}
          </span>
        </a>
      ))}
    </div>
  );
}