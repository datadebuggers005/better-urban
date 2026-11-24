"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FileText, Plus } from "lucide-react";
import { AppFrame, HydrationGate } from "@/components/app-frame";
import { Button, Chip, EmptyState, NotificationButton, PageHeader } from "@/components/ui";
import { IncidentCard } from "@/components/incident-card";
import { useApp, useSessionUser, useUnreadCount } from "@/lib/store";

type Filter = "all" | "open" | "resolved";

function MyReportsScreen() {
  const router = useRouter();
  const user = useSessionUser();
  const unread = useUnreadCount();
  const incidents = useApp((s) => s.incidents);
  const [filter, setFilter] = useState<Filter>("all");

  useEffect(() => {
    if (!user) router.replace("/auth");
  }, [user, router]);

  const mine = useMemo(
    () =>
      incidents
        .filter((incident) => incident.reporterId === user?.id)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [incidents, user?.id],
  );

  const filtered = mine.filter((incident) => {
    if (filter === "open") return incident.status !== "resolved";
    if (filter === "resolved") return incident.status === "resolved";
    return true;
  });

  if (!user) return null;

  const open = mine.filter((i) => i.status !== "resolved").length;
  const resolved = mine.filter((i) => i.status === "resolved").length;

  return (
    <div className="pb-6">
      <PageHeader
        label="WF-10 // My reports"
        title="My complaints"
        subtitle={`${mine.length} tickets filed from your account`}
        back="/app"
        right={<NotificationButton count={unread} />}
      />

      <div className="space-y-3.5 px-5 pt-4">
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: "Filed", value: mine.length },
            { label: "Open", value: open },
            { label: "Resolved", value: resolved },
          ].map((stat) => (
            <div key={stat.label} className="rounded-xl border border-line bg-white px-3 py-2.5">
              <p className="font-display text-[18px] font-semibold leading-none">{stat.value}</p>
              <p className="mt-1 text-[10px] uppercase tracking-[0.1em] text-muted">{stat.label}</p>
            </div>
          ))}
        </div>

        <div className="flex gap-2">
          {([
            ["all", "All"],
            ["open", "Open"],
            ["resolved", "Resolved"],
          ] as Array<[Filter, string]>).map(([value, label]) => (
            <Chip key={value} active={filter === value} onClick={() => setFilter(value)}>
              {label}
            </Chip>
          ))}
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            icon={<FileText className="size-6" />}
            title={mine.length === 0 ? "No complaints yet" : "Nothing in this filter"}
            body={
              mine.length === 0
                ? "Your first report takes about 20 seconds. Pick a category, add a photo, and the 3 km network does the rest."
                : "Try a different filter to see your other tickets."
            }
            action={
              mine.length === 0 ? (
                <Link href="/report/road">
                  <Button size="sm">
                    <Plus className="size-3.5" /> Report an issue
                  </Button>
                </Link>
              ) : null
            }
          />
        ) : (
          <div className="space-y-2.5">
            {filtered.map((incident) => (
              <IncidentCard key={incident.id} incident={incident} showAlerted />
            ))}
          </div>
        )}

        <p className="pt-2 text-center text-[9.5px] uppercase tracking-[0.16em] text-muted/70">
          Status updates arrive as in-app notifications
        </p>
      </div>
    </div>
  );
}

export default function MyReportsPage() {
  return (
    <HydrationGate>
      <AppFrame>
        <MyReportsScreen />
      </AppFrame>
    </HydrationGate>
  );
}
