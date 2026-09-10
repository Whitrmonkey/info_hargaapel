import { createClient } from "@/lib/supabase/server";
import { kelompokkanPasaran, type Garansi, type Grade, type Kondisi } from "@/lib/pasaran";

export type KodeTangga = "rilis_id" | "rilis_global" | "bekas_resmi" | "bekas_inter";

// Kondisi fisik tidak jadi sumbu tangga lagi, tapi tidak hilang: ia turun
// jadi dimensi di dalam anak tangga bekas. Tiap entri di sini adalah satu
// grup pembanding utuh (produk + kondisi + grade + garansi), tidak pernah
// median yang dicampur lintas grade.
export interface DimensiKondisi {
  grade: Grade;
  median: number;
  jumlah_toko: number;
}

export interface AnakTangga {
  kode: KodeTangga;
  label: string;
  sub: string;
  harga: number | null;
  gaya?: "arsip" | "inter";
  kondisi: DimensiKondisi[];
}

export interface Jarak {
  atas: KodeTangga;
  bawah: KodeTangga;
  nama: string;
  ket: string;
}

// Arti tiap jarak adalah properti tetap pada pasangan anak tangga, bukan
// hasil pencarian pasangan string saat render. Dibaca berpasangan dari atas
// ke bawah, jadi selalu terdefinisi.
export const JARAK: Jarak[] = [
  {
    atas: "rilis_id",
    bawah: "rilis_global",
    nama: "Premi masuk Indonesia",
    ket: "Selisih antara harga daftar Apple di luar dan harga rilis kanal resmi di sini. Isinya bea masuk, PPN, PPh impor, dan margin distribusi. Ini biaya yang dibayar semua pembeli unit resmi, bahkan yang beli bekas bertahun-tahun kemudian.",
  },
  {
    atas: "rilis_global",
    bawah: "bekas_resmi",
    nama: "Penyusutan",
    ket: "Yang hilang karena waktu, bukan karena kondisi. Terjadi bertahap tapi tidak rata — penurunan paling tajam selalu jatuh di September, saat generasi baru masuk.",
  },
  {
    atas: "bekas_resmi",
    bawah: "bekas_inter",
    nama: "Nilai jalur garansi resmi",
    ket: "Barang, umur, dan kondisi bisa persis sama. Yang beda cuma jalur masuknya. Selisih ini adalah harga dari IMEI terdaftar dan riwayat servis resmi yang bisa ditelusuri.",
  },
];

export interface TanggaHarga {
  anak: AnakTangga[];
  jarak: Array<Jarak & { beda: number; atasHarga: number; bawahHarga: number }>;
}

const URUTAN_GRADE: Grade[] = ["mulus", "standar", "ekonomis"];

export async function bangunTanggaHarga(produk: {
  id: string;
  harga_rilis_id: number | null;
  harga_rilis_global: number | null;
  kurs_rilis: number | string | null;
  rilis_at: string | null;
}): Promise<TanggaHarga> {
  const supabase = await createClient();
  const { data: observasi } = await supabase
    .from("harga_terkini")
    .select("*")
    .eq("product_id", produk.id)
    .eq("sisi", "jual")
    .eq("kondisi", "second");

  const jual = (observasi ?? [])
    .filter(
      (o): o is typeof o & { id: number; seller_id: string; harga: number; observed_at: string } =>
        o.id != null && o.seller_id != null && o.harga != null && o.observed_at != null,
    )
    .map((o) => ({
      id: o.id,
      product_id: produk.id,
      seller_id: o.seller_id,
      sisi: "jual" as const,
      kondisi: "second" as Kondisi,
      grade: o.grade as Grade | null,
      garansi: o.garansi as Garansi,
      harga: o.harga,
      observed_at: o.observed_at,
      perlu_verifikasi: o.perlu_verifikasi ?? false,
    }));

  const grup = kelompokkanPasaran(jual);

  // Satu anak tangga bekas = semua grup dengan garansi itu, tiap grade tetap
  // grupnya sendiri. Angka kepala diambil dari grade standar kalau ada,
  // kalau tidak dari grup dengan toko terbanyak -- bukan rata-rata lintas grade.
  function jalurBekas(garansi: Garansi): { harga: number | null; kondisi: DimensiKondisi[]; jumlahToko: number } {
    const milik = grup.filter((g) => g.garansi === garansi && g.grade != null);
    const kondisi = milik
      .map((g) => ({ grade: g.grade as Grade, median: g.median, jumlah_toko: g.jumlah_toko }))
      .sort((a, b) => URUTAN_GRADE.indexOf(a.grade) - URUTAN_GRADE.indexOf(b.grade));
    const standar = kondisi.find((k) => k.grade === "standar");
    const terbanyak = [...kondisi].sort((a, b) => b.jumlah_toko - a.jumlah_toko)[0];
    const kepala = standar ?? terbanyak ?? null;
    const jumlahToko = new Set(milik.flatMap((g) => g.items.map((i) => i.seller_id))).size;
    return { harga: kepala?.median ?? null, kondisi, jumlahToko };
  }

  const resmi = jalurBekas("resmi");
  const inter = jalurBekas("inter");

  const kurs = produk.kurs_rilis == null ? null : Number(produk.kurs_rilis);
  const rilisGlobalIdr =
    produk.harga_rilis_global != null && kurs != null ? Math.round(produk.harga_rilis_global * kurs) : null;

  const tahunRilis = produk.rilis_at ? new Date(produk.rilis_at).getFullYear() : null;

  const anak: AnakTangga[] = [
    {
      kode: "rilis_id",
      label: "Harga rilis Indonesia",
      sub: tahunRilis ? `kanal resmi, ${tahunRilis}` : "kanal resmi saat diluncurkan",
      harga: produk.harga_rilis_id,
      gaya: "arsip",
      kondisi: [],
    },
    {
      kode: "rilis_global",
      label: "Harga rilis global",
      sub:
        produk.harga_rilis_global != null && kurs != null
          ? `US$${produk.harga_rilis_global.toLocaleString("id-ID")} × kurs ${Math.round(kurs).toLocaleString("id-ID")} saat rilis`
          : "harga Apple di luar, dikonversi kurs saat rilis",
      harga: rilisGlobalIdr,
      gaya: "arsip",
      kondisi: [],
    },
    {
      kode: "bekas_resmi",
      label: "Bekas, jalur resmi",
      sub: resmi.harga != null ? `${resmi.jumlahToko} toko terpantau` : "belum ada data",
      harga: resmi.harga,
      kondisi: resmi.kondisi,
    },
    {
      kode: "bekas_inter",
      label: "Bekas, jalur inter",
      sub: inter.harga != null ? `${inter.jumlahToko} toko terpantau` : "belum ada data",
      harga: inter.harga,
      gaya: "inter",
      kondisi: inter.kondisi,
    },
  ];

  // Anak tangga tanpa angka tidak dirender, dan jarak hanya punya arti kalau
  // KEDUA ujungnya ada. Tidak ada jarak yang dikarang dari pasangan lain.
  const adaHarga = new Map(anak.filter((a) => a.harga != null).map((a) => [a.kode, a.harga!]));
  const jarak = JARAK.filter((j) => adaHarga.has(j.atas) && adaHarga.has(j.bawah)).map((j) => ({
    ...j,
    atasHarga: adaHarga.get(j.atas)!,
    bawahHarga: adaHarga.get(j.bawah)!,
    beda: adaHarga.get(j.atas)! - adaHarga.get(j.bawah)!,
  }));

  return { anak: anak.filter((a) => a.harga != null), jarak };
}
