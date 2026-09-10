import { describe, expect, it } from "vitest";
import { hitungBidAsk, kelompokkanPasaran, median, vonisHarga, type ObservasiHarga } from "./pasaran";

const SEKARANG = new Date("2026-09-09T00:00:00Z");
const jamLalu = (jam: number) => new Date(SEKARANG.getTime() - jam * 3_600_000).toISOString();
const hariLalu = (hari: number) => new Date(SEKARANG.getTime() - hari * 86_400_000).toISOString();

let nextId = 1;
function obs(partial: Partial<ObservasiHarga> & { harga: number; seller_id: string }): ObservasiHarga {
  return {
    id: nextId++,
    product_id: "p1",
    sisi: "jual",
    kondisi: "second",
    grade: "standar",
    garansi: "inter",
    observed_at: jamLalu(1),
    perlu_verifikasi: false,
    ...partial,
  };
}

describe("median", () => {
  it("jumlah ganjil: ambil nilai tengah", () => {
    expect(median([3, 1, 2])).toBe(2);
  });

  it("jumlah genap: rata-rata dua nilai tengah", () => {
    expect(median([1, 2, 3, 4])).toBe(3); // (2+3)/2 dibulatkan
  });

  it("array kosong melempar error", () => {
    expect(() => median([])).toThrow();
  });
});

describe("vonisHarga", () => {
  it("batas -6% adalah murah (inklusif)", () => {
    expect(vonisHarga(-0.06)).toBe("murah");
  });
  it("batas +6% adalah mahal (inklusif)", () => {
    expect(vonisHarga(0.06)).toBe("mahal");
  });
  it("di antaranya wajar", () => {
    expect(vonisHarga(0)).toBe("wajar");
    expect(vonisHarga(-0.059)).toBe("wajar");
    expect(vonisHarga(0.059)).toBe("wajar");
  });
});

