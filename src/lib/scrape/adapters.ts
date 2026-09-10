import { buatAdapterShopify, type Adapter } from "@/lib/adapters/shopify";

// Registry adapter per kolom sources.adapter. 'html' belum ada (BAGIAN 10+),
// 'manual' tidak pernah discrape lewat jalur ini sama sekali.
export function ambilAdapter(nama: string): Adapter | null {
  switch (nama) {
    case "shopify":
      return buatAdapterShopify();
    default:
      return null;
  }
}
