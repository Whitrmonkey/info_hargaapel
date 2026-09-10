import type { Database } from "@/lib/supabase/database.types";

export interface HasilItemAdapter {
  external_key: string;
  judul: string;
  harga: number;
  grade?: string;
  fullset?: boolean;
  tersedia: boolean;
  url?: string;
}

export type SourceRow = Database["public"]["Tables"]["sources"]["Row"];

export interface Adapter {
  ambil(source: SourceRow): Promise<HasilItemAdapter[]>;
}

interface VarianShopify {
  id: number;
  title: string;
  price: string;
  available: boolean;
}

interface ProdukShopify {
  handle: string;
  title: string;
  variants: VarianShopify[];
}

interface HalamanShopify {
  products: ProdukShopify[];
}

const ITEM_PER_HALAMAN = 250;
const JEDA_ANTAR_HALAMAN_MS = 1_000;
const USER_AGENT = "hargaapel-scraper/0.1 (+https://hargaapel.com; kontak: alert@hargaapel.com)";

const tunggu = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Satu adapter, dipakai ulang untuk semua domain Shopify -- bedanya cuma
// source.base_url. Tidak ada HTML yang di-parse, tidak ada CSS selector.
export function buatAdapterShopify(fetchImpl: typeof fetch = fetch): Adapter {
  return {
    async ambil(source: SourceRow): Promise<HasilItemAdapter[]> {
      const dasar = source.base_url.replace(/\/$/, "");
      const hasil: HasilItemAdapter[] = [];

      for (let halaman = 1; ; halaman++) {
        const url = `${dasar}/products.json?limit=${ITEM_PER_HALAMAN}&page=${halaman}`;
        const res = await fetchImpl(url, { headers: { "User-Agent": USER_AGENT } });

        if (!res.ok) {
          throw new Error(`shopify ${dasar}: HTTP ${res.status}`);
        }
        const contentType = res.headers.get("content-type") ?? "";
        if (!contentType.includes("application/json")) {
          throw new Error(`shopify ${dasar}: respons bukan JSON (content-type: ${contentType || "tidak ada"})`);
        }

        const data = (await res.json()) as HalamanShopify;
        if (data.products.length === 0) break;

        for (const p of data.products) {
          for (const v of p.variants) {
            hasil.push({
              external_key: `${p.handle}:${v.id}`,
              judul: `${p.title} - ${v.title}`,
              harga: Math.round(parseFloat(v.price)),
              tersedia: v.available,
              url: `${dasar}/products/${p.handle}`,
            });
          }
        }

        if (data.products.length < ITEM_PER_HALAMAN) break;
        await tunggu(JEDA_ANTAR_HALAMAN_MS);
      }

      return hasil;
    },
  };
}
