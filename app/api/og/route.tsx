import { ImageResponse } from "next/og";
import { PALETTE } from "@/lib/palette";

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
        backgroundColor: PALETTE.sky,
        // Sky gradient, soft cloud puffs, and a white glow behind the hole.
        backgroundImage: [
          "radial-gradient(circle at 78% 50%, rgba(255,255,255,0.55) 0%, rgba(158,216,255,0.25) 20%, rgba(255,255,255,0) 40%)",
          "radial-gradient(ellipse 260px 90px at 12% 16%, rgba(255,255,255,0.4), rgba(255,255,255,0))",
          "radial-gradient(ellipse 340px 110px at 38% 94%, rgba(255,255,255,0.32), rgba(255,255,255,0))",
          "radial-gradient(ellipse 220px 70px at 96% 8%, rgba(255,255,255,0.38), rgba(255,255,255,0))",
          `linear-gradient(180deg, ${PALETTE.skyTop}, ${PALETTE.sky} 45%, ${PALETTE.skyBottom})`,
        ].join(", "),
        color: PALETTE.ink,
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", maxWidth: 620 }}>
        <div style={{ fontSize: 28, letterSpacing: 10, color: PALETTE.haze }}>
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
        <div style={{ fontSize: 32, color: PALETTE.mist, marginTop: 28 }}>
          Then go do something with what&apos;s left.
        </div>
      </div>
      <div
        style={{
          width: 300,
          height: 300,
          borderRadius: 9999,
          backgroundColor: PALETTE.horizon,
          border: `6px solid ${PALETTE.halo}`,
          boxShadow:
            "0 0 50px 16px rgba(255,255,255,0.8), 0 0 140px 50px rgba(158,216,255,0.5)",
          display: "flex",
        }}
      />
    </div>,
    { width: 1200, height: 630 },
  );
}
