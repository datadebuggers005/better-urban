"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  AlertTriangle,
  Building2,
  Camera,
  Check,
  Crosshair,
  EyeOff,
  HandHeart,
  ImagePlus,
  Loader2,
  MapPin,
  Megaphone,
  Sparkles,
  Users,
  X,
} from "lucide-react";
import { AppFrame, HydrationGate } from "@/components/app-frame";
import {
  Button,
  CategoryIcon,
  Chip,
  ErrorNote,
  FieldLabel,
  PageHeader,
  Select,
  TextArea,
  TextInput,
  Toggle,
} from "@/components/ui";
import {
  CATEGORIES,
  categoryById,
  cityById,
  subCategoriesFor,
  subCategoryById,
} from "@/lib/catalog";
import { haversineKm } from "@/lib/geo";
import { compressImage } from "@/lib/image";
import { useApp, useSessionUser } from "@/lib/store";
import type { CategoryId } from "@/lib/types";
import { cn } from "@/lib/utils";

type Coords = { lat: number; lng: number; accuracy?: number; approximate?: boolean };

function mockTriage(fileName: string, categoryId: CategoryId) {
  const subs = subCategoriesFor(categoryId);
  const hash = Array.from(fileName).reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const sub = subs[hash % subs.length];
  const confidence = Math.min(0.97, 0.82 + ((hash % 13) / 100));
  return { subId: sub.id, confidence };
}

