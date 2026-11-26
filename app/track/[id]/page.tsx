"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  CheckCircle2,
  Clock3,
  MapPin,
  Share2,
  Star,
  Tag,
} from "lucide-react";
import { AppFrame, HydrationGate } from "@/components/app-frame";
import {
  Button,
  Card,
  EmptyState,
  PageHeader,
  Pill,
  SeverityBadge,
  StatusBadge,
  TextArea,
} from "@/components/ui";
import { apiGetIncident, resolveMediaUrl } from "@/lib/api";
import { STATUS_FLOW, STATUS_META, categoryById, cityById } from "@/lib/catalog";
import { formatDate } from "@/lib/format";
import { useApp, useSessionUser } from "@/lib/store";
import { BRAND } from "@/lib/brand";
import type { Incident } from "@/lib/types";
import { cn } from "@/lib/utils";

function TrackScreen() {
  const params = useParams<{ id: string }>();
  const user = useSessionUser();
  const storeIncidents = useApp((s) => s.incidents);
  const closeIncident = useApp((s) => s.closeIncident);
  const rateIncident = useApp((s) => s.rateIncident);

  const [fetched, setFetched] = useState<Incident | null>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  const incident = storeIncidents.find((i) => i.id === params.id) ?? fetched;

  useEffect(() => {
    if (!params.id) return;
    apiGetIncident(params.id)
      .then((d) => setFetched(d))
      .catch(() => {});
  }, [params.id]);

  if (!incident) {
    return (
      <AppFrame>
        <PageHeader back="/my-reports" title="Track Complaint" />
        <div className="p-5">
          <EmptyState
            title="Complaint not found"
            body="This ticket may have been removed or is not synced yet."
            action={
              <Link href="/app">
                <Button size="sm">Back to Home</Button>
              </Link>
            }
          />
        </div>
      </AppFrame>
    );
  }

  const category = categoryById(incident.categoryId);
  const city = cityById(incident.cityId);
  const currentStep = STATUS_META[incident.status]?.step ?? 0;
  const isReporter = user?.id && incident.reporterId === user.id;
  const isStaff = user?.role === "officer" || user?.role === "admin";
  const canClose = incident.status === "resolved" && (isReporter || isStaff);
  const canRate =
    (incident.status === "resolved" || incident.status === "closed") &&
    isReporter &&
    incident.rating == null;

  const handleClose = async () => {
    setSaving(true);
    try {
      await closeIncident(incident.id);
    } finally {
      setSaving(false);
    }
  };

  const handleRate = async () => {
    setSaving(true);
    try {
      await rateIncident(incident.id, rating, comment.trim());
    } finally {
      setSaving(false);
    }
  };

  const shareTicket = async () => {
    const text = `${BRAND.name} (${BRAND.tagline}) · ${incident.code}: ${incident.title} in ${city.name} Ward ${incident.wardNumber} [${STATUS_META[incident.status].label}] ${BRAND.hashtags.join(" ")}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  return (
    <AppFrame>
      <PageHeader
        back="/my-reports"
        label={`${incident.code} · ${city.name}`}
        title={incident.title}
        right={
          <button
            type="button"
            onClick={shareTicket}
            className="flex size-9 items-center justify-center rounded-full border border-line bg-white text-ink"
            aria-label="Share ticket"
          >
            <Share2 className="size-4" />
          </button>
        }
      />

      <div className="space-y-4 px-5 pb-8 pt-4">
        {copied ? (
          <p className="rounded-lg bg-success-95 px-3 py-2 text-[12px] font-medium text-success-30">
            Ticket summary copied to clipboard!
          </p>
        ) : null}

        {/* Status & Map Bucket Banner */}
        <Card className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <StatusBadge status={incident.status} />
              <SeverityBadge severity={incident.severity} />
            </div>
            <Pill
              tone={
                incident.mapColor === "GREEN"
                  ? "green"
                  : incident.mapColor === "YELLOW"
                    ? "gold"
                    : "danger"
              }
            >
              Map Pin: {incident.mapColor}
            </Pill>
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] text-muted">
            <span className="inline-flex items-center gap-1">
              <MapPin className="size-3.5 text-primary" />
              {city.name} · Ward {incident.wardNumber} · {incident.landmark}
            </span>
            <span className="inline-flex items-center gap-1">
              <Clock3 className="size-3.5" />
              {formatDate(incident.createdAt)}
            </span>
          </div>

          <p className="text-[12.5px] leading-relaxed text-ink/85">
            {incident.note || `${category.name} complaint reported in Ward ${incident.wardNumber}.`}
          </p>

          {incident.tags && incident.tags.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {incident.tags.map((t) => (
                <span
                  key={t}
                  className="inline-flex items-center gap-1 rounded-full bg-paper px-2.5 py-0.5 text-[11px] font-medium text-muted"
                >
                  <Tag className="size-3" />
                  {t}
                </span>
              ))}
            </div>
          ) : null}

          {incident.photoUrl ? (
            <img
              src={resolveMediaUrl(incident.photoUrl) ?? ""}
              alt={incident.title}
              className="h-48 w-full rounded-xl border border-line object-cover"
            />
          ) : null}
        </Card>

        {/* 7-State Lifecycle Progress */}
        <Card>
          <p className="label-caps mb-3">7-Stage Resolution Flow</p>
          <div className="space-y-2.5">
            {STATUS_FLOW.map((st, idx) => {
              const meta = STATUS_META[st];
              const done = idx <= currentStep;
              const active = idx === currentStep;
              return (
                <div key={st} className="flex items-center gap-3">
                  <div
                    className={cn(
                      "flex size-6 shrink-0 items-center justify-center rounded-full border text-[11px] font-bold",
                      done
                        ? "border-primary bg-primary text-white"
                        : "border-line-strong bg-paper text-muted",
                    )}
                  >
                    {done ? <CheckCircle2 className="size-3.5" /> : idx + 1}
                  </div>
                  <div className="flex flex-1 items-center justify-between">
                    <span
                      className={cn(
                        "text-[12.5px]",
                        active ? "font-bold text-ink" : done ? "font-medium text-ink/80" : "text-muted",
                      )}
                    >
                      {meta.label}
                    </span>
                    {active ? <Pill tone={meta.tone}>Current</Pill> : null}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Close Complaint Action */}
        {canClose ? (
          <Card className="border-success/40 bg-success-95/40">
            <p className="font-display text-[14px] font-semibold text-success-30">
              Issue marked Resolved — confirm &amp; close?
            </p>
            <p className="mt-1 text-[12px] text-muted">
              Confirming closes this ticket and updates the Live City Map.
            </p>
            <Button className="mt-3 w-full" onClick={handleClose} disabled={saving}>
              Confirm &amp; Close Complaint
            </Button>
          </Card>
        ) : null}

        {/* Citizen Satisfaction Rating */}
        {canRate ? (
          <Card>
            <p className="font-display text-[14px] font-semibold">Citizen Satisfaction Feedback</p>
            <div className="mt-2.5 flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setRating(n)}
                  className="p-1"
                  aria-label={`Rate ${n} stars`}
                >
                  <Star
                    className={cn(
                      "size-6",
                      n <= rating ? "fill-secondary text-secondary" : "text-line-strong",
                    )}
                  />
                </button>
              ))}
            </div>
            <TextArea
              rows={2}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Share your feedback on the resolution…"
              className="mt-3"
            />
            <Button className="mt-3 w-full" onClick={handleRate} disabled={saving}>
              Submit Rating (+10 Stars)
            </Button>
          </Card>
        ) : incident.rating != null ? (
          <Card>
            <p className="label-caps">Citizen Rating</p>
            <div className="mt-1.5 flex items-center gap-1">
              {Array.from({ length: incident.rating }).map((_, idx) => (
                <Star key={idx} className="size-4 fill-secondary text-secondary" />
              ))}
              <span className="ml-2 text-[12px] font-semibold">{incident.rating}/5</span>
            </div>
            {incident.ratingComment ? (
              <p className="mt-1.5 text-[12px] text-muted">&ldquo;{incident.ratingComment}&rdquo;</p>
            ) : null}
          </Card>
        ) : null}

        {/* Event History */}
        {incident.events && incident.events.length > 0 ? (
          <Card>
            <p className="label-caps mb-2.5">Activity History</p>
            <div className="space-y-2.5">
              {incident.events.map((ev) => (
                <div key={ev.id} className="border-l-2 border-primary/40 pl-3">
                  <p className="text-[12.5px] font-semibold">{ev.label}</p>
                  {ev.detail ? <p className="text-[11.5px] text-muted">{ev.detail}</p> : null}
                  <p className="text-[10px] text-muted/80">{formatDate(ev.at)}</p>
                </div>
              ))}
            </div>
          </Card>
        ) : null}
      </div>
    </AppFrame>
  );
}

export default function TrackPage() {
  return (
    <HydrationGate>
      <TrackScreen />
    </HydrationGate>
  );
}
