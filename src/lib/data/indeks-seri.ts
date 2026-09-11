import { createClient } from "@/lib/supabase/server";
import { ATURAN, modeSekarang, saringObservasi } from "@/lib/mode";
import { kelompokkanPasaran, type Garansi, type Grade, type Kondisi } from "@/lib/pasaran";
import { isiMaju, lajuBulanan, ringkasBulanan, type TitikHarian } from "@/lib/seri";
import { fase, type Fase } from "@/lib/keluarga";

export interface KartuSeri {
  id: string;
  slug: string; // slug varian utama, jadi kartunya bisa ditaut ke halaman produk
  model: string;
  kapasitas: string[];
  tahun: number | null;
  bentuk: { keluarga?: string; siluet?: { muka?: string; kamera?: number; bahan?: string; layar_inci?: number } } | null;
  jumlahToko: number;
  // Rentang harga bekas jalur resmi, ujung bawah dan atas dari grup-grup
  // grade lintas kapasitas -- bukan satu median yang dicampur.
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
      .eq("demo", ATURAN[modeSekarang()].demo)
      .in("product_id", ids)
      .eq("sisi", "jual")
      .eq("kondisi", "second")
      .eq("grade", "standar")
      .eq("garansi", "resmi")
      .order("tanggal"),
  ]);

  const hariIni = new Date().toISOString().slice(0, 10);

  // Satu kartu per GENERASI, bukan per kapasitas. Satu model dengan empat
  // kapasitas adalah satu baris di mata pembaca, bukan empat.
  const perModel = new Map<string, NonNullable<typeof produk>>();
  for (const p of produk ?? []) {
    const arr = perModel.get(p.model) ?? [];
    arr.push(p);
    perModel.set(p.model, arr);
  }

  const kartu: KartuSeri[] = [...perModel.entries()].map(([model, varian]) => {
    const idModel = new Set(varian.map((v) => v.id));

    const milik = saringObservasi(observasi ?? [])
      .filter(
        (o): o is typeof o & { id: number; product_id: string; seller_id: string; harga: number; observed_at: string } =>
          o.product_id != null &&
          idModel.has(o.product_id) &&
          o.id != null &&
          o.seller_id != null &&
          o.harga != null &&
          o.observed_at != null,
      )
      .map((o) => ({
        id: o.id,
        product_id: o.product_id,
        seller_id: o.seller_id,
        sisi: "jual" as const,
        kondisi: "second" as Kondisi,
        grade: o.grade as Grade | null,
        garansi: "resmi" as Garansi,
        harga: o.harga,
        observed_at: o.observed_at,
        perlu_verifikasi: o.perlu_verifikasi ?? false,
      }));

    // Dikelompokkan per produk DAN grade, jadi tidak ada median yang
    // dihitung lintas kapasitas atau lintas grade. Rentangnya diambil dari
    // ujung-ujung median grup, bukan dari harga satuan.
    const grup = kelompokkanPasaran(milik).filter((g) => g.grade != null);
    const median = grup.map((g) => g.median);
    const bekasBawah = median.length > 0 ? Math.min(...median) : null;
    const bekasAtas = median.length > 0 ? Math.max(...median) : null;

    // Laju dihitung dari SATU varian saja -- yang paling banyak datanya --
    // supaya yang dibandingkan antar bulan benar-benar barang yang sama.
    const hitungPerVarian = new Map<string, number>();
    for (const d of harian ?? []) {
      if (d.product_id == null || !idModel.has(d.product_id)) continue;
      hitungPerVarian.set(d.product_id, (hitungPerVarian.get(d.product_id) ?? 0) + 1);
    }
    const varianUtama = [...hitungPerVarian.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
    const titikHarian: TitikHarian[] = (harian ?? [])
      .filter((d): d is { product_id: string; tanggal: string; median: number } =>
        d.product_id === varianUtama && d.tanggal != null && d.median != null,
      )
      .map((d) => ({ tanggal: d.tanggal, median: d.median }));
    const laju =
      titikHarian.length > 0 ? lajuBulanan(ringkasBulanan(isiMaju(titikHarian, titikHarian[0].tanggal, hariIni))) : null;

    // Kartunya menaut ke kapasitas yang datanya paling banyak, karena itu
    // halaman yang paling berguna dibuka.
    const utama = varian.find((v) => v.id === varianUtama) ?? varian[0];
    const rilisTermuda = varian.map((v) => v.rilis_at).filter((r): r is string => r != null).sort()[0] ?? null;
    const hargaRilis = utama.harga_rilis_id;

    return {
      id: utama.id,
      slug: utama.slug,
      model,
      kapasitas: varian.map((v) => v.varian),
      tahun: rilisTermuda ? new Date(rilisTermuda).getFullYear() : null,
      bentuk: (utama.bentuk as KartuSeri["bentuk"]) ?? null,
      jumlahToko: new Set(milik.map((o) => o.seller_id)).size,
      bekasBawah,
      bekasAtas,
      laju,
      fase: laju != null ? fase(laju) : null,
      turunDariRilis: bekasBawah != null && hargaRilis ? 1 - bekasBawah / hargaRilis : null,
    };
  });

  // Pembagi batang skala sama untuk semua kartu, yaitu harga tertinggi di
  // seluruh keluarga, supaya jarak antar generasi bisa dibandingkan langsung.
  const maks = Math.max(1, ...kartu.map((k) => k.bekasAtas ?? 0));
  return { kartu, maks };
}
