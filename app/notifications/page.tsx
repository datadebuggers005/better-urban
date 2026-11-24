"use client";

import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Bell, BellOff, CheckCheck, HandHeart, Radio, Sparkles } from "lucide-react";
import { AppFrame, HydrationGate } from "@/components/app-frame";
import { Button, EmptyState, PageHeader } from "@/components/ui";
import { timeAgo } from "@/lib/format";
import { useApp, useSessionUser } from "@/lib/store";
import { cn } from "@/lib/utils";

function NotificationsScreen() {
  const router = useRouter();
  const user = useSessionUser();
  const sessionUserId = useApp((s) => s.sessionUserId);
  const allNotifications = useApp((s) => s.notifications);
  const markAll = useApp((s) => s.markAllNotificationsRead);
  const markOne = useApp((s) => s.markNotificationRead);

  const notifications = useMemo(
    () =>
      allNotifications
        .filter((n) => n.userId === sessionUserId)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [allNotifications, sessionUserId],
  );

  useEffect(() => {
    if (!user) router.replace("/auth");
  }, [user, router]);

  if (!user) return null;

  const unread = notifications.filter((n) => !n.read).length;

  return (
    <div className="pb-6">
      <PageHeader
        label="WF-11 // Alerts"
        title="Notifications"
        subtitle={`${unread} unread · ${notifications.length} total`}
        back="/app"
        right={
          notifications.length > 0 ? (
            <Button variant="ghost" size="sm" onClick={markAll}>
              <CheckCheck className="size-3.5" /> Read all
            </Button>
          ) : null
        }
      />

      <div className="space-y-2 px-5 pt-4">
        {notifications.length === 0 ? (
          <EmptyState
            icon={<BellOff className="size-6" />}
            title="All quiet"
            body="Status changes, nearby alerts and volunteer milestones will land here."
          />
        ) : (
          notifications.map((note) => {
            const Icon =
              note.type === "volunteer" ? HandHeart : note.type === "alert" ? Radio : note.type === "system" ? Sparkles : Bell;
            return (
              <button
                key={note.id}
                type="button"
                onClick={() => {
                  markOne(note.id);
                  if (note.incidentId) router.push(`/track/${note.incidentId}`);
                }}
                className={cn(
                  "flex w-full items-start gap-3 rounded-xl border px-3.5 py-3 text-left transition",
                  note.read
                    ? "border-line bg-white"
                    : "border-ink/15 bg-gold-soft/40 hover:bg-gold-soft/60",
                )}
              >
                <span
                  className={cn(
                    "flex size-9 shrink-0 items-center justify-center rounded-full",
                    note.read ? "bg-paper text-muted" : "bg-ink text-cream",
                  )}
                >
                  <Icon className="size-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-start justify-between gap-2">
                    <span className={cn("text-[12.5px] leading-snug", note.read ? "font-medium" : "font-semibold")}>
                      {note.title}
                    </span>
                    <span className="shrink-0 text-[10px] text-muted">{timeAgo(note.createdAt)}</span>
                  </span>
                  <span className="mt-0.5 block text-[11.5px] leading-relaxed text-muted">{note.body}</span>
                </span>
                {!note.read ? <span className="mt-1 size-1.5 shrink-0 rounded-full bg-danger" /> : null}
              </button>
            );
          })
        )}

        <p className="pt-2 text-center text-[9.5px] uppercase tracking-[0.16em] text-muted/70">
          Web push is not enabled in this prototype
        </p>
      </div>
    </div>
  );
}

export default function NotificationsPage() {
  return (
    <HydrationGate>
      <AppFrame>
        <NotificationsScreen />
      </AppFrame>
    </HydrationGate>
  );
}
