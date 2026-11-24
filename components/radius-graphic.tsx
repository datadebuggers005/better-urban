import { Building2, HandHeart, MapPin, Users } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Stylized 3 km dispatch radius. Pure SVG so it renders identically in the
 * demo, screenshots and the launch film.
 */
export function RadiusGraphic({
  radiusKm = 3,
  className,
  compact = false,
}: {
  radiusKm?: number;
  className?: string;
  compact?: boolean;
}) {
  return (
    <div className={cn("relative mx-auto w-full", compact ? "max-w-[180px]" : "max-w-[248px]", className)}>
      <div className="relative aspect-square">
        <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_center,rgba(227,163,60,0.18),transparent_68%)]" />
        <svg viewBox="0 0 220 220" className="absolute inset-0 size-full text-ink/35" aria-hidden="true">
          <defs>
            <pattern id="grid" width="22" height="22" patternUnits="userSpaceOnUse">
              <path d="M22 0H0V22" fill="none" stroke="currentColor" strokeOpacity="0.12" strokeWidth="1" />
            </pattern>
          </defs>
          <circle cx="110" cy="110" r="106" fill="url(#grid)" opacity="0.55" />
          <circle cx="110" cy="110" r="86" fill="none" stroke="currentColor" strokeWidth="1.4" strokeDasharray="5 6" />
          <circle cx="110" cy="110" r="54" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="2 5" opacity="0.7" />
          <line x1="110" y1="14" x2="110" y2="206" stroke="currentColor" strokeWidth="0.8" strokeDasharray="2 6" opacity="0.35" />
          <line x1="14" y1="110" x2="206" y2="110" stroke="currentColor" strokeWidth="0.8" strokeDasharray="2 6" opacity="0.35" />
          <circle cx="110" cy="110" r="26" fill="none" stroke="currentColor" strokeWidth="1.4" opacity="0.5" />
        </svg>

        <span className="absolute left-1/2 top-1/2 flex size-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-ink text-cream shadow-[0_10px_30px_-8px_rgba(14,29,56,0.7)]">
          <MapPin className="size-5" />
          <span className="absolute -inset-2 animate-ping rounded-full border border-ink/25" />
        </span>

        <span className="absolute left-[calc(50%-74px)] top-[calc(50%-30px)] flex size-7 items-center justify-center rounded-full border border-line bg-white text-ink/70 shadow-sm">
          <Building2 className="size-3.5" />
        </span>
        <span className="absolute left-[calc(50%+46px)] top-[calc(50%-52px)] flex size-7 items-center justify-center rounded-full border border-line bg-white text-ink/70 shadow-sm">
          <HandHeart className="size-3.5" />
        </span>
        <span className="absolute left-[calc(50%+60px)] top-[calc(50%+38px)] flex size-7 items-center justify-center rounded-full border border-line bg-white text-ink/70 shadow-sm">
          <Users className="size-3.5" />
        </span>

        <span className="absolute bottom-1 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full border border-line bg-paper/90 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted">
          {radiusKm.toFixed(1)} km radius
        </span>
      </div>
    </div>
  );
}