function ReportScreen() {
  const router = useRouter();
  const params = useParams<{ category: string }>();
  const user = useSessionUser();
  const users = useApp((s) => s.users);
  const sectors = useApp((s) => s.sectors);
  const activeCityId = useApp((s) => s.activeCityId);
  const createIncident = useApp((s) => s.createIncident);

  const categoryId = (CATEGORIES.some((c) => c.id === params.category)
    ? params.category
    : "road") as CategoryId;
  const category = categoryById(categoryId);
  const city = cityById(activeCityId);
  const subs = useMemo(() => subCategoriesFor(categoryId), [categoryId]);

  const citySectors = useMemo(
    () => sectors.filter((s) => s.cityId === activeCityId),
    [sectors, activeCityId],
  );

  const [subId, setSubId] = useState(subs[0]?.id ?? "");
  const [landmark, setLandmark] = useState("");
  const [sectorId, setSectorId] = useState(
    user?.cityId === activeCityId ? user.sectorId : citySectors[0]?.id ?? "",
  );
  const [note, setNote] = useState("");
  const [anonymous, setAnonymous] = useState(false);
  const [photo, setPhoto] = useState<string | null>(null);
  const [photoName, setPhotoName] = useState("");
  const [reading, setReading] = useState(false);
  const [triage, setTriage] = useState<{ subId: string; confidence: number } | null>(null);
  const [coords, setCoords] = useState<Coords | null>(null);
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) router.replace("/auth");
  }, [user, router]);

  useEffect(() => {
    setSubId(subs[0]?.id ?? "");
  }, [subs]);

  const selectedSector = citySectors.find((s) => s.id === sectorId) ?? citySectors[0];
  const location: Coords = coords ?? {
    lat: selectedSector?.lat ?? city.center.lat,
    lng: selectedSector?.lng ?? city.center.lng,
    approximate: true,
  };

  const audience = useMemo(() => {
    return users.filter((candidate) => {
      if (candidate.cityId !== city.id) return false;
      const sector = sectors.find((s) => s.id === candidate.sectorId);
      return sector ? haversineKm(sector, location) <= 3 : false;
    }).length;
  }, [users, sectors, location, city.id]);

  const useMyLocation = () => {
    setError(null);
    if (!("geolocation" in navigator)) {
      setError("Location is unavailable in this browser. Pick your sector manually.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const point = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: Math.round(position.coords.accuracy),
        };
        setCoords(point);
        const nearest = [...citySectors]
          .map((sector) => ({ sector, km: haversineKm(sector, point) }))
          .sort((a, b) => a.km - b.km)[0];
        if (nearest) setSectorId(nearest.sector.id);
        setLocating(false);
      },
      () => {
        setLocating(false);
        setCoords(null);
        setError("Permission denied — we'll use your selected sector as the location.");
      },
      { enableHighAccuracy: true, timeout: 7000, maximumAge: 30000 },
    );
  };

  const onPhoto = async (file: File | undefined) => {
    if (!file) return;
    setError(null);
    setPhotoName(file.name);
    const dataUrl = await compressImage(file);
    setPhoto(dataUrl);
    setReading(true);
    window.setTimeout(() => {
      setTriage(mockTriage(file.name || "photo.jpg", categoryId));
      setReading(false);
    }, 900);
  };

  const submit = () => {
    setError(null);
    if (!subId) {
      setError("Pick the exact problem so responders know what to bring.");
      return;
    }
    setSubmitting(true);
    const incident = createIncident({
      categoryId,
      subCategoryId: subId,
      title: subCategoryById(subId)?.name ?? category.name,
      note: note.trim() || "Reported via Better Urban. No additional note provided.",
      landmark: landmark.trim() || `${selectedSector?.name ?? "City"} main road`,
      lat: location.lat,
      lng: location.lng,
      sectorId: selectedSector?.id ?? citySectors[0]?.id ?? "",
      photoUrl: photo,
      isAnonymous: anonymous,
      severity: categoryId === "fire" || categoryId === "medical" ? "critical" : categoryId === "safety" ? "high" : "medium",
    });
    if (!incident) {
      setSubmitting(false);
      setError("Your session expired. Please sign in again.");
      return;
    }
    router.push(`/report/sent/${incident.id}`);
  };

  if (!user) return null;

  return (
    <div className="flex min-h-full flex-col pb-4">
      <PageHeader label="WF-05 // Report issue" title="Select sub-issue" back="/app" />

      <div className="flex-1 space-y-4 px-5 pt-4">
        <div className="flex items-center justify-between">
          <span className="label-caps">Reporting in {city.name}</span>
          <span className="inline-flex items-center gap-1 text-[10.5px] text-muted">
            <MapPin className="size-3" />
            {selectedSector?.name}
          </span>
        </div>

        <div className="no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5">
          {CATEGORIES.map((item) => (
            <Chip
              key={item.id}
              active={item.id === categoryId}
              onClick={() => router.push(`/report/${item.id}`)}
            >
              <CategoryIcon id={item.id} size={13} />
              {item.name}
            </Chip>
          ))}
        </div>

        <section>
          <FieldLabel>What exactly happened?</FieldLabel>
          <div className="overflow-hidden rounded-xl border border-line bg-white">
            {subs.map((sub, index) => {
              const active = sub.id === subId;
              return (
                <button
                  key={sub.id}
                  type="button"
                  onClick={() => setSubId(sub.id)}
                  className={cn(
                    "flex w-full items-center justify-between gap-3 px-3.5 py-3 text-left transition",
                    index !== subs.length - 1 && "border-b border-line/70",
                    active ? "bg-paper" : "hover:bg-paper/60",
                  )}
                >
                  <span className={cn("text-[12.5px]", active ? "font-semibold" : "text-ink/80")}>
                    {sub.name}
                  </span>
                  <span
                    className={cn(
                      "flex size-5 items-center justify-center rounded-full border transition",
                      active ? "border-ink bg-ink text-cream" : "border-line-strong bg-white",
                    )}
                  >
                    {active ? <Check className="size-3" /> : null}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        <div className="grid grid-cols-2 gap-2.5">
          <div className="rounded-xl border border-line bg-white p-3">
            <div className="flex items-center gap-1.5 text-muted">
              <MapPin className="size-3.5" />
              <span className="text-[9.5px] font-semibold uppercase tracking-[0.12em]">Pin location</span>
            </div>
            <p className="mt-1.5 truncate text-[11.5px] font-medium">
              {coords ? `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}` : `${selectedSector?.name} · approximate`}
            </p>
            <button
              type="button"
              onClick={useMyLocation}
              disabled={locating}
              className="mt-2 inline-flex items-center gap-1 text-[10.5px] font-semibold text-ink underline-offset-4 hover:underline disabled:opacity-60"
            >
              {locating ? <Loader2 className="size-3 animate-spin" /> : <Crosshair className="size-3" />}
              {locating ? "Locating…" : coords ? "Refresh GPS" : "Use my location"}
            </button>
          </div>

          <div
            role="button"
            tabIndex={0}
            onClick={() => fileRef.current?.click()}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") fileRef.current?.click();
            }}
            className="relative cursor-pointer overflow-hidden rounded-xl border border-dashed border-line-strong bg-white p-3 text-left"
          >
            {photo ? (
              <>
                <img src={photo} alt="Issue evidence" className="absolute inset-0 size-full object-cover" />
                <span className="absolute inset-0 bg-gradient-to-t from-ink/70 via-ink/10 to-transparent" />
                <span className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-[10px] font-semibold text-white">
                  Evidence added
                  <span
                    role="button"
                    tabIndex={0}
                    onClick={(event) => {
                      event.stopPropagation();
                      setPhoto(null);
                      setTriage(null);
                      if (fileRef.current) fileRef.current.value = "";
                    }}
                    className="flex size-5 items-center justify-center rounded-full bg-white/90 text-ink"
                  >
                    <X className="size-3" />
                  </span>
                </span>
              </>
            ) : (
              <div className="flex h-full flex-col justify-between">
                <div className="flex items-center gap-1.5 text-muted">
                  <Camera className="size-3.5" />
                  <span className="text-[9.5px] font-semibold uppercase tracking-[0.12em]">Add photo</span>
                </div>
                <p className="text-[11px] text-muted">Optional evidence</p>
                <span className="mt-1 inline-flex items-center gap-1 text-[10.5px] font-semibold text-ink">
                  <ImagePlus className="size-3" /> Upload
                </span>
              </div>
            )}
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(event) => void onPhoto(event.target.files?.[0])}
          />
        </div>

        {reading ? (
          <div className="flex items-center gap-2 rounded-xl border border-line bg-white px-3 py-2.5 text-[11.5px] text-muted">
            <Loader2 className="size-3.5 animate-spin" /> Demo AI is reading the photo…
          </div>
        ) : triage ? (
          <div className="rounded-xl border border-gold/30 bg-gold-soft/60 p-3">
            <div className="flex items-center gap-1.5">
              <Sparkles className="size-3.5 text-[#8a5f17]" />
              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#8a5f17]">
                Demo AI triage · {Math.round(triage.confidence * 100)}% match
              </p>
            </div>
            <p className="mt-1 text-[12px] text-ink/80">
              Looks like <span className="font-semibold">{subCategoryById(triage.subId)?.name}</span>
              {triage.subId === subId ? " — already selected." : ". Apply the suggestion?"}
            </p>
            {triage.subId !== subId ? (
              <button
                type="button"
                onClick={() => setSubId(triage.subId)}
                className="mt-2 inline-flex items-center gap-1 rounded-full border border-ink/20 bg-white px-2.5 py-1 text-[10.5px] font-semibold"
              >
                <Check className="size-3" /> Use this sub-issue
              </button>
            ) : null}
          </div>
        ) : photoName ? (
          <p className="text-[10.5px] text-muted">Photo attached · {photoName}</p>
        ) : null}

        <div>
          <FieldLabel hint="Landmark helps the field team">Location detail</FieldLabel>
          <div className="space-y-2">
            <TextInput
              value={landmark}
              onChange={(event) => setLandmark(event.target.value)}
              placeholder="Describe landmark or severity…"
            />
            <Select value={sectorId} onChange={(event) => setSectorId(event.target.value)}>
              {citySectors.map((sector) => (
                <option key={sector.id} value={sector.id}>
                  {sector.name}
                </option>
              ))}
            </Select>
          </div>
        </div>

        <div>
          <FieldLabel>Brief note</FieldLabel>
          <TextArea
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="What did you see? Who is affected?"
            rows={3}
            maxLength={280}
          />
          <p className="mt-1 text-right text-[10px] text-muted">{note.length}/280</p>
        </div>

        <div className="flex items-center justify-between gap-3 rounded-xl border border-line bg-white px-3.5 py-3">
          <div className="flex items-center gap-2.5">
            <span className="flex size-8 items-center justify-center rounded-full bg-paper text-ink/70">
              <EyeOff className="size-4" />
            </span>
            <div>
              <p className="text-[12px] font-semibold">Report anonymously</p>
              <p className="text-[10.5px] text-muted">Hide your name &amp; phone from the public feed</p>
            </div>
          </div>
          <Toggle checked={anonymous} onChange={setAnonymous} label="Report anonymously" />
        </div>

        <div className="rounded-xl border border-ink/10 bg-ink/[0.035] p-3">
          <div className="flex items-center gap-1.5">
            <AlertTriangle className="size-3.5 text-ink/60" />
            <p className="text-[11px] font-semibold">This will dispatch a 3 km alert</p>
          </div>
          <div className="mt-2 grid grid-cols-3 gap-2 text-[10px] text-muted">
            <span className="inline-flex items-center gap-1">
              <Building2 className="size-3" /> Authorities
            </span>
            <span className="inline-flex items-center gap-1">
              <HandHeart className="size-3" /> 2 NGOs
            </span>
            <span className="inline-flex items-center gap-1">
              <Users className="size-3" /> ~{audience} citizens
            </span>
          </div>
        </div>

        {error ? <ErrorNote>{error}</ErrorNote> : null}
      </div>

      <div className="sticky bottom-0 z-20 border-t border-line bg-paper/95 px-5 pb-3 pt-3 backdrop-blur">
        <Button size="lg" className="w-full" onClick={submit} disabled={submitting}>
          {submitting ? <Loader2 className="size-4 animate-spin" /> : <Megaphone className="size-4" />}
          Report &amp; send alert
        </Button>
        <p className="mt-1.5 text-center text-[9.5px] uppercase tracking-[0.14em] text-muted/70">
          Prototype · dispatch is simulated
        </p>
      </div>
    </div>
  );
}

export default function ReportPage() {
  return (
    <HydrationGate>
      <AppFrame>
        <ReportScreen />
      </AppFrame>
    </HydrationGate>
  );
}
