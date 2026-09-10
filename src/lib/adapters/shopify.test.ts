import { describe, expect, it, vi } from "vitest";
import { buatAdapterShopify, type SourceRow } from "./shopify";

function source(overrides: Partial<SourceRow> = {}): SourceRow {
  return {
    id: "src1",
    seller_id: "sel1",
    adapter: "shopify",
    base_url: "https://toko-contoh.com",
    sisi: "jual",
    config: {},
    cadence: "harian",
    aktif: true,
    last_run_at: null,
    ...overrides,
  } as SourceRow;
}

function responsJson(body: unknown, init: { status?: number; contentType?: string } = {}) {
  return new Response(JSON.stringify(body), {
    status: init.status ?? 200,
    headers: { "content-type": init.contentType ?? "application/json; charset=utf-8" },
  });
}

describe("buatAdapterShopify", () => {
  it("meratakan variants[] jadi satu item per varian dengan external_key handle:variantId", async () => {
    const fetchPalsu = vi.fn().mockResolvedValueOnce(
      responsJson({
        products: [
          {
            handle: "iphone-16",
            title: "iPhone 16",
            variants: [
              { id: 111, title: "128GB", price: "12999000.00", available: true },
              { id: 112, title: "256GB", price: "14999000.00", available: false },
            ],
          },
        ],
      }),
    );
    const adapter = buatAdapterShopify(fetchPalsu);
    const hasil = await adapter.ambil(source());

    expect(hasil).toHaveLength(2);
    expect(hasil[0]).toMatchObject({
      external_key: "iphone-16:111",
      harga: 12_999_000,
      tersedia: true,
    });
    expect(hasil[1]).toMatchObject({ external_key: "iphone-16:112", harga: 14_999_000, tersedia: false });
  });

  it("berhenti di halaman kosong, jeda 1 detik antar halaman", async () => {
    const halaman1 = {
      products: Array.from({ length: 250 }, (_, i) => ({
        handle: `produk-${i}`,
        title: `Produk ${i}`,
        variants: [{ id: i, title: "default", price: "100.00", available: true }],
      })),
    };
    const halaman2 = { products: [] };
    const fetchPalsu = vi
      .fn()
      .mockResolvedValueOnce(responsJson(halaman1))
      .mockResolvedValueOnce(responsJson(halaman2));

    const mulai = Date.now();
    const adapter = buatAdapterShopify(fetchPalsu);
    const hasil = await adapter.ambil(source());
    const durasi = Date.now() - mulai;

    expect(hasil).toHaveLength(250);
    expect(fetchPalsu).toHaveBeenCalledTimes(2);
    expect(durasi).toBeGreaterThanOrEqual(900); // jeda ~1 detik, longgar untuk jitter
  });

  it("HTTP non-200: melempar error, bukan diam-diam pindah ke HTML", async () => {
    const fetchPalsu = vi.fn().mockResolvedValueOnce(new Response("blocked", { status: 403 }));
    const adapter = buatAdapterShopify(fetchPalsu);
    await expect(adapter.ambil(source())).rejects.toThrow(/HTTP 403/);
  });

  it("respons bukan JSON (mis. halaman tantangan HTML): melempar error, bukan diam-diam di-parse sebagai HTML", async () => {
    const fetchPalsu = vi
      .fn()
      .mockResolvedValueOnce(
        new Response("<html>Verifying your connection...</html>", {
          status: 200,
          headers: { "content-type": "text/html" },
        }),
      );
    const adapter = buatAdapterShopify(fetchPalsu);
    await expect(adapter.ambil(source())).rejects.toThrow(/bukan JSON/);
  });
});
