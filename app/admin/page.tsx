"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowUpRight, Building2, CheckCircle2, Clock3, Search, ShieldAlert } from "lucide-react";
import { AppFrame, HydrationGate } from "@/components/app-frame";
import {
  Button,
  Card,
  Chip,
  PageHeader,
  Pill,
  Select,
  StatusBadge,
} from "@/components/ui";
import { STATUS_FLOW, STATUS_META, cityById } from "@/lib/catalog";
import { timeAgo } from "@/lib/format";
import { useApp, useSessionUser } from "@/lib/store";
import type { IncidentStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

function AdminScreen() {
  const router = useRouter();
  const user = useSessionUser();
  const cities = useApp((s) => s.cities);
  const activeCityId = useApp((s) => s.activeCityId);
  const setCity = useApp((s) => s.setCity);
  const incidents = useApp((s) => s.incidents);
  const updateStatus = useApp((s) => s.updateStatus);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<IncidentStatus | "all">("all");

  useEffect(() => {
    if (!user) router.replace("/auth");
  }, [user, router]);

  const cityIncidents = useMemo(
    () =>
      incidents
        .filter((incident) => incident.cityId === activeCityId)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [incidents, activeCityId],
  );

  const filtered = cityIncidents.filter((incident) => {
    if (statusFilter !== "all" && incident.status !== statusFilter) return false;
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return (
      incident.code.toLowerCase().includes(q) ||
      incident.title.toLowerCase().includes(q) ||
      incident.landmark.toLowerCase().includes(q)
    );
  });

  const stats = useMemo(() => {
    const resolved = cityIncidents.filter((incident) => incident.status === "resolved").length;
    const open = cityIncidents.length - resolved;
    return {
      open,
      resolved,
      rate: cityIncidents.length ? Math.round((resolved / cityIncidents.length) * 100) : 0,
    };
  }, [cityIncidents]);

  if (!user) return null;

  return (
    <div className="pb-6">
      <PageHeader
        label="Ops // City console"
        title="Dispatch console"
        subtitle="Simulated authority view for the demo"
        back="/profile"
        right={<Pill tone="gold">Demo</Pill>}
      />

      <div className="space-y-3.5 px-5 pt-4">
        <div className="flex items-start gap-2 rounded-xl border border-gold/30 bg-gold-soft/50 px-3 py-2.5">
          <ShieldAlert className="mt-0.5 size-3.5 shrink-0 text-[#8a5f17]" />
          <p className="text-[10.5px] leading-relaxed text-[#6d4c13]">
            This console mimics a municipal control room. Status changes notify the original reporter —
            use it to demo the closed loop. No real authority is connected.
          </p>
        </div>

        <div className="grid grid-cols-4 gap-2">
          {[
            { label: "Tickets", value: cityIncidents.length },
            { label: "Open", value: stats.open },
            { label: "Closed", value: stats.resolved },
            { label: "Rate", value: `${stats.rate}%` },
          ].map((stat) => (
            <div key={stat.label} className="rounded-xl border border-line bg-white px-2 py-2.5 text-center">
              <p className="font-display text-[16px] font-semibold leading-none">{stat.value}</p>
              <p className="mt-1 text-[9px] uppercase tracking-[0.1em] text-muted">{stat.label}</p>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <Select value={activeCityId} onChange={(event) => setCity(event.target.value)}>
            {cities.map((city) => (
              <option key={city.id} value={city.id}>
                {city.name}
              </option>
            ))}
          </Select>
        </div>

        <div className="relative">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search code, issue or landmark…"
            className="field pl-10"
          />
        </div>

        <div className="no-scrollbar -mx-5 flex gap-1.5 overflow-x-auto px-5">
          <Chip active={statusFilter === "all"} onClick={() => setStatusFilter("all")}>
            All ({cityIncidents.length})
          </Chip>
          {STATUS_FLOW.map((status) => (
            <Chip key={status} active={statusFilter === status} onClick={() => setStatusFilter(status)}>
              {STATUS_META[status].short}
            </Chip>
          ))}
        </div>

        <div className="space-y-2">
          {filtered.slice(0, 24).map((incident) => (
            <Card key={incident.id} className="p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="font-mono text-[10.5px] text-muted">{incident.code}</p>
                    <StatusBadge status={incident.status} />
                  </div>
                  <p className="mt-1 truncate text-[12.5px] font-semibold">{incident.title}</p>
                  <p className="truncate text-[10.5px] text-muted">
                    {incident.landmark} · {timeAgo(incident.createdAt)} · {incident.alertedCount} alerted
                  </p>
                </div>
                <Link
                  href={`/track/${incident.id}`}
                  className="flex size-7 shrink-0 items-center justify-center rounded-full border border-line bg-white text-muted"
                  aria-label="Open ticket"
                >
                  <ArrowUpRight className="size-3.5" />
                </Link>
              </div>

              <div className="mt-2.5 flex flex-wrap gap-1.5 border-t border-line/70 pt-2.5">
                {STATUS_FLOW.filter((status) => status !== "reported").map((status) => {
                  const current = incident.status === status;
                  return (
                    <button
                      key={status}
                      type="button"
                      onClick={() => updateStatus(incident.id, status)}
                      className={cn(
                        "rounded-full border px-2.5 py-1 text-[10px] font-semibold transition",
                        current
                          ? "border-ink bg-ink text-cream"
                          : "border-line bg-white text-ink/70 hover:border-ink/30",
                      )}
                    >
                      {STATUS_META[status].short}
                    </button>
                  );
                })}
              </div>
            </Card>
          ))}
          {filtered.length === 0 ? (
            <div className="rounded-xl border border-dashed border-line-strong bg-white/60 px-4 py-8 text-center">
              <p className="text-[12px] font-semibold">No tickets match</p>
              <p className="mt-1 text-[11px] text-muted">Try another status or clear the search.</p>
            </div>
          ) : null}
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Button variant="secondary" onClick={() => setStatusFilter("all")}>
            <Clock3 className="size-4" /> Clear filters
          </Button>
          <Button
            onClick={() => {
              const next = cityIncidents.find((incident) => incident.status !== "resolved");
              if (next) updateStatus(next.id, "resolved");
            }}
          >
            <CheckCircle2 className="size-4" /> Close oldest open
          </Button>
        </div>

        <p className="pt-1 text-center text-[9.5px] uppercase tracking-[0.16em] text-muted/70">
          {cityById(activeCityId).name} · simulated control room
        </p>
      </div>
    </div>
  );
}

export default function AdminPage() {
  return (
    <HydrationGate>
      <AppFrame>
        <AdminScreen />
      </AppFrame>
    </HydrationGate>
  );
}
