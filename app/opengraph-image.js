import { ImageResponse } from "next/og"

export const runtime = "edge"

export const size = {
  width: 1200,
  height: 630
}

export const contentType = "image/png"

export default function OpenGraphImage() {
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
        <div
          style={{
            width: "100%",
            display: "flex",
            flexDirection: "column",
            gap: 20
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: 14,
                background: "rgba(255,255,255,0.12)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 28,
                fontWeight: 800
              }}
            >
              P
            </div>
            <div style={{ fontSize: 44, fontWeight: 800, letterSpacing: -1 }}>
              PulseDaily
            </div>
          </div>

          <div style={{ fontSize: 34, fontWeight: 700, letterSpacing: -0.5 }}>
            Build habits. Keep momentum.
          </div>

          <div style={{ fontSize: 22, color: "rgba(255,255,255,0.8)", lineHeight: 1.4 }}>
            Mobile-first • No login • Local-first • Gentle reminders
          </div>

          <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
            {["Fast setup", "Simple streaks", "Your data stays local"].map((t) => (
              <div
                key={t}
                style={{
                  border: "1px solid rgba(255,255,255,0.18)",
                  background: "rgba(255,255,255,0.06)",
                  padding: "10px 14px",
                  borderRadius: 999,
                  fontSize: 18,
                  color: "rgba(255,255,255,0.9)"
                }}
              >
                {t}
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
    size
  )
}

