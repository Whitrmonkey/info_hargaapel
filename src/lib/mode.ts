// Tiga mode data, satu arah: maintenance -> testing -> production.
//
//   maintenance  hanya data peragaan. Untuk memperlihatkan bentuk situsnya
//                ke orang tanpa menunggu data nyata terkumpul.
//   testing      hanya data hasil scraper. Data nyata yang sudah masuk
//                sebelum situs dinyatakan produksi, tanpa pencatatan manual
//                dan tanpa peragaan.
//   production   seluruh data nyata: scraper dan pencatatan lapangan.
//
// Satu sifat yang tidak boleh hilang dari susunan ini: data peragaan HANYA
// terlihat di maintenance. Di testing dan production ia disaring keluar
// walaupun barisnya kebetulan ada di basis data. Angka buatan yang bisa
// bocor ke halaman produksi akan menghancurkan satu-satunya hal yang
// dijual situs ini, yaitu angkanya tidak dikarang.

export type ModeData = "maintenance" | "testing" | "production";

export const MODE_URUT: ModeData[] = ["maintenance", "testing", "production"];

// Penanda yang dipasang seluruh baris di supabase/demo/isi.sql.
export const PENANDA_DEMO = "demo";

export function bacaMode(nilai: string | undefined): ModeData {
  const v = (nilai ?? "").trim().toLowerCase();
  if (v === "maintenance" || v === "testing" || v === "production") return v;
  // Bawaan sengaja maintenance, bukan production. Salah ketik env tidak
  // boleh berakibat data mentah tertampil sebagai angka produksi.
  return "maintenance";
}

export function modeSekarang(): ModeData {
  return bacaMode(process.env.NEXT_PUBLIC_MODE_DATA);
}

export interface AturanMode {
  /** Baris peragaan ikut ditampilkan. */
  demo: boolean;
  /** Baris hasil pencatatan manual ikut ditampilkan. */
  manual: boolean;
  /** Baris hasil scraper ikut ditampilkan. */
  scraper: boolean;
  /** Pita penanda di atas halaman, null berarti tidak ada. */
  pita: string | null;
}

export const ATURAN: Record<ModeData, AturanMode> = {
  maintenance: {
    demo: true,
    manual: false,
    scraper: false,
    pita: "Mode peragaan. Seluruh angka di halaman ini buatan, bukan harga yang terpantau di pasar.",
  },
  testing: {
    demo: false,
    manual: false,
    scraper: true,
    pita: "Mode uji. Angkanya nyata dari sumber yang menerbitkan harganya sendiri, tapi belum lengkap dan belum ditinjau.",
  },
  production: { demo: false, manual: true, scraper: true, pita: null },
};

export interface BarisObservasi {
  sumber?: string | null;
  catatan?: string | null;
}

// Satu-satunya tempat yang memutuskan sebuah baris observasi boleh tampil.
// Dipakai seluruh lapisan data supaya tidak ada halaman yang punya aturan
// sendiri.
export function bolehTampil(baris: BarisObservasi, mode: ModeData = modeSekarang()): boolean {
  const aturan = ATURAN[mode];
  const demo = baris.catatan === PENANDA_DEMO;
  if (demo) return aturan.demo;
  if (baris.sumber === "scraper") return aturan.scraper;
  return aturan.manual;
}

export function saringObservasi<T extends BarisObservasi>(baris: readonly T[], mode: ModeData = modeSekarang()): T[] {
  return baris.filter((b) => bolehTampil(b, mode));
}
