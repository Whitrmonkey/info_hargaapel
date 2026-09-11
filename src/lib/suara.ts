// Dua sumbu berbeda untuk dua jenis isi. Jangan pernah disamakan.
//
// Laporan harga -> masuk_akal / meragukan. Sumbunya KREDIBILITAS, karena
// suka dan tidak suka tidak berarti apa-apa di sini: orang menyukai harga
// murah karena ingin harga itu ada, bukan karena mempercayainya.
//
// Diskusi -> naik / turun dengan skor bersih. Di sini suka dan tidak suka
// memang tepat, karena yang dinilai kualitas pendapat.

export type NilaiLaporan = "masuk_akal" | "meragukan";

export type AlasanRagu =
  | "harga_tidak_masuk_akal"
  | "grade_tidak_cocok"
  | "bukan_pembeli"
  | "duplikat"
  | "kelengkapan_tidak_jelas";

// Daftar tertutup. Sama persis dengan check constraint di 040_komunitas.sql
// -- kalau salah satunya berubah, yang lain wajib ikut.
export const ALASAN_RAGU: Array<{ kode: AlasanRagu; label: string }> = [
  { kode: "harga_tidak_masuk_akal", label: "Harga tidak masuk akal untuk kombinasi ini" },
  { kode: "grade_tidak_cocok", label: "Grade atau jalur sepertinya tidak cocok" },
  { kode: "bukan_pembeli", label: "Sepertinya bukan pembeli" },
  { kode: "duplikat", label: "Duplikat laporan lain" },
  { kode: "kelengkapan_tidak_jelas", label: "Kelengkapan tidak disebutkan" },
];

const ALASAN_SAH = new Set<string>(ALASAN_RAGU.map((a) => a.kode));

export function alasanSah(alasan: string | null): alasan is AlasanRagu {
  return alasan != null && ALASAN_SAH.has(alasan);
}

export interface HasilPenilaian {
  boleh: boolean;
  pesan?: string;
}

// Penjaga di sisi aplikasi. Basis data punya penjaganya sendiri; keduanya
// sengaja ada supaya tidak ada satu pun jalur tulis yang lolos.
export function periksaPenilaian(nilai: NilaiLaporan, alasan: string | null): HasilPenilaian {
  if (nilai === "meragukan" && !alasanSah(alasan)) {
    return { boleh: false, pesan: "Pilih dulu alasannya. Kecurigaan tanpa alasan tidak bisa dihitung jadi apa pun." };
  }
  if (nilai === "masuk_akal" && alasan != null) {
    return { boleh: false, pesan: "Penilaian masuk akal tidak perlu alasan." };
  }
  return { boleh: true };
}

// Skor sangat rendah membuat kiriman DILIPAT, tidak dihapus. Jejaknya tetap
// ada -- tidak ada yang dihilangkan diam-diam.
export const AMBANG_LIPAT = -5;

export type StatusDiskusi = "tampil" | "dilipat" | "ditahan";

export function statusDariSkor(skor: number, statusSekarang: StatusDiskusi): StatusDiskusi {
  // Kiriman yang ditahan moderasi tidak pernah dibatalkan penahanannya oleh
  // suara. Suara tidak berwenang di sumbu itu.
  if (statusSekarang === "ditahan") return "ditahan";
  return skor <= AMBANG_LIPAT ? "dilipat" : "tampil";
}

// Urutan diskusi dari skor bersih, terbaru jadi pemutus kalau seri.
export function urutkanDiskusi<T extends { skor: number; dibuat_at: string }>(kiriman: readonly T[]): T[] {
  return [...kiriman].sort((a, b) => b.skor - a.skor || new Date(b.dibuat_at).getTime() - new Date(a.dibuat_at).getTime());
}
