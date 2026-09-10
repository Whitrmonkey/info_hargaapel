import { describe, expect, it } from "vitest";
import { hitungKelayakan, hitungKelayakanPedagang, hitungKelayakanPemilik } from "./kelayakan";

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

describe("hitungKelayakanPemilik", () => {
  it("salah satu sisi belum ada -> null", () => {
    expect(hitungKelayakanPemilik(null, 200_000, 8_000_000)).toBeNull();
    expect(hitungKelayakanPemilik(1_000_000, null, 8_000_000)).toBeNull();
    expect(hitungKelayakanPemilik(1_000_000, 200_000, null)).toBeNull();
  });

  it("biaya = harga_komponen + jasa_pasang, bukan harga_komponen saja", () => {
    const r = hitungKelayakanPemilik(1_000_000, 200_000, 8_000_000)!;
    expect(r.biaya).toBe(1_200_000);
    expect(r.rasio).toBeCloseTo(0.15, 5);
    expect(r.label).toBe("layak");
  });

  it("pita sama dengan hitungKelayakan (< 0.25 / 0.25-0.50 / > 0.50)", () => {
    expect(hitungKelayakanPemilik(3_000_000, 500_000, 7_000_000)!.label).toBe("masuk_akal");
    expect(hitungKelayakanPemilik(4_000_000, 1_000_000, 7_000_000)!.label).toBe("jual_saja");
  });
});

describe("hitungKelayakanPedagang", () => {
  it("salah satu masukan belum ada -> null", () => {
    expect(hitungKelayakanPedagang(null, 1_000_000, 200_000, 8_000_000)).toBeNull();
  });

  it("margin = hasil - modal, modal = beli unit rusak + komponen + jasa pasang", () => {
    const r = hitungKelayakanPedagang(4_000_000, 1_000_000, 200_000, 7_800_000)!;
    expect(r.modal).toBe(5_200_000);
    expect(r.margin).toBe(2_600_000);
    expect(r.margin_persen).toBeCloseTo(2_600_000 / 5_200_000, 5);
  });

  it("margin negatif (rugi) ditampilkan apa adanya, bukan disembunyikan", () => {
    const r = hitungKelayakanPedagang(7_000_000, 1_000_000, 200_000, 7_800_000)!;
    expect(r.margin).toBeLessThan(0);
  });
});
