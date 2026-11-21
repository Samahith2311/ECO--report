"use client";

import "leaflet/dist/leaflet.css";
import { CircleMarker, MapContainer, Popup, TileLayer } from "react-leaflet";
import { STATUSES, STATUS_STYLE, TYPES, fmtDate, type PublicComplaint } from "@/lib/complaints";

const MYSURU: [number, number] = [12.2958, 76.6394];

// Only rows that have coordinates (callers filter), so latitude/longitude are never null here.
export default function ComplaintMap({ pins }: { pins: PublicComplaint[] }) {
  // Frame all pins when there are any, else show Mysuru. maxZoom keeps a single pin from zooming to street level.
  const view = pins.length
    ? { bounds: pins.map((p) => [p.latitude!, p.longitude!] as [number, number]), boundsOptions: { padding: [40, 40] as [number, number], maxZoom: 15 } }
    : { center: MYSURU, zoom: 12 };

  return (
    <MapContainer {...view} scrollWheelZoom={false} className="h-96 w-full rounded-xl" aria-label="Map of complaint locations">
      <TileLayer attribution="&copy; OpenStreetMap contributors" url="https://tile.openstreetmap.org/{z}/{x}/{y}.png" />
      {pins.map((p) => (
        <CircleMarker
          key={p.tracking_id}
          center={[p.latitude!, p.longitude!]}
          radius={9}
          pathOptions={{ color: "#ffffff", weight: 2, fillColor: STATUS_STYLE[p.status].color, fillOpacity: 0.95 }}
        >
          <Popup>
            <p className="font-semibold">{TYPES[p.complaint_type]}</p>
            <p>{p.location_text}</p>
            <p>{STATUSES[p.status]} · {fmtDate(p.complaint_date)}</p>
            <a href={`/track?id=${p.tracking_id}`} className="font-mono underline">{p.tracking_id}</a>
          </Popup>
        </CircleMarker>
      ))}
    </MapContainer>
  );
}
