"use client";

import { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Building2,
  Check,
  Clock3,
  HandHeart,
  MapPin,
  Radio,
  Share2,
  Sparkles,
  Star,
  Users,
} from "lucide-react";
import { AppFrame, HydrationGate } from "@/components/app-frame";
import {
  Avatar,
  Button,
  Card,
  ErrorNote,
  PageHeader,
  Pill,
  Progress,
  SeverityBadge,
  StatusBadge,
  TextArea,
} from "@/components/ui";
import { STATUS_FLOW, STATUS_META, categoryById, cityById, subCategoryById } from "@/lib/catalog";
import { formatDate, timeAgo } from "@/lib/format";
import { useApp, useSessionUser } from "@/lib/store";
import { cn } from "@/lib/utils";

const SLA_HOURS = { critical: 6, high: 24, medium: 72, low: 120 } as const;

function TrackScreen() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const user = useSessionUser();
  const incident = useApp((s) => s.incidents.find((i) => i.id === params.id));
  const users = useApp((s) => s.users);
  const sectors = useApp((s) => s.sectors);
  const acceptAlert = useApp((s) => s.acceptAlert);
  const rateIncident = useApp((s) => s.rateIncident);

  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [toast, setToast] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const sla = useMemo(() => {
    if (!incident) return null;
    const hours = SLA_HOURS[incident.severity];
    const due = new Date(incident.createdAt).getTime() + hours * 3600_000;
    const diff = due - Date.now();
    return {
      hours,
      overdue: diff < 0,
      label:
        incident.status === "resolved"
          ? "Closed within SLA"
          : diff < 0
            ? `${Math.ceil(Math.abs(diff) / 3600_000)}h past SLA`
            : `${Math.ceil(diff / 3600_000)}h left`,
    };
  }, [incident]);

  if (!incident) {
    return (
      <div className="flex min-h-full flex-col">
        <PageHeader label="WF-09 // Track" title="Complaint" back="/my-reports" />
        <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
          <p className="font-display text-[16px] font-semibold">This ticket is not in your city data</p>
          <p className="text-[12px] text-muted">It may have been removed with the demo reset.</p>
          <Button onClick={() => router.push("/app")}>Back to home</Button>
        </div>
      </div>
    );
  }

  const city = cityById(incident.cityId);
  const category = categoryById(incident.categoryId);
  const sub = subCategoryById(incident.subCategoryId);
  const reporterSector = sectors.find((s) => s.id === incident.sectorId);
  const helpers = users.filter((u) => incident.helpedBy.includes(u.id));
  const isHelping = !!user && incident.helpedBy.includes(user.id);
  const step = STATUS_META[incident.status].step;
  const canHelp = incident.status !== "resolved" && !!user && !isHelping;
  const timeline = [...incident.events].sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());

  const share = async () => {
    const text = `${incident.code} · ${incident.title} at ${incident.landmark}. Track it on Better Urban.`;
    try {
      if (navigator.share) {
        await navigator.share({ title: "Better Urban", text });
      } else {
        await navigator.clipboard.writeText(text);
        setToast("Ticket link copied");
      }
    } catch {
      setToast("Sharing was cancelled");
    }
    window.setTimeout(() => setToast(null), 2200);
  };

  return (
    <div className="pb-6">
      <PageHeader
        label="WF-09 // Track complaint"
        title={incident.code}
        subtitle={`${category.name} · ${city.name}`}
        back="/my-reports"
        right={<StatusBadge status={incident.status} />}
      />

      <div className="space-y-3.5 px-5 pt-4">
        <Card className="p-0">
          {incident.photoUrl ? (
            <img
              src={incident.photoUrl}
              alt={incident.title}
              className="h-40 w-full rounded-t-[var(--radius-card)] object-cover"
            />
          ) : (
            <div
              className="flex h-24 items-center justify-between rounded-t-[var(--radius-card)] border-b border-line px-4"
              style={{ backgroundColor: `${category.accent}0f` }}
            >
              <div>
                <p className="text-[10px] uppercase tracking-[0.14em] text-muted">Evidence</p>
                <p className="text-[11.5px] text-muted">No photo attached to this report</p>
              </div>
              <span
                className="flex size-12 items-center justify-center rounded-xl border"
                style={{ borderColor: `${category.accent}30`, color: category.accent }}
              >
                <Radio className="size-5" />
              </span>
            </div>
          )}

          <div className="p-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h2 className="font-display text-[17px] font-semibold leading-snug tracking-tight">
                  {incident.title}
                </h2>
                <p className="mt-0.5 text-[11px] text-muted">
                  {sub?.name} · reported {timeAgo(incident.createdAt)}
                </p>
              </div>
              <SeverityBadge severity={incident.severity} />
            </div>

            <p className="mt-2.5 text-[12.5px] leading-relaxed text-ink/75">{incident.note}</p>

            <div className="mt-3 grid grid-cols-2 gap-2">
              <div className="rounded-lg border border-line bg-paper px-2.5 py-2">
                <p className="text-[9.5px] uppercase tracking-[0.12em] text-muted">Location</p>
                <p className="mt-0.5 truncate text-[11.5px] font-medium">
                  {incident.landmark}
                </p>
                <p className="truncate text-[10px] text-muted">{reporterSector?.name}</p>
              </div>
              <div className="rounded-lg border border-line bg-paper px-2.5 py-2">
                <p className="text-[9.5px] uppercase tracking-[0.12em] text-muted">SLA</p>
                <p className={cn("mt-0.5 text-[11.5px] font-medium", sla?.overdue && "text-danger")}>
                  {sla?.label}
                </p>
                <p className="text-[10px] text-muted">{sla?.hours}h target</p>
              </div>
            </div>

            <div className="mt-3 flex items-center gap-2 text-[10.5px] text-muted">
              <Avatar name={incident.reporterName} size={20} className="ring-1 ring-line" />
              <span className="truncate">
                {incident.isAnonymous ? "Anonymous citizen" : incident.reporterName}
              </span>
              <span className="ml-auto shrink-0">{formatDate(incident.createdAt)}</span>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <span className="label-caps">Resolution trail</span>
            <span className="text-[10.5px] text-muted">
              Step {step + 1} of {STATUS_FLOW.length}
            </span>
          </div>
          <div className="mt-3">
            <Progress value={(step / (STATUS_FLOW.length - 1)) * 100} />
            <div className="mt-2 flex justify-between">
              {STATUS_FLOW.map((status, index) => (
                <span
                  key={status}
                  className={cn(
                    "text-[9px] font-medium uppercase tracking-[0.06em]",
                    index <= step ? "text-ink" : "text-muted/60",
                  )}
                >
                  {STATUS_META[status].short}
                </span>
              ))}
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <span className="label-caps">Timeline</span>
            <span className="text-[10.5px] text-muted">{incident.events.length} updates</span>
          </div>
          <ol className="mt-3 space-y-3.5">
            {timeline.map((event, index) => (
              <li key={event.id} className="relative flex gap-3">
                <div className="flex flex-col items-center">
                  <span
                    className={cn(
                      "flex size-6 shrink-0 items-center justify-center rounded-full border",
                      index === 0
                        ? "border-ink bg-ink text-cream"
                        : "border-line bg-paper text-muted",
                    )}
                  >
                    {event.kind === "feedback" ? (
                      <Star className="size-3" />
                    ) : event.kind === "volunteer" ? (
                      <HandHeart className="size-3" />
                    ) : event.kind === "dispatch" ? (
                      <Radio className="size-3" />
                    ) : (
                      <Check className="size-3" />
                    )}
                  </span>
                  {index !== timeline.length - 1 ? <span className="mt-1 w-px flex-1 bg-line" /> : null}
                </div>
                <div className="pb-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-[12px] font-semibold">{event.label}</p>
                    <span className="text-[10px] text-muted">{timeAgo(event.at)}</span>
                  </div>
                  {event.detail ? (
                    <p className="mt-0.5 text-[11px] leading-relaxed text-muted">{event.detail}</p>
                  ) : null}
                </div>
              </li>
            ))}
          </ol>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <span className="label-caps">Network response</span>
            <Pill tone="green">
              <Radio className="size-2.5" /> {incident.alertedCount} alerted
            </Pill>
          </div>
          <div className="mt-2.5 space-y-2 text-[11.5px]">
            <div className="flex items-center gap-2 text-ink/75">
              <Building2 className="size-3.5 text-muted" />
              {incident.notifiedOrgs.join(" · ")}
            </div>
            <div className="flex items-center gap-2 text-ink/75">
              <Users className="size-3.5 text-muted" />
              {incident.notifiedNgos.join(" · ")}
            </div>
            <div className="flex items-center gap-2 text-ink/75">
              <MapPin className="size-3.5 text-muted" />
              Everyone inside {incident.radiusKm.toFixed(1)} km was pinged
            </div>
          </div>

          {helpers.length > 0 ? (
            <div className="mt-3 border-t border-line/70 pt-2.5">
              <p className="label-caps mb-2">Volunteers on this ticket</p>
              <div className="flex flex-wrap gap-1.5">
                {helpers.map((helper) => (
                  <span
                    key={helper.id}
                    className="inline-flex items-center gap-1.5 rounded-full border border-line bg-paper py-0.5 pl-0.5 pr-2.5 text-[10.5px]"
                  >
                    <Avatar name={helper.name} size={20} className="ring-0" />
                    {helper.name.split(" ")[0]}
                  </span>
                ))}
              </div>
            </div>
          ) : null}
        </Card>

        {incident.status === "resolved" ? (
          <Card className={cn(incident.rating ? "bg-green-soft/40" : "bg-gold-soft/30")}>
            <div className="flex items-center justify-between">
              <span className="label-caps">Close the loop</span>
              {incident.rating ? <Pill tone="green">Rated {incident.rating}/5</Pill> : <Pill tone="gold">Action needed</Pill>}
            </div>
            {incident.rating ? (
              <div className="mt-1.5">
                <div className="flex items-center gap-0.5">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <Star
                      key={index}
                      className={cn(
                        "size-4",
                        index < (incident.rating ?? 0) ? "fill-gold text-gold" : "text-line-strong",
                      )}
                    />
                  ))}
                </div>
                <p className="mt-1.5 text-[11.5px] text-ink/70">
                  {incident.ratingComment || "Thanks for confirming the fix."}
                </p>
              </div>
            ) : (
              <div className="mt-2">
                <p className="text-[12px] font-semibold">Did the city actually fix this?</p>
                <div className="mt-2 flex items-center gap-1.5">
                  {Array.from({ length: 5 }).map((_, index) => {
                    const value = index + 1;
                    return (
                      <button
                        key={value}
                        type="button"
                        aria-label={`Rate ${value} of 5`}
                        onClick={() => setRating(value)}
                        className="p-0.5"
                      >
                        <Star
                          className={cn(
                            "size-6 transition",
                            value <= rating ? "fill-gold text-gold" : "text-line-strong",
                          )}
                        />
                      </button>
                    );
                  })}
                </div>
                <TextArea
                  value={comment}
                  onChange={(event) => setComment(event.target.value)}
                  placeholder="One line for the next citizen…"
                  rows={2}
                  className="mt-2"
                />
                {error ? <div className="mt-2"><ErrorNote>{error}</ErrorNote></div> : null}
                <Button
                  size="md"
                  className="mt-2 w-full"
                  onClick={() => {
                    if (!rating) {
                      setError("Pick a star rating first.");
                      return;
                    }
                    rateIncident(incident.id, rating, comment.trim());
                    setError(null);
                    setToast("Feedback saved · +10 stars");
                    window.setTimeout(() => setToast(null), 2200);
                  }}
                >
                  <Sparkles className="size-4" /> Submit feedback
                </Button>
              </div>
            )}
          </Card>
        ) : null}

        <div className="grid grid-cols-2 gap-2">
          <Button variant="secondary" size="lg" onClick={share}>
            <Share2 className="size-4" /> Share
          </Button>
          {isHelping ? (
            <Button variant="gold" size="lg" disabled>
              <Check className="size-4" /> You are responding
            </Button>
          ) : (
            <Button
              size="lg"
              disabled={!canHelp}
              onClick={() => {
                if (!user) {
                  router.push("/auth");
                  return;
                }
                acceptAlert(incident.id);
                setToast("You are on the way · +25 stars");
                window.setTimeout(() => setToast(null), 2400);
              }}
            >
              <HandHeart className="size-4" /> I&apos;m nearby — help
            </Button>
          )}
        </div>

        <p className="pb-2 text-center text-[9.5px] uppercase tracking-[0.16em] text-muted/70">
          Demo ticket · simulated dispatch · {incident.code}
        </p>
      </div>

      {toast ? (
        <div className="pointer-events-none fixed inset-x-0 bottom-24 z-50 flex justify-center px-6">
          <div className="rounded-full bg-ink px-4 py-2 text-[11.5px] font-medium text-cream shadow-lg">
            {toast}
          </div>
        </div>
      ) : null}

      <div className="px-5">
        <Link href="/my-reports" className="block text-center text-[11px] text-muted underline-offset-4 hover:underline">
          All my reports
        </Link>
      </div>
    </div>
  );
}

export default function TrackPage() {
  return (
    <HydrationGate>
      <AppFrame>
        <TrackScreen />
      </AppFrame>
    </HydrationGate>
  );
}
