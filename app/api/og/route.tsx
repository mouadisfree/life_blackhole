import { ImageResponse } from "next/og";

/**
 * Generic link-preview image (1200×630). Deliberately takes no parameters:
 * personal share cards are rendered on the device (PROGRESS.md D1), so nothing
 * personal ever reaches this route — query strings are ignored.
 */
export function GET() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 96px",
        backgroundColor: "#05050a",
        backgroundImage:
          "radial-gradient(circle at 78% 50%, rgba(255,107,26,0.45) 0%, rgba(255,179,71,0.12) 22%, rgba(5,5,10,0) 45%)",
        color: "#eeebf3",
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", maxWidth: 620 }}>
        <div style={{ fontSize: 28, letterSpacing: 10, color: "#9d99ad" }}>
          LIFE BLACKHOLE
        </div>
        <div
          style={{
            fontSize: 68,
            fontWeight: 700,
            lineHeight: 1.1,
            marginTop: 28,
          }}
        >
          Watch your time fall into the black hole.
        </div>
        <div style={{ fontSize: 32, color: "#ffb347", marginTop: 28 }}>
          Then go do something with what&apos;s left.
        </div>
      </div>
      <div
        style={{
          width: 300,
          height: 300,
          borderRadius: 9999,
          backgroundColor: "#000",
          border: "6px solid #fff4e0",
          boxShadow:
            "0 0 60px 20px rgba(255,179,71,0.75), 0 0 160px 60px rgba(255,107,26,0.45)",
          display: "flex",
        }}
      />
    </div>,
    { width: 1200, height: 630 },
  );
}
