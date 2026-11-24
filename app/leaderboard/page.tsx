"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowUpRight, Crown, Trophy } from "lucide-react";
import { AppFrame, HydrationGate } from "@/components/app-frame";
import { Avatar, Card, Chip, PageHeader, Pill, StarCount } from "@/components/ui";
import { cityById } from "@/lib/catalog";
import { useApp, useSessionUser } from "@/lib/store";
import { cn } from "@/lib/utils";

type Scope = "city" | "global";

function LeaderboardScreen() {
  const router = useRouter();
  const user = useSessionUser();
  const users = useApp((s) => s.users);
  const sectors = useApp((s) => s.sectors);
  const activeCityId = useApp((s) => s.activeCityId);
  const [scope, setScope] = useState<Scope>("city");

  useEffect(() => {
    if (!user) router.replace("/auth");
  }, [user, router]);

  const ranked = useMemo(() => {
    const pool = scope === "city" ? users.filter((u) => u.cityId === activeCityId) : users;
    return [...pool].sort((a, b) => b.stars - a.stars).slice(0, 25);
  }, [users, scope, activeCityId]);

  const myIndex = ranked.findIndex((entry) => entry.id === user?.id);
  const myRank = useMemo(() => {
    if (!user) return 0;
    const pool = scope === "city" ? users.filter((u) => u.cityId === activeCityId) : users;
    return [...pool].sort((a, b) => b.stars - a.stars).findIndex((entry) => entry.id === user.id) + 1;
  }, [users, scope, activeCityId, user]);

  if (!user) return null;

  return (
    <div className="pb-6">
      <PageHeader
        label="WF-08 // Leaderboard"
        title="Top responders"
        subtitle={scope === "city" ? `${cityById(activeCityId).name} · this month` : "All Better Urban cities"}
        back="/app"
      />

      <div className="space-y-3.5 px-5 pt-4">
        <div className="flex gap-2">
          <Chip active={scope === "city"} onClick={() => setScope("city")}>
            My city
          </Chip>
          <Chip active={scope === "global"} onClick={() => setScope("global")}>
            Global
          </Chip>
          <span className="ml-auto self-center text-[10px] uppercase tracking-[0.12em] text-muted">
            Stars earned
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {ranked.slice(0, 3).map((entry, index) => (
            <div
              key={entry.id}
              className={cn(
                "flex flex-col items-center rounded-xl border px-2 py-3 text-center",
                index === 0
                  ? "border-gold/40 bg-gold-soft/50"
                  : "border-line bg-white",
              )}
            >
              <span className="relative">
                <Avatar name={entry.name} size={index === 0 ? 46 : 38} />
                <span
                  className={cn(
                    "absolute -bottom-1 left-1/2 flex size-4 -translate-x-1/2 items-center justify-center rounded-full text-[8px] font-bold",
                    index === 0 ? "bg-gold text-white" : "bg-ink text-cream",
                  )}
                >
                  {index + 1}
                </span>
              </span>
              <p className="mt-2 w-full truncate text-[11px] font-semibold">{entry.name.split(" ")[0]}</p>
              <p className="mt-0.5 text-[9.5px] text-muted">{entry.helped} helped</p>
              <span className="mt-1 inline-flex items-center gap-0.5 text-[10px] font-semibold">
                <Trophy className="size-2.5 text-gold" /> {entry.stars}
              </span>
            </div>
          ))}
        </div>

        <Card className="divide-y divide-line/70 p-0">
          {ranked.map((entry, index) => {
            const isMe = entry.id === user.id;
            return (
              <div
                key={entry.id}
                className={cn(
                  "flex items-center gap-3 px-3.5 py-2.5",
                  isMe && "bg-gold-soft/40",
                )}
              >
                <span
                  className={cn(
                    "flex size-7 shrink-0 items-center justify-center rounded-full text-[10.5px] font-bold",
                    index === 0
                      ? "bg-ink text-cream"
                      : index < 3
                        ? "bg-gold-soft text-[#8a5f17]"
                        : "bg-paper text-ink/60",
                  )}
                >
                  {index === 0 ? <Crown className="size-3.5" /> : `#${index + 1}`}
                </span>
                <Avatar name={entry.name} size={32} />
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-1.5 truncate text-[12px] font-semibold">
                    {entry.name}
                    {isMe ? <Pill tone="gold">You</Pill> : null}
                  </p>
                  <p className="truncate text-[10.5px] text-muted">
                    {sectors.find((s) => s.id === entry.sectorId)?.name ?? "City"} · {entry.helped} helped
                    {entry.isVolunteer ? " · volunteer" : ""}
                  </p>
                </div>
                <StarCount value={entry.stars} />
              </div>
            );
          })}
        </Card>

        {myIndex === -1 ? (
          <div className="rounded-xl border border-line bg-white px-3.5 py-3">
            <div className="flex items-center justify-between">
              <p className="text-[12px] font-semibold">Your position</p>
              <Pill tone="gold">#{myRank || "—"} in {scope === "city" ? "city" : "global"}</Pill>
            </div>
            <p className="mt-1 text-[11px] text-muted">
              Report an issue or accept a nearby alert to move up. You have {user.stars} stars.
            </p>
          </div>
        ) : null}

        <div className="flex items-center justify-between rounded-xl border border-line bg-paper px-3.5 py-2.5">
          <p className="text-[10.5px] text-muted">
            {ranked.length} responders shown · demo profiles
          </p>
          <span className="inline-flex items-center gap-0.5 text-[10.5px] font-medium">
            Scoring rules <ArrowUpRight className="size-3" />
          </span>
        </div>

        <p className="text-center text-[9.5px] uppercase tracking-[0.16em] text-muted/70">
          Report +10 · verify +5 · help +25 · feedback +10
        </p>
      </div>
    </div>
  );
}

export default function LeaderboardPage() {
  return (
    <HydrationGate>
      <AppFrame>
        <LeaderboardScreen />
      </AppFrame>
    </HydrationGate>
  );
}
