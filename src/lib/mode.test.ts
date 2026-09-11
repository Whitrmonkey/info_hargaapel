import { describe, expect, it } from "vitest";
import { ATURAN, bacaMode, bolehTampil, MODE_URUT, saringObservasi, type ModeData } from "./mode";

const demo = { sumber: "manual", catatan: "demo" };
const manual = { sumber: "manual", catatan: null };
const scraper = { sumber: "scraper", catatan: null };

describe("bacaMode", () => {
  it("membaca ketiga mode yang sah", () => {
    expect(bacaMode("maintenance")).toBe("maintenance");
    expect(bacaMode("testing")).toBe("testing");
    expect(bacaMode("production")).toBe("production");
  });

  it("tidak peduli huruf besar dan spasi", () => {
    expect(bacaMode("  Production ")).toBe("production");
  });

  it("nilai asing atau kosong jatuh ke maintenance, BUKAN production", () => {
    // Salah ketik env tidak boleh berakibat data mentah tertampil sebagai
    // angka produksi. Bawaan yang aman adalah yang paling sedikit klaimnya.
    expect(bacaMode(undefined)).toBe("maintenance");
    expect(bacaMode("")).toBe("maintenance");
    expect(bacaMode("prod")).toBe("maintenance");
    expect(bacaMode("PRODUKSI")).toBe("maintenance");
  });
});

describe("bolehTampil", () => {
  it("maintenance: hanya peragaan", () => {
    expect(bolehTampil(demo, "maintenance")).toBe(true);
    expect(bolehTampil(manual, "maintenance")).toBe(false);
    expect(bolehTampil(scraper, "maintenance")).toBe(false);
  });

  it("testing: hanya scraper", () => {
    expect(bolehTampil(scraper, "testing")).toBe(true);
    expect(bolehTampil(manual, "testing")).toBe(false);
    expect(bolehTampil(demo, "testing")).toBe(false);
  });

  it("production: scraper dan manual, tidak pernah peragaan", () => {
    expect(bolehTampil(scraper, "production")).toBe(true);
    expect(bolehTampil(manual, "production")).toBe(true);
    expect(bolehTampil(demo, "production")).toBe(false);
  });

  it("data peragaan tidak pernah bocor ke luar maintenance, apa pun sumbernya", () => {
    for (const mode of ["testing", "production"] as ModeData[]) {
      expect(bolehTampil({ sumber: "scraper", catatan: "demo" }, mode)).toBe(false);
      expect(bolehTampil({ sumber: "manual", catatan: "demo" }, mode)).toBe(false);
    }
  });

  it("catatan lain bukan penanda peragaan", () => {
    expect(bolehTampil({ sumber: "manual", catatan: "nego di tempat" }, "production")).toBe(true);
  });
});

describe("saringObservasi", () => {
  it("menyaring satu kumpulan campuran sesuai modenya", () => {
    const semua = [demo, manual, scraper];
    expect(saringObservasi(semua, "maintenance")).toEqual([demo]);
    expect(saringObservasi(semua, "testing")).toEqual([scraper]);
    expect(saringObservasi(semua, "production")).toEqual([manual, scraper]);
  });
});

describe("pita penanda", () => {
  it("hanya production yang tidak memasang pita", () => {
    expect(ATURAN.maintenance.pita).not.toBeNull();
    expect(ATURAN.testing.pita).not.toBeNull();
    expect(ATURAN.production.pita).toBeNull();
  });

  it("pita maintenance menyebut angkanya buatan", () => {
    expect(ATURAN.maintenance.pita).toMatch(/buatan/i);
  });

  it("urutannya satu arah maintenance -> testing -> production", () => {
    expect(MODE_URUT).toEqual(["maintenance", "testing", "production"]);
  });
});
