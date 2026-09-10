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

export interface TitikBulanan {
  bulan: string; // YYYY-MM
  label: string; // "Sep 2022"
  nilai: number;
}

const NAMA_BULAN = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];

// Ringkas deret harian jadi satu titik per bulan, memakai nilai TERAKHIR yang
// diketahui di bulan itu. Dipasangkan dengan isiMaju, artinya tiap titik
// adalah potret akhir bulan -- bukan rata-rata, supaya tidak melembutkan
// penurunan tajam yang justru jadi inti bacaannya (September).
export function ringkasBulanan(seri: readonly TitikSeri[]): TitikBulanan[] {
  const per = new Map<string, number>();
  for (const t of seri) {
    if (t.median == null) continue;
    per.set(t.tanggal.slice(0, 7), t.median);
  }
  return [...per.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([bulan, nilai]) => {
      const [th, bl] = bulan.split("-");
      return { bulan, label: `${NAMA_BULAN[Number(bl) - 1]} ${th}`, nilai };
    });
}

// Laju perubahan rata-rata per bulan sebagai pecahan (-0.012 = turun 1,2%
// sebulan), dihitung majemuk dari ujung ke ujung jendela, bukan rata-rata
// selisih -- supaya satu bulan yang melonjak tidak menyeret seluruh angkanya.
export function lajuBulanan(titik: readonly TitikBulanan[], jendela = 6): number | null {
  if (titik.length < 2) return null;
  const potong = titik.slice(-Math.max(2, jendela + 1));
  const awal = potong[0].nilai;
  const akhir = potong[potong.length - 1].nilai;
  const n = potong.length - 1;
  if (awal <= 0 || akhir <= 0 || n < 1) return null;
  return Math.pow(akhir / awal, 1 / n) - 1;
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
