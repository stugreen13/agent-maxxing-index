import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const alt = "Agent Maxxing Index — Live developer activity across GitHub, npm, PyPI, and more";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OGImage() {
  const fontData = await readFile(
    join(process.cwd(), "assets/JetBrainsMono-Bold.ttf")
  );

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#0a0a0a",
          fontFamily: "JetBrains Mono",
          padding: "60px",
        }}
      >
        {/* Top accent bar */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "6px",
            background: "linear-gradient(90deg, #06b6d4, #14b8a6, #06b6d4)",
            display: "flex",
          }}
        />

        {/* Main content */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "24px",
          }}
        >
          {/* Logo icon */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="80"
            height="80"
            viewBox="0 0 24 24"
            fill="none"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 8V6L17 1" stroke="#ffffff" />
            <path d="M14 1H17V4" stroke="#ffffff" />
            <rect width="16" height="12" x="4" y="8" rx="2" stroke="#ffffff" />
            <path d="M2 14h2" stroke="#ffffff" />
            <path d="M20 14h2" stroke="#ffffff" />
            <path d="M15 13v2" stroke="#ffffff" />
            <path d="M9 13v2" stroke="#ffffff" />
          </svg>

          {/* Title */}
          <div
            style={{
              fontSize: "64px",
              fontWeight: 700,
              color: "#ffffff",
              textAlign: "center",
              lineHeight: 1.1,
              display: "flex",
            }}
          >
            AGENT MAXXING INDEX
          </div>

          {/* Subtitle */}
          <div
            style={{
              fontSize: "24px",
              color: "#a1a1aa",
              textAlign: "center",
              display: "flex",
              maxWidth: "800px",
              lineHeight: 1.4,
            }}
          >
            Live developer activity across GitHub, npm, PyPI, and more.
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        {
          name: "JetBrains Mono",
          data: fontData,
          style: "normal",
          weight: 700,
        },
      ],
    }
  );
}
