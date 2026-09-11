import { describe, expect, it } from "vitest";
import { alasanLaporSah, periksaIsi, saringTeks } from "./diskusi";

const daftar = [{ kata: "penipu" }, { kata: "tipu" }, { kata: "bodong" }, { kata: "scam" }];

describe("saringTeks — menahan, bukan memblokir", () => {
  it("menangkap tuduhan langsung", () => {
    const h = saringTeks("toko itu penipu", daftar);
    expect(h.tahan).toBe(true);
    expect(h.kataKetemu).toEqual(["penipu"]);
  });

  it("huruf besar dan tanda baca tidak menyelamatkan tuduhan", () => {
    expect(saringTeks("TOKO ITU PENIPU!!!", daftar).tahan).toBe(true);
    expect(saringTeks("dia scam, serius", daftar).tahan).toBe(true);
  });

  it("membantah data tidak tertahan", () => {
    const h = saringTeks("Harga ini tidak masuk akal karena tujuh toko lain di rentang berbeda", daftar);
    expect(h.tahan).toBe(false);
  });

  it("dicocokkan per kata utuh, bukan potongan", () => {
    // "ketipuan" memang memuat "tipu", tapi "sekitar" tidak boleh tertahan
    // gara-gara potongan huruf. Yang diuji: pencocokan tidak substring.
    expect(saringTeks("harganya sekitar delapan juta", daftar).tahan).toBe(false);
    expect(saringTeks("stok bodong katanya", daftar).tahan).toBe(true);
  });

  it("beberapa kata sekaligus dilaporkan sekali per kata", () => {
    const h = saringTeks("penipu penipu bodong", daftar);
    expect(h.kataKetemu.sort()).toEqual(["bodong", "penipu"]);
  });

  it("daftar kosong tidak menahan apa pun", () => {
    expect(saringTeks("penipu", []).tahan).toBe(false);
  });
});

describe("alasan lapor tertutup", () => {
  it("hanya alasan dari daftar yang diterima", () => {
    expect(alasanLaporSah("tuduhan")).toBe(true);
    expect(alasanLaporSah("pokoknya_tidak_suka")).toBe(false);
  });
});

describe("periksaIsi", () => {
  it("terlalu pendek dan terlalu panjang ditolak", () => {
    expect(periksaIsi("  a ").boleh).toBe(false);
    expect(periksaIsi("x".repeat(5000)).boleh).toBe(false);
  });

  it("isi wajar diterima", () => {
    expect(periksaIsi("Menurut saya rentangnya kelewat lebar.").boleh).toBe(true);
  });
});
