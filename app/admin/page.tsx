"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ShieldAlert } from "lucide-react";
import { AppFrame, HydrationGate } from "@/components/app-frame";
import {
  Button,
  Card,
  Chip,
  EmptyState,
  PageHeader,
  Pill,
  Select,
  StatusBadge,
  TextInput,
} from "@/components/ui";
import {
  apiAdminActivityLogs,
  apiAdminDataQuality,
  apiAdminDataSources,
  apiAdminDuplicates,
  apiAdminFeedback,
  apiAdminIncidents,
  apiAdminUpdateUserRole,
  apiAdminUsers,
} from "@/lib/api";
import { CATEGORIES, STATUS_FLOW, STATUS_META } from "@/lib/catalog";
import { formatDate } from "@/lib/format";
import { useApp, useSessionUser } from "@/lib/store";
import type {
  ActivityLog,
  DataQualityReport,
  DataSource,
  DuplicateCluster,
  FeedbackItem,
  Incident,
  IncidentStatus,
  Role,
  User,
} from "@/lib/types";

type AdminTab = "queue" | "logs" | "duplicates" | "quality" | "sources" | "users";

function AdminScreen() {
  const user = useSessionUser();
  const token = useApp((s) => s.token);
  const cities = useApp((s) => s.cities);
  const updateStatus = useApp((s) => s.updateStatus);

  const [tab, setTab] = useState<AdminTab>("queue");
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [duplicates, setDuplicates] = useState<DuplicateCluster[]>([]);
  const [quality, setQuality] = useState<DataQualityReport | null>(null);
  const [sources, setSources] = useState<DataSource[]>([]);
  const [feedback, setFeedback] = useState<FeedbackItem[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState("");
  const [cityFilter, setCityFilter] = useState("all");
  const [catFilter, setCatFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [busyId, setBusyId] = useState<string | null>(null);

  const isStaff = user?.role === "officer" || user?.role === "admin";
  const isAdmin = user?.role === "admin";

  const loadAll = async () => {
    if (!token || !isStaff) return;
    try {
      const [incList, logList, dupList, dq, ds, fb, usrList] = await Promise.all([
        apiAdminIncidents(token, {
          cityId: cityFilter === "all" ? undefined : cityFilter,
          categoryId: catFilter === "all" ? undefined : catFilter,
          status: statusFilter === "all" ? undefined : statusFilter,
          search: search.trim() || undefined,
        }),
        apiAdminActivityLogs(token),
        apiAdminDuplicates(token),
        apiAdminDataQuality(token),
        apiAdminDataSources(token),
        apiAdminFeedback(token),
        apiAdminUsers(token),
      ]);
      setIncidents(incList);
      setLogs(logList);
      setDuplicates(dupList);
      setQuality(dq);
      setSources(ds);
      setFeedback(fb);
      setUsers(usrList);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    loadAll();
  }, [token, isStaff, cityFilter, catFilter, statusFilter]);

  if (!user || !isStaff) {
    return (
      <AppFrame>
        <PageHeader back="/app" label="Restricted" title="Officer & Admin Console" />
        <div className="p-5">
          <EmptyState
            icon={<ShieldAlert className="size-8 text-error" />}
            title="Officer or Admin Role Required"
            body="Sign in with an Officer or Admin account to manage complaints, view activity logs, and audit data quality."
            action={
              <Link href="/auth">
                <Button size="sm">Switch Account</Button>
              </Link>
            }
          />
        </div>
      </AppFrame>
    );
  }

  const handleStatusChange = async (incId: string, nextStatus: IncidentStatus) => {
    setBusyId(incId);
    try {
      await updateStatus(incId, nextStatus);
      await loadAll();
    } finally {
      setBusyId(null);
    }
  };

  const handleRoleChange = async (targetUid: string, nextRole: Role) => {
    if (!token || !isAdmin) return;
    setBusyId(targetUid);
    try {
      await apiAdminUpdateUserRole(targetUid, nextRole, token);
      await loadAll();
    } finally {
      setBusyId(null);
    }
  };

  return (
    <AppFrame>
      <PageHeader
        back="/app"
        label={`${user.role.toUpperCase()} CONSOLE`}
        title="OCOR Operations"
        subtitle={`${incidents.length} complaints · ${logs.length} logs`}
      />

      <div className="space-y-4 px-5 pb-8 pt-4">
        {/* Tabs */}
        <div className="flex flex-wrap gap-1.5">
          {(
            [
              ["queue", "Complaints"],
              ["logs", "Activity Logs"],
              ["duplicates", "Duplicates"],
              ["quality", "Data Quality"],
              ["sources", "Sources & Feedback"],
              ...(isAdmin ? [["users", "RBAC Users"]] : []),
            ] as [AdminTab, string][]
          ).map(([id, label]) => (
            <Chip key={id} active={tab === id} onClick={() => setTab(id)}>
              {label}
            </Chip>
          ))}
        </div>

        {/* Queue Tab */}
        {tab === "queue" ? (
          <div className="space-y-3">
            <div className="flex gap-2">
              <TextInput
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search code, title, landmark…"
              />
              <Button size="sm" onClick={loadAll}>
                Search
              </Button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <Select value={cityFilter} onChange={(e) => setCityFilter(e.target.value)}>
                <option value="all">All Cities</option>
                {cities.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.short}
                  </option>
                ))}
              </Select>
              <Select value={catFilter} onChange={(e) => setCatFilter(e.target.value)}>
                <option value="all">All Types</option>
                {CATEGORIES.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
              <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="all">All Status</option>
                {STATUS_FLOW.map((s) => (
                  <option key={s} value={s}>
                    {STATUS_META[s].short}
                  </option>
                ))}
              </Select>
            </div>

            {incidents.map((inc) => (
              <Card key={inc.id} className="space-y-2.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <Link href={`/track/${inc.id}`} className="font-display text-[13.5px] font-semibold hover:text-primary">
                      {inc.title}
                    </Link>
                    <p className="text-[11px] text-muted">
                      {inc.code} · Ward {inc.wardNumber} · {inc.reporterName}
                    </p>
                  </div>
                  <StatusBadge status={inc.status} />
                </div>

                <div className="flex items-center gap-2">
                  <Select
                    value={inc.status}
                    disabled={busyId === inc.id}
                    onChange={(e) => handleStatusChange(inc.id, e.target.value as IncidentStatus)}
                    aria-label={`Change status for ${inc.code}`}
                  >
                    {STATUS_FLOW.map((st) => (
                      <option key={st} value={st}>
                        {STATUS_META[st].label}
                      </option>
                    ))}
                  </Select>
                </div>
              </Card>
            ))}
          </div>
        ) : null}

        {/* Activity Logs Tab */}
        {tab === "logs" ? (
          <div className="space-y-2.5">
            {logs.map((log) => (
              <Card key={log.id} className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[12px] font-semibold">
                    {log.actorName} ({log.actorRole})
                  </span>
                  <Pill tone="neutral">{log.action}</Pill>
                </div>
                <p className="text-[12px] text-ink/80">{log.detail}</p>
                <p className="text-[10.5px] text-muted">{formatDate(log.createdAt)}</p>
              </Card>
            ))}
          </div>
        ) : null}

        {/* Duplicates Tab */}
        {tab === "duplicates" ? (
          <div className="space-y-2.5">
            {duplicates.length === 0 ? (
              <EmptyState title="No duplicate clusters" body="No active complaints within 100m of each other in the same category." />
            ) : (
              duplicates.map((cl) => (
                <Card key={cl.primary.id} className="space-y-2">
                  <p className="font-display text-[13.5px] font-semibold">
                    {cl.primary.code} · {cl.primary.title} (Ward {cl.primary.wardNumber})
                  </p>
                  {cl.duplicates.map((d) => (
                    <div key={d.id} className="rounded-lg bg-paper px-3 py-2 text-[11.5px]">
                      {d.code} · {d.title} — <strong>{d.distanceMeters}m</strong> away
                    </div>
                  ))}
                </Card>
              ))
            )}
          </div>
        ) : null}

        {/* Data Quality Tab */}
        {tab === "quality" && quality ? (
          <div className="space-y-3">
            <Card>
              <p className="label-caps">Overall Data Quality Score</p>
              <p className="mt-1 font-display text-[28px] font-bold text-primary">
                {quality.qualityScore}%
              </p>
              <p className="text-[11.5px] text-muted">
                {quality.healthyIncidents} healthy / {quality.totalIncidents} total complaints
              </p>
              <div className="mt-3 grid grid-cols-2 gap-2 text-[11.5px]">
                <div className="rounded-lg bg-paper p-2">Invalid Coords: {quality.summary.invalidCoordinates}</div>
                <div className="rounded-lg bg-paper p-2">Missing Ward: {quality.summary.missingWardNumber}</div>
                <div className="rounded-lg bg-paper p-2">Missing Photo: {quality.summary.missingPhoto}</div>
                <div className="rounded-lg bg-paper p-2">Orphan Reporter: {quality.summary.orphanReporter}</div>
              </div>
            </Card>
          </div>
        ) : null}

        {/* Data Sources & Feedback Tab */}
        {tab === "sources" ? (
          <div className="space-y-3">
            <p className="label-caps">Dataset Sources</p>
            {sources.map((src) => (
              <Card key={src.id} className="space-y-1">
                <div className="flex items-center justify-between">
                  <p className="font-display text-[13px] font-semibold">{src.name}</p>
                  <Pill tone="green">{src.status}</Pill>
                </div>
                <p className="text-[11.5px] text-muted">{src.source}</p>
                <p className="text-[10.5px] text-muted">
                  Cycle: {src.refreshCycle} · Updated: {formatDate(src.lastUpdated)}
                </p>
              </Card>
            ))}

            <p className="label-caps pt-2">Citizen Feedback ({feedback.length})</p>
            {feedback.map((f) => (
              <Card key={f.id} className="space-y-1">
                <p className="text-[12.5px] font-semibold">
                  {f.name || "Citizen"} {f.rating ? `· ${f.rating}/5 ★` : ""}
                </p>
                <p className="text-[12px] text-ink/80">{f.message}</p>
              </Card>
            ))}
          </div>
        ) : null}

        {/* RBAC Users Tab (Admin Only) */}
        {tab === "users" && isAdmin ? (
          <div className="space-y-2.5">
            {users.slice(0, 30).map((u) => (
              <Card key={u.id} className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-semibold">{u.name}</p>
                  <p className="truncate text-[11px] text-muted">{u.email}</p>
                </div>
                <Select
                  value={u.role}
                  disabled={busyId === u.id}
                  onChange={(e) => handleRoleChange(u.id, e.target.value as Role)}
                  className="w-28"
                  aria-label={`Role for ${u.email}`}
                >
                  <option value="citizen">Citizen</option>
                  <option value="officer">Officer</option>
                  <option value="admin">Admin</option>
                </Select>
              </Card>
            ))}
          </div>
        ) : null}
      </div>
    </AppFrame>
  );
}

export default function AdminPage() {
  return (
    <HydrationGate>
      <AdminScreen />
    </HydrationGate>
  );
}
