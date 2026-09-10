export type KodeSinyal = "sepi" | "tahan" | "beli" | "netral";

export interface EventPromoTerdekat {
  label: string;
  hari_lagi: number;
}

// Fakta yang sudah dihitung di tempat lain (pasaran_harian, ambilSeri,
// fx_rates, market_events). sinyal.ts murni menerapkan urutan aturan --
// tidak query apa pun sendiri.
export interface FaktaSinyal {
  jumlah_observasi: number;
  jumlah_toko: number;
  kondisi: "baru" | "second" | "refurb";
  garansi: "resmi" | "inter" | "toko";
  tren30: number;
  hari_ke_rilis_penerus: number | null;
  kurs_naik_30_hari: number | null;
  event_promo: EventPromoTerdekat | null;
}

export interface HasilSinyal {
  kode: KodeSinyal;
  judul: string;
  alasan: string;
}

const persen = (x: number) => Math.abs(Math.round(x * 100));

export function evaluasiSinyal(f: FaktaSinyal): HasilSinyal {
  // Aturan 0: gerbang, tidak boleh dilewati.
  if (f.jumlah_observasi < 4 || f.jumlah_toko < 2) {
    return {
      kode: "sepi",
      judul: "Data belum cukup",
      alasan: "Butuh minimal 4 kali pengecekan dari minimal 2 toko sebelum tren bisa dibaca.",
    };
  }

  // Aturan 1: generasi baru baru rilis, unit lama biasanya ikut turun.
  if (
    f.kondisi !== "baru" &&
    f.hari_ke_rilis_penerus != null &&
    f.hari_ke_rilis_penerus >= -14 &&
    f.hari_ke_rilis_penerus <= 45
  ) {
    return {
      kode: "tahan",
      judul: "Tunggu dulu",
      alasan:
        "Generasi baru baru saja masuk pasar. Unit second biasanya ikut turun 8-12% dalam 30 hari setelah itu, karena banyak orang lepas unit lama sekaligus.",
    };
  }

  // Aturan 2: tren turun.
  if (f.tren30 <= -0.03) {
    return {
      kode: "tahan",
      judul: "Masih turun",
      alasan: `Harga pasaran turun ${persen(f.tren30)}% dalam 30 hari terakhir dan belum berhenti. Belum ada alasan buru-buru.`,
    };
  }

  // Aturan 3: tren naik.
  if (f.tren30 >= 0.025) {
    let alasan = `Harga pasaran naik ${persen(f.tren30)}% dalam 30 hari terakhir.`;
    if (f.garansi === "inter" && f.kurs_naik_30_hari != null && f.kurs_naik_30_hari > 0.02) {
      alasan +=
        " Unit inter mengikuti kurs, jadi kenaikan rupiah lemah biasanya diteruskan ke harga jual dalam 1-2 minggu.";
    }
    return { kode: "beli", judul: "Cenderung naik", alasan };
  }

  // Aturan 4: promo besar segera datang, harga cenderung ditahan dulu.
  if (f.event_promo != null) {
    return {
      kode: "tahan",
      judul: `Tunggu ${f.event_promo.label}`,
      alasan: `Harga pasaran datar (${persen(f.tren30)}%) dalam 30 hari terakhir, dan ${f.event_promo.label} tinggal ${f.event_promo.hari_lagi} hari lagi.`,
    };
  }

  // Aturan 5: default.
  return {
    kode: "netral",
    judul: "Harga stabil",
    alasan: `Pasaran bergerak ${persen(f.tren30)}% saja dalam 30 hari. Tidak ada tanda akan turun maupun naik.`,
  };
}
