"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowUpRight,
  Check,
  HandHeart,
  MapPin,
  ShieldCheck,
  Star,
  Trophy,
  Users,
} from "lucide-react";
import { AppFrame, HydrationGate } from "@/components/app-frame";
import {
  Avatar,
  Button,
  Card,
  Chip,
  EmptyState,
  NotificationButton,
  PageHeader,
  Pill,
  StarCount,
} from "@/components/ui";
import { VOLUNTEER_SKILLS, cityById } from "@/lib/catalog";
import { formatKm, haversineKm } from "@/lib/geo";
import { useApp, useSessionUser, useUnreadCount } from "@/lib/store";
import { cn } from "@/lib/utils";

function VolunteerScreen() {
  const router = useRouter();
  const user = useSessionUser();
  const unread = useUnreadCount();
  const users = useApp((s) => s.users);
  const sectors = useApp((s) => s.sectors);
  const incidents = useApp((s) => s.incidents);
  const activeCityId = useApp((s) => s.activeCityId);
  const joinVolunteer = useApp((s) => s.joinVolunteer);
  const leaveVolunteer = useApp((s) => s.leaveVolunteer);
  const acceptAlert = useApp((s) => s.acceptAlert);

  const [skills, setSkills] = useState<string[]>(user?.skills ?? []);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (!user) router.replace("/auth");
  }, [user, router]);

  useEffect(() => {
    if (user) setSkills(user.skills);
  }, [user?.id, user?.skills]);

  const reference = useMemo(() => {
    const sector =
      user?.cityId === activeCityId ? sectors.find((s) => s.id === user?.sectorId) : undefined;
    return sector ? { lat: sector.lat, lng: sector.lng } : cityById(activeCityId).center;
  }, [sectors, user?.sectorId, user?.cityId, activeCityId]);

  const alerts = useMemo(
    () =>
      incidents
        .filter((incident) => incident.cityId === activeCityId && incident.status !== "resolved")
        .map((incident) => ({ incident, distance: haversineKm(reference, incident) }))
        .filter((row) => row.distance <= 3)
        .sort((a, b) => a.distance - b.distance)
        .slice(0, 8),
    [incidents, activeCityId, reference],
  );

  const rank = useMemo(() => {
    if (!user) return 0;
    const cityUsers = users.filter((u) => u.cityId === user.cityId).sort((a, b) => b.stars - a.stars);
    return cityUsers.findIndex((u) => u.id === user.id) + 1;
  }, [users, user]);

  const leaders = useMemo(
    () =>
      users
        .filter((u) => u.cityId === activeCityId && u.isVolunteer)
        .sort((a, b) => b.stars - a.stars)
        .slice(0, 3),
    [users, activeCityId],
  );

  if (!user) return null;

  const isVolunteer = user.isVolunteer;

  const toggleSkill = (skill: string) => {
    setSkills((current) =>
      current.includes(skill) ? current.filter((s) => s !== skill) : [...current, skill],
    );
  };

  const respond = (incidentId: string) => {
    if (!isVolunteer) joinVolunteer(skills.length ? skills : ["First Aid"]);
    acceptAlert(incidentId);
    setToast("Accepted · +25 stars, reporter notified");
    window.setTimeout(() => setToast(null), 2400);
  };

  return (
    <div className="pb-6">
      <PageHeader
        label="WF-07 // Volunteer"
        title="Volunteer hub"
        subtitle={`${cityById(activeCityId).name} · 3 km response radius`}
        back="/app"
        right={<NotificationButton count={unread} />}
      />

      <div className="space-y-3.5 px-5 pt-4">
        <Card className="relative overflow-hidden border-ink/10 bg-white p-0">
          <div className="bg-ink px-4 pb-4 pt-4 text-cream">
            <div className="flex items-center justify-between">
              <p className="font-display text-[16px] font-semibold leading-tight">
                {isVolunteer ? "Verified responder" : "Join Better Urban Volunteers"}
              </p>
              <span className="flex size-8 items-center justify-center rounded-full bg-white/10">
                <HandHeart className="size-4" />
              </span>
            </div>
            <p className="mt-1.5 max-w-[280px] text-[11.5px] leading-relaxed text-cream/70">
              {isVolunteer
                ? "You get pinged for incidents inside 3 km. Accept what you can reach and earn stars for verified help."
                : "Respond to nearby 3 km alerts, assist citizens, and earn stars for every verified help."}
            </p>
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {isVolunteer ? (
                <Pill tone="green" className="bg-green-soft/90">
                  <ShieldCheck className="size-2.5" /> Active
                </Pill>
              ) : null}
              <Pill tone="gold" className="bg-gold-soft/90">
                {user.stars} stars
              </Pill>
            </div>
          </div>

          <div className="p-4">
            <p className="label-caps">Your response skills</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {VOLUNTEER_SKILLS.map((skill) => (
                <Chip key={skill} active={skills.includes(skill)} onClick={() => toggleSkill(skill)}>
                  {skills.includes(skill) ? <Check className="size-3" /> : null}
                  {skill}
                </Chip>
              ))}
            </div>

            {isVolunteer ? (
              <div className="mt-3 grid grid-cols-2 gap-2">
                <Button
                  size="md"
                  onClick={() => {
                    joinVolunteer(skills);
                    setToast("Skills updated");
                    window.setTimeout(() => setToast(null), 1800);
                  }}
                >
                  Save skills
                </Button>
                <Button
                  variant="secondary"
                  size="md"
                  onClick={() => {
                    leaveVolunteer();
                    setToast("You left the volunteer hub");
                    window.setTimeout(() => setToast(null), 1800);
                  }}
                >
                  Leave hub
                </Button>
              </div>
            ) : (
              <Button
                size="md"
                className="mt-3 w-full"
                onClick={() => {
                  joinVolunteer(skills.length ? skills : ["First Aid"]);
                  setToast("Welcome to the hub · +15 stars");
                  window.setTimeout(() => setToast(null), 2200);
                }}
              >
                <HandHeart className="size-4" /> Join as volunteer
              </Button>
            )}
          </div>
        </Card>

        <div className="grid grid-cols-3 gap-2">
          {[
            { label: "Stars", value: user.stars, icon: Star },
            { label: "Helped", value: user.helped, icon: HandHeart },
            { label: "City rank", value: rank ? `#${rank}` : "—", icon: Trophy },
          ].map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className="rounded-xl border border-line bg-white px-3 py-2.5">
                <Icon className="size-3.5 text-muted" />
                <p className="mt-1 font-display text-[18px] font-semibold leading-none">{stat.value}</p>
                <p className="mt-1 text-[10px] uppercase tracking-[0.1em] text-muted">{stat.label}</p>
              </div>
            );
          })}
        </div>

        <section>
          <div className="mb-2 flex items-center justify-between">
            <span className="label-caps">Nearby alerts</span>
            <Link href="/leaderboard" className="text-[11px] font-medium text-muted hover:text-ink">
              Leaderboard
            </Link>
          </div>
          {alerts.length === 0 ? (
            <EmptyState
              icon={<MapPin className="size-6" />}
              title="No open alerts in 3 km"
              body="When a neighbour reports something, it shows up here with the distance and severity."
            />
          ) : (
            <div className="space-y-2">
              {alerts.map(({ incident, distance }) => {
                const helping = incident.helpedBy.includes(user.id);
                return (
                  <div key={incident.id} className="rounded-xl border border-line bg-white p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-[12.5px] font-semibold">{incident.title}</p>
                        <p className="mt-0.5 truncate text-[11px] text-muted">
                          {incident.landmark} · {formatKm(distance)}
                        </p>
                      </div>
                      <Pill tone="neutral">{incident.code}</Pill>
                    </div>
                    <div className="mt-2 flex items-center justify-between gap-2">
                      <span className="inline-flex items-center gap-1 text-[10.5px] text-muted">
                        <Users className="size-3" /> {incident.alertedCount} alerted ·{" "}
                        {incident.helpedBy.length} responding
                      </span>
                      <Button
                        size="sm"
                        variant={helping ? "gold" : "secondary"}
                        disabled={helping}
                        onClick={() => respond(incident.id)}
                      >
                        {helping ? (
                          <>
                            <Check className="size-3" /> Responding
                          </>
                        ) : (
                          <>
                            <HandHeart className="size-3" /> Accept
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <section>
          <div className="mb-2 flex items-center justify-between">
            <span className="label-caps">City leaderboard</span>
            <Link
              href="/leaderboard"
              className="inline-flex items-center gap-0.5 text-[11px] font-medium text-muted hover:text-ink"
            >
              All <ArrowUpRight className="size-3" />
            </Link>
          </div>
          <Card className="divide-y divide-line/70 p-0">
            {leaders.map((leader, index) => (
              <div key={leader.id} className="flex items-center gap-3 px-3.5 py-2.5">
                <span
                  className={cn(
                    "flex size-7 items-center justify-center rounded-full text-[10.5px] font-bold",
                    index === 0 ? "bg-gold-soft text-[#8a5f17]" : "bg-paper text-ink/70",
                  )}
                >
                  #{index + 1}
                </span>
                <Avatar name={leader.name} size={32} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[12px] font-semibold">{leader.name}</p>
                  <p className="truncate text-[10.5px] text-muted">
                    {sectors.find((s) => s.id === leader.sectorId)?.name} · {leader.helped} helped
                  </p>
                </div>
                <StarCount value={leader.stars} />
              </div>
            ))}
          </Card>
        </section>

        <p className="pt-1 text-center text-[9.5px] uppercase tracking-[0.16em] text-muted/70">
          Stars are demo rewards · payouts are not implemented
        </p>
      </div>

      {toast ? (
        <div className="pointer-events-none fixed inset-x-0 bottom-24 z-50 flex justify-center px-6">
          <div className="rounded-full bg-ink px-4 py-2 text-[11.5px] font-medium text-cream shadow-lg">
            {toast}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default function VolunteerPage() {
  return (
    <HydrationGate>
      <AppFrame>
        <VolunteerScreen />
      </AppFrame>
    </HydrationGate>
  );
}
