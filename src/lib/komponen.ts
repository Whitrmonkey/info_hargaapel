import { median } from "@/lib/pasaran";

export interface ObservasiKomponen {
  id: number;
  product_id: string;
  seller_id: string;
  component_type_id: string;
  board_grade_id: string | null;
  part_grade_id: string | null;
  harga: number;
  observed_at: string;
}

export interface GrupKomponen<T extends ObservasiKomponen> {
  key: string;
  product_id: string;
  component_type_id: string;
  board_grade_id: string | null;
  part_grade_id: string | null;
  jumlah_penjual: number;
  harga_komponen: number;
  rasio: number | null;
  terakhir: string;
  items: T[];
}

const JENDELA_HARI = 120;
const MIN_PENJUAL = 3;

function kunciGrup(o: ObservasiKomponen): string {
  return `${o.product_id}|${o.component_type_id}|${o.board_grade_id ?? ""}|${o.part_grade_id ?? ""}`;
}

// Rasio disimpan/ditampilkan sebagai pecahan terhadap harga unit second
// grade standar -- rupiahnya dihitung ulang tiap kali dari rasio ini, bukan
// disimpan sebagai angka mati (KOMPONEN.md bagian 1). Gerbang 3 penjual,
// lebih longgar dari servis (5) karena pasar part lebih tipis.
export function kelompokkanKomponen<T extends ObservasiKomponen>(
  observasi: readonly T[],
  hargaUnit: number | null,
  sekarang: Date = new Date(),
): GrupKomponen<T>[] {
  const batas = sekarang.getTime() - JENDELA_HARI * 86_400_000;
  const relevan = observasi.filter((o) => new Date(o.observed_at).getTime() >= batas);

  const kelompok = new Map<string, T[]>();
  for (const o of relevan) {
    const key = kunciGrup(o);
    const arr = kelompok.get(key);
    if (arr) arr.push(o);
    else kelompok.set(key, [o]);
  }

  const hasil: GrupKomponen<T>[] = [];
  for (const [key, items] of kelompok) {
    const penjualUnik = new Set(items.map((i) => i.seller_id));
    if (penjualUnik.size < MIN_PENJUAL) continue;

    const hargaKomponen = median(items.map((i) => i.harga));
    hasil.push({
      key,
      product_id: items[0].product_id,
      component_type_id: items[0].component_type_id,
      board_grade_id: items[0].board_grade_id,
      part_grade_id: items[0].part_grade_id,
      jumlah_penjual: penjualUnik.size,
      harga_komponen: hargaKomponen,
      rasio: hargaUnit != null && hargaUnit > 0 ? hargaKomponen / hargaUnit : null,
      terakhir: items.reduce((t, i) => (i.observed_at > t ? i.observed_at : t), items[0].observed_at),
      items: [...items].sort((a, b) => a.harga - b.harga),
    });
  }
  return hasil;
}

export interface RasioSumber {
  rasio: number;
  jumlah_penjual: number;
  terakhir: string;
}

export interface KandidatPinjaman {
  productId: string;
  model: string;
  rasio: RasioSumber | null;
}

export interface RasioTerpinjam {
  rasio: number;
  estimasi: boolean;
  jumlah_penjual?: number;
  terakhir?: string;
  dipinjamDariProductId?: string;
  dipinjamDariModel?: string;
}

// KOMPONEN.md bagian 3: boleh dipinjam ke SATU generasi bersebelahan dalam
// keluarga yang sama (bukan lintas kategori, bukan lintas beberapa
// generasi), wajib ditandai estimasi, dan tidak pernah dipakai kalau data
// langsung sudah ada -- sekecil apa pun jumlah penjualnya.
export function pinjamRasioKomponen(
  langsung: RasioSumber | null,
  kandidat: readonly KandidatPinjaman[],
): RasioTerpinjam | null {
  if (langsung != null) {
    return { rasio: langsung.rasio, estimasi: false, jumlah_penjual: langsung.jumlah_penjual, terakhir: langsung.terakhir };
  }
  const layak = kandidat.find((k) => k.rasio != null);
  if (!layak?.rasio) return null;
  return {
    rasio: layak.rasio.rasio,
    estimasi: true,
    dipinjamDariProductId: layak.productId,
    dipinjamDariModel: layak.model,
  };
}
