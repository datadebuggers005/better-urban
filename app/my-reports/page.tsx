"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FileText, Search } from "lucide-react";
import { AppFrame, HydrationGate } from "@/components/app-frame";
import { IncidentCard } from "@/components/incident-card";
import { Button, EmptyState, PageHeader, Select, TextInput } from "@/components/ui";
import { CATEGORIES, STATUS_FLOW, STATUS_META } from "@/lib/catalog";
import { useApp, useSessionUser } from "@/lib/store";

function MyReportsScreen() {
  const router = useRouter();
  const user = useSessionUser();
  const incidents = useApp((s) => s.incidents);
  const cities = useApp((s) => s.cities);

  const [search, setSearch] = useState("");
  const [cityFilter, setCityFilter] = useState("all");
  const [catFilter, setCatFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    if (!user) router.replace("/auth");
  }, [user, router]);

  const myReports = useMemo(() => {
    const q = search.trim().toLowerCase();
    return incidents.filter((inc) => {
      if (inc.reporterId !== user?.id) return false;
      if (cityFilter !== "all" && inc.cityId !== cityFilter) return false;
      if (catFilter !== "all" && inc.categoryId !== catFilter) return false;
      if (statusFilter !== "all" && inc.status !== statusFilter) return false;
      if (
        q &&
        !inc.title.toLowerCase().includes(q) &&
        !inc.code.toLowerCase().includes(q) &&
        !inc.landmark.toLowerCase().includes(q)
      ) {
        return false;
      }
      return true;
    });
  }, [incidents, user?.id, cityFilter, catFilter, statusFilter, search]);

  if (!user) return null;

  return (
    <AppFrame>
      <PageHeader
        back="/app"
        label="Citizen History"
        title="My Complaints"
        subtitle={`${myReports.length} matching report(s)`}
      />

      <div className="space-y-3 px-5 pb-8 pt-4">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
          <TextInput
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by code, title, landmark…"
            className="pl-9"
          />
        </div>

        <div className="grid grid-cols-3 gap-2">
          <Select value={cityFilter} onChange={(e) => setCityFilter(e.target.value)} aria-label="Filter by city">
            <option value="all">All Cities</option>
            {cities.map((c) => (
              <option key={c.id} value={c.id}>
                {c.short}
              </option>
            ))}
          </Select>

          <Select value={catFilter} onChange={(e) => setCatFilter(e.target.value)} aria-label="Filter by category">
            <option value="all">All Types</option>
            {CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>

          <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} aria-label="Filter by status">
            <option value="all">All Status</option>
            {STATUS_FLOW.map((st) => (
              <option key={st} value={st}>
                {STATUS_META[st].short}
              </option>
            ))}
          </Select>
        </div>

        {myReports.length === 0 ? (
          <EmptyState
            icon={<FileText className="size-8" />}
            title="No complaints match"
            body="Report an issue or adjust your filters to see your submitted reports."
            action={
              <Link href="/report/road">
                <Button size="sm">Report an Issue</Button>
              </Link>
            }
          />
        ) : (
          <div className="space-y-2.5">
            {myReports.map((inc) => (
              <IncidentCard key={inc.id} incident={inc} />
            ))}
          </div>
        )}
      </div>
    </AppFrame>
  );
}

export default function MyReportsPage() {
  return (
    <HydrationGate>
      <MyReportsScreen />
    </HydrationGate>
  );
}
