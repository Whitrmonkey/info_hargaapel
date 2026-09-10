import { createClient } from "@/lib/supabase/server";
import { isiMaju, ringkasBulanan, type TitikHarian } from "@/lib/seri";

export interface TitikLinimasa {
  bulan: string; // YYYY-MM
  label: string; // "Sep 2022"
  resmi: number | null;
  inter: number | null;
}

export interface Linimasa {
  titik: TitikLinimasa[];
  adaResmi: boolean;
  adaInter: boolean;
}

// Dua jalur dipisah sebagai dua grup pembanding utuh, masing-masing grade
// standar. Tidak ada garis yang dirata-ratakan lintas grade atau lintas
// garansi -- kalau satu jalur belum punya data, garisnya memang tidak ada
// dan halaman menyebutkan itu, bukan menggambar garis palsu.
export async function ambilLinimasa(produk: { id: string; rilis_at: string | null }): Promise<Linimasa> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("pasaran_harian")
    .select("tanggal, median, garansi")
    .eq("product_id", produk.id)
    .eq("sisi", "jual")
    .eq("kondisi", "second")
    .eq("grade", "standar")
    .in("garansi", ["resmi", "inter"])
    .order("tanggal");

  const baris = (data ?? []).filter(
    (d): d is { tanggal: string; median: number; garansi: string } =>
      d.tanggal != null && d.median != null && d.garansi != null,
  );
  if (baris.length === 0) return { titik: [], adaResmi: false, adaInter: false };

  const perJalur = (garansi: string): TitikHarian[] =>
    baris.filter((d) => d.garansi === garansi).map((d) => ({ tanggal: d.tanggal, median: d.median }));

  const resmiHarian = perJalur("resmi");
  const interHarian = perJalur("inter");

  // Rentang dimulai dari hari pertama yang benar-benar ada datanya, bukan dari
  // tanggal rilis -- isiMaju tidak pernah menebak nilai sebelum data pertama.
  const semuaTanggal = baris.map((d) => d.tanggal).sort();
  const dari = semuaTanggal[0];
  const ke = new Date().toISOString().slice(0, 10);

  const resmiBulanan = new Map(ringkasBulanan(isiMaju(resmiHarian, dari, ke)).map((t) => [t.bulan, t]));
  const interBulanan = new Map(ringkasBulanan(isiMaju(interHarian, dari, ke)).map((t) => [t.bulan, t]));

  const bulanSemua = [...new Set([...resmiBulanan.keys(), ...interBulanan.keys()])].sort();

  return {
    titik: bulanSemua.map((bulan) => ({
      bulan,
      label: (resmiBulanan.get(bulan) ?? interBulanan.get(bulan))!.label,
      resmi: resmiBulanan.get(bulan)?.nilai ?? null,
      inter: interBulanan.get(bulan)?.nilai ?? null,
    })),
    adaResmi: resmiHarian.length > 0,
    adaInter: interHarian.length > 0,
  };
}
