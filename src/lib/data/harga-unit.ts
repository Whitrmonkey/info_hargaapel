import { createClient } from "@/lib/supabase/server";
import { saringObservasi } from "@/lib/mode";
import { kelompokkanPasaran, type Garansi, type Grade, type Kondisi } from "@/lib/pasaran";

// Dipakai kelayakan.ts: harga pasaran unit second grade STANDAR, sisi jual,
// lintas garansi (median gabungan groupnya sendiri per garansi -- kita ambil
// yang jumlah tokonya terbesar supaya representatif, bukan menjumlah lintas
// grup yang seharusnya tidak pernah satu median).
export async function ambilHargaUnitSecondStandar(productId: string): Promise<number | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("harga_terkini")
    .select("*")
    .eq("product_id", productId)
    .eq("sisi", "jual")
    .eq("kondisi", "second")
    .eq("grade", "standar");

  if (!data || data.length === 0) return null;

  const observasi = saringObservasi(data)
    .filter((o): o is typeof o & { id: number; seller_id: string; harga: number; observed_at: string } =>
      o.id != null && o.seller_id != null && o.harga != null && o.observed_at != null,
    )
    .map((o) => ({
      id: o.id,
      product_id: productId,
      seller_id: o.seller_id,
      sisi: "jual" as const,
      kondisi: "second" as Kondisi,
      grade: "standar" as Grade,
      garansi: (o.garansi ?? "toko") as Garansi,
      harga: o.harga,
      observed_at: o.observed_at,
      perlu_verifikasi: o.perlu_verifikasi ?? false,
    }));

  const grup = kelompokkanPasaran(observasi);
  if (grup.length === 0) return null;

  return grup.sort((a, b) => b.jumlah_toko - a.jumlah_toko)[0].median;
}
