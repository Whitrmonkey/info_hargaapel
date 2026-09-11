// Blok yang belum cukup isi mengembalikan null, bukan dirender kosong.
//
// Alasannya bukan kerapian. Kotak "tulis komentar" yang menganggur di
// halaman tanpa diskusi memberi tahu pembaca bahwa tidak ada siapa-siapa di
// sini, dan itu justru membuat tidak ada siapa-siapa yang datang. Ruang
// kosong tidak dipamerkan; tombol menulis tetap ada di bawah.

export const AMBANG = {
  sentimen: 3, // tiga suara sudah berarti sesuatu
  laporan: 1,
  diskusi: 1,
} as const;

export function tampilkanSentimen(jumlahSuara: number): boolean {
  return jumlahSuara >= AMBANG.sentimen;
}
export function tampilkanLaporan(jumlahLaporan: number): boolean {
  return jumlahLaporan >= AMBANG.laporan;
}
export function tampilkanDiskusi(jumlahKiriman: number): boolean {
  return jumlahKiriman >= AMBANG.diskusi;
}

export type SuaraSentimen = "worth" | "mahal" | "tunggu";

export const LABEL_SENTIMEN: Record<SuaraSentimen, string> = {
  worth: "Sepadan di harga ini",
  mahal: "Masih kemahalan",
  tunggu: "Tunggu dulu",
};

export interface RingkasSentimen {
  total: number;
  per: Record<SuaraSentimen, number>;
  terbanyak: SuaraSentimen;
}

export function ringkasSentimen(hitungan: Partial<Record<SuaraSentimen, number>>): RingkasSentimen | null {
  const per: Record<SuaraSentimen, number> = {
    worth: hitungan.worth ?? 0,
    mahal: hitungan.mahal ?? 0,
    tunggu: hitungan.tunggu ?? 0,
  };
  const total = per.worth + per.mahal + per.tunggu;
  if (!tampilkanSentimen(total)) return null;

  const terbanyak = (Object.keys(per) as SuaraSentimen[]).reduce((a, b) => (per[b] > per[a] ? b : a));
  return { total, per, terbanyak };
}
