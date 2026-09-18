import { ImageResponse } from "next/og";
import { SITE_NAME, SITE_TAGLINE } from "@/lib/site";

export const alt = SITE_NAME;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          width: "100%",
          height: "100%",
          flexDirection: "column",
          justifyContent: "center",
          padding: "96px",
          background: "#0a0a0a",
          color: "#ededed",
        }}
      >
        <div
          style={{
            display: "flex",
            width: 96,
            height: 8,
            marginBottom: 48,
            background: "#5865f2",
          }}
        />
        <div style={{ fontSize: 76, fontWeight: 600, letterSpacing: "-0.03em" }}>
          {SITE_NAME}
        </div>
        <div style={{ marginTop: 20, fontSize: 34, color: "#a1a1a1" }}>
          {SITE_TAGLINE}
        </div>
      </div>
    ),
    size,
  );
}
