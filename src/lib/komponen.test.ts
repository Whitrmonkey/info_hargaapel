import { describe, expect, it } from "vitest";
import { kelompokkanKomponen, pinjamRasioKomponen, type ObservasiKomponen } from "./komponen";

const SEKARANG = new Date("2026-09-09T00:00:00Z");
const hariLalu = (hari: number) => new Date(SEKARANG.getTime() - hari * 86_400_000).toISOString();

let nextId = 1;
function obs(partial: Partial<ObservasiKomponen> & { harga: number; seller_id: string }): ObservasiKomponen {
  return {
    id: nextId++,
    product_id: "p1",
    component_type_id: "layar",
    board_grade_id: null,
    part_grade_id: "incell",
    observed_at: hariLalu(1),
    ...partial,
  };
}
function penjual(n: number, harga: (i: number) => number) {
  return Array.from({ length: n }, (_, i) => obs({ seller_id: `s${i}`, harga: harga(i) }));
}

describe("kelompokkanKomponen", () => {
  it("tepat 3 penjual: gerbang terbuka", () => {
    const data = penjual(3, (i) => 800_000 + i * 10_000);
    const hasil = kelompokkanKomponen(data, 8_000_000, SEKARANG);
    expect(hasil).toHaveLength(1);
    expect(hasil[0].jumlah_penjual).toBe(3);
  });

  it("tepat 2 penjual: gerbang belum terbuka, grup tidak muncul", () => {
    const data = penjual(2, (i) => 800_000 + i * 10_000);
    expect(kelompokkanKomponen(data, 8_000_000, SEKARANG)).toHaveLength(0);
  });

  it("rasio dihitung terhadap harga unit, bukan disimpan sebagai rupiah mati", () => {
    const data = penjual(3, () => 1_000_000);
    const [grup] = kelompokkanKomponen(data, 8_000_000, SEKARANG);
    expect(grup.harga_komponen).toBe(1_000_000);
    expect(grup.rasio).toBeCloseTo(0.125, 5);
  });

  it("harga_unit null -> rasio null, bukan dilempar error atau ditebak", () => {
    const data = penjual(3, () => 1_000_000);
    const [grup] = kelompokkanKomponen(data, null, SEKARANG);
    expect(grup.rasio).toBeNull();
  });

  it("mesin (board_grade) dan komponen lain (part_grade) tidak pernah satu grup", () => {
    const data = [
      ...penjual(3, () => 2_000_000).map((o) => ({ ...o, component_type_id: "mesin", board_grade_id: "normal", part_grade_id: null })),
      ...penjual(3, () => 1_000_000).map((o, i) => ({ ...o, seller_id: `x${i}`, component_type_id: "layar", part_grade_id: "incell" })),
    ];
    const hasil = kelompokkanKomponen(data, 8_000_000, SEKARANG);
    expect(hasil).toHaveLength(2);
  });

  it("data lebih dari 120 hari dibuang", () => {
    const data = penjual(3, () => 1_000_000).map((o) => ({ ...o, observed_at: hariLalu(121) }));
    expect(kelompokkanKomponen(data, 8_000_000, SEKARANG)).toHaveLength(0);
  });
});

describe("pinjamRasioKomponen", () => {
  it("data langsung ada, sekecil apa pun jumlah penjualnya -> tidak pernah pinjam", () => {
    const langsung = { rasio: 0.2, jumlah_penjual: 3, terakhir: hariLalu(1) };
    const kandidat = [{ productId: "lain", model: "iPhone 13", rasio: { rasio: 0.5, jumlah_penjual: 5, terakhir: hariLalu(1) } }];
    const hasil = pinjamRasioKomponen(langsung, kandidat);
    expect(hasil?.estimasi).toBe(false);
    expect(hasil?.rasio).toBe(0.2);
  });

  it("tidak ada data langsung -> pinjam dari kandidat pertama yang punya data, ditandai estimasi", () => {
    const kandidat = [
      { productId: "p-tanpa-data", model: "iPhone 12", rasio: null },
      { productId: "p-donor", model: "iPhone 13", rasio: { rasio: 0.18, jumlah_penjual: 4, terakhir: hariLalu(2) } },
    ];
    const hasil = pinjamRasioKomponen(null, kandidat);
    expect(hasil?.estimasi).toBe(true);
    expect(hasil?.rasio).toBe(0.18);
    expect(hasil?.dipinjamDariModel).toBe("iPhone 13");
  });

  it("tidak ada data langsung maupun kandidat -> null, bukan menebak", () => {
    expect(pinjamRasioKomponen(null, [{ productId: "x", model: "iPhone 12", rasio: null }])).toBeNull();
  });
});
