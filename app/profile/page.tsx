"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BellRing,
  Building2,
  ChevronRight,
  FileText,
  HandHeart,
  LogOut,
  MessageSquare,
  Pencil,
  RotateCcw,
  Shield,
  Star,
  Trophy,
  X,
} from "lucide-react";
import { AppFrame, HydrationGate } from "@/components/app-frame";
import {
  Avatar,
  Button,
  Card,
  CategoryIcon,
  Chip,
  FieldLabel,
  PageHeader,
  Pill,
  Select,
  StarCount,
  TextInput,
  Toggle,
} from "@/components/ui";
import { CATEGORIES, cityById } from "@/lib/catalog";
import { useApp, useSessionUser } from "@/lib/store";
import { cn } from "@/lib/utils";

function ProfileScreen() {
  const router = useRouter();
  const user = useSessionUser();
  const cities = useApp((s) => s.cities);
  const sectors = useApp((s) => s.sectors);
  const users = useApp((s) => s.users);
  const toggleAlerts = useApp((s) => s.toggleAlerts);
  const setAlertRadius = useApp((s) => s.setAlertRadius);
  const toggleCategory = useApp((s) => s.togglePreferredCategory);
  const updateProfile = useApp((s) => s.updateProfile);
  const logout = useApp((s) => s.logout);
  const resetDemo = useApp((s) => s.resetDemo);

  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [cityId, setCityId] = useState("metro");
  const [sectorId, setSectorId] = useState("");

  useEffect(() => {
    if (!user) router.replace("/auth");
  }, [user, router]);

  useEffect(() => {
    if (!user) return;
    setName(user.name);
    setPhone(user.phone);
    setCityId(user.cityId);
    setSectorId(user.sectorId);
  }, [user?.id]);

  const sector = sectors.find((s) => s.id === user?.sectorId);
  const rank = useMemo(() => {
    if (!user) return 0;
    const pool = users.filter((u) => u.cityId === user.cityId).sort((a, b) => b.stars - a.stars);
    return pool.findIndex((u) => u.id === user.id) + 1;
  }, [users, user]);

  if (!user) return null;

  const citySectors = sectors.filter((s) => s.cityId === cityId);

  return (
    <div className="pb-6">
      <PageHeader
        label="WF-08 // Profile"
        title="Profile"
        back="/app"
        right={
          <Button variant="secondary" size="sm" onClick={() => setEditing((value) => !value)}>
            {editing ? <X className="size-3.5" /> : <Pencil className="size-3.5" />}
            {editing ? "Close" : "Edit"}
          </Button>
        }
      />

      <div className="space-y-3.5 px-5 pt-4">
        <Card>
          <div className="flex items-center gap-3">
            <Avatar name={user.name} size={54} />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <p className="truncate font-display text-[17px] font-semibold">{user.name}</p>
                {user.isVolunteer ? <Shield className="size-3.5 text-green" /> : null}
              </div>
              <p className="text-[11px] text-muted">
                {user.isVolunteer ? "Volunteer account" : "Citizen account"} · {cityById(user.cityId).name}
              </p>
              <p className="mt-0.5 truncate text-[11px] text-muted">
                {sector?.name} · {user.phone || user.email}
              </p>
            </div>
            <StarCount value={user.stars} />
          </div>

          <div className="mt-3 grid grid-cols-3 gap-2">
            <div className="rounded-lg bg-paper px-2.5 py-2">
              <p className="font-display text-[16px] font-semibold leading-none">{user.stars}</p>
              <p className="mt-1 text-[9.5px] uppercase tracking-[0.1em] text-muted">Stars</p>
            </div>
            <div className="rounded-lg bg-paper px-2.5 py-2">
              <p className="font-display text-[16px] font-semibold leading-none">{user.helped}</p>
              <p className="mt-1 text-[9.5px] uppercase tracking-[0.1em] text-muted">Helped</p>
            </div>
            <div className="rounded-lg bg-paper px-2.5 py-2">
              <p className="font-display text-[16px] font-semibold leading-none">#{rank || "—"}</p>
              <p className="mt-1 text-[9.5px] uppercase tracking-[0.1em] text-muted">City rank</p>
            </div>
          </div>
        </Card>

        {editing ? (
          <Card>
            <span className="label-caps">Edit profile</span>
            <div className="mt-2 space-y-2.5">
              <div>
                <FieldLabel>Name</FieldLabel>
                <TextInput value={name} onChange={(event) => setName(event.target.value)} />
              </div>
              <div>
                <FieldLabel>Phone</FieldLabel>
                <TextInput
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  placeholder="+91…"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <FieldLabel>City</FieldLabel>
                  <Select
                    value={cityId}
                    onChange={(event) => {
                      const nextCity = event.target.value;
                      setCityId(nextCity);
                      const first = sectors.find((s) => s.cityId === nextCity);
                      if (first) setSectorId(first.id);
                    }}
                  >
                    {cities.map((city) => (
                      <option key={city.id} value={city.id}>
                        {city.name}
                      </option>
                    ))}
                  </Select>
                </div>
                <div>
                  <FieldLabel>Sector</FieldLabel>
                  <Select value={sectorId} onChange={(event) => setSectorId(event.target.value)}>
                    {citySectors.map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.name}
                      </option>
                    ))}
                  </Select>
                </div>
              </div>
              <Button
                size="md"
                className="w-full"
                onClick={() => {
                  updateProfile({ name: name.trim() || user.name, phone, cityId, sectorId });
                  setEditing(false);
                }}
              >
                Save changes
              </Button>
            </div>
          </Card>
        ) : null}

        <Card>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BellRing className="size-4 text-muted" />
              <span className="label-caps">Alerts</span>
            </div>
            <Toggle checked={user.alertsEnabled} onChange={() => toggleAlerts()} label="3 km alerts" />
          </div>

          <div className="mt-3">
            <FieldLabel hint="Applies to new reports">Alert radius</FieldLabel>
            <div className="flex gap-1.5">
              {[3, 5, 10].map((km) => (
                <Chip key={km} active={user.alertRadiusKm === km} onClick={() => setAlertRadius(km)}>
                  {km} km
                </Chip>
              ))}
            </div>
          </div>

          <div className="mt-3">
            <FieldLabel>Alert sub-categories</FieldLabel>
            <div className="flex flex-wrap gap-1.5">
              {CATEGORIES.map((category) => (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => toggleCategory(category.id)}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10.5px] font-medium transition",
                    user.preferredCategories.includes(category.id)
                      ? "border-ink bg-ink text-cream"
                      : "border-line bg-white text-ink/70",
                  )}
                >
                  <CategoryIcon id={category.id} size={12} />
                  {category.short}
                </button>
              ))}
            </div>
          </div>
        </Card>

        <Card className="divide-y divide-line/70 p-0">
          <Link href="/my-reports" className="flex items-center gap-3 px-3.5 py-3">
            <span className="flex size-8 items-center justify-center rounded-lg bg-paper text-ink/70">
              <FileText className="size-4" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[12.5px] font-semibold">My complaints</p>
              <p className="text-[10.5px] text-muted">Track every ticket you filed</p>
            </div>
            <ChevronRight className="size-4 text-muted" />
          </Link>
          <Link href="/volunteer" className="flex items-center gap-3 px-3.5 py-3">
            <span className="flex size-8 items-center justify-center rounded-lg bg-paper text-ink/70">
              <HandHeart className="size-4" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[12.5px] font-semibold">Volunteer hub</p>
              <p className="text-[10.5px] text-muted">
                {user.isVolunteer ? "You are an active responder" : "Join and respond to nearby alerts"}
              </p>
            </div>
            <Pill tone="gold">
              <Star className="size-2.5" /> {user.stars}
            </Pill>
          </Link>
          <Link href="/leaderboard" className="flex items-center gap-3 px-3.5 py-3">
            <span className="flex size-8 items-center justify-center rounded-lg bg-paper text-ink/70">
              <Trophy className="size-4" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[12.5px] font-semibold">City leaderboard</p>
              <p className="text-[10.5px] text-muted">Rank #{rank || "—"} in {cityById(user.cityId).name}</p>
            </div>
            <ChevronRight className="size-4 text-muted" />
          </Link>
          <Link href="/admin" className="flex items-center gap-3 px-3.5 py-3">
            <span className="flex size-8 items-center justify-center rounded-lg bg-paper text-ink/70">
              <Building2 className="size-4" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[12.5px] font-semibold">City ops console</p>
              <p className="text-[10.5px] text-muted">Demo view for authorities — move ticket status</p>
            </div>
            <Pill tone="neutral">Demo</Pill>
          </Link>
          <Link href="/feedback" className="flex items-center gap-3 px-3.5 py-3">
            <span className="flex size-8 items-center justify-center rounded-lg bg-paper text-ink/70">
              <MessageSquare className="size-4" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[12.5px] font-semibold">Send feedback</p>
              <p className="text-[10.5px] text-muted">Tell us what to fix or build next</p>
            </div>
            <ChevronRight className="size-4 text-muted" />
          </Link>
        </Card>

        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="secondary"
            onClick={() => {
              logout();
              router.push("/auth");
            }}
          >
            <LogOut className="size-4" /> Sign out
          </Button>
          <Button
            variant="danger"
            onClick={() => {
              const confirmed = window.confirm(
                "Reset the demo database? This clears every local report and reseeds the 5 cities.",
              );
              if (!confirmed) return;
              resetDemo();
              router.push("/auth");
            }}
          >
            <RotateCcw className="size-4" /> Reset demo
          </Button>
        </div>

        <div className="rounded-xl border border-dashed border-line-strong px-3.5 py-3 text-[10.5px] leading-relaxed text-muted">
          <p className="font-semibold text-ink">Prototype disclosure</p>
          <p className="mt-1">
            Better Urban is a student buildathon prototype. It is not affiliated with any government
            body. All cities, citizens, tickets and dispatch events are demo data stored in your browser.
          </p>
          <p className="mt-2">
            <Link href="/landing" className="underline underline-offset-2">
              Landing page
            </Link>{" "}
            · v0.1
          </p>
        </div>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <HydrationGate>
      <AppFrame>
        <ProfileScreen />
      </AppFrame>
    </HydrationGate>
  );
}
