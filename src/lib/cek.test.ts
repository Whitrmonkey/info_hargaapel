import { describe, expect, it } from "vitest";
import { MIN_TOKO_VONIS, nilaiVonis, rentangPita, sebaranDevice, type SebaranDevice } from "./cek";

const contoh: SebaranDevice = { p10: 7_000_000, p25: 7_500_000, p50: 8_000_000, p75: 8_500_000, p90: 9_000_000, jumlah_toko: 8 };

describe("sebaranDevice", () => {
  it("di bawah gerbang toko -> null, bukan sebaran setengah jadi", () => {
    expect(sebaranDevice([1, 2, 3], MIN_TOKO_VONIS - 1)).toBeNull();
  });

  it("tepat di gerbang -> sebaran keluar", () => {
    const s = sebaranDevice([1, 2, 3, 4, 5], MIN_TOKO_VONIS);
    expect(s).not.toBeNull();
    expect(s!.p50).toBe(3);
  });

  it("tidak bergantung urutan masukan", () => {
    const a = sebaranDevice([5, 1, 4, 2, 3], 5);
    const b = sebaranDevice([1, 2, 3, 4, 5], 5);
    expect(a).toEqual(b);
  });

  it("array kosong -> null walau jumlah toko cukup", () => {
    expect(sebaranDevice([], 9)).toBeNull();
  });
});

describe("nilaiVonis", () => {
  it("memetakan tiap pita ke vonisnya", () => {
    expect(nilaiVonis(6_000_000, contoh).kode).toBe("jauh_bawah");
    expect(nilaiVonis(7_200_000, contoh).kode).toBe("bawah");
    expect(nilaiVonis(8_000_000, contoh).kode).toBe("umum");
    expect(nilaiVonis(8_700_000, contoh).kode).toBe("atas");
    expect(nilaiVonis(9_500_000, contoh).kode).toBe("jauh_atas");
  });

  it("batas persis: p25 dan p75 masih masuk rentang umum", () => {
    expect(nilaiVonis(contoh.p25, contoh).kode).toBe("umum");
    expect(nilaiVonis(contoh.p75, contoh).kode).toBe("umum");
    expect(nilaiVonis(contoh.p10, contoh).kode).toBe("bawah");
    expect(nilaiVonis(contoh.p90, contoh).kode).toBe("atas");
  });

  it("tidak pernah memakai kata prediksi di kalimat vonis", () => {
    const terlarang = /\b(prediksi|diprediksi|ramalan|akan turun|akan naik|dijamin)\b/i;
    for (const h of [6_000_000, 7_200_000, 8_000_000, 8_700_000, 9_500_000]) {
      const v = nilaiVonis(h, contoh);
      expect(v.judul + " " + v.teks).not.toMatch(terlarang);
    }
  });
});

describe("rentangPita", () => {
  it("melingkupi seluruh sebaran dengan ruang lebih di kedua ujung", () => {
    const { min, max } = rentangPita(contoh);
    expect(min).toBeLessThan(contoh.p10);
    expect(max).toBeGreaterThan(contoh.p90);
  });

  it("selalu kelipatan langkah dan tidak pernah nol atau negatif", () => {
    const { min, max } = rentangPita({ ...contoh, p10: 100_000, p90: 200_000 });
    expect(min % 50_000).toBe(0);
    expect(max % 50_000).toBe(0);
    expect(min).toBeGreaterThan(0);
  });
});
