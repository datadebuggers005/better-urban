"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppFrame } from "@/components/app-frame";
import { BrandMark, Progress } from "@/components/ui";
import { useApp } from "@/lib/store";

export default function SplashPage() {
  const router = useRouter();
  const hydrated = useApp((s) => s.hydrated);
  const onboarded = useApp((s) => s.onboarded);
  const sessionUserId = useApp((s) => s.sessionUserId);
  const [progress, setProgress] = useState(12);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setProgress((value) => (value >= 92 ? value : value + 7));
    }, 140);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    const timer = window.setTimeout(() => {
      if (!onboarded) router.replace("/onboarding");
      else if (sessionUserId) router.replace("/app");
      else router.replace("/auth");
    }, 1650);
    return () => window.clearTimeout(timer);
  }, [hydrated, onboarded, sessionUserId, router]);

  return (
    <AppFrame nav={false}>
      <div className="flex min-h-full flex-col px-6 pb-8 pt-5">
        <div className="flex items-center justify-between">
          <span className="label-caps">WF-01 // Splash</span>
          <span className="text-[9.5px] uppercase tracking-[0.16em] text-muted">v1.0</span>
        </div>

        <div className="flex flex-1 flex-col items-center justify-center text-center">
          <BrandMark size={86} className="text-ink" />
          <h1 className="mt-6 font-display text-[30px] font-semibold tracking-tight">
            Better Urban
          </h1>
          <p className="mt-1 font-display text-[14px] text-ink/60">Better Together</p>

          <div className="mt-6 flex w-44 items-center gap-3">
            <span className="h-px flex-1 bg-line-strong" />
            <span className="size-1 rounded-full bg-ink/40" />
            <span className="h-px flex-1 bg-line-strong" />
          </div>

          <p className="mt-6 max-w-[250px] text-[12.5px] leading-relaxed text-muted">
            We don&apos;t just solve problems. We build civilised citizens.
          </p>

          <div className="mt-10 w-40">
            <Progress value={progress} />
            <p className="mt-2.5 text-[10.5px] uppercase tracking-[0.16em] text-muted">
              Locating city grid…
            </p>
          </div>
        </div>

        <div className="space-y-1 text-center text-[9.5px] uppercase tracking-[0.18em] text-muted/80">
          <p>Civic &amp; Emergency Dispatch Network</p>
          <p>3.0 km radius enabled</p>
        </div>
      </div>
    </AppFrame>
  );
}
