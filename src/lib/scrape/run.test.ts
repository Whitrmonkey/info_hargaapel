import { randomUUID } from "node:crypto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { Database } from "@/lib/supabase/database.types";
import { jalankanScrape, type Adapter, type HasilItemAdapter, type SourceRow } from "./run";

// Berjalan lewat Postgres lokal beneran (docker, `supabase start`), bukan
// mock -- run.ts adalah orkestrasi DB, bukan fungsi murni seperti BAGIAN 2.
const admin: SupabaseClient<Database> = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

const PRODUK_SEED = "a0000000-0000-0000-0000-000000000001"; // iPhone 16 Pro Max, dari 004_seed.sql

function adapterPalsu(item: HasilItemAdapter[]): Adapter {
  return { ambil: async () => item };
}
function adapterGagal(pesan: string): Adapter {
  return {
    ambil: async () => {
      throw new Error(pesan);
    },
  };
}

let sellerId: string;
let sourceId: string;

beforeEach(async () => {
  sellerId = randomUUID();
  sourceId = randomUUID();
  await admin.from("sellers").insert({ id: sellerId, nama: "Toko Uji", tipe: "toko", area: "Jakarta Pusat" });
  await admin.from("sources").insert({
    id: sourceId,
    seller_id: sellerId,
    adapter: "shopify",
    base_url: "https://toko-uji.example",
    sisi: "jual",
    cadence: "harian",
    config: { kondisi: "second", garansi: "inter" },
  });
});

afterEach(async () => {
  await admin.from("price_observations").delete().eq("seller_id", sellerId);
  await admin.from("source_product_map").delete().eq("source_id", sourceId);
  await admin.from("scrape_runs").delete().eq("source_id", sourceId);
  await admin.from("sources").delete().eq("id", sourceId);
  await admin.from("sellers").delete().eq("id", sellerId);
});

async function ambilSource(): Promise<SourceRow> {
  const { data } = await admin.from("sources").select("*").eq("id", sourceId).single();
  return data as SourceRow;
}

describe("jalankanScrape -- gerbang kewarasan", () => {
  it("turun >30% dari run sukses terakhir -> ditolak, nol observasi ditulis", async () => {
    // Baseline: run sukses sebelumnya dengan 100 item.
    await admin.from("scrape_runs").insert({
      source_id: sourceId,
      dipicu_oleh: "cron",
      status: "sukses",
      jumlah_item: 100,
      mulai_at: new Date(Date.now() - 86_400_000).toISOString(),
      selesai_at: new Date(Date.now() - 86_400_000 + 1000).toISOString(),
    });

    const item50 = Array.from({ length: 50 }, (_, i) => ({
      external_key: `k${i}`,
      judul: `Item ${i}`,
      harga: 100_000,
      tersedia: true,
    }));

    const hasil = await jalankanScrape(admin, await ambilSource(), adapterPalsu(item50), "cron");

    expect(hasil.status).toBe("ditolak");
    expect(hasil.jumlah_baru).toBe(0);

    const { data: obsSetelah } = await admin.from("price_observations").select("id").eq("seller_id", sellerId);
    expect(obsSetelah).toHaveLength(0);
  });

  it("turun di bawah 30% (mis. 75 dari 100) masih dianggap wajar -> tetap sukses", async () => {
    await admin.from("scrape_runs").insert({
      source_id: sourceId,
      dipicu_oleh: "cron",
      status: "sukses",
      jumlah_item: 100,
      mulai_at: new Date(Date.now() - 86_400_000).toISOString(),
    });
    const item75 = Array.from({ length: 75 }, (_, i) => ({
      external_key: `k${i}`,
      judul: `Item ${i}`,
      harga: 100_000,
      tersedia: false, // tidak tersedia semua supaya tidak perlu pemetaan produk nyata
    }));
    const hasil = await jalankanScrape(admin, await ambilSource(), adapterPalsu(item75), "cron");
    expect(hasil.status).toBe("sukses");
  });
});

