import { createClient } from "@/lib/supabase/server";
import { ATURAN, modeSekarang } from "@/lib/mode";
import { isiMaju, type TitikSeri } from "@/lib/seri";
import { median } from "@/lib/pasaran";

const HARI_RIWAYAT = 90;

export async function ambilSeriPasaran(params: {
  productId: string;
  sisi?: "jual" | "beli";
  kondisi: string;
  grade?: string | null;
  garansi?: string;
}): Promise<TitikSeri[]> {
  const supabase = await createClient();
  const dari = new Date(Date.now() - HARI_RIWAYAT * 86_400_000).toISOString().slice(0, 10);
  const ke = new Date().toISOString().slice(0, 10);

  let query = supabase
    .from("pasaran_harian")
    .select("tanggal, median")
      .eq("demo", ATURAN[modeSekarang()].demo)
    .eq("product_id", params.productId)
    .eq("sisi", params.sisi ?? "jual")
    .eq("kondisi", params.kondisi)
    .gte("tanggal", dari);

  if (params.garansi) query = query.eq("garansi", params.garansi);
  if (params.grade !== undefined) query = params.grade ? query.eq("grade", params.grade) : query.is("grade", null);

  const { data } = await query;
  const titik = (data ?? [])
    .filter((d): d is { tanggal: string; median: number } => d.tanggal != null && d.median != null)
    .map((d) => ({ tanggal: d.tanggal, median: d.median }));

  return isiMaju(titik, dari, ke);
}

// Servis tidak punya matview harian seperti pasaran_harian, jadi diringkas
// langsung dari observasi mentah -- cukup untuk grafik, tidak untuk beban
// query tinggi (jumlah observasi servis jauh lebih kecil dari device).
export async function ambilSeriServis(params: { productId: string; serviceTypeId: string; partGradeId: string | null }): Promise<TitikSeri[]> {
  const supabase = await createClient();
  const dari = new Date(Date.now() - HARI_RIWAYAT * 86_400_000).toISOString().slice(0, 10);
  const ke = new Date().toISOString().slice(0, 10);

  let query = supabase
    .from("service_observations")
    .select("id, observed_at, harga, koreksi_atas")
    .eq("product_id", params.productId)
    .eq("service_type_id", params.serviceTypeId)
    .eq("termasuk_jasa", true)
    .gte("observed_at", dari);
  query = params.partGradeId ? query.eq("part_grade_id", params.partGradeId) : query.is("part_grade_id", null);

  const { data } = await query;
  // koreksi_atas diisi di baris koreksi (baru), bukan di baris lama yang
  // dikoreksi -- buang baris yang sudah dirujuk sebagai koreksi_atas oleh
  // baris lain, bukan baris yang koreksi_atas-nya sendiri null.
  const tertimpa = new Set((data ?? []).map((o) => o.koreksi_atas).filter((v): v is number => v != null));
  const perHari = new Map<string, number[]>();
  for (const o of data ?? []) {
    if (o.observed_at == null || o.harga == null || o.id == null || tertimpa.has(o.id)) continue;
    const tgl = o.observed_at.slice(0, 10);
    const arr = perHari.get(tgl) ?? [];
    arr.push(o.harga);
    perHari.set(tgl, arr);
  }
  const titik = Array.from(perHari.entries()).map(([tanggal, harga]) => ({ tanggal, median: median(harga) }));

  return isiMaju(titik, dari, ke);
}
