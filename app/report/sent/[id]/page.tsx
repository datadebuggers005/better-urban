"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Building2, Check, HandHeart, MapPin, Radio, Users } from "lucide-react";
import { AppFrame, HydrationGate } from "@/components/app-frame";
import { Button, Pill, StatusBadge } from "@/components/ui";
import { RadiusGraphic } from "@/components/radius-graphic";
import { categoryById, cityById, subCategoryById } from "@/lib/catalog";
import { useApp } from "@/lib/store";

function SentScreen() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const incident = useApp((s) => s.incidents.find((i) => i.id === params.id));

  if (!incident) {
    return (
      <div className="flex min-h-full flex-col items-center justify-center gap-3 px-6 text-center">
        <p className="font-display text-[16px] font-semibold">Ticket not found</p>
        <p className="text-[12px] text-muted">It may have been cleared with the demo data.</p>
        <Button onClick={() => router.push("/app")}>Back to home</Button>
      </div>
    );
  }

  const city = cityById(incident.cityId);
  const category = categoryById(incident.categoryId);
  const sub = subCategoryById(incident.subCategoryId);

  const rows = [
    {
      icon: Building2,
      title: "Related government office",
      body: incident.notifiedOrgs.join(" · "),
      meta: "Notified",
      live: true,
    },
    {
      icon: HandHeart,
      title: "Local NGOs",
      body: `${incident.notifiedNgos.length} verified civic response NGOs on ground`,
      meta: "Notified",
      live: true,
    },
    {
      icon: Users,
      title: `${incident.radiusKm.toFixed(1)} km radius users`,
      body: "Citizens in the radius were pinged to verify or help",
      meta: `${incident.alertedCount} alerted`,
      live: true,
    },
  ];

  return (
    <div className="flex min-h-full flex-col">
      <div className="px-5 pt-5">
        <div className="flex items-center justify-between">
          <span className="label-caps">WF-06 // Dispatch</span>
          <StatusBadge status={incident.status} />
        </div>

        <div className="mt-4 flex items-center gap-3">
          <span className="flex size-11 items-center justify-center rounded-full bg-green-soft text-green">
            <Check className="size-5" />
          </span>
          <div>
            <p className="text-[10.5px] uppercase tracking-[0.14em] text-muted">Incident {incident.code}</p>
            <h1 className="font-display text-[21px] font-semibold leading-tight tracking-tight">
              Alert dispatched
            </h1>
          </div>
          <Pill tone="green" className="ml-auto">
            {incident.radiusKm.toFixed(1)} km
          </Pill>
        </div>

        <div className="mt-3 rounded-[var(--radius-card)] border border-line bg-white px-4 pb-2 pt-4">
          <RadiusGraphic radiusKm={incident.radiusKm} />
          <p className="mt-1 text-center text-[11px] text-muted">
            {incident.landmark} · {sub?.name ?? incident.title}
          </p>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted">
          <span className="inline-flex items-center gap-1">
            <MapPin className="size-3" /> {city.name}
          </span>
          <span>{category.name}</span>
          <span className="ml-auto inline-flex items-center gap-1 text-green">
            <Radio className="size-3" /> Live on the network
          </span>
        </div>

        <section className="mt-5">
          <div className="mb-2 flex items-center justify-between">
            <span className="label-caps">Who has been informed</span>
            <span className="text-[10px] text-muted">3 channels</span>
          </div>
          <div className="space-y-2">
            {rows.map((row) => {
              const Icon = row.icon;
              return (
                <div
                  key={row.title}
                  className="flex items-start gap-3 rounded-xl border border-line bg-white p-3"
                >
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-line bg-paper text-ink/70">
                    <Icon className="size-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[12.5px] font-semibold">{row.title}</p>
                    <p className="mt-0.5 line-clamp-2 text-[11px] leading-relaxed text-muted">{row.body}</p>
                  </div>
                  <Pill tone="green" className="shrink-0">
                    {row.meta}
                  </Pill>
                </div>
              );
            })}
          </div>
        </section>

        <p className="mt-4 rounded-xl border border-dashed border-line-strong bg-white/60 px-3 py-2 text-[10.5px] leading-relaxed text-muted">
          Prototype note: authority and NGO notifications are simulated for the demo. Citizens counted
          here come from seeded demo profiles inside the radius.
        </p>
      </div>

      <div className="sticky bottom-0 mt-auto grid grid-cols-2 gap-2 border-t border-line bg-paper/95 px-5 pb-4 pt-3 backdrop-blur">
        <Link href="/app">
          <Button variant="secondary" size="lg" className="w-full">
            Back to home
          </Button>
        </Link>
        <Link href={`/track/${incident.id}`}>
          <Button size="lg" className="w-full">
            Track status
          </Button>
        </Link>
      </div>
    </div>
  );
}

export default function SentPage() {
  return (
    <HydrationGate>
      <AppFrame>
        <SentScreen />
      </AppFrame>
    </HydrationGate>
  );
}