describe("jalankanScrape -- pemetaan produk", () => {
  it("external_key belum terpetakan disimpan dengan product_id null, TIDAK ditebak walau judul mirip produk asli", async () => {
    const item: HasilItemAdapter[] = [
      { external_key: "iphone-16-pro-max:999", judul: "iPhone 16 Pro Max - 256GB", harga: 20_000_000, tersedia: true },
    ];
    const hasil = await jalankanScrape(admin, await ambilSource(), adapterPalsu(item), "manual");

    expect(hasil.jumlah_tak_terpetakan).toBe(1);
    expect(hasil.jumlah_baru).toBe(0);

    const { data: peta } = await admin
      .from("source_product_map")
      .select("*")
      .eq("source_id", sourceId)
      .eq("external_key", "iphone-16-pro-max:999")
      .single();
    expect(peta?.product_id).toBeNull();

    const { data: obs } = await admin.from("price_observations").select("id").eq("seller_id", sellerId);
    expect(obs).toHaveLength(0);
  });

  it("setelah dipetakan manual ke product_id, item berikutnya mulai tercatat", async () => {
    await admin.from("source_product_map").insert({
      source_id: sourceId,
      external_key: "iphone-16-pro-max:999",
      product_id: PRODUK_SEED,
      grade: "standar",
    });
    const item: HasilItemAdapter[] = [
      { external_key: "iphone-16-pro-max:999", judul: "iPhone 16 Pro Max - 256GB", harga: 20_000_000, tersedia: true },
    ];
    const hasil = await jalankanScrape(admin, await ambilSource(), adapterPalsu(item), "manual");
    expect(hasil.jumlah_baru).toBe(1);
    expect(hasil.jumlah_tak_terpetakan).toBe(0);
  });

  it("baris dengan abaikan=true tidak pernah dicatat sebagai observasi", async () => {
    await admin.from("source_product_map").insert({
      source_id: sourceId,
      external_key: "aksesoris-tidak-relevan:1",
      product_id: null,
      abaikan: true,
    });
    const item: HasilItemAdapter[] = [
      { external_key: "aksesoris-tidak-relevan:1", judul: "Case iPhone", harga: 50_000, tersedia: true },
    ];
    const hasil = await jalankanScrape(admin, await ambilSource(), adapterPalsu(item), "manual");
    expect(hasil.jumlah_baru).toBe(0);
    expect(hasil.jumlah_tak_terpetakan).toBe(1);
  });
});

describe("jalankanScrape -- peredam duplikat 20 jam", () => {
  beforeEach(async () => {
    await admin.from("source_product_map").insert({
      source_id: sourceId,
      external_key: "k1",
      product_id: PRODUK_SEED,
      grade: "standar",
    });
  });

  it("harga sama persis dalam 20 jam dilewati, harga berubah tetap dicatat", async () => {
    const source = await ambilSource();
    const itemSama = [{ external_key: "k1", judul: "iPhone 16 Pro Max", harga: 20_000_000, tersedia: true }];

    const r1 = await jalankanScrape(admin, source, adapterPalsu(itemSama), "cron");
    expect(r1.jumlah_baru).toBe(1);

    const r2 = await jalankanScrape(admin, source, adapterPalsu(itemSama), "cron");
    expect(r2.jumlah_baru).toBe(0); // duplikat, dilewati

    const itemBeda = [{ external_key: "k1", judul: "iPhone 16 Pro Max", harga: 20_500_000, tersedia: true }];
    const r3 = await jalankanScrape(admin, source, adapterPalsu(itemBeda), "cron");
    expect(r3.jumlah_baru).toBe(1); // harga berubah, bukan duplikat

    const { data: semua } = await admin
      .from("price_observations")
      .select("harga")
      .eq("seller_id", sellerId)
      .order("harga");
    expect(semua).toHaveLength(2);
  });
});

describe("jalankanScrape -- scrape_runs ditulis dari awal sampai akhir", () => {
  it("run sukses: mulai_at dan selesai_at terisi, status akhir sukses", async () => {
    await jalankanScrape(admin, await ambilSource(), adapterPalsu([]), "cron");
    const { data: run } = await admin
      .from("scrape_runs")
      .select("*")
      .eq("source_id", sourceId)
      .order("mulai_at", { ascending: false })
      .limit(1)
      .single();
    expect(run?.status).toBe("sukses");
    expect(run?.mulai_at).toBeTruthy();
    expect(run?.selesai_at).toBeTruthy();
  });

  it("adapter melempar error: status berakhir gagal, bukan macet di 'jalan'", async () => {
    const hasil = await jalankanScrape(admin, await ambilSource(), adapterGagal("situs berubah struktur"), "cron");
    expect(hasil.status).toBe("gagal");
    expect(hasil.pesan).toMatch(/situs berubah struktur/);

    const { data: run } = await admin
      .from("scrape_runs")
      .select("*")
      .eq("source_id", sourceId)
      .order("mulai_at", { ascending: false })
      .limit(1)
      .single();
    expect(run?.status).toBe("gagal");
    expect(run?.selesai_at).toBeTruthy();
  });
});
