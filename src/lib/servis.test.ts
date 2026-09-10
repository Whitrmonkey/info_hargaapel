import { describe, expect, it } from "vitest";
import { kelompokkanServis, persentil, vonisServis, type ObservasiServis } from "./servis";

const SEKARANG = new Date("2026-09-09T00:00:00Z");
const hariLalu = (hari: number) => new Date(SEKARANG.getTime() - hari * 86_400_000).toISOString();

let nextId = 1;
function obs(partial: Partial<ObservasiServis> & { harga: number; workshop_id: string }): ObservasiServis {
  return {
    id: nextId++,
    product_id: "p1",
    service_type_id: "st1",
    part_grade_id: "pg1",
    termasuk_jasa: true,
    observed_at: hariLalu(1),
    ...partial,
  };
}

function bengkel(n: number, harga: (i: number) => number) {
  return Array.from({ length: n }, (_, i) => obs({ workshop_id: `w${i}`, harga: harga(i) }));
}

describe("persentil", () => {
  it("interpolasi linear sama dengan percentile_cont", () => {
    const nilai = [100, 200, 300, 400, 500];
    expect(persentil(nilai, 0.5)).toBe(300);
    expect(persentil(nilai, 0)).toBe(100);
    expect(persentil(nilai, 1)).toBe(500);
    // idx = 0.25 * 4 = 1 -> tepat di indeks 1
    expect(persentil(nilai, 0.25)).toBe(200);
  });

  it("satu nilai saja: semua persentil sama dengan nilai itu", () => {
    expect(persentil([777], 0.1)).toBe(777);
    expect(persentil([777], 0.9)).toBe(777);
  });
});

describe("vonisServis", () => {
  const p = { p10: 100, p25: 150, p50: 200, p75: 250, p90: 300 };
  it("batas p25 masuk 'umum', bukan 'bawah'", () => {
    expect(vonisServis(150, p)).toBe("umum");
  });
  it("batas p75 masih 'umum', bukan 'atas'", () => {
    expect(vonisServis(250, p)).toBe("umum");
  });
  it("di bawah p10 -> jauh_bawah", () => {
    expect(vonisServis(99, p)).toBe("jauh_bawah");
  });
  it("di atas p90 -> jauh_atas", () => {
    expect(vonisServis(301, p)).toBe("jauh_atas");
  });
});

describe("kelompokkanServis", () => {
  it("tepat 4 bengkel: gerbang belum terbuka, grup tidak muncul", () => {
    const data = bengkel(4, (i) => 100 + i * 10);
    expect(kelompokkanServis(data, SEKARANG)).toHaveLength(0);
  });

  it("tepat 5 bengkel: gerbang terbuka, vonis dihitung", () => {
    const data = bengkel(5, (i) => 100 + i * 10); // 100,110,120,130,140
    const hasil = kelompokkanServis(data, SEKARANG);
    expect(hasil).toHaveLength(1);
    expect(hasil[0].jumlah_bengkel).toBe(5);
    expect(hasil[0].p50).toBe(120);
  });

  it("harga identik semua: seluruh persentil sama", () => {
    const data = bengkel(5, () => 200);
    const [grup] = kelompokkanServis(data, SEKARANG);
    expect([grup.p10, grup.p25, grup.p50, grup.p75, grup.p90]).toEqual([200, 200, 200, 200, 200]);
  });

  it("satu outlier ekstrem melebarkan p90 tapi tidak menggeser p50", () => {
    const data = [
      obs({ workshop_id: "w1", harga: 100 }),
      obs({ workshop_id: "w2", harga: 110 }),
      obs({ workshop_id: "w3", harga: 120 }),
      obs({ workshop_id: "w4", harga: 130 }),
      obs({ workshop_id: "w5", harga: 2_000 }), // bengkel premium jauh di atas
    ];
    const [grup] = kelompokkanServis(data, SEKARANG);
    expect(grup.p50).toBe(120);
    expect(grup.p90).toBeGreaterThan(1_000);
  });

  it("semua data kedaluwarsa (>120 hari) dibuang", () => {
    const data = bengkel(5, (i) => 100 + i).map((o) => ({ ...o, observed_at: hariLalu(121) }));
    expect(kelompokkanServis(data, SEKARANG)).toHaveLength(0);
  });

  it("harga part-saja (termasuk_jasa=false) tidak ikut sebaran all-in", () => {
    const data = [
      ...bengkel(5, (i) => 100 + i * 10),
      obs({ workshop_id: "w6", harga: 20, termasuk_jasa: false }),
    ];
    const [grup] = kelompokkanServis(data, SEKARANG);
    expect(grup.jumlah_bengkel).toBe(5);
    expect(grup.items.some((i) => i.harga === 20)).toBe(false);
  });

  it("grade part berbeda tidak pernah satu median", () => {
    const data = [
      ...bengkel(5, (i) => 100 + i * 10).map((o) => ({ ...o, part_grade_id: "incell" })),
      ...bengkel(5, (i) => 500 + i * 10).map((o, i) => ({ ...o, workshop_id: `x${i}`, part_grade_id: "ori_copotan" })),
    ];
    const hasil = kelompokkanServis(data, SEKARANG);
    expect(hasil).toHaveLength(2);
    expect(new Set(hasil.map((g) => g.part_grade_id))).toEqual(new Set(["incell", "ori_copotan"]));
  });
});
