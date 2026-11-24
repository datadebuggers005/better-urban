"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { BrandMark, Wordmark } from "@/components/ui";
import { BottomNav } from "@/components/bottom-nav";
import { cn } from "@/lib/utils";
import { useApp } from "@/lib/store";

export function AppFrame({
  children,
  nav = true,
  className,
}: {
  children: ReactNode;
  nav?: boolean;
  className?: string;
}) {
  return (
    <div className="app-backdrop min-h-dvh">
      {nav ? (
        <div className="hidden md:flex items-center justify-between max-w-[480px] mx-auto px-4 py-3 border-b border-line">
          <Link href="/app" className="flex items-center gap-2">
            <BrandMark size={24} />
            <span className="font-display text-[13px] font-semibold">Better Urban</span>
          </Link>
          <nav className="flex items-center gap-4 text-[12px]">
            <Link href="/app" className="text-muted hover:text-ink">Home</Link>
            <Link href="/my-reports" className="text-muted hover:text-ink">Reports</Link>
            <Link href="/volunteer" className="text-muted hover:text-ink">Volunteer</Link>
            <Link href="/profile" className="text-muted hover:text-ink">Profile</Link>
          </nav>
        </div>
      ) : null}
      <div className="phone-screen">
        <div className={cn("no-scrollbar flex-1 overflow-y-auto overscroll-contain", className)}>
          {children}
        </div>
        {nav ? <BottomNav /> : null}
      </div>
    </div>
  );
}

export function FullLoader({ label = "Locating city grid…" }: { label?: string }) {
  return (
    <div className="app-backdrop flex min-h-dvh items-center justify-center">
      <div className="flex flex-col items-center gap-3 text-ink">
        <BrandMark size={54} className="animate-pulse" />
        <p className="font-display text-[15px] font-semibold">Better Urban</p>
        <p className="text-[11px] uppercase tracking-[0.18em] text-muted">{label}</p>
      </div>
    </div>
  );
}

export function HydrationGate({ children }: { children: ReactNode }) {
  const hydrated = useApp((state) => state.hydrated);
  const hasData = useApp((state) => state.cities.length > 0);
  if (!hydrated || !hasData) return <FullLoader />;
  return <>{children}</>;
}

export function DemoBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-line bg-white/70 px-2 py-0.5 text-[9.5px] font-semibold uppercase tracking-[0.12em] text-muted">
      Demo data
    </span>
  );
}
