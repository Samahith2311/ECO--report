import { ImageResponse } from "next/og";

// Home-screen icon for iPhones/iPads (PNG, 180x180), drawn from the same leaf mark as the logo.
// iOS rounds the corners itself, so the green fills the whole square.
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#276540",
        }}
      >
        <svg width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 18C6 10 11 5 19 5c0 8-5 13-13 13ZM6 18l8-8" />
        </svg>
      </div>
    ),
    size,
  );
}
