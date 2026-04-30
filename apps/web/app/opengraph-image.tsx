import { ImageResponse } from "next/og";

export const alt =
  "Meet Susi — The AI agent that negotiates your bills by email";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const runtime = "edge";

export default function OgImage() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        position: "relative",
        overflow: "hidden",
        background:
          "linear-gradient(135deg, #f5e8d3 0%, #f0d9c0 30%, #e8c5a8 60%, #d8a890 85%, #c08a7e 100%)",
        color: "#2a1a0e",
        fontFamily:
          'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          background:
            "radial-gradient(ellipse 900px 500px at 80% 15%, rgba(255, 230, 180, 0.7), transparent 60%), radial-gradient(ellipse 700px 600px at 10% 90%, rgba(180, 200, 160, 0.35), transparent 55%)",
        }}
      />

      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          backgroundImage:
            "repeating-linear-gradient(0deg, rgba(80, 50, 30, 0.02) 0px, transparent 1px, transparent 3px)",
          opacity: 0.6,
        }}
      />

      <div
        style={{
          position: "absolute",
          top: 28,
          left: 28,
          right: 28,
          bottom: 28,
          borderRadius: 24,
          border: "1px solid rgba(60, 40, 25, 0.12)",
          display: "flex",
        }}
      />

      <div
        style={{
          position: "absolute",
          top: 28,
          left: 28,
          right: 28,
          bottom: 28,
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "52px 56px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
            }}
          >
            <div
              style={{
                width: 14,
                height: 14,
                borderRadius: 999,
                background: "#3a2615",
                display: "flex",
              }}
            />
            <span
              style={{
                fontSize: 22,
                fontWeight: 600,
                letterSpacing: "-0.01em",
                color: "#3a2615",
              }}
            >
              Meet Susi
            </span>
          </div>
          <span
            style={{
              fontSize: 16,
              fontWeight: 500,
              color: "rgba(58, 38, 21, 0.7)",
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              display: "flex",
            }}
          >
            Vercel · Zero to Agent · 2026
          </span>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 0,
          }}
        >
          <div
            style={{
              fontSize: 78,
              fontWeight: 600,
              lineHeight: 1.02,
              letterSpacing: "-0.04em",
              color: "#1a0e05",
              maxWidth: 1000,
            }}
          >
            The AI agent that negotiates your bills by email.
          </div>

          <div
            style={{
              marginTop: 28,
              fontSize: 28,
              lineHeight: 1.4,
              color: "rgba(40, 24, 12, 0.72)",
              maxWidth: 920,
              display: "flex",
            }}
          >
            Save 20–40% on SaaS, rent, cars and services. Patient.
            Professional. Persistent.
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <TechPill label="Workflow SDK" />
          <TechPill label="AI SDK 6" />
          <TechPill label="Claude Sonnet 4.6" />
          <TechPill label="Cloudflare Email" />

          <div
            style={{
              display: "flex",
              flex: 1,
              justifyContent: "flex-end",
            }}
          >
            <span
              style={{
                fontSize: 18,
                color: "rgba(58, 38, 21, 0.55)",
                letterSpacing: "0.01em",
              }}
            >
              meetsusi.com
            </span>
          </div>
        </div>
      </div>
    </div>,
    { ...size },
  );
}

function TechPill({ label }: { label: string }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        padding: "8px 16px",
        borderRadius: 999,
        border: "1px solid rgba(60, 40, 25, 0.18)",
        background: "rgba(255, 248, 235, 0.5)",
        fontSize: 16,
        color: "rgba(50, 32, 18, 0.78)",
        fontWeight: 500,
      }}
    >
      {label}
    </div>
  );
}
