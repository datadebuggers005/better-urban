"use client";

import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import {
  ArrowLeft,
  Bell,
  Construction,
  Droplets,
  Lightbulb,
  MoreHorizontal,
  Star,
  Trash2,
  Waves,
} from "lucide-react";
import { BRAND } from "@/lib/brand";
import { cn } from "@/lib/utils";
import type { CategoryId, IncidentStatus, Severity } from "@/lib/types";
import { STATUS_META, normalizeStatus } from "@/lib/catalog";
import { initials } from "@/lib/format";

/* ---------------------------------- brand --------------------------------- */

export function BrandMark({ className, size = 44 }: { className?: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <rect x="1" y="1" width="46" height="46" rx="15" stroke="currentColor" strokeWidth="1.5" opacity="0.25" />
      <circle cx="24" cy="24" r="13.5" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="24" cy="24" r="6.5" stroke="currentColor" strokeWidth="1.6" opacity="0.55" />
      <circle cx="24" cy="24" r="2.6" fill="currentColor" />
      <circle cx="37.5" cy="24" r="2.2" fill="currentColor" />
      <circle cx="10.5" cy="24" r="2.2" fill="currentColor" opacity="0.4" />
    </svg>
  );
}

export function Wordmark({ small = false }: { small?: boolean }) {
  return (
    <span className={cn("font-display font-semibold tracking-tight", small ? "text-[15px]" : "text-[19px]")}>
      {BRAND.name}
    </span>
  );
}

/* --------------------------------- buttons -------------------------------- */

type ButtonProps = ComponentProps<"button"> & {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "gold";
  size?: "sm" | "md" | "lg";
};

export function Button({ className, variant = "primary", size = "md", ...props }: ButtonProps) {
  return (
    <button
      type="button"
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition active:scale-[0.985] disabled:pointer-events-none disabled:opacity-50",
        size === "sm" && "h-9 px-3 text-[12.5px]",
        size === "md" && "h-11 px-4 text-[13.5px]",
        size === "lg" && "h-12 px-5 text-[14px]",
        variant === "primary" &&
          "bg-ink text-cream shadow-[0_10px_24px_-14px_rgba(14,29,56,0.9)] hover:bg-ink-2",
        variant === "secondary" &&
          "border border-line bg-white text-ink hover:border-line-strong hover:bg-paper",
        variant === "ghost" && "text-ink hover:bg-ink/5",
        variant === "danger" && "bg-danger-soft text-danger hover:bg-danger/10",
        variant === "gold" && "bg-gold-soft text-secondary-50 hover:bg-gold/20",
        className,
      )}
      {...props}
    />
  );
}

/* ---------------------------------- cards --------------------------------- */

export function Card({ className, children, ...rest }: ComponentProps<"div">) {
  return (
    <div className={cn("card p-4", className)} {...rest}>
      {children}
    </div>
  );
}

export function SectionLabel({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={cn("label-caps", className)}>{children}</p>;
}

/* ---------------------------------- chips --------------------------------- */

export function Chip({
  active,
  className,
  children,
  ...props
}: ComponentProps<"button"> & { active?: boolean }) {
  return (
    <button
      type="button"
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12px] font-medium transition",
        active
          ? "border-ink bg-ink text-cream"
          : "border-line bg-white text-ink/75 hover:border-line-strong",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function Pill({
  children,
  tone = "neutral",
  className,
}: {
  children: ReactNode;
  tone?: "neutral" | "gold" | "green" | "danger";
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10.5px] font-semibold uppercase tracking-[0.06em]",
        tone === "neutral" && "bg-ink/5 text-ink/70",
        tone === "gold" && "bg-gold-soft text-secondary-50",
        tone === "green" && "bg-green-soft text-green",
        tone === "danger" && "bg-danger-soft text-danger",
        className,
      )}
    >
      {children}
    </span>
  );
}

export function StatusBadge({ status, className }: { status: IncidentStatus; className?: string }) {
  const meta = STATUS_META[normalizeStatus(status)];
  return (
    <Pill tone={meta.tone} className={className}>
      {meta.short}
    </Pill>
  );
}

export function SeverityBadge({ severity }: { severity: Severity }) {
  const map: Record<Severity, { label: string; tone: "neutral" | "gold" | "danger" }> = {
    low: { label: "Low", tone: "neutral" },
    medium: { label: "Medium", tone: "gold" },
    high: { label: "High", tone: "danger" },
    critical: { label: "Critical", tone: "danger" },
  };
  return <Pill tone={map[severity].tone}>{map[severity].label}</Pill>;
}

export function LivePill({ label = "Live" }: { label?: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-green/25 bg-green-soft px-2 py-0.5 text-[10.5px] font-semibold text-green">
      <span className="relative flex size-1.5">
        <span className="absolute inline-flex size-full animate-ping rounded-full bg-green opacity-60" />
        <span className="relative inline-flex size-1.5 rounded-full bg-green" />
      </span>
      {label}
    </span>
  );
}

