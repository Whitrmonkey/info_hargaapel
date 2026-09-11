// Aturan tunggal: bantah datanya, jangan orangnya, dan jangan tokonya.
//
// Penyaringnya MENAHAN, tidak memblokir. Bedanya penting: memblokir berarti
// menyuruh orang diam, menahan berarti memberi tahu apa yang bermasalah dan
// memberi kesempatan menyusun ulang. Yang pertama membuat orang pergi, yang
// kedua membuat tulisannya lebih baik.

export interface KataTahan {
  kata: string;
}

export interface HasilSaringTeks {
  tahan: boolean;
  kataKetemu: string[];
}

// Dicocokkan per kata utuh, bukan potongan, supaya "sekitar" tidak ikut
// tertahan gara-gara mengandung "kita" dan sejenisnya. Tanda baca dan huruf
// besar diabaikan.
export function saringTeks(isi: string, daftar: readonly KataTahan[]): HasilSaringTeks {
  const kata = isi
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
  const set = new Set(kata);
  const ketemu = daftar.map((k) => k.kata.toLowerCase()).filter((k) => set.has(k));
  return { tahan: ketemu.length > 0, kataKetemu: [...new Set(ketemu)] };
}

export const PESAN_TAHAN =
  "Kiriman ini ditahan dulu untuk ditinjau karena memuat tuduhan langsung. Aturannya satu: bantah datanya, jangan orangnya dan jangan tokonya. Sebutkan angkanya dan apa yang tidak cocok, lalu kirim ulang — tulisan yang menunjuk data jauh lebih sulit dibantah daripada tulisan yang menunjuk orang.";

export const ALASAN_LAPOR: Array<{ kode: string; label: string }> = [
  { kode: "tuduhan", label: "Menuduh orang atau toko" },
  { kode: "spam", label: "Spam" },
  { kode: "iklan", label: "Iklan terselubung" },
  { kode: "tidak_relevan", label: "Tidak relevan" },
  { kode: "pribadi", label: "Menyerang pribadi" },
];

const ALASAN_SAH = new Set(ALASAN_LAPOR.map((a) => a.kode));
export function alasanLaporSah(alasan: string): boolean {
  return ALASAN_SAH.has(alasan);
}

export const PANJANG_MIN = 3;
export const PANJANG_MAKS = 4000;

export function periksaIsi(isi: string): { boleh: boolean; pesan?: string } {
  const bersih = isi.trim();
  if (bersih.length < PANJANG_MIN) return { boleh: false, pesan: "Kirimannya terlalu pendek." };
  if (bersih.length > PANJANG_MAKS) return { boleh: false, pesan: "Kirimannya terlalu panjang." };
  return { boleh: true };
}
