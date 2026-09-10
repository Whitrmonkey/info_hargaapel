export type LabelKelayakan = "layak" | "masuk_akal" | "jual_saja";

export interface RasioKelayakan {
  rasio: number;
  label: LabelKelayakan;
  judul: string;
}

const JUDUL: Record<LabelKelayakan, string> = {
  layak: "Jelas layak diperbaiki",
  masuk_akal: "Masih masuk akal, tapi hitung dulu",
  jual_saja: "Biasanya lebih masuk dijual apa adanya lalu ganti unit",
};

function labelDariRasio(rasio: number): LabelKelayakan {
  if (rasio < 0.25) return "layak";
  if (rasio <= 0.5) return "masuk_akal";
  return "jual_saja";
}

// Satu-satunya tempat harga servis dan harga device bertemu. Kalau salah
// satu sisi belum ada datanya, sembunyikan -- jangan pernah menebak
// (SERVIS.md aturan 2). Dipakai di /servis dan /cek-harga.
export function hitungKelayakan(
  hargaServisMedian: number | null,
  hargaUnitSecondStandar: number | null,
): RasioKelayakan | null {
  if (hargaServisMedian == null || hargaUnitSecondStandar == null) return null;
  const rasio = hargaServisMedian / hargaUnitSecondStandar;
  const label = labelDariRasio(rasio);
  return { rasio, label, judul: JUDUL[label] };
}

// KOMPONEN.md bagian 4 -- kalkulator dua sudut pandang untuk /hitung.
// Beda dari hitungKelayakan di atas: yang dibandingkan bukan harga jasa
// servis, tapi harga BELI KOMPONEN + jasa pasangnya (part-saja, bukan
// all-in) terhadap nilai unit pada grade hasil akhir.

export interface RincianKelayakanPemilik extends RasioKelayakan {
  harga_komponen: number;
  jasa_pasang: number;
  biaya: number;
  nilai_unit: number;
}

export function hitungKelayakanPemilik(
  hargaKomponen: number | null,
  jasaPasang: number | null,
  nilaiUnitGradeAkhir: number | null,
): RincianKelayakanPemilik | null {
  if (hargaKomponen == null || jasaPasang == null || nilaiUnitGradeAkhir == null || nilaiUnitGradeAkhir <= 0) {
    return null;
  }
  const biaya = hargaKomponen + jasaPasang;
  const rasio = biaya / nilaiUnitGradeAkhir;
  const label = labelDariRasio(rasio);
  return {
    rasio,
    label,
    judul: JUDUL[label],
    harga_komponen: hargaKomponen,
    jasa_pasang: jasaPasang,
    biaya,
    nilai_unit: nilaiUnitGradeAkhir,
  };
}

export interface RincianKelayakanPedagang {
  harga_beli_unit_rusak: number;
  harga_komponen: number;
  jasa_pasang: number;
  modal: number;
  hasil: number;
  margin: number;
  margin_persen: number;
}

export function hitungKelayakanPedagang(
  hargaBeliUnitRusak: number | null,
  hargaKomponen: number | null,
  jasaPasang: number | null,
  hasilUnitGradeAkhir: number | null,
): RincianKelayakanPedagang | null {
  if (
    hargaBeliUnitRusak == null ||
    hargaKomponen == null ||
    jasaPasang == null ||
    hasilUnitGradeAkhir == null
  ) {
    return null;
  }
  const modal = hargaBeliUnitRusak + hargaKomponen + jasaPasang;
  const margin = hasilUnitGradeAkhir - modal;
  return {
    harga_beli_unit_rusak: hargaBeliUnitRusak,
    harga_komponen: hargaKomponen,
    jasa_pasang: jasaPasang,
    modal,
    hasil: hasilUnitGradeAkhir,
    margin,
    margin_persen: modal !== 0 ? margin / modal : 0,
  };
}
