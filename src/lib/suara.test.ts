import { describe, expect, it } from "vitest";
import { ALASAN_RAGU, alasanSah, periksaPenilaian, statusDariSkor, urutkanDiskusi } from "./suara";

describe("periksaPenilaian — dua sumbu tidak disamakan", () => {
  it("meragukan tanpa alasan ditolak", () => {
    expect(periksaPenilaian("meragukan", null).boleh).toBe(false);
  });

  it("meragukan dengan alasan di luar daftar tertutup ditolak", () => {
    expect(periksaPenilaian("meragukan", "tidak_suka").boleh).toBe(false);
  });

  it("setiap alasan di daftar tertutup diterima", () => {
    for (const a of ALASAN_RAGU) {
      expect(periksaPenilaian("meragukan", a.kode).boleh).toBe(true);
    }
  });

  it("masuk akal tidak perlu dan tidak boleh beralasan", () => {
    expect(periksaPenilaian("masuk_akal", null).boleh).toBe(true);
    expect(periksaPenilaian("masuk_akal", "duplikat").boleh).toBe(false);
  });
});

describe("alasanSah", () => {
  it("null dan string asing bukan alasan sah", () => {
    expect(alasanSah(null)).toBe(false);
    expect(alasanSah("apa_saja")).toBe(false);
    expect(alasanSah("bukan_pembeli")).toBe(true);
  });
});

describe("statusDariSkor — yang buruk dilipat, tidak dihapus", () => {
  it("skor sangat rendah melipat, bukan menghilangkan", () => {
    expect(statusDariSkor(-5, "tampil")).toBe("dilipat");
    expect(statusDariSkor(-20, "tampil")).toBe("dilipat");
  });

  it("skor naik lagi membuka lipatannya", () => {
    expect(statusDariSkor(0, "dilipat")).toBe("tampil");
  });

  it("suara tidak berwenang membatalkan penahanan moderasi", () => {
    expect(statusDariSkor(100, "ditahan")).toBe("ditahan");
  });
});

describe("urutkanDiskusi", () => {
  it("skor bersih menentukan urutan", () => {
    const hasil = urutkanDiskusi([
      { skor: 1, dibuat_at: "2026-01-01T00:00:00Z" },
      { skor: 9, dibuat_at: "2026-01-01T00:00:00Z" },
      { skor: -3, dibuat_at: "2026-01-01T00:00:00Z" },
    ]);
    expect(hasil.map((x) => x.skor)).toEqual([9, 1, -3]);
  });

  it("kalau skor seri, yang terbaru lebih dulu", () => {
    const hasil = urutkanDiskusi([
      { skor: 2, dibuat_at: "2026-01-01T00:00:00Z" },
      { skor: 2, dibuat_at: "2026-05-01T00:00:00Z" },
    ]);
    expect(hasil[0].dibuat_at).toBe("2026-05-01T00:00:00Z");
  });
});
