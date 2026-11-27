"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { Incident } from "@/lib/types";
import { MAP_STATUS_TOKENS, OCOR_PALETTE } from "@/lib/theme";
import { STATUS_META, normalizeStatus, categoryById, mapColorForStatus } from "@/lib/catalog";

export default function LiveCityMap({
  center,
  incidents,
  onSelectIncident,
}: {
  center: { lat: number; lng: number };
  incidents: Incident[];
  onSelectIncident: (incident: Incident) => void;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerRef = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = L.map(containerRef.current, {
      center: [center.lat, center.lng],
      zoom: 12,
      zoomControl: true,
    });
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors",
    }).addTo(map);
    const layer = L.layerGroup().addTo(map);
    mapRef.current = map;
    layerRef.current = layer;

    return () => {
      map.remove();
      mapRef.current = null;
      layerRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    map.setView([center.lat, center.lng], 12, { animate: true });
  }, [center.lat, center.lng]);

  useEffect(() => {
    const layer = layerRef.current;
    if (!layer) return;
    layer.clearLayers();

    for (const inc of incidents) {
      const bucket = mapColorForStatus(inc.status);
      const token = MAP_STATUS_TOKENS[bucket] ?? MAP_STATUS_TOKENS.RED;
      const cat = categoryById(inc.categoryId);
      const statusMeta = STATUS_META[normalizeStatus(inc.status)];

      const marker = L.circleMarker([inc.lat, inc.lng], {
        radius: 11,
        color: OCOR_PALETTE.core.surfaceContainer,
        weight: 2.5,
        fillColor: token.hex,
        fillOpacity: 0.92,
      });

      marker.bindTooltip(`Ward ${inc.wardNumber} · ${inc.code}`, {
        direction: "top",
        offset: [0, -8],
      });

      marker.bindPopup(
        `<div style="min-width:170px;font-family:sans-serif">
          <div style="font-weight:700;font-size:13px;margin-bottom:2px">${inc.title}</div>
          <div style="font-size:11px;color:#50606f">${inc.code} · Ward ${inc.wardNumber} · ${cat.name}</div>
          <div style="margin-top:4px;font-size:11px;font-weight:600;color:${token.hex}">Status: ${statusMeta.label}</div>
        </div>`,
      );

      marker.on("click", () => {
        onSelectIncident(inc);
      });

      marker.addTo(layer);
    }
  }, [incidents, onSelectIncident]);

  return (
    <div
      ref={containerRef}
      className="h-[360px] w-full rounded-[var(--radius-card)] border border-line"
    />
  );
}
