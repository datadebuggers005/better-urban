"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowUpRight,
  ChevronDown,
  MapPin,
  Search,
  ShieldCheck,
  Star,
  TrendingUp,
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
import { BRAND } from "@/lib/brand";
import { cn } from "@/lib/utils";

function HomeScreen() {
  const router = useRouter();
  const user = useSessionUser();
  const unread = useUnreadCount();
  const cities = useApp((s) => s.cities);
  const activeCityId = useApp((s) => s.activeCityId);
  const setCity = useApp((s) => s.setCity);
  const incidents = useApp((s) => s.incidents);
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

  const myStats = useMemo(() => {
    const mine = incidents.filter((i) => i.reporterId === user?.id);
    const resolved = mine.filter((i) => i.status === "resolved" || i.status === "closed").length;
    const inProgress = mine.filter((i) => i.status === "assigned" || i.status === "in_progress").length;
    return { total: mine.length, inProgress, resolved };
  }, [incidents, user?.id]);

  const citySummary = useMemo(() => {
    const red = cityIncidents.filter((i) => i.mapColor === "RED").length;
    const yellow = cityIncidents.filter((i) => i.mapColor === "YELLOW").length;
    const green = cityIncidents.filter((i) => i.mapColor === "GREEN").length;
    return { red, yellow, green };
  }, [cityIncidents]);

  const reference = useMemo(() => {
    const sector =
      user?.cityId === activeCityId ? sectors.find((s) => s.id === user?.sectorId) : undefined;
    return sector ? { lat: sector.lat, lng: sector.lng } : city.center;
  }, [sectors, user?.sectorId, user?.cityId, activeCityId, city.center]);

  const nearby = useMemo(() => {
    return cityIncidents
      .filter((i) => i.status !== "closed")
      .map((i) => ({ incident: i, distance: haversineKm(reference, i) }))
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 5);
  }, [cityIncidents, reference]);

  const mySector = sectors.find((s) => s.id === user?.sectorId);

  const categories = useMemo(() => {
    if (!query.trim()) return CATEGORIES;
    const q = query.toLowerCase();
    return CATEGORIES.filter((c) => c.name.toLowerCase().includes(q) || c.blurb.toLowerCase().includes(q));
  }, [query]);

  if (!user) return null;

  return (
    <AppFrame>
      <div className="space-y-4 px-5 pb-6 pt-4">
        {/* Top bar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <img src={BRAND.logo} alt={BRAND.name} className="h-9 w-auto rounded-lg object-contain" />
            <div>
              <p className="font-display text-[15px] font-bold leading-tight text-ink">{BRAND.name}</p>
              <p className="text-[10px] font-medium text-muted">{BRAND.tagline}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <StarCount value={user.stars} />
            <NotificationButton count={unread} />
          </div>
        </div>

        {/* City selector + role badge */}
        <div className="flex items-center justify-between gap-2 rounded-xl border border-line bg-white px-3 py-2">
          <div className="flex items-center gap-2">
            <MapPin className="size-4 text-primary" />
            <select
              aria-label="Select city"
              value={activeCityId}
              onChange={(e) => setCity(e.target.value)}
              className="bg-transparent font-display text-[13px] font-semibold text-ink focus:outline-none"
            >
              {cities.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <ChevronDown className="size-3.5 text-muted" />
          </div>
          <div className="flex items-center gap-1.5">
            <Pill tone="neutral">{user.role}</Pill>
            <DemoBadge />
          </div>
        </div>

        {/* Citizen personal overview */}
        <div className="rounded-[var(--radius-card)] bg-surface-dark p-4 text-white shadow-[var(--shadow-soft)]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar name={user.name} size={42} className="bg-primary text-white ring-white/20" />
              <div>
                <p className="font-display text-[15px] font-semibold">{user.name}</p>
                <p className="text-[11px] text-white/75">
                  {mySector ? mySector.name : city.name}
                </p>
              </div>
            </div>
            {(user.role === "officer" || user.role === "admin") && (
              <Link
                href="/admin"
                className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-1 text-[11px] font-semibold text-secondary-10"
              >
                <ShieldCheck className="size-3.5" />
                Console
              </Link>
            )}
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2 rounded-xl bg-white/10 p-2.5 text-center">
            <div>
              <p className="font-display text-[18px] font-bold">{myStats.total}</p>
              <p className="text-[10px] uppercase tracking-wider text-white/75">My Reports</p>
            </div>
            <div>
              <p className="font-display text-[18px] font-bold text-secondary-80">{myStats.inProgress}</p>
              <p className="text-[10px] uppercase tracking-wider text-white/75">In Progress</p>
            </div>
            <div>
              <p className="font-display text-[18px] font-bold text-success-90">{myStats.resolved}</p>
              <p className="text-[10px] uppercase tracking-wider text-white/75">Resolved</p>
            </div>
          </div>
        </div>

        {/* Live City Map card */}
        <Link
          href="/map"
          className="block rounded-[var(--radius-card)] border border-primary/25 bg-white p-4 transition hover:border-primary hover:shadow-[var(--shadow-lift)]"
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <LivePill label="Live City Map" />
                <span className="text-[11px] text-muted">{city.name}</span>
              </div>
              <p className="mt-1.5 font-display text-[15px] font-semibold text-ink">
                Explore Ward Issues &amp; Resolution Status
              </p>
            </div>
            <ArrowUpRight className="size-5 text-primary" />
          </div>
          <div className="mt-3 flex items-center gap-3 text-[11px] font-medium">
            <span className="inline-flex items-center gap-1.5 text-error">
              <span className="size-2.5 rounded-full bg-error" />
              {citySummary.red} Not Started
            </span>
            <span className="inline-flex items-center gap-1.5 text-secondary-50">
              <span className="size-2.5 rounded-full bg-secondary" />
              {citySummary.yellow} Working
            </span>
            <span className="inline-flex items-center gap-1.5 text-success-50">
              <span className="size-2.5 rounded-full bg-success" />
              {citySummary.green} Done
            </span>
          </div>
        </Link>

        {/* Report an Issue — 5 Canonical Categories */}
        <div>
          <div className="mb-2.5 flex items-center justify-between">
            <h2 className="font-display text-[15px] font-semibold">Report an Issue</h2>
            <div className="relative w-36">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Filter…"
                className="w-full rounded-full border border-line bg-white py-1 pl-8 pr-3 text-[11.5px] focus:border-primary focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            {categories.map((cat) => (
              <Link
                key={cat.id}
                href={`/report/${cat.id}`}
                className={cn(
                  "flex items-center gap-3 rounded-[var(--radius-card)] border border-line bg-white p-3 transition hover:border-primary hover:shadow-[var(--shadow-soft)]",
                )}
              >
                <div
                  className="flex size-10 shrink-0 items-center justify-center rounded-xl"
                  style={{ backgroundColor: `${cat.accent}18`, color: cat.accent }}
                >
                  <CategoryIcon id={cat.id} size={20} />
                </div>
                <div className="min-w-0">
                  <p className="truncate font-display text-[13.5px] font-semibold">{cat.name}</p>
                  <p className="truncate text-[10.5px] text-muted">{cat.blurb}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Nearby / Recent City Complaints */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <h2 className="font-display text-[15px] font-semibold">Recent in {city.name}</h2>
            <Link href="/my-reports" className="text-[12px] font-semibold text-primary hover:underline">
              View all
            </Link>
          </div>

          <div className="space-y-2.5">
            {nearby.map(({ incident, distance }) => (
              <Link
                key={incident.id}
                href={`/track/${incident.id}`}
                className="flex items-center justify-between gap-3 rounded-xl border border-line bg-white p-3 transition hover:border-line-strong"
              >
                <div className="min-w-0">
                  <p className="truncate font-display text-[13px] font-semibold">{incident.title}</p>
                  <p className="mt-0.5 text-[11px] text-muted">
                    {incident.code} · Ward {incident.wardNumber} · {formatKm(distance)}
                  </p>
                </div>
                <StatusBadge status={incident.status} />
              </Link>
            ))}
          </div>
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-2 gap-2.5 pt-1">
          <Link
            href="/leaderboard"
            className="flex items-center gap-2 rounded-xl border border-line bg-white p-3 text-[12px] font-semibold hover:border-primary"
          >
            <TrendingUp className="size-4 text-primary" />
            Civic Leaderboard
          </Link>
          <Link
            href="/feedback"
            className="flex items-center gap-2 rounded-xl border border-line bg-white p-3 text-[12px] font-semibold hover:border-primary"
          >
            <Star className="size-4 text-secondary" />
            App Feedback
          </Link>
        </div>
      </div>
    </AppFrame>
  );
}

export default function AppDashboardPage() {
  return (
    <HydrationGate>
      <HomeScreen />
    </HydrationGate>
  );
}
