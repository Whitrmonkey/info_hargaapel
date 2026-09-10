import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import { kelompokkanPasaran, type Garansi, type Grade, type Kondisi } from "@/lib/pasaran";
import { kelompokkanServis, type ObservasiServis } from "@/lib/servis";

type WatchlistRow = Database["public"]["Tables"]["watchlists"]["Row"];

// Harga saat ini untuk satu baris watchlist -- device lewat pasaran.ts,
// servis lewat servis.ts. null kalau grupnya belum lolos gerbang datanya.
export async function hargaSaatIniUntukWatchlist(
  admin: SupabaseClient<Database>,
  w: WatchlistRow,
): Promise<number | null> {
  if (w.jenis === "device") {
    if (!w.product_id || !w.kondisi || !w.garansi) return null;
    const { data } = await admin
      .from("harga_terkini")
      .select("*")
      .eq("product_id", w.product_id)
      .eq("sisi", "jual")
      .eq("kondisi", w.kondisi)
      .eq("garansi", w.garansi);

    const observasi = (data ?? [])
      .filter((o): o is typeof o & { id: number; seller_id: string; harga: number; observed_at: string } =>
        o.id != null && o.seller_id != null && o.harga != null && o.observed_at != null,
      )
      .filter((o) => (o.grade ?? null) === (w.grade ?? null))
      .map((o) => ({
        id: o.id,
        product_id: w.product_id!,
        seller_id: o.seller_id,
        sisi: "jual" as const,
        kondisi: w.kondisi as Kondisi,
        grade: w.grade as Grade | null,
        garansi: w.garansi as Garansi,
        harga: o.harga,
        observed_at: o.observed_at,
        perlu_verifikasi: o.perlu_verifikasi ?? false,
      }));
    const [grup] = kelompokkanPasaran(observasi);
    return grup?.median ?? null;
  }

  if (!w.product_id || !w.service_type_id) return null;
  const { data } = await admin
    .from("service_observations")
    .select("*")
    .eq("product_id", w.product_id)
    .eq("service_type_id", w.service_type_id)
    .is("koreksi_atas", null);

  const observasi: ObservasiServis[] = (data ?? [])
    .filter((o): o is typeof o & { id: number; workshop_id: string; harga: number; observed_at: string } =>
      o.id != null && o.workshop_id != null && o.harga != null && o.observed_at != null,
    )
    .filter((o) => (o.part_grade_id ?? null) === (w.part_grade_id ?? null))
    .map((o) => ({
      id: o.id,
      product_id: w.product_id!,
      workshop_id: o.workshop_id,
      service_type_id: w.service_type_id!,
      part_grade_id: o.part_grade_id,
      harga: o.harga,
      termasuk_jasa: o.termasuk_jasa,
      observed_at: o.observed_at,
    }));
  const [grup] = kelompokkanServis(observasi);
  return grup?.p50 ?? null;
}
