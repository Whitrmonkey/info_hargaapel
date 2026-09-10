export interface TitikHarian {
  tanggal: string; // YYYY-MM-DD
  median: number;
}

export interface TitikSeri {
  tanggal: string;
  median: number | null; // null hanya untuk hari sebelum data pertama pernah ada
  diisi: boolean; // true kalau median ini hasil isi-maju, bukan observasi hari itu
}

function tambahHari(iso: string, n: number): string {
  const d = new Date(iso + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

// Deret harian jarang lengkap -- toko tidak selalu dicek tiap hari. isiMaju
// membawa nilai terakhir yang diketahui ke hari-hari kosong supaya sparkline
// tidak berlubang, tanpa pernah menebak nilai SEBELUM data pertama ada.
export function isiMaju(titik: readonly TitikHarian[], dariTanggal: string, keTanggal: string): TitikSeri[] {
  const byTanggal = new Map(titik.map((t) => [t.tanggal, t.median]));
  const hasil: TitikSeri[] = [];
  let terakhir: number | null = null;

  for (let tgl = dariTanggal; tgl <= keTanggal; tgl = tambahHari(tgl, 1)) {
    if (byTanggal.has(tgl)) {
      terakhir = byTanggal.get(tgl)!;
      hasil.push({ tanggal: tgl, median: terakhir, diisi: false });
    } else {
      hasil.push({ tanggal: tgl, median: terakhir, diisi: terakhir != null });
    }
  }
  return hasil;
}

const HARI_JENDELA_PERUBAHAN = 30;

export function perubahan30Hari(seri: readonly TitikSeri[]): number | null {
  const valid = seri.filter((s) => s.median != null);
  if (valid.length < 2) return null;

  const sekarang = valid[valid.length - 1].median!;
  const idxDulu = Math.max(0, valid.length - 1 - HARI_JENDELA_PERUBAHAN);
  const dulu = valid[idxDulu].median!;
  if (dulu === 0) return null;

  return (sekarang - dulu) / dulu;
}
