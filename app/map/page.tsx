"use client";

import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import Link from "next/link";
import { MapPin, Tag, X } from "lucide-react";
import { AppFrame, HydrationGate } from "@/components/app-frame";
import {
  Button,
  Card,
  PageHeader,
  Pill,
  Select,
  StatusBadge,
} from "@/components/ui";
import { CATEGORIES, STATUS_META, normalizeStatus, mapColorForStatus, categoryById, cityById } from "@/lib/catalog";
import { resolveMediaUrl } from "@/lib/api";
import { useApp } from "@/lib/store";
import type { Incident } from "@/lib/types";

const LiveCityMap = dynamic(() => import("@/components/map/live-city-map"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[360px] items-center justify-center rounded-[var(--radius-card)] border border-line bg-white text-[12px] text-muted">
      Loading interactive city map…
    </div>
  ),
});

function MapScreen() {
  const cities = useApp((s) => s.cities);
  const incidents = useApp((s) => s.incidents);
  const activeCityId = useApp((s) => s.activeCityId);

  const [cityFilter, setCityFilter] = useState(activeCityId || "metro");
  const [catFilter, setCatFilter] = useState("all");
  const [wardFilter, setWardFilter] = useState("all");
  const [selected, setSelected] = useState<Incident | null>(null);

  const city = cityById(cityFilter);

  const filtered = useMemo(() => {
    return incidents.filter((inc) => {
      if (cityFilter !== "all" && inc.cityId !== cityFilter) return false;
      if (catFilter !== "all" && inc.categoryId !== catFilter) return false;
      if (wardFilter !== "all" && String(inc.wardNumber) !== wardFilter) return false;
      return true;
    });
  }, [incidents, cityFilter, catFilter, wardFilter]);

  const counts = useMemo(() => {
    return {
      red: filtered.filter((i) => mapColorForStatus(i.status) === "RED").length,
      yellow: filtered.filter((i) => mapColorForStatus(i.status) === "YELLOW").length,
      green: filtered.filter((i) => mapColorForStatus(i.status) === "GREEN").length,
    };
  }, [filtered]);

  const wards = useMemo(() => {
    const set = new Set<number>();
    incidents
      .filter((i) => cityFilter === "all" || i.cityId === cityFilter)
      .forEach((i) => set.add(i.wardNumber));
    return Array.from(set).sort((a, b) => a - b);
  }, [incidents, cityFilter]);

  return (
    <AppFrame>
      <PageHeader
        back="/app"
        label="Live City Map"
        title={`${cityFilter === "all" ? "All Cities" : city.name} · ${filtered.length} Issues`}
      />

      <div className="space-y-4 px-5 pb-8 pt-4">
        {/* Legend */}
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-line bg-white px-3.5 py-2.5 text-[11px] font-semibold">
          <span className="inline-flex items-center gap-1.5 text-error">
            <span className="size-3 rounded-full bg-error" />
            RED · Not Started ({counts.red})
          </span>
          <span className="inline-flex items-center gap-1.5 text-secondary-50">
            <span className="size-3 rounded-full bg-secondary" />
            YELLOW · In Progress ({counts.yellow})
          </span>
          <span className="inline-flex items-center gap-1.5 text-success-50">
            <span className="size-3 rounded-full bg-success" />
            GREEN · Done ({counts.green})
          </span>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-3 gap-2">
          <Select value={cityFilter} onChange={(e) => setCityFilter(e.target.value)} aria-label="Filter map by city">
            {cities.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
            <option value="all">All Cities</option>
          </Select>

          <Select value={catFilter} onChange={(e) => setCatFilter(e.target.value)} aria-label="Filter map by category">
            <option value="all">All Categories</option>
            {CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>

          <Select value={wardFilter} onChange={(e) => setWardFilter(e.target.value)} aria-label="Filter map by ward">
            <option value="all">All Wards</option>
            {wards.map((w) => (
              <option key={w} value={String(w)}>
                Ward {w}
              </option>
            ))}
          </Select>
        </div>

        {/* Interactive Leaflet Map */}
        <LiveCityMap
          center={city.center}
          incidents={filtered}
          onSelectIncident={(inc) => setSelected(inc)}
        />

        {/* Selected Complaint Details Drawer */}
        {selected ? (
          <Card className="border-primary/40 space-y-2.5">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="label-caps">
                  {selected.code} · Ward {selected.wardNumber} · {categoryById(selected.categoryId).name}
                </p>
                <h2 className="font-display text-[15px] font-semibold">{selected.title}</h2>
              </div>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="rounded-full p-1 text-muted hover:bg-paper"
                aria-label="Close details"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={selected.status} />
              <Pill
                tone={
                  mapColorForStatus(selected.status) === "GREEN"
                    ? "green"
                    : mapColorForStatus(selected.status) === "YELLOW"
                      ? "gold"
                      : "danger"
                }
              >
                {mapColorForStatus(selected.status)}
              </Pill>
            </div>

            <p className="flex items-center gap-1.5 text-[12px] text-muted">
              <MapPin className="size-3.5 text-primary" />
              {selected.landmark || `Ward ${selected.wardNumber}`}
            </p>

            {selected.photoUrl ? (
              <img
                src={resolveMediaUrl(selected.photoUrl) ?? ""}
                alt={selected.title}
                className="h-36 w-full rounded-xl object-cover"
              />
            ) : null}

            {selected.tags?.length ? (
              <div className="flex flex-wrap gap-1">
                {selected.tags.map((t) => (
                  <span key={t} className="inline-flex items-center gap-1 rounded-full bg-paper px-2 py-0.5 text-[10.5px] text-muted">
                    <Tag className="size-2.5" />
                    {t}
                  </span>
                ))}
              </div>
            ) : null}

            <Link href={`/track/${selected.id}`} className="block pt-1">
              <Button size="sm" className="w-full">
                Open Full Complaint &amp; Timeline
              </Button>
            </Link>
          </Card>
        ) : (
          <p className="text-center text-[11.5px] text-muted">
            Tap any colored marker on the map to inspect complaint details and ward number.
          </p>
        )}

        {/* Quick Ward List */}
        <div className="space-y-2">
          <p className="label-caps">Visible Markers ({filtered.length})</p>
          {filtered.slice(0, 6).map((inc) => (
            <button
              key={inc.id}
              type="button"
              onClick={() => setSelected(inc)}
              className="flex w-full items-center justify-between rounded-xl border border-line bg-white px-3 py-2.5 text-left transition hover:border-primary"
            >
              <div className="min-w-0">
                <p className="truncate text-[12.5px] font-semibold">{inc.title}</p>
                <p className="text-[11px] text-muted">
                  {inc.code} · Ward {inc.wardNumber} · {STATUS_META[normalizeStatus(inc.status)].label}
                </p>
              </div>
              <span
                className={
                  mapColorForStatus(inc.status) === "GREEN"
                    ? "size-3 rounded-full bg-success"
                    : mapColorForStatus(inc.status) === "YELLOW"
                      ? "size-3 rounded-full bg-secondary"
                      : "size-3 rounded-full bg-error"
                }
              />
            </button>
          ))}
        </div>
      </div>
    </AppFrame>
  );
}

export default function MapPage() {
  return (
    <HydrationGate>
      <MapScreen />
    </HydrationGate>
  );
}
