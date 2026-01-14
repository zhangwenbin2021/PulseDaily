import { ImageResponse } from "next/og"

export const runtime = "edge"

export const size = {
  width: 1200,
  height: 600
}

export const contentType = "image/png"

export default function TwitterImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #0f172a 0%, #111827 40%, #0b1220 100%)",
          color: "white",
          fontFamily: "sans-serif",
          padding: 64
        }}
      >
        <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 18 }}>
          <div style={{ fontSize: 48, fontWeight: 900, letterSpacing: -1 }}>PulseDaily</div>
          <div style={{ fontSize: 30, fontWeight: 700, letterSpacing: -0.5 }}>
            A simple, local-first habit tracker.
          </div>
          <div style={{ fontSize: 20, color: "rgba(255,255,255,0.8)", lineHeight: 1.4 }}>
            No login • Mobile-first • Gentle reminders • Streak momentum
          </div>
        </div>
      </div>
    ),
    size
  )
}

