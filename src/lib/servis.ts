export type VonisServis = "jauh_bawah" | "bawah" | "umum" | "atas" | "jauh_atas";

export interface ObservasiServis {
  id: number;
  product_id: string;
  workshop_id: string;
  service_type_id: string;
  part_grade_id: string | null;
  harga: number;
  termasuk_jasa: boolean;
  observed_at: string;
}

export interface Persentil {
  p10: number;
  p25: number;
  p50: number;
  p75: number;
  p90: number;
}

export interface SebaranServis<T extends ObservasiServis> extends Persentil {
  key: string;
  product_id: string;
  service_type_id: string;
  part_grade_id: string | null;
  jumlah_bengkel: number;
  terakhir: string;
  items: T[];
}

const JENDELA_HARI = 120;
const MIN_BENGKEL = 5;

// Interpolasi linear, sama dengan percentile_cont Postgres, supaya angka di
// /cek-harga (dihitung live dari sini) tidak pernah beda dengan sebaran_servis.
export function persentil(nilaiTerurut: readonly number[], p: number): number {
  if (nilaiTerurut.length === 0) throw new Error("persentil: array kosong");
  if (nilaiTerurut.length === 1) return nilaiTerurut[0];
  const idx = p * (nilaiTerurut.length - 1);
  const bawah = Math.floor(idx);
  const atas = Math.ceil(idx);
  if (bawah === atas) return nilaiTerurut[bawah];
  const pecahan = idx - bawah;
  return nilaiTerurut[bawah] + (nilaiTerurut[atas] - nilaiTerurut[bawah]) * pecahan;
}

export function vonisServis(harga: number, p: Persentil): VonisServis {
  if (harga < p.p10) return "jauh_bawah";
  if (harga < p.p25) return "bawah";
  if (harga <= p.p75) return "umum";
  if (harga <= p.p90) return "atas";
  return "jauh_atas";
}

function kunciGrup(o: ObservasiServis): string {
  return `${o.product_id}|${o.service_type_id}|${o.part_grade_id ?? ""}`;
}

// Gerbang 5 bengkel: grup di bawah itu TIDAK muncul di sini sama sekali.
// UI (BAGIAN 5) menampilkan daftar harga apa adanya untuk grup itu lewat
// query mentah terpisah, bukan lewat fungsi ini.
export function kelompokkanServis<T extends ObservasiServis>(
  observasi: readonly T[],
  sekarang: Date = new Date(),
): SebaranServis<T>[] {
  const batas = sekarang.getTime() - JENDELA_HARI * 86_400_000;
  const relevan = observasi.filter(
    (o) => o.termasuk_jasa && new Date(o.observed_at).getTime() >= batas,
  );

  const kelompok = new Map<string, T[]>();
  for (const o of relevan) {
    const key = kunciGrup(o);
    const arr = kelompok.get(key);
    if (arr) arr.push(o);
    else kelompok.set(key, [o]);
  }

  const hasil: SebaranServis<T>[] = [];
  for (const [key, items] of kelompok) {
    const bengkelUnik = new Set(items.map((i) => i.workshop_id));
    if (bengkelUnik.size < MIN_BENGKEL) continue;

    const terurut = [...items].sort((a, b) => a.harga - b.harga);
    const harga = terurut.map((i) => i.harga);

    hasil.push({
      key,
      product_id: items[0].product_id,
      service_type_id: items[0].service_type_id,
      part_grade_id: items[0].part_grade_id,
      jumlah_bengkel: bengkelUnik.size,
      terakhir: items.reduce((t, i) => (i.observed_at > t ? i.observed_at : t), items[0].observed_at),
      p10: persentil(harga, 0.1),
      p25: persentil(harga, 0.25),
      p50: persentil(harga, 0.5),
      p75: persentil(harga, 0.75),
      p90: persentil(harga, 0.9),
      items: terurut,
    });
  }
  return hasil;
}
