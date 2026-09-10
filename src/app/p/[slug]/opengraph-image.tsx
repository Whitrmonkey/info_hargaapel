import { ImageResponse } from "next/og";
import { createClient } from "@/lib/supabase/server";
import { kelompokkanPasaran, type Garansi, type Grade, type Kondisi } from "@/lib/pasaran";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: produk } = await supabase.from("products").select("*").eq("slug", slug).single();

  let hargaTeks = "Belum ada data";
  if (produk) {
    const { data } = await supabase.from("harga_terkini").select("*").eq("product_id", produk.id).eq("sisi", "jual");
    const observasi = (data ?? [])
      .filter(
        (o): o is typeof o & { id: number; seller_id: string; harga: number; observed_at: string } =>
          o.id != null && o.seller_id != null && o.harga != null && o.observed_at != null,
      )
      .map((o) => ({
        id: o.id,
        product_id: produk.id,
        seller_id: o.seller_id,
        sisi: "jual" as const,
        kondisi: o.kondisi as Kondisi,
        grade: o.grade as Grade | null,
        garansi: o.garansi as Garansi,
        harga: o.harga,
        observed_at: o.observed_at,
        perlu_verifikasi: o.perlu_verifikasi ?? false,
      }));
    const grup = kelompokkanPasaran(observasi);
    const utama = [...grup].sort((a, b) => b.jumlah_toko - a.jumlah_toko)[0];
    if (utama) hargaTeks = "Rp " + utama.median.toLocaleString("id-ID");
  }

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
        <div style={{ fontSize: 28, color: "#5A6472" }}>hargaapel</div>
        <div style={{ fontSize: 64, fontWeight: 800, marginTop: 20, letterSpacing: -2 }}>
          {produk ? `${produk.model} ${produk.varian}` : "Produk"}
        </div>
        <div style={{ fontSize: 48, marginTop: 24, color: "#5A6472" }}>{`harga pasaran ${hargaTeks}`}</div>
      </div>
    ),
    size,
  );
}
