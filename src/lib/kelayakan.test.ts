import { describe, expect, it } from "vitest";
import { hitungKelayakan } from "./kelayakan";

describe("hitungKelayakan", () => {
  it("harga servis belum ada: disembunyikan, bukan ditebak", () => {
    expect(hitungKelayakan(null, 5_000_000)).toBeNull();
  });

  it("harga unit belum ada: disembunyikan, bukan ditebak", () => {
    expect(hitungKelayakan(1_000_000, null)).toBeNull();
  });

  it("keduanya belum ada: disembunyikan", () => {
    expect(hitungKelayakan(null, null)).toBeNull();
  });

  it("rasio < 0.25 -> jelas layak diperbaiki", () => {
    const r = hitungKelayakan(1_000_000, 5_000_000)!;
    expect(r.rasio).toBeCloseTo(0.2);
    expect(r.label).toBe("layak");
  });

  it("batas bawah 0.25 masuk pita tengah, bukan pita layak", () => {
    const r = hitungKelayakan(1_250_000, 5_000_000)!;
    expect(r.rasio).toBeCloseTo(0.25);
    expect(r.label).toBe("masuk_akal");
  });

  it("batas atas 0.50 masih masuk pita tengah, bukan jual_saja", () => {
    const r = hitungKelayakan(2_500_000, 5_000_000)!;
    expect(r.rasio).toBeCloseTo(0.5);
    expect(r.label).toBe("masuk_akal");
  });

  it("rasio > 0.50 -> lebih masuk jual apa adanya", () => {
    const r = hitungKelayakan(3_000_000, 5_000_000)!;
    expect(r.rasio).toBeCloseTo(0.6);
    expect(r.label).toBe("jual_saja");
  });

  it("arah rasio: harga servis dibagi harga unit, bukan sebaliknya", () => {
    const r = hitungKelayakan(1_000_000, 4_000_000)!;
    expect(r.rasio).toBeCloseTo(0.25);
  });
});
