"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Building2, Check, HandHeart, Star, Users } from "lucide-react";
import { AppFrame } from "@/components/app-frame";
import { Button, CategoryIcon, Wordmark } from "@/components/ui";
import { RadiusGraphic } from "@/components/radius-graphic";
import { useApp } from "@/lib/store";
import { cn } from "@/lib/utils";

const SLIDES = [
  {
    title: "One report alerts authorities, NGOs & your neighborhood",
    body: "Pick a city issue — traffic jam, fire, medical emergency or water leak — and instantly notify responders plus citizens within a 3 km radius.",
  },
  {
    title: "Every complaint gets a public trail",
    body: "Track the ticket, see the field team's progress, and rate the fix once it's done. No more report-and-forget.",
  },
  {
    title: "Volunteer for your own sector",
    body: "Accept alerts close to you, earn stars for verified help, and climb your city's responder leaderboard.",
  },
];

function SlideArt({ index }: { index: number }) {
  if (index === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-1">
        <RadiusGraphic compact />
        <div className="mt-1 flex items-center gap-2">
          <span className="inline-flex items-center gap-1 rounded-full border border-line bg-white px-2 py-1 text-[10px] font-medium text-ink/70">
            <Building2 className="size-3" /> Authorities
          </span>
          <span className="inline-flex items-center gap-1 rounded-full border border-line bg-white px-2 py-1 text-[10px] font-medium text-ink/70">
            <HandHeart className="size-3" /> NGOs
          </span>
          <span className="inline-flex items-center gap-1 rounded-full border border-line bg-white px-2 py-1 text-[10px] font-medium text-ink/70">
            <Users className="size-3" /> Citizens
          </span>
        </div>
      </div>
    );
  }

  if (index === 1) {
    return (
      <div className="flex h-full flex-col justify-center gap-2 px-1">
        {[
          { label: "Report received", done: true, sub: "3 km alert sent" },
          { label: "Authority acknowledged", done: true, sub: "Municipal control room" },
          { label: "Field team assigned", done: true, sub: "Crew on the way" },
          { label: "Resolved & rated", done: false, sub: "Awaiting citizen sign-off" },
        ].map((step, i) => (
          <div key={step.label} className="flex items-center gap-2.5 rounded-xl border border-line bg-white px-3 py-2">
            <span
              className={cn(
                "flex size-5 items-center justify-center rounded-full text-[9px] font-bold",
                step.done ? "bg-ink text-cream" : "border border-line bg-paper text-muted",
              )}
            >
              {step.done ? <Check className="size-3" /> : i + 1}
            </span>
            <div className="min-w-0">
              <p className="truncate text-[11.5px] font-semibold">{step.label}</p>
              <p className="truncate text-[10px] text-muted">{step.sub}</p>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col justify-center gap-2 px-1">
      <div className="flex items-center justify-between rounded-xl border border-line bg-white px-3 py-2.5">
        <div className="flex items-center gap-2">
          <span className="flex size-7 items-center justify-center rounded-full bg-ink text-[10px] font-bold text-cream">#1</span>
          <div>
            <p className="text-[11.5px] font-semibold">Aarav Mehta</p>
            <p className="text-[10px] text-muted">Sector 18 · 24 helped</p>
          </div>
        </div>
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold">
          <Star className="size-3 fill-gold text-gold" /> 488
        </span>
      </div>
      <div className="flex items-center justify-between rounded-xl border border-line bg-white px-3 py-2.5">
        <div className="flex items-center gap-2">
          <span className="flex size-7 items-center justify-center rounded-full bg-paper text-[10px] font-bold text-ink">#2</span>
          <div>
            <p className="text-[11.5px] font-semibold">Priya Nair</p>
            <p className="text-[10px] text-muted">Sector 09 · 19 helped</p>
          </div>
        </div>
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold">
          <Star className="size-3 fill-gold text-gold" /> 415
        </span>
      </div>
      <div className="flex items-center justify-between rounded-xl border border-ink/15 bg-gold-soft/60 px-3 py-2.5">
        <div className="flex items-center gap-2">
          <span className="flex size-7 items-center justify-center rounded-full bg-white text-[10px] font-bold text-ink">#4</span>
          <div>
            <p className="text-[11.5px] font-semibold">You (Citizen)</p>
            <p className="text-[10px] text-muted">Sector 18 · 6 helped</p>
          </div>
        </div>
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold">
          <Star className="size-3 fill-gold text-gold" /> 340
        </span>
      </div>
    </div>
  );
}

export default function OnboardingPage() {
  const router = useRouter();
  const finishOnboarding = useApp((s) => s.finishOnboarding);
  const [index, setIndex] = useState(0);

  const start = () => {
    finishOnboarding();
    router.push("/auth");
  };

  return (
    <AppFrame nav={false}>
      <div className="flex min-h-full flex-col px-5 pb-6 pt-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wordmark small />
          </div>
          <button
            type="button"
            onClick={start}
            className="text-[12px] font-medium text-muted underline-offset-4 hover:text-ink hover:underline"
          >
            Skip
          </button>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <span className="label-caps">WF-02 // Onboarding</span>
          <span className="text-[9.5px] uppercase tracking-[0.16em] text-muted">
            {String(index + 1).padStart(2, "0")} / 03
          </span>
        </div>

        <div className="relative mt-3 overflow-hidden rounded-[1.4rem] border border-line bg-[radial-gradient(rgba(14,29,56,0.06)_1px,transparent_1px)] [background-size:16px_16px]">
          <div className="h-[268px] px-4 py-4">
            <SlideArt index={index} />
          </div>
        </div>

        <div className="mt-5 flex gap-1.5">
          {SLIDES.map((slide, i) => (
            <button
              key={slide.title}
              type="button"
              aria-label={`Go to slide ${i + 1}`}
              onClick={() => setIndex(i)}
              className={cn(
                "h-1.5 rounded-full transition-all",
                i === index ? "w-6 bg-ink" : "w-1.5 bg-ink/20",
              )}
            />
          ))}
        </div>

        <div className="mt-4 flex-1">
          <h1 className="max-w-[330px] font-display text-[22px] font-semibold leading-[1.22] tracking-tight">
            {SLIDES[index].title}
          </h1>
          <p className="mt-2.5 max-w-[340px] text-[12.5px] leading-relaxed text-muted">
            {SLIDES[index].body}
          </p>
        </div>

        <div className="mt-5 flex items-center gap-2">
          {index > 0 ? (
            <Button variant="secondary" size="lg" onClick={() => setIndex((i) => i - 1)}>
              Back
            </Button>
          ) : null}
          <Button size="lg" className="flex-1" onClick={() => (index < 2 ? setIndex((i) => i + 1) : start())}>
            {index < 2 ? "Next" : "Get Started"}
            <ArrowRight className="size-4" />
          </Button>
        </div>

        <p className="mt-3 text-center text-[9.5px] uppercase tracking-[0.16em] text-muted/70">
          Prototype · demo data · not affiliated with any government body
        </p>
      </div>
    </AppFrame>
  );
}