/* --------------------------------- avatars -------------------------------- */

export function Avatar({
  name,
  size = 40,
  className,
}: {
  name: string;
  size?: number;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full bg-ink font-semibold text-cream ring-2 ring-white",
        className,
      )}
      style={{ width: size, height: size, fontSize: size * 0.34 }}
      aria-hidden="true"
    >
      {initials(name)}
    </span>
  );
}

export function StarCount({ value, className }: { value: number; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border border-line bg-paper px-2 py-0.5 text-[11px] font-semibold text-ink",
        className,
      )}
    >
      <Star className="size-3 fill-gold text-gold" />
      {value.toLocaleString("en-IN")}
    </span>
  );
}

/* ---------------------------------- inputs -------------------------------- */

export function FieldLabel({ children, hint }: { children: ReactNode; hint?: string }) {
  return (
    <div className="mb-1.5 flex items-baseline justify-between">
      <span className="label-caps">{children}</span>
      {hint ? <span className="text-[11px] text-muted">{hint}</span> : null}
    </div>
  );
}

export function TextInput({ className, ...props }: ComponentProps<"input">) {
  return <input className={cn("field", className)} {...props} />;
}

export function TextArea({ className, ...props }: ComponentProps<"textarea">) {
  return <textarea className={cn("field resize-none leading-relaxed", className)} {...props} />;
}

export function Select({ className, children, ...props }: ComponentProps<"select">) {
  return (
    <select className={cn("field appearance-none pr-9", className)} {...props}>
      {children}
    </select>
  );
}

export function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative h-6 w-10 rounded-full border transition",
        checked ? "border-ink bg-ink" : "border-line-strong bg-paper",
      )}
    >
      <span
        className={cn(
          "absolute top-0.5 size-[18px] rounded-full bg-white shadow-sm transition-all",
          checked ? "left-[18px]" : "left-0.5",
        )}
      />
    </button>
  );
}

/* --------------------------------- headers -------------------------------- */

export function PageHeader({
  label,
  title,
  back,
  right,
  subtitle,
}: {
  label?: string;
  title?: string;
  back?: string;
  right?: ReactNode;
  subtitle?: string;
}) {
  return (
    <header className="sticky top-0 z-20 border-b border-line/70 bg-paper/95 px-5 pb-3 pt-4 backdrop-blur">
      <div className="flex items-center justify-between">
        <div className="flex min-w-0 items-center gap-2.5">
          {back ? (
            <Link
              href={back}
              className="flex size-8 items-center justify-center rounded-full border border-line bg-white text-ink"
              aria-label="Go back"
            >
              <ArrowLeft className="size-4" />
            </Link>
          ) : null}
          <div className="min-w-0">
            {label ? <p className="label-caps truncate">{label}</p> : null}
            {title ? (
              <h1 className="truncate font-display text-[18px] font-semibold leading-tight tracking-tight">
                {title}
              </h1>
            ) : null}
            {subtitle ? <p className="truncate text-[11.5px] text-muted">{subtitle}</p> : null}
          </div>
        </div>
        {right}
      </div>
    </header>
  );
}

export function NotificationButton({ count = 0 }: { count?: number }) {
  return (
    <Link
      href="/notifications"
      aria-label="Notifications"
      className="relative flex size-9 items-center justify-center rounded-full border border-line bg-white text-ink"
    >
      <Bell className="size-4" />
      {count > 0 ? (
        <span className="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-danger text-[9px] font-bold text-white">
          {count > 9 ? "9+" : count}
        </span>
      ) : null}
    </Link>
  );
}

/* -------------------------------- category -------------------------------- */

const ICONS = {
  road: Construction,
  water: Droplets,
  garbage: Trash2,
  drainage: Waves,
  streetlight: Lightbulb,
} as const;

export function CategoryIcon({
  id,
  className,
  size = 20,
}: {
  id: CategoryId;
  className?: string;
  size?: number;
}) {
  const Icon = ICONS[id] ?? MoreHorizontal;
  return <Icon className={className} size={size} strokeWidth={1.7} />;
}

/* --------------------------------- misc ---------------------------------- */

export function Progress({ value }: { value: number }) {
  return (
    <div className="h-1 w-full overflow-hidden rounded-full bg-ink/10">
      <div
        className="h-full rounded-full bg-ink transition-all duration-500"
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  body,
  action,
}: {
  icon?: ReactNode;
  title: string;
  body: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-[var(--radius-card)] border border-dashed border-line-strong bg-white/60 px-6 py-10 text-center">
      {icon ? <div className="mb-1 text-muted">{icon}</div> : null}
      <p className="font-display text-[15px] font-semibold">{title}</p>
      <p className="max-w-[260px] text-[12px] leading-relaxed text-muted">{body}</p>
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}

export function ErrorNote({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-lg bg-danger-soft px-3 py-2 text-[12px] font-medium text-danger">{children}</p>
  );
}
