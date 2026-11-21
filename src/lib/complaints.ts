import type { IconName } from "@/components/ui/icons";

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

// One style per status, used by badges, timelines, charts and map pins, so a status always
// looks the same. Earthy tones that sit well next to the green brand:
// - color: dots, bars and map pins (at least 3:1 against white)
// - text + tint: badge label on its light background (at least 6:1, WCAG AA needs 4.5:1)
// - icon: a second cue next to the colour, for colour-blind readers
export const STATUS_STYLE: Record<ComplaintStatus, { color: string; text: string; tint: string; icon: IconName }> = {
  submitted: { color: "#55626a", text: "#3f4a50", tint: "#eef1f2", icon: "send" }, // slate
  under_review: { color: "#c0841c", text: "#7a4a00", tint: "#fbf1dc", icon: "search" }, // amber
  action_taken: { color: "#1585a3", text: "#0d5a73", tint: "#e3f2f7", icon: "zap" }, // teal
  resolved: { color: "#2e7a36", text: "#1f5a2b", tint: "#e4f1e6", icon: "check" }, // green
  rejected: { color: "#c4442f", text: "#9b2c1c", tint: "#fbe7e3", icon: "x" }, // brick
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
