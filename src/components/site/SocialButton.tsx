import type { ReactNode } from "react";

export function SocialButton({
  href,
  label,
  handle,
  icon,
  accent = "neon",
}: {
  href: string;
  label: string;
  handle: string;
  icon: ReactNode;
  accent?: "neon" | "gold" | "discord" | "insta";
}) {
  const accentClass = {
    neon: "hover:shadow-neon hover:border-neon",
    gold: "hover:shadow-gold hover:border-gold",
    discord: "hover:border-[oklch(0.62_0.19_275)] hover:shadow-[0_10px_40px_-10px_oklch(0.62_0.19_275_/_0.5)]",
    insta: "hover:border-[oklch(0.68_0.22_20)] hover:shadow-[0_10px_40px_-10px_oklch(0.68_0.22_20_/_0.5)]",
  }[accent];

  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className={`group flex items-center gap-4 rounded-xl border border-border bg-surface p-4 transition-all duration-300 ${accentClass}`}
    >
      <div className="grid h-12 w-12 place-items-center rounded-lg bg-surface-2 transition-transform group-hover:scale-110">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-xs uppercase tracking-widest text-muted-foreground">
          {label}
        </div>
        <div className="truncate font-display text-lg font-semibold text-foreground">
          {handle}
        </div>
      </div>
    </a>
  );
}
