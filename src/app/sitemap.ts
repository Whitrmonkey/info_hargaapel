import type { MetadataRoute } from "next";
import { createClient } from "@/lib/supabase/server";
import { KELUARGA } from "@/lib/keluarga";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "https://hargaapel.com";
  const supabase = await createClient();

  const [{ data: products }, { data: serviceTypes }, { data: penjualScraper }] = await Promise.all([
    supabase.from("products").select("slug").eq("aktif", true),
    supabase.from("service_types").select("slug"),
    // /toko/[id] cuma untuk penjual yang boleh disebut namanya -- yaitu
    // yang punya baris harga_terkini bersumber scraper (aturan keras 5).
    supabase.from("harga_terkini").select("seller_id").eq("sumber", "scraper"),
  ]);

  const statis: MetadataRoute.Sitemap = [
    { url: base, changeFrequency: "hourly", priority: 1 },
    { url: `${base}/servis`, changeFrequency: "daily", priority: 0.8 },
    { url: `${base}/cek-harga`, changeFrequency: "daily", priority: 0.8 },
    { url: `${base}/hitung`, changeFrequency: "weekly", priority: 0.6 },
    ...Object.keys(KELUARGA).map((k) => ({
      url: `${base}/${k}`,
      changeFrequency: "daily" as const,
      priority: 0.7,
    })),
  ];

  const tokoUrls: MetadataRoute.Sitemap = Array.from(
    new Set((penjualScraper ?? []).map((o) => o.seller_id).filter((v): v is string => v != null)),
  ).map((id) => ({ url: `${base}/toko/${id}`, changeFrequency: "daily" as const, priority: 0.4 }));

  const produkUrls: MetadataRoute.Sitemap = (products ?? []).map((p) => ({
    url: `${base}/p/${p.slug}`,
    changeFrequency: "daily",
    priority: 0.6,
  }));

  const servisUrls: MetadataRoute.Sitemap = (products ?? []).flatMap((p) =>
    (serviceTypes ?? []).map((j) => ({
      url: `${base}/servis/${p.slug}/${j.slug}`,
      changeFrequency: "daily" as const,
      priority: 0.4,
    })),
  );

  return [...statis, ...produkUrls, ...servisUrls, ...tokoUrls];
}
