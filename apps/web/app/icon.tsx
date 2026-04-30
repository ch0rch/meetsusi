import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = { width: 64, height: 64 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background:
          "linear-gradient(135deg, #f5e8d3 0%, #e8c5a8 55%, #c08a7e 100%)",
        borderRadius: 14,
        color: "#1a0e05",
        fontSize: 44,
        fontWeight: 700,
        fontFamily:
          'ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif',
        letterSpacing: "-0.04em",
        lineHeight: 1,
      }}
    >
      s
    </div>,
    { ...size },
  );
}
