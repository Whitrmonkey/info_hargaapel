import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          background: "#F7F6F3",
          color: "#1B2430",
          padding: 80,
        }}
      >
        <div style={{ fontSize: 88, fontWeight: 800, letterSpacing: -2 }}>hargaapel</div>
        <div style={{ fontSize: 34, marginTop: 16, color: "#5A6472" }}>
          Pembanding harga produk dan servis Apple untuk Jabodetabek
        </div>
      </div>
    ),
    size,
  );
}
