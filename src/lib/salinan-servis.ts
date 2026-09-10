import type { VonisServis } from "@/lib/servis";

// Disalin persis dari hargaapel-SERVIS.md bagian "Vonis harga servis".
// Jangan diubah jadi penilaian tentang bengkelnya -- lihat aturan bahasa
// SERVIS.md bagian 4.
export const JUDUL_VONIS_SERVIS: Record<VonisServis, string> = {
  jauh_atas: "Jauh di atas kebanyakan",
  atas: "Di atas kebanyakan",
  umum: "Di rentang yang umum",
  bawah: "Di bawah kebanyakan",
  jauh_bawah: "Jauh di bawah kebanyakan",
};

export const SALINAN_VONIS_SERVIS: Record<VonisServis, string> = {
  jauh_atas:
    "Di atas hampir semua bengkel yang terpantau untuk kelas part yang sama. Sebelum setuju, tanyakan apa yang membuatnya berbeda — jenis part-nya apa, garansinya berapa lama dan tertulis atau tidak, siapa yang mengerjakan, dan apa yang terjadi kalau gagal. Bisa jadi jawabannya masuk akal. Bisa juga tidak. Yang penting jawabannya ada.",
  atas: "Di atas kebanyakan. Tanyakan jenis part dan lama garansinya sebelum setuju.",
  umum: "Di rentang yang umum dipasang bengkel untuk kelas part ini.",
  bawah: "Di bawah kebanyakan. Pastikan kelas part-nya sama dengan yang kamu kira.",
  jauh_bawah:
    "Jauh di bawah hampir semua bengkel. Harga sejauh ini di bawah rentang umum biasanya berarti kelas part-nya berbeda dari yang kamu bayangkan, atau ada bagian pekerjaan yang tidak dikerjakan. Minta lihat part-nya sebelum dipasang, minta garansi tertulis, dan tanyakan apa yang terjadi kalau dalam seminggu bermasalah. Murah belum tentu buruk — tapi murah tanpa penjelasan layak dipertanyakan.",
};

export const JUDUL_KELAYAKAN: Record<"layak" | "masuk_akal" | "jual_saja", string> = {
  layak: "Jelas layak diperbaiki",
  masuk_akal: "Masih masuk akal, tapi hitung dulu",
  jual_saja: "Biasanya lebih masuk dijual apa adanya lalu ganti unit",
};

// SERVIS.md hanya memberi contoh eksplisit untuk layar, baterai, dan board.
// Kategori lain (kamera, konektor, housing, audio) ditulis mengikuti pola
// yang sama: ditujukan ke pembeli, soal kelas part dan garansi, tidak
// pernah soal bagaimana bengkel harus memasang harga.
const PERTANYAAN: Record<string, string[]> = {
  layar: [
    "Jenis panelnya apa — ori copotan, service pack, atau aftermarket?",
    "Garansinya berapa lama?",
    "Kalau ada dead pixel, bisa tukar tidak?",
    "True tone jalan tidak setelah diganti?",
  ],
  baterai: [
    "Siklus dan kesehatan baterainya berapa persen?",
    "Ada peringatan baterai tidak di iOS setelah dipasang?",
  ],
  board: [
    "Didiagnosa dulu atau langsung ganti?",
    "No fix no pay atau tidak?",
    "Kalau board tambah rusak saat dikerjakan, bagaimana?",
  ],
  kamera: [
    "Part-nya original atau aftermarket?",
    "Garansinya berapa lama?",
    "Kalau hasil foto atau fokus masih bermasalah setelah ganti, bisa retur?",
  ],
  konektor: [
    "Cuma ganti port, atau ada pengecekan komponen di sekitarnya juga?",
    "Garansinya berapa lama?",
    "Kalau setelah diganti tetap tidak mengisi daya, bagaimana?",
  ],
  housing: [
    "Part-nya original atau aftermarket?",
    "Ketahanan air ikut terpengaruh tidak?",
    "Garansinya berapa lama?",
  ],
  audio: [
    "Part-nya original atau aftermarket?",
    "Garansinya berapa lama?",
    "Kalau kualitas suara masih bermasalah setelah ganti, bisa retur?",
  ],
  software: [
    "Ini masalah software atau hardware?",
    "Apa yang dicoba dulu sebelum unit dibongkar?",
    "Ada risiko data hilang tidak?",
  ],
};

export function pertanyaanUntukKategori(kategori: string): string[] {
  return PERTANYAAN[kategori] ?? [];
}
