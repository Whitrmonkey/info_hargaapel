import { describe, expect, it } from "vitest";
import { ringkasSentimen, tampilkanDiskusi, tampilkanLaporan, tampilkanSentimen } from "./ambang";

describe("ambang tampil", () => {
  it("sentimen mulai dari tiga suara", () => {
    expect(tampilkanSentimen(2)).toBe(false);
    expect(tampilkanSentimen(3)).toBe(true);
  });

  it("laporan dan diskusi mulai dari satu", () => {
    expect(tampilkanLaporan(0)).toBe(false);
    expect(tampilkanLaporan(1)).toBe(true);
    expect(tampilkanDiskusi(0)).toBe(false);
    expect(tampilkanDiskusi(1)).toBe(true);
  });
});

describe("ringkasSentimen", () => {
  it("di bawah ambang mengembalikan null, bukan blok kosong", () => {
    expect(ringkasSentimen({ worth: 1, mahal: 1 })).toBeNull();
  });

  it("menghitung total dan pilihan terbanyak", () => {
    const r = ringkasSentimen({ worth: 5, mahal: 2, tunggu: 1 });
    expect(r).not.toBeNull();
    expect(r!.total).toBe(8);
    expect(r!.terbanyak).toBe("worth");
  });

  it("pilihan yang tidak ada dihitung nol, bukan undefined", () => {
    const r = ringkasSentimen({ tunggu: 3 });
    expect(r!.per.worth).toBe(0);
    expect(r!.terbanyak).toBe("tunggu");
  });
});
