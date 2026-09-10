import { ImageResponse } from "next/og";
import { createClient } from "@/lib/supabase/server";
import { bangunTanggaHarga } from "@/lib/data/tangga-harga";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const rupiah = (n: number) => "Rp " + n.toLocaleString("id-ID");

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: produk } = await supabase.from("products").select("*").eq("slug", slug).single();

  const tangga = produk ? (await bangunTanggaHarga(produk)).filter((t) => t.kode !== "rilis" && t.harga != null) : [];
  const tertinggi = tangga.length > 0 ? Math.max(...tangga.map((t) => t.harga!)) : 1;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: "#F7F6F3",
          color: "#1B2430",
          padding: 72,
        }}
      >
        <div style={{ display: "flex", fontSize: 26, color: "#5A6472" }}>hargaapel</div>
        <div style={{ display: "flex", fontSize: 52, fontWeight: 800, marginTop: 12, letterSpacing: -2 }}>
          {produk ? `${produk.model} ${produk.varian}` : "Produk"}
        </div>
        <div style={{ display: "flex", fontSize: 24, marginTop: 8, color: "#5A6472" }}>Tangga harga satu model</div>

        <div style={{ display: "flex", flexDirection: "column", marginTop: 32, gap: 14 }}>
          {tangga.length === 0 && (
            <div style={{ display: "flex", fontSize: 32, color: "#5A6472" }}>Belum ada data harga</div>
          )}
          {tangga.map((t) => (
            <div key={t.kode} style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <div style={{ display: "flex", width: 220, fontSize: 22, color: "#5A6472" }}>{t.label}</div>
              <div
                style={{
                  display: "flex",
                  height: 26,
                  width: Math.max(24, Math.round((t.harga! / tertinggi) * 640)),
                  background: t.gaya === "lantai" ? "#8A8375" : "#1B2430",
                  borderRadius: 6,
                }}
              />
              <div style={{ display: "flex", fontSize: 24, fontWeight: 700 }}>{rupiah(t.harga!)}</div>
            </div>
          ))}
        </div>
      </div>
    ),
    size,
  );
}
