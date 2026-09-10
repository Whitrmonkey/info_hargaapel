import { createClient } from "@/lib/supabase/server";
import { kelompokkanPasaran, type Garansi, type Grade, type Kondisi } from "@/lib/pasaran";

export interface AnakTangga {
  kode: string;
  label: string;
  sub: string;
  harga: number | null;
  gaya?: "arsip" | "inter" | "lantai";
  naik_dari: string;
}

// Kalimat generik per anak tangga -- menjelaskan apa yang dibeli saat naik
// satu tingkat dari baris di bawahnya. Properti tetap per posisi tangga,
// bukan hasil pencarian pasangan harga (harga-apel-produk.jsx).
const NAIK_DARI: Record<string, string> = {
  rilis: "Ini jangkar sejarah, bukan harga yang bisa dibeli hari ini.",
  baru_resmi: "Baru dengan garansi resmi Apple Indonesia, bisa diklaim ke service center resmi.",
  baru_inter:
    "Belum pernah dipakai, tapi garansinya toko dan bukan resmi. Yang kamu bayar di sini adalah segel, bukan jaminan purna jual.",
  mulus: "Selisih ini murni kondisi fisik. Fungsinya sama persis dengan standar.",
  standar:
    "Ekonomis biasanya sudah ganti layar aftermarket atau baterainya di bawah 80%. Hitung biaya itu dulu sebelum memilih yang lebih murah.",
  ekonomis:
    "Toko memberi garansi dan sudah mengecek unitnya. Perorangan tidak. Selisih ini adalah harga rasa aman.",
  perorangan:
    "Di atas lantai pasar. Penjual perorangan menahan harga sedikit di atas tawaran buyback karena selisih itulah untungnya menjual sendiri.",
  buyback: "Lantai pasar. Tidak ada yang menjual di bawah angka ini, karena dia tinggal menjual ke platform buyback.",
};

export async function bangunTanggaHarga(produk: {
  id: string;
  harga_rilis: number | null;
}): Promise<AnakTangga[]> {
  const supabase = await createClient();
  const [{ data: observasi }, { data: sellers }] = await Promise.all([
    supabase.from("harga_terkini").select("*").eq("product_id", produk.id),
    supabase.from("sellers").select("id, tipe"),
  ]);
  const tipeById = new Map((sellers ?? []).map((s) => [s.id, s.tipe]));

  const jual = (observasi ?? [])
    .filter(
      (o): o is typeof o & { id: number; seller_id: string; harga: number; observed_at: string } =>
        o.id != null && o.seller_id != null && o.harga != null && o.observed_at != null && o.sisi === "jual",
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

  const beli = (observasi ?? []).filter(
    (o) => o.sisi === "beli" && o.harga != null,
  ) as Array<{ harga: number }>;

  const grup = kelompokkanPasaran(jual);

  function grupTerbesar(kondisi: Kondisi, grade: Grade | null, garansi?: Garansi) {
    const kandidat = grup.filter(
      (g) => g.kondisi === kondisi && g.grade === grade && (garansi == null || g.garansi === garansi),
    );
    return [...kandidat].sort((a, b) => b.jumlah_toko - a.jumlah_toko)[0] ?? null;
  }

  const baruResmi = grupTerbesar("baru", null, "resmi");
  const baruInter = grupTerbesar("baru", null, "inter");
  const mulus = grupTerbesar("second", "mulus");
  const standar = grupTerbesar("second", "standar");
  const ekonomis = grupTerbesar("second", "ekonomis");

  const perorangan = jual.filter((o) => o.kondisi === "second" && tipeById.get(o.seller_id) === "perorangan");
  const hargaPerorangan =
    perorangan.length > 0 ? Math.round(perorangan.reduce((s, o) => s + o.harga, 0) / perorangan.length) : null;

  const bidTertinggi = beli.length > 0 ? Math.max(...beli.map((o) => o.harga)) : null;

  const anak = (kode: string, label: string, sub: string, harga: number | null, gaya?: AnakTangga["gaya"]): AnakTangga => ({
    kode,
    label,
    sub,
    harga,
    gaya,
    naik_dari: NAIK_DARI[kode],
  });

  return [
    anak("rilis", "Harga rilis resmi", "sejak diluncurkan", produk.harga_rilis, "arsip"),
    anak("baru_resmi", "Baru, garansi resmi", baruResmi ? `${baruResmi.jumlah_toko} toko` : "sudah tidak diproduksi", baruResmi?.median ?? null),
    anak("baru_inter", "Baru, unit inter", baruInter ? `${baruInter.jumlah_toko} toko` : "tidak tersedia", baruInter?.median ?? null, "inter"),
    anak("mulus", "Second, mulus", mulus ? `${mulus.jumlah_toko} toko` : "belum ada data", mulus?.median ?? null),
    anak("standar", "Second, standar", standar ? `${standar.jumlah_toko} toko` : "belum ada data", standar?.median ?? null),
    anak("ekonomis", "Second, ekonomis", ekonomis ? `${ekonomis.jumlah_toko} toko` : "belum ada data", ekonomis?.median ?? null),
    anak("perorangan", "Perorangan", perorangan.length > 0 ? `rata-rata ${perorangan.length} penawaran` : "belum ada data", hargaPerorangan),
    anak("buyback", "Ditawar platform buyback", bidTertinggi != null ? "harga beli tertinggi" : "belum ada data", bidTertinggi, "lantai"),
  ];
}