describe("kelompokkanPasaran", () => {
  it("grup satu toko dibuang, meski jumlah baris >= 2", () => {
    const data = [
      obs({ seller_id: "s1", harga: 100 }),
      obs({ seller_id: "s1", harga: 105 }), // toko sama, bukan pembanding
    ];
    expect(kelompokkanPasaran(data, SEKARANG)).toHaveLength(0);
  });

  it("dua toko berbeda lolos gerbang", () => {
    const data = [obs({ seller_id: "s1", harga: 100 }), obs({ seller_id: "s2", harga: 120 })];
    const hasil = kelompokkanPasaran(data, SEKARANG);
    expect(hasil).toHaveLength(1);
    expect(hasil[0].jumlah_toko).toBe(2);
  });

  it("harga identik semua: delta nol, posisi tengah, semua wajar", () => {
    const data = [
      obs({ seller_id: "s1", harga: 100 }),
      obs({ seller_id: "s2", harga: 100 }),
      obs({ seller_id: "s3", harga: 100 }),
    ];
    const [grup] = kelompokkanPasaran(data, SEKARANG);
    expect(grup.median).toBe(100);
    for (const item of grup.items) {
      expect(item.delta).toBe(0);
      expect(item.vonis).toBe("wajar");
      expect(item.posisi).toBe(0.5);
    }
  });

  it("satu outlier ekstrem tidak menggeser median jauh", () => {
    const data = [
      obs({ seller_id: "s1", harga: 100 }),
      obs({ seller_id: "s2", harga: 102 }),
      obs({ seller_id: "s3", harga: 104 }),
      obs({ seller_id: "s4", harga: 5_000 }), // outlier ekstrem
    ];
    const [grup] = kelompokkanPasaran(data, SEKARANG);
    // median dari [100,102,104,5000] genap -> rata-rata dua tengah (102+104)/2
    expect(grup.median).toBe(103);
    expect(grup.tertinggi).toBe(5_000);
    const outlier = grup.items.find((i) => i.harga === 5_000)!;
    expect(outlier.vonis).toBe("mahal");
    // toko lain tidak ikut kebawa jadi "mahal" oleh satu outlier
    const wajar = grup.items.filter((i) => i.harga !== 5_000);
    expect(wajar.every((i) => i.vonis === "wajar")).toBe(true);
  });

  it("jumlah genap dan ganjil dihitung benar dalam grup nyata", () => {
    const genap = [
      obs({ seller_id: "s1", harga: 100 }),
      obs({ seller_id: "s2", harga: 200 }),
    ];
    const ganjil = [
      obs({ seller_id: "s1", harga: 100, product_id: "p2" }),
      obs({ seller_id: "s2", harga: 200, product_id: "p2" }),
      obs({ seller_id: "s3", harga: 300, product_id: "p2" }),
    ];
    const [gGenap] = kelompokkanPasaran(genap, SEKARANG);
    const [gGanjil] = kelompokkanPasaran(ganjil, SEKARANG);
    expect(gGenap.median).toBe(150);
    expect(gGanjil.median).toBe(200);
  });

  it("semua data kedaluwarsa (>7 hari) dibuang seluruhnya", () => {
    const data = [
      obs({ seller_id: "s1", harga: 100, observed_at: hariLalu(8) }),
      obs({ seller_id: "s2", harga: 110, observed_at: hariLalu(10) }),
    ];
    expect(kelompokkanPasaran(data, SEKARANG)).toHaveLength(0);
  });

  it("tepat di batas 7 hari masih dihitung", () => {
    const data = [
      obs({ seller_id: "s1", harga: 100, observed_at: hariLalu(7) }),
      obs({ seller_id: "s2", harga: 110, observed_at: hariLalu(6) }),
    ];
    expect(kelompokkanPasaran(data, SEKARANG)).toHaveLength(1);
  });

  it("observasi sisi beli ikut masuk tapi harus terbuang dari perhitungan sisi jual", () => {
    const data = [
      obs({ seller_id: "s1", harga: 100, sisi: "jual" }),
      obs({ seller_id: "s2", harga: 120, sisi: "jual" }),
      obs({ seller_id: "s3", harga: 60, sisi: "beli" }), // harga beli, harus tidak ikut median jual
    ];
    const [grup] = kelompokkanPasaran(data, SEKARANG);
    expect(grup.jumlah_toko).toBe(2);
    expect(grup.median).toBe(110); // (100+120)/2, bukan ikut memasukkan 60
    expect(grup.items.some((i) => i.harga === 60)).toBe(false);
  });

  it("unit inter dan garansi resmi tidak pernah satu grup", () => {
    const data = [
      obs({ seller_id: "s1", harga: 100, garansi: "inter" }),
      obs({ seller_id: "s2", harga: 105, garansi: "inter" }),
      obs({ seller_id: "s3", harga: 200, garansi: "resmi" }),
      obs({ seller_id: "s4", harga: 210, garansi: "resmi" }),
    ];
    const hasil = kelompokkanPasaran(data, SEKARANG);
    expect(hasil).toHaveLength(2);
    expect(new Set(hasil.map((g) => g.garansi))).toEqual(new Set(["inter", "resmi"]));
  });
});

describe("hitungBidAsk", () => {
  it("null kalau salah satu sisi tidak ada data", () => {
    const hanyaJual = [obs({ seller_id: "s1", harga: 100, sisi: "jual" })];
    expect(hitungBidAsk(hanyaJual, "p1", "second", SEKARANG)).toBeNull();
  });

  it("bid tertinggi vs ask terendah, tidak pernah dicampur jadi satu median", () => {
    const data = [
      obs({ seller_id: "s1", harga: 100, sisi: "jual" }),
      obs({ seller_id: "s2", harga: 120, sisi: "jual" }),
      obs({ seller_id: "s3", harga: 80, sisi: "beli" }),
      obs({ seller_id: "s4", harga: 90, sisi: "beli" }),
    ];
    const hasil = hitungBidAsk(data, "p1", "second", SEKARANG)!;
    expect(hasil.bid_tertinggi).toBe(90);
    expect(hasil.ask_terendah).toBe(100);
    expect(hasil.selisih).toBe(10);
  });

  it("kondisi berbeda tidak ikut terhitung", () => {
    const data = [
      obs({ seller_id: "s1", harga: 100, sisi: "jual", kondisi: "second" }),
      obs({ seller_id: "s2", harga: 90, sisi: "beli", kondisi: "baru" }),
    ];
    expect(hitungBidAsk(data, "p1", "second", SEKARANG)).toBeNull();
  });
});
