import { ImageResponse } from "next/og";

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
          backgroundColor: "#0a0a0a",
          borderRadius: "22%",
        }}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="120"
          height="120"
          viewBox="0 0 24 24"
          fill="none"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {/* Stock chart arrow */}
          <path d="M12 8V6L17 1" stroke="#10b981" />
          <path d="M14 1H17V4" stroke="#10b981" />
          {/* Robot head */}
          <rect width="16" height="12" x="4" y="8" rx="2" stroke="#10b981" />
          {/* Ears */}
          <path d="M2 14h2" stroke="#10b981" />
          <path d="M20 14h2" stroke="#10b981" />
          {/* Eyes */}
          <path d="M15 13v2" stroke="#10b981" />
          <path d="M9 13v2" stroke="#10b981" />
        </svg>
      </div>
    ),
    { ...size }
  );
}
