// Pertahanan utama sistem ada di berkas ini. Dua aturan yang tidak boleh
// dilanggar mekanisme apa pun:
//
// 1. Verifikasi TIDAK PERNAH datang dari suara. Ia datang dari observasi
//    independen yang masuk SESUDAH laporan dibuat. Suara hanya mempercepat
//    atau menahan antrean.
// 2. Bobot dihitung PER KATEGORI PRODUK, bukan global. Reputasi di iPhone
//    tidak otomatis berlaku di Mac.

export type StatusLaporan = "baru" | "menunggu" | "terverifikasi" | "meleset" | "kedaluwarsa" | "ditahan";

export const TOLERANSI_COCOK = 0.05; // dalam 5 persen -> terverifikasi
export const AMBANG_MELESET = 0.15; // meleset lebih dari 15 persen -> meleset
export const HARI_KEDALUWARSA = 30;

export interface Pembanding {
  harga: number;
  observed_at: string;
  observasi_id: number;
}

export interface HasilNilai {
  status: Extract<StatusLaporan, "menunggu" | "terverifikasi" | "meleset" | "kedaluwarsa">;
  observasi_id?: number;
}

// Sebuah laporan dinilai HANYA dengan observasi yang masuk sesudahnya.
// Observasi yang sudah ada sebelum laporan dibuat tidak bisa dipakai: itu
// justru angka yang bisa dicontek pelapor.
export function nilaiLaporan(
  laporan: { harga_jadi: number; dibuat_at: string },
  pembanding: readonly Pembanding[],
  sekarang: Date = new Date(),
): HasilNilai {
  const dibuat = new Date(laporan.dibuat_at).getTime();
  const sesudah = pembanding
    .filter((p) => new Date(p.observed_at).getTime() > dibuat)
    .sort((a, b) => new Date(a.observed_at).getTime() - new Date(b.observed_at).getTime());

  for (const p of sesudah) {
    const selisih = Math.abs(p.harga - laporan.harga_jadi) / laporan.harga_jadi;
    if (selisih <= TOLERANSI_COCOK) return { status: "terverifikasi", observasi_id: p.observasi_id };
    if (selisih > AMBANG_MELESET) return { status: "meleset", observasi_id: p.observasi_id };
  }

  // Lewat 30 hari tanpa pembanding: kedaluwarsa. Ini BUKAN kegagalan --
  // tidak ada yang bisa dinilai, dan bobot pelapor tidak diturunkan.
  const umurHari = (sekarang.getTime() - dibuat) / 86_400_000;
  if (umurHari > HARI_KEDALUWARSA) return { status: "kedaluwarsa" };
  return { status: "menunggu" };
}

export interface Reputasi {
  bobot: number;
  terverifikasi: number;
  meleset: number;
}

export const BOBOT_MAKS = 3;

// Bobot dari rekam jejak, dan rekam jejak tidak bisa dipercepat. Batas atas
// 3 supaya tidak ada satu orang yang bisa menyetir angka.
export function hitungBobot(terverifikasi: number, meleset: number, melesetBeruntun: number): number {
  // Dua meleset berturut-turut mengembalikan ke 0, berapa pun rekam jejaknya.
  if (melesetBeruntun >= 2) return 0;

  let bobot = 0;
  if (terverifikasi >= 3) bobot = 1;
  if (terverifikasi >= 10 && meleset === 0) bobot = 2;
  if (terverifikasi >= 30) bobot = 3;

  // Satu meleset menurunkan satu tingkat.
  if (melesetBeruntun === 1) bobot = Math.max(0, bobot - 1);
  return Math.min(BOBOT_MAKS, bobot);
}

// Urutan status terbaru lebih dulu; menghitung berapa meleset beruntun di
// ujung terbaru. Kedaluwarsa tidak memutus dan tidak menambah -- ia bukan
// penilaian sama sekali.
export function melesetBeruntun(statusTerbaruDulu: readonly StatusLaporan[]): number {
  let n = 0;
  for (const s of statusTerbaruDulu) {
    if (s === "meleset") n++;
    else if (s === "terverifikasi") break;
    // 'kedaluwarsa', 'menunggu', 'baru', 'ditahan' dilewati tanpa efek
  }
  return n;
}

// Ambang suara: tiga penilaian masuk akal dari akun berbobot minimal 1, dan
// nol meragukan. Ini HANYA mempercepat antrean -- laporan tetap tidak masuk
// hitungan sebelum lapis verifikasi meloloskannya.
export const MIN_MASUK_AKAL = 3;

export function layakDipercepat(masukAkalDariBerbobot: number, meragukan: number): boolean {
  return masukAkalDariBerbobot >= MIN_MASUK_AKAL && meragukan === 0;
}

// Satu-satunya pintu masuk laporan ke hitungan. Sengaja tidak menerima
// parameter suara sama sekali, supaya tidak ada cara menuliskannya.
export function bolehMasukHitungan(status: StatusLaporan, bobotSaatLapor: number): boolean {
  return status === "terverifikasi" && bobotSaatLapor >= 1;
}
