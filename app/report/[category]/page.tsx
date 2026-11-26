"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  AlertTriangle,
  Camera,
  Check,
  Crosshair,
  EyeOff,
  Loader2,
  MapPin,
  Sparkles,
  Tag,
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
  normalizeCategoryId,
  subCategoriesFor,
  subCategoryById,
} from "@/lib/catalog";
import { apiAnalyzePhoto, apiCheckDuplicate, apiListSectors, apiUploadPhoto, resolveMediaUrl } from "@/lib/api";
import { useApp, useSessionUser } from "@/lib/store";
import type { CategoryId, DuplicateMatch, Sector, Severity } from "@/lib/types";

function ReportScreen() {
  const router = useRouter();
  const params = useParams<{ category: string }>();
  const user = useSessionUser();
  const cities = useApp((s) => s.cities);
  const storeSectors = useApp((s) => s.sectors);
  const activeCityId = useApp((s) => s.activeCityId);
  const createIncident = useApp((s) => s.createIncident);

  const initialCat = normalizeCategoryId(params.category);
  const [categoryId, setCategoryId] = useState<CategoryId>(initialCat);
  const [selectedCityId, setSelectedCityId] = useState<string>(activeCityId || "metro");
  const [citySectors, setCitySectors] = useState<Sector[]>(() =>
    storeSectors.filter((s) => s.cityId === (activeCityId || "metro")),
  );

  const category = categoryById(categoryId);
  const subs = useMemo(() => subCategoriesFor(categoryId), [categoryId]);

  const [subId, setSubId] = useState(subs[0]?.id ?? "");
  const [sectorId, setSectorId] = useState("");
  const [landmark, setLandmark] = useState("");
  const [note, setNote] = useState("");
  const [severity, setSeverity] = useState<Severity>("medium");
  const [anonymous, setAnonymous] = useState(false);

  // Photo upload + AI tags
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [tags, setTags] = useState<string[]>([]);
  const [customTag, setCustomTag] = useState("");
  const [suggestedCat, setSuggestedCat] = useState<string | null>(null);

  // GPS & Duplicate Detection
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const [duplicates, setDuplicates] = useState<DuplicateMatch[]>([]);
  const [duplicateOf, setDuplicateOf] = useState<string | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) router.replace("/auth");
  }, [user, router]);

  useEffect(() => {
    setSubId(subs[0]?.id ?? "");
  }, [subs]);

  useEffect(() => {
    let active = true;
    apiListSectors(selectedCityId)
      .then((list) => {
        if (!active) return;
        setCitySectors(list);
        if (list.length && !list.some((s) => s.id === sectorId)) {
          setSectorId(list[0].id);
        }
      })
      .catch(() => {
        const fallback = storeSectors.filter((s) => s.cityId === selectedCityId);
        setCitySectors(fallback);
        if (fallback.length) setSectorId(fallback[0].id);
      });
    return () => {
      active = false;
    };
  }, [selectedCityId, storeSectors, sectorId]);

  const activeSector = useMemo(
    () => citySectors.find((s) => s.id === sectorId) ?? citySectors[0],
    [citySectors, sectorId],
  );

  // Run duplicate detection whenever coordinates or category change
  useEffect(() => {
    const lat = coords?.lat ?? activeSector?.lat;
    const lng = coords?.lng ?? activeSector?.lng;
    if (lat == null || lng == null) return;
    let cancelled = false;
    apiCheckDuplicate({ lat, lng, categoryId, cityId: selectedCityId })
      .then((res) => {
        if (!cancelled) setDuplicates(res.matches || []);
      })
      .catch(() => {
        if (!cancelled) setDuplicates([]);
      });
    return () => {
      cancelled = true;
    };
  }, [coords, activeSector, categoryId, selectedCityId]);

  const handlePhotoSelect = async (file: File) => {
    setError(null);
    setUploading(true);
    try {
      const [up, analysis] = await Promise.all([
        apiUploadPhoto(file),
        apiAnalyzePhoto(file),
      ]);
      setPhotoUrl(up.url);
      if (analysis.tags?.length) {
        setTags(analysis.tags);
      }
      if (analysis.suggestedCategory) {
        setSuggestedCat(analysis.suggestedCategory);
      }
      if (analysis.gps) {
        setCoords(analysis.gps);
      }
      if (analysis.location?.display && !landmark) {
        setLandmark(analysis.location.display.split(",").slice(0, 2).join(","));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not upload photo");
    } finally {
      setUploading(false);
    }
  };

  const detectGps = () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported in this browser.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: Number(pos.coords.latitude.toFixed(6)), lng: Number(pos.coords.longitude.toFixed(6)) });
        setLocating(false);
      },
      () => {
        if (activeSector) {
          setCoords({ lat: activeSector.lat, lng: activeSector.lng });
        }
        setLocating(false);
      },
      { timeout: 6000 },
    );
  };

  const addCustomTag = () => {
    const t = customTag.trim().toLowerCase();
    if (t && !tags.includes(t)) {
      setTags([...tags, t]);
    }
    setCustomTag("");
  };

  const handleSubmit = async () => {
    if (!activeSector) {
      setError("Please select a ward/sector.");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const sub = subCategoryById(subId);
      const lat = coords?.lat ?? activeSector.lat;
      const lng = coords?.lng ?? activeSector.lng;
      const inc = await createIncident({
        categoryId,
        subCategoryId: subId || `${categoryId}-general`,
        title: sub?.name ?? `${category.name} Issue`,
        note: note.trim(),
        landmark: landmark.trim() || activeSector.name,
        lat,
        lng,
        cityId: selectedCityId,
        sectorId: activeSector.id,
        wardNumber: activeSector.wardNumber,
        photoUrl,
        tags,
        isAnonymous: anonymous,
        severity,
        duplicateOf,
      });
      if (!inc) {
        setError("Failed to submit complaint.");
        return;
      }
      router.push(`/report/sent/${inc.id}`);
    } finally {
      setSubmitting(false);
    }
  };

  if (!user) return null;

  return (
    <AppFrame>
      <PageHeader
        back="/app"
        label="Report Issue"
        title={`New ${category.name} Complaint`}
      />

      <div className="space-y-4 px-5 pb-8 pt-4">
        {/* Category Switcher */}
        <div>
          <FieldLabel>Category</FieldLabel>
          <div className="flex flex-wrap gap-1.5">
            {CATEGORIES.map((c) => (
              <Chip key={c.id} active={categoryId === c.id} onClick={() => setCategoryId(c.id)}>
                <CategoryIcon id={c.id} size={13} />
                {c.name}
              </Chip>
            ))}
          </div>
        </div>

        {/* Photo Upload & Auto-Tagging */}
        <div className="rounded-[var(--radius-card)] border border-line bg-white p-3.5">
          <FieldLabel hint="Auto-tags & EXIF GPS">Upload Photo</FieldLabel>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handlePhotoSelect(f);
            }}
          />
          {photoUrl ? (
            <div className="relative overflow-hidden rounded-xl border border-line">
              <img
                src={resolveMediaUrl(photoUrl) ?? ""}
                alt="Uploaded complaint"
                className="h-44 w-full object-cover"
              />
              <button
                type="button"
                onClick={() => {
                  setPhotoUrl(null);
                  setTags([]);
                  setSuggestedCat(null);
                }}
                className="absolute right-2 top-2 flex size-7 items-center justify-center rounded-full bg-ink/80 text-white"
                aria-label="Remove photo"
              >
                <X className="size-4" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="flex w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-line-strong bg-paper/60 py-6 text-muted transition hover:border-primary hover:text-primary"
            >
              {uploading ? <Loader2 className="size-6 animate-spin" /> : <Camera className="size-6" />}
              <span className="text-[12px] font-medium">
                {uploading ? "Uploading & generating tags…" : "Tap to upload issue photo"}
              </span>
            </button>
          )}

          {suggestedCat && suggestedCat !== categoryId ? (
            <div className="mt-2.5 flex items-center justify-between rounded-lg bg-primary-95 px-3 py-2 text-[11.5px] text-primary-30">
              <span className="flex items-center gap-1.5">
                <Sparkles className="size-3.5" />
                AI suggests category: <strong className="capitalize">{suggestedCat}</strong>
              </span>
              <button
                type="button"
                onClick={() => setCategoryId(normalizeCategoryId(suggestedCat))}
                className="font-semibold underline"
              >
                Switch
              </button>
            </div>
          ) : null}

          {/* Tags */}
          <div className="mt-3">
            <div className="flex flex-wrap gap-1.5">
              {tags.map((t) => (
                <span
                  key={t}
                  className="inline-flex items-center gap-1 rounded-full bg-primary-95 px-2.5 py-0.5 text-[11px] font-medium text-primary-30"
                >
                  <Tag className="size-3" />
                  {t}
                  <button
                    type="button"
                    onClick={() => setTags(tags.filter((x) => x !== t))}
                    aria-label={`Remove ${t}`}
                  >
                    <X className="size-3" />
                  </button>
                </span>
              ))}
            </div>
            <div className="mt-2 flex gap-2">
              <TextInput
                value={customTag}
                onChange={(e) => setCustomTag(e.target.value)}
                placeholder="Add custom tag (e.g. pothole)"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addCustomTag();
                  }
                }}
              />
              <Button variant="secondary" size="sm" onClick={addCustomTag}>
                Add
              </Button>
            </div>
          </div>
        </div>

        {/* City, Ward & GPS Location */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <FieldLabel>Select City</FieldLabel>
            <Select value={selectedCityId} onChange={(e) => setSelectedCityId(e.target.value)}>
              {cities.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <FieldLabel>Ward / Sector</FieldLabel>
            <Select value={sectorId} onChange={(e) => setSectorId(e.target.value)}>
              {citySectors.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </Select>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 rounded-xl border border-line bg-white px-3.5 py-2.5">
          <div className="min-w-0">
            <p className="text-[12px] font-semibold text-ink">GPS Coordinates</p>
            <p className="truncate text-[11px] text-muted">
              {coords
                ? `${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)}`
                : activeSector
                  ? `Ward ${activeSector.wardNumber} center (${activeSector.lat}, ${activeSector.lng})`
                  : "Not set"}
            </p>
          </div>
          <Button variant="secondary" size="sm" onClick={detectGps} disabled={locating}>
            <Crosshair className="size-3.5" />
            {locating ? "Locating…" : "Use GPS"}
          </Button>
        </div>

        {/* Duplicate Warning */}
        {duplicates.length > 0 ? (
          <div className="rounded-xl border border-secondary bg-secondary-95 p-3.5 text-[12px] text-secondary-20">
            <div className="flex items-center gap-2 font-semibold">
              <AlertTriangle className="size-4 text-secondary-50" />
              Possible Duplicate Complaint Nearby ({duplicates.length})
            </div>
            <p className="mt-1 text-[11px]">
              An open {category.name} issue was already reported within 100m:
            </p>
            <div className="mt-2 space-y-1.5">
              {duplicates.slice(0, 2).map((d) => (
                <div key={d.id} className="flex items-center justify-between rounded-lg bg-white/80 px-2.5 py-1.5">
                  <Link href={`/track/${d.id}`} className="font-medium text-primary underline">
                    {d.code} · {d.title} ({d.distanceMeters}m)
                  </Link>
                  <button
                    type="button"
                    onClick={() => setDuplicateOf(d.id)}
                    className="text-[11px] font-semibold text-secondary-50"
                  >
                    {duplicateOf === d.id ? "Linked" : "Link"}
                  </button>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {/* Issue Details */}
        <div>
          <FieldLabel>Issue Type</FieldLabel>
          <Select value={subId} onChange={(e) => setSubId(e.target.value)}>
            {subs.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </Select>
        </div>

        <div>
          <FieldLabel>Landmark / Street</FieldLabel>
          <div className="relative">
            <MapPin className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
            <TextInput
              value={landmark}
              onChange={(e) => setLandmark(e.target.value)}
              placeholder="Near school gate, main road..."
              className="pl-9"
            />
          </div>
        </div>

        <div>
          <FieldLabel>Severity</FieldLabel>
          <div className="grid grid-cols-4 gap-2">
            {(["low", "medium", "high", "critical"] as Severity[]).map((sev) => (
              <Chip
                key={sev}
                active={severity === sev}
                onClick={() => setSeverity(sev)}
                className="justify-center capitalize"
              >
                {sev}
              </Chip>
            ))}
          </div>
        </div>

        <div>
          <FieldLabel>Description</FieldLabel>
          <TextArea
            rows={3}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Describe the problem to help the ward officer…"
          />
        </div>

        <div className="flex items-center justify-between rounded-xl border border-line bg-white px-3.5 py-3">
          <div className="flex items-center gap-2.5">
            <EyeOff className="size-4 text-muted" />
            <div>
              <p className="text-[12.5px] font-semibold">Report Anonymously</p>
              <p className="text-[11px] text-muted">Hide your name from public map</p>
            </div>
          </div>
          <Toggle checked={anonymous} onChange={setAnonymous} label="Report anonymously" />
        </div>

        {error ? <ErrorNote>{error}</ErrorNote> : null}

        <Button size="lg" className="w-full" onClick={handleSubmit} disabled={submitting}>
          {submitting ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
          {submitting ? "Submitting Complaint…" : "Submit Complaint"}
        </Button>
      </div>
    </AppFrame>
  );
}

export default function ReportPage() {
  return (
    <HydrationGate>
      <ReportScreen />
    </HydrationGate>
  );
}
