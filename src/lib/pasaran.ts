export type Kondisi = "baru" | "second" | "refurb";
export type Grade = "mulus" | "standar" | "ekonomis";
export type Garansi = "resmi" | "inter" | "toko";
export type Vonis = "murah" | "wajar" | "mahal";

export interface ObservasiHarga {
  id: number;
  product_id: string;
  seller_id: string;
  sisi: "jual" | "beli";
  kondisi: Kondisi;
  grade: Grade | null;
  garansi: Garansi;
  harga: number;
  observed_at: string;
  perlu_verifikasi: boolean;
}

export interface GrupPasaran<T extends ObservasiHarga> {
  key: string;
  product_id: string;
  kondisi: Kondisi;
  grade: Grade | null;
  garansi: Garansi;
  median: number;
  terendah: number;
  tertinggi: number;
  jumlah_toko: number;
  items: Array<T & { delta: number; posisi: number; vonis: Vonis }>;
}

const JENDELA_HARI = 7;
const MIN_TOKO = 2;
const AMBANG_MURAH = -0.06;
const AMBANG_MAHAL = 0.06;

export function median(nilai: readonly number[]): number {
  if (nilai.length === 0) throw new Error("median: array kosong");
  const s = [...nilai].sort((a, b) => a - b);
  const t = s.length >> 1;
  return s.length % 2 === 1 ? s[t] : Math.round((s[t - 1] + s[t]) / 2);
}

export function vonisHarga(delta: number): Vonis {
  if (delta <= AMBANG_MURAH) return "murah";
  if (delta >= AMBANG_MAHAL) return "mahal";
  return "wajar";
}

function kunciGrup(o: ObservasiHarga): string {
  return `${o.product_id}|${o.kondisi}|${o.grade ?? ""}|${o.garansi}`;
}

export interface BidAsk {
  bid_tertinggi: number;
  ask_terendah: number;
  selisih: number;
  selisih_persen: number;
}

const JENDELA_HARI_BELI = 30; // sisi beli jarang dicek, jendelanya lebih longgar dari sisi jual

// Hanya untuk grup barang SECOND (SPEC.md "Sisi pasar: bid dan ask"). Sisi
// jual dan sisi beli tetap tidak pernah masuk satu median -- ini
// perbandingan berdampingan, bukan penggabungan.
export function hitungBidAsk<T extends ObservasiHarga>(
  observasi: readonly T[],
  productId: string,
  kondisi: Kondisi,
  sekarang: Date = new Date(),
): BidAsk | null {
  const batasBeli = sekarang.getTime() - JENDELA_HARI_BELI * 86_400_000;
  const batasJual = sekarang.getTime() - JENDELA_HARI * 86_400_000;

  const bid = observasi.filter(
    (o) => o.sisi === "beli" && o.product_id === productId && o.kondisi === kondisi && new Date(o.observed_at).getTime() >= batasBeli,
  );
  const ask = observasi.filter(
    (o) => o.sisi === "jual" && o.product_id === productId && o.kondisi === kondisi && new Date(o.observed_at).getTime() >= batasJual,
  );
  if (bid.length === 0 || ask.length === 0) return null;

  const bidTertinggi = Math.max(...bid.map((o) => o.harga));
  const askTerendah = Math.min(...ask.map((o) => o.harga));
  const selisih = askTerendah - bidTertinggi;

  return {
    bid_tertinggi: bidTertinggi,
    ask_terendah: askTerendah,
    selisih,
    selisih_persen: bidTertinggi === 0 ? 0 : selisih / bidTertinggi,
  };
}

export function kelompokkanPasaran<T extends ObservasiHarga>(
  observasi: readonly T[],
  sekarang: Date = new Date(),
): GrupPasaran<T>[] {
  const batas = sekarang.getTime() - JENDELA_HARI * 86_400_000;
  const relevan = observasi.filter(
    (o) => o.sisi === "jual" && new Date(o.observed_at).getTime() >= batas,
  );

  const kelompok = new Map<string, T[]>();
  for (const o of relevan) {
    const key = kunciGrup(o);
    const arr = kelompok.get(key);
    if (arr) arr.push(o);
    else kelompok.set(key, [o]);
  }

  const hasil: GrupPasaran<T>[] = [];
  for (const [key, items] of kelompok) {
    // Kunci grup harus >= 2 PENJUAL berbeda, bukan >= 2 baris -- dua
    // pengecekan dari toko yang sama tetap bukan perbandingan.
    const penjualUnik = new Set(items.map((i) => i.seller_id));
    if (penjualUnik.size < MIN_TOKO) continue;

    const harga = items.map((i) => i.harga);
    const med = median(harga);
    const terendah = Math.min(...harga);
    const tertinggi = Math.max(...harga);
    const rentang = tertinggi - terendah;

    hasil.push({
      key,
      product_id: items[0].product_id,
      kondisi: items[0].kondisi,
      grade: items[0].grade,
      garansi: items[0].garansi,
      median: med,
      terendah,
      tertinggi,
      jumlah_toko: penjualUnik.size,
      items: items
        .map((i) => {
          const delta = (i.harga - med) / med;
          return {
            ...i,
            delta,
            posisi: rentang === 0 ? 0.5 : (i.harga - terendah) / rentang,
            vonis: vonisHarga(delta),
          };
        })
        .sort((a, b) => a.harga - b.harga),
    });
  }
  return hasil;
}
