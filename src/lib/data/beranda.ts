import { createClient } from "@/lib/supabase/server";
import { KELUARGA } from "@/lib/keluarga";
import { MIN_TOKO_VONIS } from "@/lib/cek";

export interface Gerakan {
  slug: string;
  model: string;
  varian: string;
  harga: number;
  ubah: number; // pecahan, -0.061 = turun 6,1%
  toko: number;
}

export interface KeluargaRingkas {
  kode: string;
  nama: string;
  kategori: string;
  seri: number;
  dari: number | null;
}

export interface LaporanTerbaru {
  id: number;
  slug: string;
  model: string;
  varian: string;
  harga: number;
  area: string;
  garansi: string;
  grade: string | null;
  dibuatAt: string;
  masukAkal: number;
}

export interface DataBeranda {
  gerakan: Gerakan[];
  keluarga: KeluargaRingkas[];
  laporan: LaporanTerbaru[];
  pintasan: string[];
}

const HARI_BANDING = 7;
const MIN_GERAKAN = 3;
const MIN_UMUR_BANDING = 3; // hari; titik banding yang terlalu muda tidak dipakai

// Gerakan minggu ini: median grade standar jalur resmi hari ini dibanding
// tujuh hari lalu, hanya untuk model yang cukup terpantau. Dikunci ke satu
// grup pembanding supaya yang dibandingkan memang barang yang sama.
export async function ambilDataBeranda(): Promise<DataBeranda> {
  const supabase = await createClient();
  const batas = new Date(Date.now() - HARI_BANDING * 86_400_000).toISOString().slice(0, 10);

  const [{ data: produk }, { data: harian }, { data: terkini }, { data: laporan }] = await Promise.all([
    supabase.from("products").select("id, slug, model, varian, kategori").eq("aktif", true),
    supabase
      .from("pasaran_harian")
      .select("product_id, tanggal, median, jumlah_toko")
      .eq("sisi", "jual")
      .eq("kondisi", "second")
      .eq("grade", "standar")
      .eq("garansi", "resmi")
      .gte("tanggal", batas)
      .order("tanggal"),
    supabase
      .from("harga_terkini")
      .select("product_id, harga, seller_id")
      .eq("sisi", "jual")
      .eq("kondisi", "second")
      .eq("grade", "standar")
      .eq("garansi", "resmi"),
    supabase
      .from("laporan_harga")
      .select("id, product_id, harga_jadi, area, garansi, grade, dibuat_at")
      .neq("status", "ditahan")
      .order("dibuat_at", { ascending: false })
      .limit(6),
  ]);

  const produkById = new Map((produk ?? []).map((p) => [p.id, p]));

  // Jumlah toko dihitung dari observasi terkini, bukan dari baris harian,
  // karena gerbangnya soal berapa toko yang sedang terpantau sekarang.
  const tokoPer = new Map<string, Set<string>>();
  const hargaPer = new Map<string, number[]>();
  for (const o of terkini ?? []) {
    if (o.product_id == null || o.harga == null || o.seller_id == null) continue;
    (tokoPer.get(o.product_id) ?? tokoPer.set(o.product_id, new Set()).get(o.product_id)!).add(o.seller_id);
    (hargaPer.get(o.product_id) ?? hargaPer.set(o.product_id, []).get(o.product_id)!).push(o.harga);
  }

  // Titik awal harus benar-benar tua. Kalau baris terlama di jendela ini
  // ternyata dari pagi tadi, selisihnya bukan "dibanding tujuh hari lalu" --
  // menyebutnya begitu adalah bohong halus, jadi modelnya dilewati saja.
  const awal = new Map<string, { nilai: number; tanggal: string }>();
  const akhir = new Map<string, number>();
  for (const d of harian ?? []) {
    if (d.product_id == null || d.median == null || d.tanggal == null) continue;
    if (!awal.has(d.product_id)) awal.set(d.product_id, { nilai: d.median, tanggal: d.tanggal });
    akhir.set(d.product_id, d.median);
  }

  const gerakan: Gerakan[] = [];
  for (const [productId, toko] of tokoPer) {
    const p = produkById.get(productId);
    const a = awal.get(productId);
    const b = akhir.get(productId);
    if (!p || a == null || b == null || a.nilai <= 0 || toko.size < MIN_TOKO_VONIS) continue;
    const umurAwalHari = (Date.now() - new Date(a.tanggal).getTime()) / 86_400_000;
    if (umurAwalHari < MIN_UMUR_BANDING) continue;
    const ubah = (b - a.nilai) / a.nilai;
    // Model yang tidak bergerak sama sekali bukan berita; menampilkannya
    // sebagai "bergerak minggu ini" akan bohong halus.
    if (Math.abs(ubah) < 0.005) continue;
    gerakan.push({ slug: p.slug, model: p.model, varian: p.varian, harga: b, ubah, toko: toko.size });
  }
  gerakan.sort((x, y) => Math.abs(y.ubah) - Math.abs(x.ubah));

  const keluarga: KeluargaRingkas[] = Object.entries(KELUARGA)
    .map(([kode, k]) => {
      const milik = (produk ?? []).filter((p) => p.kategori === k.kategori);
      const harga = milik.flatMap((p) => hargaPer.get(p.id) ?? []);
      return {
        kode,
        nama: k.judul,
        kategori: k.kategori,
        seri: new Set(milik.map((p) => p.model)).size,
        dari: harga.length > 0 ? Math.min(...harga) : null,
      };
    })
    .filter((k) => k.seri > 0);

  const laporanTerbaru: LaporanTerbaru[] = (laporan ?? [])
    .filter((l) => produkById.has(l.product_id))
    .map((l) => {
      const p = produkById.get(l.product_id)!;
      return {
        id: l.id,
        slug: p.slug,
        model: p.model,
        varian: p.varian,
        harga: l.harga_jadi,
        area: l.area,
        garansi: l.garansi,
        grade: l.grade,
        dibuatAt: l.dibuat_at,
        masukAkal: 0,
      };
    });

  if (laporanTerbaru.length > 0) {
    const { data: nilai } = await supabase
      .from("penilaian_agregat")
      .select("laporan_id, masuk_akal")
      .in("laporan_id", laporanTerbaru.map((l) => l.id));
    const per = new Map((nilai ?? []).map((n) => [n.laporan_id, n.masuk_akal ?? 0]));
    for (const l of laporanTerbaru) l.masukAkal = per.get(l.id) ?? 0;
  }

  // Pintasan "sering dicek" diambil dari model yang paling banyak terpantau,
  // sampai catatan pengecekan nyata terkumpul. Bukan ditulis tangan.
  const pintasan = [...tokoPer.entries()]
    .sort((a, b) => b[1].size - a[1].size)
    .slice(0, 4)
    .map(([id]) => produkById.get(id))
    .filter((p): p is NonNullable<typeof p> => p != null)
    .map((p) => `${p.model} ${p.varian}`);

  return {
    gerakan: gerakan.length >= MIN_GERAKAN ? gerakan.slice(0, 5) : [],
    keluarga,
    laporan: laporanTerbaru.length >= 2 ? laporanTerbaru.slice(0, 3) : [],
    pintasan,
  };
}
