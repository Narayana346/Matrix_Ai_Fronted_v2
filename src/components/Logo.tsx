import { cn } from "@/lib/utils";

const SIZE_MAP = {
  sm: { box: "w-8 h-8", radius: "rounded-lg", icon: 16, text: "text-base" },
  md: { box: "w-11 h-11", radius: "rounded-xl", icon: 22, text: "text-xl" },
  lg: { box: "w-16 h-16", radius: "rounded-2xl", icon: 32, text: "text-3xl" },
} as const;

interface LogoProps {
  size?: keyof typeof SIZE_MAP;
  withWordmark?: boolean;
  className?: string;
}

// Three linked nodes read as both a stylized "M" and a neural-net / matrix
// motif, standing in for the generic sparkle icon used across auth pages.
function LogoMark({ size }: { size: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M6 24V10.5C6 9.4 7.1 8.7 8 9.3L16 15L24 9.3C24.9 8.7 26 9.4 26 10.5V24"
        stroke="white"
        strokeWidth="2.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="6" cy="24" r="2" fill="white" />
      <circle cx="16" cy="15" r="2" fill="white" fillOpacity="0.9" />
      <circle cx="26" cy="24" r="2" fill="white" />
    </svg>
  );
}

export function Logo({ size = "md", withWordmark = false, className }: LogoProps) {
  const { box, radius, icon, text } = SIZE_MAP[size];

  return (
    <div className={cn("inline-flex items-center gap-3", className)}>
      <div
        className={cn(
          box,
          radius,
          "relative flex items-center justify-center shrink-0 overflow-hidden"
        )}
        style={{ background: "var(--gradient-primary)", boxShadow: "var(--shadow-glow)" }}
      >
        <div className="absolute inset-0 bg-white/5" />
        <LogoMark size={icon} />
      </div>
      {withWordmark && (
        <span className={cn("font-semibold tracking-tight text-foreground", text)}>
          Matrix <span className="gradient-text">AI</span>
        </span>
      )}
    </div>
  );
}
