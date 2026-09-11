import { describe, expect, it } from "vitest";
import {
  bolehMasukHitungan,
  hitungBobot,
  layakDipercepat,
  melesetBeruntun,
  nilaiLaporan,
  type Pembanding,
  type StatusLaporan,
} from "./reputasi";

const LAPOR = { harga_jadi: 8_000_000, dibuat_at: "2026-03-01T00:00:00Z" };
const p = (harga: number, tanggal: string, id = 1): Pembanding => ({ harga, observed_at: tanggal, observasi_id: id });

describe("nilaiLaporan — verifikasi datang dari masa depan, bukan dari suara", () => {
  it("observasi yang SUDAH ADA sebelum laporan tidak pernah memverifikasi", () => {
    // Angka persis sama, tapi tercatat sebelum laporan dibuat: itu justru
    // angka yang bisa dicontek pelapor.
    const h = nilaiLaporan(LAPOR, [p(8_000_000, "2026-02-25T00:00:00Z")], new Date("2026-03-05T00:00:00Z"));
    expect(h.status).toBe("menunggu");
  });

  it("observasi sesudahnya dalam 5 persen -> terverifikasi, dengan id pembandingnya", () => {
    const h = nilaiLaporan(LAPOR, [p(8_200_000, "2026-03-04T00:00:00Z", 77)], new Date("2026-03-05T00:00:00Z"));
    expect(h.status).toBe("terverifikasi");
    expect(h.observasi_id).toBe(77);
  });

  it("meleset lebih dari 15 persen -> meleset", () => {
    const h = nilaiLaporan(LAPOR, [p(9_600_000, "2026-03-04T00:00:00Z")], new Date("2026-03-05T00:00:00Z"));
    expect(h.status).toBe("meleset");
  });

  it("di antara 5 dan 15 persen belum memutuskan apa pun", () => {
    const h = nilaiLaporan(LAPOR, [p(8_800_000, "2026-03-04T00:00:00Z")], new Date("2026-03-05T00:00:00Z"));
    expect(h.status).toBe("menunggu");
  });

  it("lewat 30 hari tanpa pembanding -> kedaluwarsa", () => {
    const h = nilaiLaporan(LAPOR, [], new Date("2026-04-05T00:00:00Z"));
    expect(h.status).toBe("kedaluwarsa");
  });

  it("pembanding paling awal yang menentukan, bukan yang paling cocok", () => {
    const h = nilaiLaporan(
      LAPOR,
      [p(8_100_000, "2026-03-10T00:00:00Z", 2), p(9_900_000, "2026-03-03T00:00:00Z", 1)],
      new Date("2026-03-15T00:00:00Z"),
    );
    expect(h.status).toBe("meleset");
    expect(h.observasi_id).toBe(1);
  });
});

describe("bolehMasukHitungan — satu-satunya pintu masuk ke median", () => {
  it("hanya laporan terverifikasi dari akun berbobot yang masuk hitungan", () => {
    expect(bolehMasukHitungan("terverifikasi", 1)).toBe(true);
    expect(bolehMasukHitungan("terverifikasi", 3)).toBe(true);
  });

  it("akun berbobot 0 laporannya TIDAK terhitung, walau sudah terverifikasi", () => {
    expect(bolehMasukHitungan("terverifikasi", 0)).toBe(false);
  });

  it("status apa pun selain terverifikasi tidak pernah masuk hitungan", () => {
    const lain: StatusLaporan[] = ["baru", "menunggu", "meleset", "kedaluwarsa", "ditahan"];
    for (const s of lain) expect(bolehMasukHitungan(s, 3)).toBe(false);
  });
});

describe("layakDipercepat — suara hanya menggerakkan antrean, tidak pernah harga", () => {
  it("tiga masuk akal dari akun berbobot dan nol meragukan", () => {
    expect(layakDipercepat(3, 0)).toBe(true);
  });

  it("satu meragukan menahan antrean berapa pun yang menyetujui", () => {
    expect(layakDipercepat(50, 1)).toBe(false);
  });

  it("kurang dari tiga belum cukup", () => {
    expect(layakDipercepat(2, 0)).toBe(false);
  });
});

describe("hitungBobot", () => {
  it("tangga bobot sesuai rekam jejak", () => {
    expect(hitungBobot(0, 0, 0)).toBe(0);
    expect(hitungBobot(3, 0, 0)).toBe(1);
    expect(hitungBobot(10, 0, 0)).toBe(2);
    expect(hitungBobot(30, 0, 0)).toBe(3);
  });

  it("bobot 2 butuh nol meleset; pernah meleset menahan di 1", () => {
    expect(hitungBobot(10, 1, 0)).toBe(1);
  });

  it("satu meleset beruntun menurunkan satu tingkat", () => {
    expect(hitungBobot(30, 1, 1)).toBe(2);
    expect(hitungBobot(3, 1, 1)).toBe(0);
  });

  it("dua meleset berturut-turut mengembalikan ke 0 berapa pun rekam jejaknya", () => {
    expect(hitungBobot(100, 2, 2)).toBe(0);
  });

  it("tidak pernah melewati batas atas 3", () => {
    expect(hitungBobot(1000, 0, 0)).toBe(3);
  });
});

describe("melesetBeruntun — kedaluwarsa bukan kegagalan", () => {
  it("kedaluwarsa tidak memutus dan tidak menambah hitungan meleset", () => {
    expect(melesetBeruntun(["kedaluwarsa", "kedaluwarsa"])).toBe(0);
    expect(melesetBeruntun(["meleset", "kedaluwarsa", "meleset"])).toBe(2);
  });

  it("terverifikasi memutus rentetan", () => {
    expect(melesetBeruntun(["meleset", "terverifikasi", "meleset"])).toBe(1);
  });

  it("laporan yang belum dinilai dilewati tanpa efek", () => {
    expect(melesetBeruntun(["menunggu", "baru", "meleset"])).toBe(1);
  });
});
