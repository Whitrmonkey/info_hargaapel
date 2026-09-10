import { describe, expect, it } from "vitest";
import { isiMaju, lajuBulanan, perubahan30Hari, ringkasBulanan } from "./seri";

describe("isiMaju", () => {
  it("mengisi lubang dengan nilai terakhir yang diketahui", () => {
    const hasil = isiMaju([{ tanggal: "2026-01-01", median: 100 }], "2026-01-01", "2026-01-04");
    expect(hasil.map((h) => h.median)).toEqual([100, 100, 100, 100]);
    expect(hasil.map((h) => h.diisi)).toEqual([false, true, true, true]);
  });

  it("hari sebelum data pertama tetap null, bukan ditebak", () => {
    const hasil = isiMaju([{ tanggal: "2026-01-03", median: 100 }], "2026-01-01", "2026-01-03");
    expect(hasil.map((h) => h.median)).toEqual([null, null, 100]);
    expect(hasil[0].diisi).toBe(false); // null bukan "diisi", memang belum ada
  });

  it("naik turun mengikuti observasi baru begitu ada", () => {
    const hasil = isiMaju(
      [
        { tanggal: "2026-01-01", median: 100 },
        { tanggal: "2026-01-03", median: 150 },
      ],
      "2026-01-01",
      "2026-01-04",
    );
    expect(hasil.map((h) => h.median)).toEqual([100, 100, 150, 150]);
  });
});

describe("perubahan30Hari", () => {
  it("kurang dari 2 titik valid -> null", () => {
    expect(perubahan30Hari([{ tanggal: "2026-01-01", median: null, diisi: false }])).toBeNull();
  });

  it("menghitung persentase perubahan dari ~30 hari lalu ke sekarang", () => {
    const seri = isiMaju(
      [
        { tanggal: "2026-01-01", median: 100 },
        { tanggal: "2026-01-31", median: 110 },
      ],
      "2026-01-01",
      "2026-01-31",
    );
    const hasil = perubahan30Hari(seri);
    expect(hasil).toBeCloseTo(0.1, 5);
  });

  it("dulu = 0 -> null, bukan Infinity", () => {
    const seri = isiMaju(
      [
        { tanggal: "2026-01-01", median: 0 },
        { tanggal: "2026-01-31", median: 50 },
      ],
      "2026-01-01",
      "2026-01-31",
    );
    expect(perubahan30Hari(seri)).toBeNull();
  });
});

describe("ringkasBulanan", () => {
  it("mengambil nilai terakhir tiap bulan, bukan rata-ratanya", () => {
    const seri = isiMaju(
      [
        { tanggal: "2026-01-01", median: 100 },
        { tanggal: "2026-01-20", median: 90 },
        { tanggal: "2026-02-05", median: 80 },
      ],
      "2026-01-01",
      "2026-02-28",
    );
    expect(ringkasBulanan(seri)).toEqual([
      { bulan: "2026-01", label: "Jan 2026", nilai: 90 },
      { bulan: "2026-02", label: "Feb 2026", nilai: 80 },
    ]);
  });

  it("melewati bulan yang belum punya data sama sekali", () => {
    expect(ringkasBulanan([{ tanggal: "2026-01-05", median: null, diisi: false }])).toEqual([]);
  });
});

describe("lajuBulanan", () => {
  it("kurang dari dua titik -> null", () => {
    expect(lajuBulanan([{ bulan: "2026-01", label: "Jan 2026", nilai: 100 }])).toBeNull();
  });

  it("turun 10 persen dalam satu bulan -> -0,1", () => {
    const hasil = lajuBulanan([
      { bulan: "2026-01", label: "Jan 2026", nilai: 100 },
      { bulan: "2026-02", label: "Feb 2026", nilai: 90 },
    ]);
    expect(hasil).toBeCloseTo(-0.1, 6);
  });

  it("dihitung majemuk, bukan rata-rata selisih", () => {
    // 100 -> 81 dalam dua bulan = -10% per bulan, bukan -9,5%
    const hasil = lajuBulanan([
      { bulan: "2026-01", label: "Jan 2026", nilai: 100 },
      { bulan: "2026-02", label: "Feb 2026", nilai: 90 },
      { bulan: "2026-03", label: "Mar 2026", nilai: 81 },
    ]);
    expect(hasil).toBeCloseTo(-0.1, 6);
  });

  it("hanya memakai jendela terakhir", () => {
    const titik = [
      { bulan: "2025-01", label: "Jan 2025", nilai: 1000 },
      { bulan: "2025-02", label: "Feb 2025", nilai: 500 },
      { bulan: "2025-03", label: "Mar 2025", nilai: 100 },
      { bulan: "2025-04", label: "Apr 2025", nilai: 90 },
    ];
    expect(lajuBulanan(titik, 1)).toBeCloseTo(-0.1, 6);
  });

  it("nilai nol atau negatif -> null, bukan NaN", () => {
    const hasil = lajuBulanan([
      { bulan: "2026-01", label: "Jan 2026", nilai: 0 },
      { bulan: "2026-02", label: "Feb 2026", nilai: 90 },
    ]);
    expect(hasil).toBeNull();
  });
});
