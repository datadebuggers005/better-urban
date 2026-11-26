"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppFrame } from "@/components/app-frame";
import { Progress } from "@/components/ui";
import { useApp } from "@/lib/store";
import { BRAND } from "@/lib/brand";

export default function SplashPage() {
  const router = useRouter();
  const hydrated = useApp((s) => s.hydrated);
  const onboarded = useApp((s) => s.onboarded);
  const sessionUserId = useApp((s) => s.sessionUserId);
  const [progress, setProgress] = useState(14);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setProgress((value) => (value >= 94 ? value : value + 8));
    }, 130);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    const timer = window.setTimeout(() => {
      if (!onboarded) router.replace("/onboarding");
      else if (sessionUserId) router.replace("/app");
      else router.replace("/auth");
    }, 1500);
    return () => window.clearTimeout(timer);
  }, [hydrated, onboarded, sessionUserId, router]);

  return (
    <AppFrame nav={false}>
      <div className="flex min-h-full flex-col px-6 pb-8 pt-5">
        <div className="flex items-center justify-between">
          <span className="label-caps">OCOR // Splash</span>
          <span className="text-[9.5px] uppercase tracking-[0.16em] text-muted">v1.0</span>
        </div>

        <div className="flex flex-1 flex-col items-center justify-center text-center">
          <div className="rounded-2xl border border-line bg-white p-4 shadow-[var(--shadow-soft)]">
            <img
              src={BRAND.logo}
              alt={BRAND.fullName}
              className="h-28 w-auto object-contain"
            />
          </div>
          <h1 className="mt-6 font-display text-[26px] font-bold tracking-tight text-ink">
            {BRAND.name}
          </h1>
          <p className="mt-1 font-display text-[14px] font-medium text-primary">
            {BRAND.tagline}
          </p>

          <div className="mt-6 flex w-44 items-center gap-3">
            <span className="h-px flex-1 bg-line-strong" />
            <span className="size-1.5 rounded-full bg-secondary" />
            <span className="h-px flex-1 bg-line-strong" />
          </div>

          <p className="mt-5 max-w-[260px] text-[12.5px] leading-relaxed text-muted">
            {BRAND.line}
          </p>

          <div className="mt-8 w-44">
            <Progress value={progress} />
            <p className="mt-2.5 text-[10.5px] uppercase tracking-[0.16em] text-muted">
              Loading city grid…
            </p>
          </div>
        </div>

        <div className="space-y-1 text-center text-[9.5px] uppercase tracking-[0.18em] text-muted/80">
          <p>Civic Issue Reporting &amp; Live City Map</p>
          <p>Citizen · Officer · Admin</p>
        </div>
      </div>
    </AppFrame>
  );
}
