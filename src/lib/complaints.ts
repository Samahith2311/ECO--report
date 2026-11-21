// Shared labels/colours for the two DB enums (see supabase/migrations/*_init_ecoreport.sql).
export const TYPES = {
  air_pollution: "Air pollution",
  water_pollution: "Water pollution",
  illegal_dumping: "Illegal dumping",
  noise: "Noise",
  deforestation: "Deforestation",
  other: "Other",
} as const;
export type ComplaintType = keyof typeof TYPES;

export const STATUSES = {
  submitted: "Submitted",
  under_review: "Under review",
  action_taken: "Action taken",
  resolved: "Resolved",
  rejected: "Rejected",
} as const;
export type ComplaintStatus = keyof typeof STATUSES;

// Dark enough for text on a light tint (badges) and distinct on the map/charts.
export const STATUS_COLOR: Record<ComplaintStatus, string> = {
  submitted: "#475569",
  under_review: "#b45309",
  action_taken: "#1d4ed8",
  resolved: "#276540",
  rejected: "#b91c1c",
};

// Date-only values ("2026-11-21") parse as UTC midnight, so format in UTC to avoid an off-by-one day.
export const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString("en-IN", { dateStyle: "medium", timeZone: "UTC" });
export const fmtDateTime = (t: string) =>
  new Date(t).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Kolkata" });

// One row of get_public_complaints(): anonymised, no reporter details.
export type PublicComplaint = {
  tracking_id: string;
  complaint_type: ComplaintType;
  location_text: string;
  latitude: number | null;
  longitude: number | null;
  complaint_date: string;
  status: ComplaintStatus;
  created_at: string;
  resolved_at: string | null;
};
