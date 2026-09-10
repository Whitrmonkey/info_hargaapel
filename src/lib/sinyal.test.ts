import { describe, expect, it } from "vitest";
import { evaluasiSinyal, type FaktaSinyal } from "./sinyal";

function fakta(partial: Partial<FaktaSinyal> = {}): FaktaSinyal {
  return {
    jumlah_observasi: 10,
    jumlah_toko: 4,
    kondisi: "second",
    garansi: "inter",
    tren30: 0,
    hari_ke_rilis_penerus: null,
    kurs_naik_30_hari: null,
    event_promo: null,
    ...partial,
  };
}

describe("evaluasiSinyal -- aturan 0 (gerbang)", () => {
  it("di bawah 4 observasi -> sepi, walau toko cukup", () => {
    const r = evaluasiSinyal(fakta({ jumlah_observasi: 3, jumlah_toko: 5 }));
    expect(r.kode).toBe("sepi");
  });

  it("tepat 4 observasi -> lolos gerbang, lanjut ke aturan berikutnya", () => {
    const r = evaluasiSinyal(fakta({ jumlah_observasi: 4, jumlah_toko: 2, tren30: 0 }));
    expect(r.kode).not.toBe("sepi");
  });

  it("di bawah 2 toko -> sepi, walau observasi cukup", () => {
    const r = evaluasiSinyal(fakta({ jumlah_observasi: 10, jumlah_toko: 1 }));
    expect(r.kode).toBe("sepi");
  });

  it("gerbang tidak bisa dilewati oleh aturan lain (mis. tren turun tajam)", () => {
    const r = evaluasiSinyal(fakta({ jumlah_observasi: 1, jumlah_toko: 1, tren30: -0.5 }));
    expect(r.kode).toBe("sepi");
  });
});

describe("evaluasiSinyal -- aturan 1 (generasi baru rilis)", () => {
  it("unit second, penerus rilis -14 hari (baru saja) -> tahan", () => {
    const r = evaluasiSinyal(fakta({ kondisi: "second", hari_ke_rilis_penerus: -14 }));
    expect(r.kode).toBe("tahan");
    expect(r.judul).toBe("Tunggu dulu");
  });

  it("unit second, penerus rilis +45 hari (batas atas) -> tahan", () => {
    const r = evaluasiSinyal(fakta({ kondisi: "second", hari_ke_rilis_penerus: 45 }));
    expect(r.kode).toBe("tahan");
  });

  it("di luar rentang (+46 hari) -> tidak kena aturan 1", () => {
    const r = evaluasiSinyal(fakta({ kondisi: "second", hari_ke_rilis_penerus: 46, tren30: 0 }));
    expect(r.judul).not.toBe("Tunggu dulu");
  });

  it("kondisi baru tidak kena aturan 1 sama sekali", () => {
    const r = evaluasiSinyal(fakta({ kondisi: "baru", hari_ke_rilis_penerus: 0, tren30: 0 }));
    expect(r.judul).not.toBe("Tunggu dulu");
  });
});

describe("evaluasiSinyal -- aturan 2 (tren turun)", () => {
  it("tren tepat -3% -> tahan (batas inklusif)", () => {
    const r = evaluasiSinyal(fakta({ tren30: -0.03 }));
    expect(r.kode).toBe("tahan");
    expect(r.judul).toBe("Masih turun");
  });

  it("tren -2.9% belum kena aturan 2", () => {
    const r = evaluasiSinyal(fakta({ tren30: -0.029 }));
    expect(r.judul).not.toBe("Masih turun");
  });
});

describe("evaluasiSinyal -- aturan 3 (tren naik)", () => {
  it("tren tepat +2.5% -> beli (batas inklusif)", () => {
    const r = evaluasiSinyal(fakta({ tren30: 0.025 }));
    expect(r.kode).toBe("beli");
  });

  it("garansi inter + kurs naik >2% -> tambahan kalimat kurs", () => {
    const r = evaluasiSinyal(fakta({ tren30: 0.03, garansi: "inter", kurs_naik_30_hari: 0.025 }));
    expect(r.alasan).toMatch(/kurs|inter/i);
  });

  it("garansi resmi tidak dapat kalimat kurs meski kurs naik", () => {
    const r = evaluasiSinyal(fakta({ tren30: 0.03, garansi: "resmi", kurs_naik_30_hari: 0.05 }));
    expect(r.alasan).not.toMatch(/kurs/i);
  });
});

describe("evaluasiSinyal -- aturan 4 (promo mendatang)", () => {
  it("tren datar + promo dalam 75 hari -> tahan sebut nama promo", () => {
    const r = evaluasiSinyal(
      fakta({ tren30: 0.001, event_promo: { label: "Harbolnas 11.11", hari_lagi: 20 } }),
    );
    expect(r.kode).toBe("tahan");
    expect(r.judul).toContain("Harbolnas 11.11");
  });
});

describe("evaluasiSinyal -- aturan 5 (default)", () => {
  it("tidak ada aturan lain yang cocok -> netral", () => {
    const r = evaluasiSinyal(fakta({ tren30: 0.001, event_promo: null, hari_ke_rilis_penerus: null }));
    expect(r.kode).toBe("netral");
  });
});

describe("evaluasiSinyal -- urutan aturan (ambil yang pertama cocok)", () => {
  it("aturan 1 menang atas aturan 3 walau tren juga sedang naik", () => {
    const r = evaluasiSinyal(
      fakta({ kondisi: "second", hari_ke_rilis_penerus: 0, tren30: 0.05 }),
    );
    expect(r.judul).toBe("Tunggu dulu");
  });

  it("aturan 2 menang atas aturan 4 walau ada promo mendatang", () => {
    const r = evaluasiSinyal(
      fakta({ tren30: -0.1, event_promo: { label: "Harbolnas 12.12", hari_lagi: 10 } }),
    );
    expect(r.judul).toBe("Masih turun");
  });

  it("kata 'prediksi' atau 'ramalan' tidak pernah muncul di alasan sinyal apa pun", () => {
    const semua = [
      evaluasiSinyal(fakta({ jumlah_observasi: 1 })),
      evaluasiSinyal(fakta({ kondisi: "second", hari_ke_rilis_penerus: 0 })),
      evaluasiSinyal(fakta({ tren30: -0.03 })),
      evaluasiSinyal(fakta({ tren30: 0.03 })),
      evaluasiSinyal(fakta({ tren30: 0, event_promo: { label: "Promo", hari_lagi: 1 } })),
      evaluasiSinyal(fakta({ tren30: 0 })),
    ];
    for (const s of semua) {
      expect(`${s.judul} ${s.alasan}`.toLowerCase()).not.toMatch(/prediksi|ramalan/);
    }
  });
});
