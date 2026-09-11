import { persentil } from "@/lib/servis";

// Gerbang vonis untuk harga device di /cek-harga. Lebih ketat dari gerbang
// pengelompokan biasa (2 toko) karena di sini angkanya dipakai untuk memberi
// VONIS ke satu penawaran, bukan sekadar ditampilkan sebagai pasaran.
export const MIN_TOKO_VONIS = 5;

export interface SebaranDevice {
  p10: number;
  p25: number;
  p50: number;
  p75: number;
  p90: number;
  jumlah_toko: number;
}

export function sebaranDevice(harga: readonly number[], jumlahToko: number): SebaranDevice | null {
  if (jumlahToko < MIN_TOKO_VONIS || harga.length === 0) return null;
  const urut = [...harga].sort((a, b) => a - b);
  return {
    p10: persentil(urut, 0.1),
    p25: persentil(urut, 0.25),
    p50: persentil(urut, 0.5),
    p75: persentil(urut, 0.75),
    p90: persentil(urut, 0.9),
    jumlah_toko: jumlahToko,
  };
}

export type KodeVonisCek = "jauh_bawah" | "bawah" | "umum" | "atas" | "jauh_atas";
export type SisiVonis = "bawah" | "umum" | "atas";

export interface VonisCek {
  kode: KodeVonisCek;
  sisi: SisiVonis;
  judul: string;
  teks: string;
}

// Kalimatnya selalu ditujukan ke PEMBELI tentang apa yang perlu ditanyakan,
// bukan ke penjual tentang harga yang seharusnya dipasang (SERVIS.md aturan
// bahasa). Semuanya bicara tentang keadaan sekarang, tidak pernah tentang
// ke mana harga akan bergerak.
const VONIS: Record<KodeVonisCek, VonisCek> = {
  jauh_bawah: {
    kode: "jauh_bawah",
    sisi: "bawah",
    judul: "Jauh di bawah kebanyakan",
    teks: "Harga sejauh ini di bawah rentang umum biasanya berarti kelas barangnya berbeda dari yang kamu kira, atau ada bagian yang belum disebutkan. Minta lihat unitnya, cek kesehatan baterai, dan pastikan garansinya tertulis.",
  },
  bawah: {
    kode: "bawah",
    sisi: "bawah",
    judul: "Di bawah kebanyakan",
    teks: "Masih masuk akal. Pastikan grade dan jalur garansinya sama dengan yang kamu kira.",
  },
  umum: {
    kode: "umum",
    sisi: "umum",
    judul: "Di rentang yang umum",
    teks: "Sesuai dengan yang dipasang kebanyakan toko untuk kombinasi ini.",
  },
  atas: {
    kode: "atas",
    sisi: "atas",
    judul: "Di atas kebanyakan",
    teks: "Tanyakan apa yang membuatnya berbeda sebelum setuju. Kelengkapan, garansi, atau kondisi baterai biasanya jawabannya.",
  },
  jauh_atas: {
    kode: "jauh_atas",
    sisi: "atas",
    judul: "Jauh di atas kebanyakan",
    teks: "Di atas hampir semua toko terpantau. Sebelum setuju, tanyakan apa yang berbeda, berapa lama garansinya dan tertulis atau tidak, dan apa yang terjadi kalau bermasalah minggu pertama.",
  },
};

export function nilaiVonis(harga: number, s: SebaranDevice): VonisCek {
  if (harga < s.p10) return VONIS.jauh_bawah;
  if (harga < s.p25) return VONIS.bawah;
  if (harga <= s.p75) return VONIS.umum;
  if (harga <= s.p90) return VONIS.atas;
  return VONIS.jauh_atas;
}

export const LANGKAH_PITA = 50_000;

// Rentang pita: cukup lebar supaya zona jauh-di-bawah dan jauh-di-atas
// benar-benar bisa dicapai dengan menggeser, tidak mentok di ujung.
export function rentangPita(s: SebaranDevice): { min: number; max: number } {
  const bulat = (n: number) => Math.round(n / LANGKAH_PITA) * LANGKAH_PITA;
  return { min: Math.max(LANGKAH_PITA, bulat(s.p10 * 0.72)), max: bulat(s.p90 * 1.34) };
}

export interface OpsiProduk {
  id: string;
  kategori: string;
  model: string;
  varian: string;
  slug: string;
}

// Kunci grup pembanding tidak berubah: produk + kondisi + grade + garansi.
// Ada di modul murni supaya klien boleh memakainya tanpa ikut menyeret
// klien Supabase sisi server.
export function kunciSebaran(productId: string, kondisi: string, grade: string | null, garansi: string): string {
  return `${productId}|${kondisi}|${grade ?? ""}|${garansi}`;
}
