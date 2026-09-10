export type LabelKelayakan = "layak" | "masuk_akal" | "jual_saja";

export interface RasioKelayakan {
  rasio: number;
  label: LabelKelayakan;
  judul: string;
}

// Satu-satunya tempat harga servis dan harga device bertemu. Kalau salah
// satu sisi belum ada datanya, sembunyikan -- jangan pernah menebak
// (SERVIS.md aturan 2).
export function hitungKelayakan(
  hargaServisMedian: number | null,
  hargaUnitSecondStandar: number | null,
): RasioKelayakan | null {
  if (hargaServisMedian == null || hargaUnitSecondStandar == null) return null;

  const rasio = hargaServisMedian / hargaUnitSecondStandar;

  if (rasio < 0.25) {
    return { rasio, label: "layak", judul: "Jelas layak diperbaiki" };
  }
  if (rasio <= 0.5) {
    return { rasio, label: "masuk_akal", judul: "Masih masuk akal, tapi hitung dulu" };
  }
  return { rasio, label: "jual_saja", judul: "Biasanya lebih masuk dijual apa adanya lalu ganti unit" };
}
