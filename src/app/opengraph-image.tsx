import { ImageResponse } from "next/og";
export const alt = "Edmund Spencer Katso — The Living Archive";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export default function OpenGraphImage() {
  return new ImageResponse(
    <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", width: "100%", height: "100%", padding: "80px", background: "#17253B", color: "#F5F0E7", borderBottom: "12px solid #B39463" }}>
      <div style={{ fontSize: 22, letterSpacing: 6, color: "#D8BF97", marginBottom: 30 }}>THE LIVING ARCHIVE</div>
      <div style={{ fontSize: 70, lineHeight: 1.12, marginBottom: 26 }}>Edmund Spencer Katso</div>
      <div style={{ fontSize: 34, color: "#E2DACB" }}>History remembered. Stories preserved.</div>
      <div style={{ fontSize: 22, marginTop: 48, color: "#D8BF97" }}>AUTHOR · EDUCATOR · HISTORIAN</div>
    </div>, size,
  );
}
