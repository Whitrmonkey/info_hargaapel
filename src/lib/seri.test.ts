import { describe, expect, it } from "vitest";
import { isiMaju, perubahan30Hari } from "./seri";

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
