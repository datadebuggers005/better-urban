"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowUpRight,
  ChevronDown,
  MapPin,
  Search,
  Star,
  TrendingUp,
  Users,
} from "lucide-react";
import { AppFrame, DemoBadge, HydrationGate } from "@/components/app-frame";
import {
  Avatar,
  CategoryIcon,
  LivePill,
  NotificationButton,
  Pill,
  StarCount,
  StatusBadge,
} from "@/components/ui";
import { CATEGORIES, cityById } from "@/lib/catalog";
import { haversineKm, formatKm } from "@/lib/geo";
import { useApp, useSessionUser, useUnreadCount } from "@/lib/store";
import { cn } from "@/lib/utils";

function HomeScreen() {
  const router = useRouter();
  const user = useSessionUser();
  const unread = useUnreadCount();
  const cities = useApp((s) => s.cities);
  const activeCityId = useApp((s) => s.activeCityId);
  const setCity = useApp((s) => s.setCity);
  const incidents = useApp((s) => s.incidents);
  const users = useApp((s) => s.users);
  const sectors = useApp((s) => s.sectors);
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (!user) router.replace("/auth");
  }, [user, router]);

  const city = cityById(activeCityId);
  const cityIncidents = useMemo(
    () => incidents.filter((i) => i.cityId === activeCityId),
    [incidents, activeCityId],
  );

  const topVolunteer = useMemo(() => {
    const pool = users.filter((u) => u.cityId === activeCityId && u.isVolunteer && u.id !== user?.id);
    return pool.sort((a, b) => b.stars - a.stars)[0] ?? null;
  }, [users, activeCityId, user?.id]);

  const week = useMemo(() => {
    const since = Date.now() - 7 * 24 * 3600 * 1000;
    const recent = cityIncidents.filter((i) => new Date(i.createdAt).getTime() >= since);
    const resolved = cityIncidents.filter((i) => i.status === "resolved").length;
    return { reported: recent.length, resolved, open: cityIncidents.length - resolved };
  }, [cityIncidents]);

  const reference = useMemo(() => {
    const sector =
      user?.cityId === activeCityId ? sectors.find((s) => s.id === user?.sectorId) : undefined;
    return sector ? { lat: sector.lat, lng: sector.lng } : city.center;
  }, [sectors, user?.sectorId, user?.cityId, activeCityId, city.center]);

  const nearby = useMemo(() => {
    return cityIncidents
      .filter((i) => i.status !== "resolved")
      .map((i) => ({ incident: i, distance: haversineKm(reference, i) }))
      .filter((row) => row.distance <= (user?.alertRadiusKm ?? 3))
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 6);
  }, [cityIncidents, reference, user?.alertRadiusKm]);

  const mySector = sectors.find((s) => s.id === user?.sectorId);
  const rank = useMemo(() => {
    if (!user) return 0;
    const cityUsers = users.filter((u) => u.cityId === user.cityId).sort((a, b) => b.stars - a.stars);
    return cityUsers.findIndex((u) => u.id === user.id) + 1;
  }, [users, user]);

  const categories = useMemo(() => {
    if (!query.trim()) return CATEGORIES;
    const q = query.toLowerCase();
    return CATEGORIES.filter((c) => c.name.toLowerCase().includes(q) || c.blurb.toLowerCase().includes(q));
  }, [query]);

  const matches = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return cityIncidents
      .filter(
        (i) =>
          i.title.toLowerCase().includes(q) ||
          i.landmark.toLowerCase().includes(q) ||
          i.note.toLowerCase().includes(q),
      )
      .slice(0, 4);
  }, [cityIncidents, query]);

  if (!user) return null;

  return (
    <div className="pb-6">
      <header className="sticky top-0 z-20 border-b border-line/70 bg-paper/95 px-5 pb-3 pt-4 backdrop-blur">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-1">
              <MapPin className="size-3 text-muted" />
              <span className="label-caps">Select city</span>
            </div>
            <label className="relative mt-0.5 flex items-center gap-1">
              <span className="font-display text-[17px] font-semibold tracking-tight">{city.name}</span>
              <ChevronDown className="size-3.5 text-muted" />
              <select
                aria-label="Select city"
                value={activeCityId}
                onChange={(event) => setCity(event.target.value)}
                className="absolute inset-0 cursor-pointer opacity-0"
              >
                {cities.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.name}
                  </option>
                ))}
              </select>
            </label>
            <p className="mt-0.5 text-[10.5px] text-muted">
              {mySector && user.cityId === activeCityId ? `${mySector.name} · ${formatKm(user.alertRadiusKm)} radius` : `Viewing ${city.short} city`}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <NotificationButton count={unread} />
            <Link
              href="/profile"
              aria-label="Profile"
              className="flex size-9 items-center justify-center rounded-full border border-line bg-white"
            >
              <Avatar name={user.name} size={28} className="ring-0" />
            </Link>
          </div>
        </div>
      </header>

      <div className="space-y-4 px-5 pt-4">
        <div className="flex items-center justify-between">
          <span className="label-caps">This week</span>
          <DemoBadge />
        </div>

        <div className="grid grid-cols-3 gap-2">
          {[
            { label: "Reported", value: week.reported },
            { label: "Resolved", value: week.resolved },
            { label: "In queue", value: week.open },
          ].map((stat) => (
            <div key={stat.label} className="rounded-xl border border-line bg-white px-3 py-2.5">
              <p className="font-display text-[18px] font-semibold leading-none">{stat.value}</p>
              <p className="mt-1 text-[10px] uppercase tracking-[0.1em] text-muted">{stat.label}</p>
            </div>
          ))}
        </div>

        {topVolunteer ? (
          <section>
            <div className="mb-1.5 flex items-center justify-between">
              <span className="label-caps">Best volunteer</span>
              <Link href="/leaderboard" className="text-[11px] font-medium text-muted hover:text-ink">
                Leaderboard
              </Link>
            </div>
            <Link
              href="/leaderboard"
              className="flex items-center gap-3 rounded-[var(--radius-card)] border border-line bg-white p-3.5 shadow-[var(--shadow-soft)] transition hover:border-line-strong"
            >
              <Avatar name={topVolunteer.name} size={46} />
              <div className="min-w-0 flex-1">
                <p className="truncate font-display text-[14.5px] font-semibold">{topVolunteer.name}</p>
                <p className="mt-0.5 truncate text-[11.5px] text-muted">
                  {sectors.find((s) => s.id === topVolunteer.sectorId)?.name} · {topVolunteer.helped} issues helped
                </p>
                <Pill tone="gold" className="mt-1.5">
                  Top civic responder
                </Pill>
              </div>
              <StarCount value={topVolunteer.stars} />
            </Link>
          </section>
        ) : null}

        <section>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="What's your problem?"
              className="field pl-10 pr-3"
            />
          </div>
        </section>

        {matches.length > 0 ? (
          <section className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="label-caps">Matching issues</span>
              <span className="text-[11px] text-muted">{matches.length} found</span>
            </div>
            {matches.map((incident) => (
              <Link
                key={incident.id}
                href={`/track/${incident.id}`}
                className="flex items-center justify-between gap-3 rounded-xl border border-line bg-white px-3 py-2.5"
              >
                <div className="min-w-0">
                  <p className="truncate text-[12.5px] font-semibold">{incident.title}</p>
                  <p className="truncate text-[11px] text-muted">
                    {incident.landmark} · {incident.code}
                  </p>
                </div>
                <StatusBadge status={incident.status} />
              </Link>
            ))}
          </section>
        ) : null}

        <section>
          <div className="mb-2 flex items-center justify-between">
            <span className="label-caps">Select category</span>
            <span className="text-[10px] uppercase tracking-[0.1em] text-muted">{categories.length} categories</span>
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            {categories.map((category) => (
              <Link
                key={category.id}
                href={`/report/${category.id}`}
                className="group flex flex-col gap-2 rounded-[1.05rem] border border-line bg-white p-3 transition hover:-translate-y-0.5 hover:border-line-strong hover:shadow-[var(--shadow-soft)]"
              >
                <span
                  className="flex size-9 items-center justify-center rounded-xl border"
                  style={{
                    backgroundColor: `${category.accent}12`,
                    borderColor: `${category.accent}2e`,
                    color: category.accent,
                  }}
                >
                  <CategoryIcon id={category.id} size={18} />
                </span>
                <span className="min-w-0">
                  <span className="block truncate font-display text-[12.5px] font-semibold leading-tight">
                    {category.name}
                  </span>
                  <span className="mt-0.5 block truncate text-[10.5px] text-muted">{category.blurb}</span>
                </span>
              </Link>
            ))}
          </div>
        </section>

        <section>
          <div className="mb-2 flex items-center justify-between">
            <span className="label-caps">Live alerts near you</span>
            <LivePill />
          </div>
          {nearby.length === 0 ? (
            <div className="rounded-[var(--radius-card)] border border-dashed border-line-strong bg-white/60 px-4 py-6 text-center">
              <p className="text-[12px] font-semibold">Your 3 km radius is quiet</p>
              <p className="mt-1 text-[11px] text-muted">Report an issue to wake up the neighbourhood.</p>
            </div>
          ) : (
            <div className="no-scrollbar -mx-5 flex snap-x gap-2.5 overflow-x-auto px-5 pb-1">
              {nearby.map(({ incident, distance }) => (
                <Link
                  key={incident.id}
                  href={`/track/${incident.id}`}
                  className="w-[228px] shrink-0 snap-start rounded-[var(--radius-card)] border border-line bg-white p-3.5"
                >
                  <div className="flex items-center justify-between">
                    <Pill tone="neutral">{incident.code}</Pill>
                    <span className="text-[10.5px] text-muted">{formatKm(distance)} away</span>
                  </div>
                  <p className="mt-2 line-clamp-2 font-display text-[13px] font-semibold leading-snug">
                    {incident.title}
                  </p>
                  <p className="mt-1 truncate text-[11px] text-muted">{incident.landmark}</p>
                  <div className="mt-2.5 flex items-center justify-between">
                    <span className="inline-flex items-center gap-1 text-[10.5px] text-muted">
                      <Users className="size-3" /> {incident.alertedCount} alerted
                    </span>
                    <StatusBadge status={incident.status} />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        <Link
          href="/leaderboard"
          className="flex items-center justify-between rounded-[var(--radius-card)] border border-ink/10 bg-ink px-4 py-3.5 text-cream"
        >
          <div className="flex items-center gap-3">
            <span className="flex size-9 items-center justify-center rounded-full bg-white/10">
              <TrendingUp className="size-4" />
            </span>
            <div>
              <p className="text-[12.5px] font-semibold">
                {user.stars.toLocaleString("en-IN")} stars · Rank #{rank || "—"}
              </p>
              <p className="text-[10.5px] text-cream/60">
                {user.helped} verified helps · {mySector?.name ?? "Your sector"}
              </p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-cream/80">
            <Star className="size-3 fill-gold text-gold" /> {user.stars}
            <ArrowUpRight className="size-3.5" />
          </span>
        </Link>

        <p className={cn("pb-2 text-center text-[9.5px] uppercase tracking-[0.16em] text-muted/70")}>
          Prototype · seeded demo data · simulated dispatch
        </p>
      </div>
    </div>
  );
}

export default function AppHomePage() {
  return (
    <HydrationGate>
      <AppFrame>
        <HomeScreen />
      </AppFrame>
    </HydrationGate>
  );
}
