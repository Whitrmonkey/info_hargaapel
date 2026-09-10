import { createClient } from "@/lib/supabase/server";
import { kelompokkanPasaran, type Garansi, type Grade, type Kondisi } from "@/lib/pasaran";
import { isiMaju, lajuBulanan, ringkasBulanan, type TitikHarian } from "@/lib/seri";
import { fase, type Fase } from "@/lib/keluarga";

export interface KartuSeri {
  id: string;
  slug: string;
  model: string;
  varian: string;
  tahun: number | null;
  bentuk: { keluarga?: string; siluet?: { muka?: string; kamera?: number } } | null;
  jumlahToko: number;
  // Rentang harga bekas jalur resmi, ujung bawah dan atas dari grup-grup
  // grade -- bukan satu median yang dicampur lintas grade.
  bekasBawah: number | null;
  bekasAtas: number | null;
  laju: number | null;
  fase: Fase | null;
  turunDariRilis: number | null;
}

export async function ambilIndeksSeri(kategori: string): Promise<{ kartu: KartuSeri[]; maks: number }> {
  const supabase = await createClient();

  const { data: produk } = await supabase
    .from("products")
    .select("id, slug, model, varian, rilis_at, harga_rilis_id, bentuk")
    .eq("kategori", kategori)
    .eq("aktif", true);

  const ids = (produk ?? []).map((p) => p.id);
  if (ids.length === 0) return { kartu: [], maks: 1 };

  const [{ data: observasi }, { data: harian }] = await Promise.all([
    supabase.from("harga_terkini").select("*").in("product_id", ids).eq("sisi", "jual").eq("kondisi", "second").eq("garansi", "resmi"),
    supabase
      .from("pasaran_harian")
      .select("product_id, tanggal, median")
      .in("product_id", ids)
      .eq("sisi", "jual")
      .eq("kondisi", "second")
      .eq("grade", "standar")
      .eq("garansi", "resmi")
      .order("tanggal"),
  ]);

  const hariIni = new Date().toISOString().slice(0, 10);

  const kartu: KartuSeri[] = (produk ?? []).map((p) => {
    const milik = (observasi ?? [])
      .filter(
        (o): o is typeof o & { id: number; seller_id: string; harga: number; observed_at: string } =>
          o.product_id === p.id && o.id != null && o.seller_id != null && o.harga != null && o.observed_at != null,
      )
      .map((o) => ({
        id: o.id,
        product_id: p.id,
        seller_id: o.seller_id,
        sisi: "jual" as const,
        kondisi: "second" as Kondisi,
        grade: o.grade as Grade | null,
        garansi: "resmi" as Garansi,
        harga: o.harga,
        observed_at: o.observed_at,
        perlu_verifikasi: o.perlu_verifikasi ?? false,
      }));

    const grup = kelompokkanPasaran(milik).filter((g) => g.grade != null);
    const median = grup.map((g) => g.median);
    const bekasBawah = median.length > 0 ? Math.min(...median) : null;
    const bekasAtas = median.length > 0 ? Math.max(...median) : null;

    const titikHarian: TitikHarian[] = (harian ?? [])
      .filter((d): d is { product_id: string; tanggal: string; median: number } => d.product_id === p.id && d.tanggal != null && d.median != null)
      .map((d) => ({ tanggal: d.tanggal, median: d.median }));
    const laju =
      titikHarian.length > 0 ? lajuBulanan(ringkasBulanan(isiMaju(titikHarian, titikHarian[0].tanggal, hariIni))) : null;

    return {
      id: p.id,
      slug: p.slug,
      model: p.model,
      varian: p.varian,
      tahun: p.rilis_at ? new Date(p.rilis_at).getFullYear() : null,
      bentuk: (p.bentuk as KartuSeri["bentuk"]) ?? null,
      jumlahToko: new Set(milik.map((o) => o.seller_id)).size,
      bekasBawah,
      bekasAtas,
      laju,
      fase: laju != null ? fase(laju) : null,
      turunDariRilis:
        bekasBawah != null && p.harga_rilis_id ? 1 - bekasBawah / p.harga_rilis_id : null,
    };
  });

  // Pembagi batang skala sama untuk semua kartu, yaitu harga tertinggi di
  // seluruh keluarga, supaya jarak antar generasi bisa dibandingkan langsung.
  const maks = Math.max(1, ...kartu.map((k) => k.bekasAtas ?? 0));
  return { kartu, maks };
}
