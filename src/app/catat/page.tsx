import { createClient } from "@/lib/supabase/server";
import { kelompokkanPasaran, type Garansi, type Grade, type Kondisi, type ObservasiHarga } from "@/lib/pasaran";
import { CatatForm } from "./catat-form";

function hariLaluIso(n: number): string {
  return new Date(Date.now() - n * 86_400_000).toISOString();
}

export default async function CatatPage() {
  const supabase = await createClient();
  const batas30Hari = hariLaluIso(30);
  const batasBeli30Hari = hariLaluIso(30);

  const [{ data: produk }, { data: seller }, { data: observasi30Hari }, { data: hargaTerkini }, { data: sisiBeli }] =
    await Promise.all([
      supabase.from("products").select("id, slug, model, varian, kategori").eq("aktif", true),
      supabase.from("sellers").select("id, nama").eq("aktif", true).order("nama"),
      supabase.from("price_observations").select("product_id").gte("observed_at", batas30Hari),
      supabase.from("harga_terkini").select("*").eq("sisi", "jual"),
      supabase.from("price_observations").select("product_id, kondisi, harga").eq("sisi", "beli").gte("observed_at", batasBeli30Hari),
    ]);

  const frekuensi: Record<string, number> = {};
  for (const o of observasi30Hari ?? []) {
    frekuensi[o.product_id] = (frekuensi[o.product_id] ?? 0) + 1;
  }

  // Lantai pasar per produk+kondisi: harga beli tertinggi platform buyback
  // dalam 30 hari terakhir. Dipakai untuk peringatan (bukan blokir) di form.
  const lantaiPasar: Record<string, number> = {};
  for (const o of sisiBeli ?? []) {
    const kunci = `${o.product_id}|${o.kondisi}`;
    lantaiPasar[kunci] = Math.max(lantaiPasar[kunci] ?? 0, o.harga);
  }

  const observasi: ObservasiHarga[] = (hargaTerkini ?? [])
    .filter((o): o is typeof o & { id: number; product_id: string; seller_id: string; harga: number; observed_at: string } =>
      o.id != null && o.product_id != null && o.seller_id != null && o.harga != null && o.observed_at != null,
    )
    .map((o) => ({
      id: o.id,
      product_id: o.product_id,
      seller_id: o.seller_id,
      sisi: "jual",
      kondisi: o.kondisi as Kondisi,
      grade: o.grade as Grade | null,
      garansi: o.garansi as Garansi,
      harga: o.harga,
      observed_at: o.observed_at,
      perlu_verifikasi: o.perlu_verifikasi ?? false,
    }));

  const grup = kelompokkanPasaran(observasi);

  return <CatatForm produk={produk ?? []} seller={seller ?? []} frekuensi={frekuensi} grup={grup} lantaiPasar={lantaiPasar} />;
}
