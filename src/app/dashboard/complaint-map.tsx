"use client";

import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import { ICON_PATHS } from "@/components/ui/icons";
import StatusBadge from "@/components/ui/status-badge";
import { STATUSES, STATUS_STYLE, TYPES, fmtDate, type ComplaintStatus, type PublicComplaint } from "@/lib/complaints";

const MYSURU: [number, number] = [12.2958, 76.6394];

// One pin per status: a coloured circle with the status icon inside, so pins differ by more than colour.
const PIN_ICONS = Object.fromEntries(
  (Object.keys(STATUS_STYLE) as ComplaintStatus[]).map((status) => {
    const s = STATUS_STYLE[status];
    const html =
      `<span style="display:grid;place-items:center;width:28px;height:28px;border-radius:9999px;` +
      `background:${s.color};border:2px solid #fff;box-shadow:0 1px 4px rgba(27,42,33,.35);color:#fff">` +
      `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="3" ` +
      `stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${ICON_PATHS[s.icon]}"/></svg></span>`;
    return [status, L.divIcon({ html, className: "", iconSize: [28, 28], iconAnchor: [14, 14], popupAnchor: [0, -14] })];
  }),
) as Record<ComplaintStatus, L.DivIcon>;

// Only rows that have coordinates (callers filter), so latitude/longitude are never null here.
export default function ComplaintMap({ pins }: { pins: PublicComplaint[] }) {
  // Frame all pins when there are any, else show Mysuru. maxZoom keeps a single pin from zooming to street level.
  const view = pins.length
    ? {
        bounds: pins.map((p) => [p.latitude!, p.longitude!] as [number, number]),
        boundsOptions: { padding: [32, 32] as [number, number], maxZoom: 15 },
      }
    : { center: MYSURU, zoom: 12 };

  // On touch screens one finger scrolls the page (not the map); pinch still zooms.
  const touch = window.matchMedia("(pointer: coarse)").matches;

  return (
    <MapContainer
      {...view}
      scrollWheelZoom={false}
      dragging={!touch}
      className="h-80 w-full rounded-control sm:h-[28rem]"
      aria-label="Map of complaint locations"
    >
      <TileLayer attribution="&copy; OpenStreetMap contributors" url="https://tile.openstreetmap.org/{z}/{x}/{y}.png" />
      {pins.map((p) => (
        <Marker
          key={p.tracking_id}
          position={[p.latitude!, p.longitude!]}
          icon={PIN_ICONS[p.status]}
          title={`${STATUSES[p.status]}: ${TYPES[p.complaint_type]}, ${p.location_text}`}
        >
          <Popup>
            <div className="space-y-1.5 font-sans text-sm text-ink">
              <StatusBadge status={p.status} />
              <div className="font-semibold">{TYPES[p.complaint_type]}</div>
              <div>{p.location_text}</div>
              <div className="text-muted">Noticed {fmtDate(p.complaint_date)}</div>
              <a href={`/track?id=${p.tracking_id}`} className="link font-mono">
                {p.tracking_id}
              </a>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
