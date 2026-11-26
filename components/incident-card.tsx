import Link from "next/link";
import { Clock3, MapPin, Users } from "lucide-react";
import type { Incident } from "@/lib/types";
import { categoryById } from "@/lib/catalog";
import { resolveMediaUrl } from "@/lib/api";
import { timeAgo } from "@/lib/format";
import { CategoryIcon, SeverityBadge, StatusBadge } from "@/components/ui";
import { cn } from "@/lib/utils";

export function IncidentThumb({ incident, size = 46 }: { incident: Incident; size?: number }) {
  const category = categoryById(incident.categoryId);
  const src = resolveMediaUrl(incident.photoUrl);
  if (src) {
    return (
      <img
        src={src}
        alt={incident.title}
        className="shrink-0 rounded-xl object-cover"
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-xl border"
      style={{
        width: size,
        height: size,
        backgroundColor: `${category.accent}14`,
        borderColor: `${category.accent}33`,
        color: category.accent,
      }}
    >
      <CategoryIcon id={incident.categoryId} size={size * 0.42} />
    </div>
  );
}

export function IncidentCard({
  incident,
  showStatus = true,
  showAlerted = false,
  href,
  className,
}: {
  incident: Incident;
  showStatus?: boolean;
  showAlerted?: boolean;
  href?: string;
  className?: string;
}) {
  const category = categoryById(incident.categoryId);

  return (
    <Link
      href={href ?? `/track/${incident.id}`}
      className={cn(
        "block rounded-[var(--radius-card)] border border-line bg-white p-3.5 transition hover:border-line-strong hover:shadow-[var(--shadow-lift)]",
        className,
      )}
    >
      <div className="flex items-start gap-3">
        <IncidentThumb incident={incident} />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate font-display text-[14px] font-semibold leading-snug">
                {incident.title}
              </p>
              <p className="mt-0.5 truncate text-[11.5px] text-muted">
                {category.short} · {incident.code} · Ward {incident.wardNumber}
              </p>
            </div>
            {showStatus ? <StatusBadge status={incident.status} /> : null}
          </div>
          {incident.note ? (
            <p className="mt-1.5 line-clamp-2 text-[12px] leading-relaxed text-ink/70">
              {incident.note}
            </p>
          ) : null}
          {incident.tags && incident.tags.length > 0 ? (
            <div className="mt-2 flex flex-wrap gap-1">
              {incident.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-paper px-2 py-0.5 text-[10px] font-medium text-muted"
                >
                  #{tag}
                </span>
              ))}
            </div>
          ) : null}
        </div>
      </div>

      <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1.5 border-t border-line/70 pt-2.5 text-[11px] text-muted">
        <span className="inline-flex items-center gap-1">
          <MapPin className="size-3" />
          {incident.landmark || `Ward ${incident.wardNumber}`}
        </span>
        <span className="inline-flex items-center gap-1">
          <Clock3 className="size-3" />
          {timeAgo(incident.createdAt)}
        </span>
        {showAlerted ? (
          <span className="inline-flex items-center gap-1">
            <Users className="size-3" />
            {incident.alertedCount} alerted
          </span>
        ) : null}
        <span className="ml-auto">
          <SeverityBadge severity={incident.severity} />
        </span>
      </div>
    </Link>
  );
}
