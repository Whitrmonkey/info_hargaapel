import type { MetadataRoute } from "next";
import { createClient } from "@/lib/supabase/server";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "https://hargaapel.com";
  const supabase = await createClient();

  const [{ data: products }, { data: serviceTypes }] = await Promise.all([
    supabase.from("products").select("slug").eq("aktif", true),
    supabase.from("service_types").select("slug"),
  ]);

  const statis: MetadataRoute.Sitemap = [
    { url: base, changeFrequency: "hourly", priority: 1 },
    { url: `${base}/servis`, changeFrequency: "daily", priority: 0.8 },
    { url: `${base}/cek-harga`, changeFrequency: "daily", priority: 0.8 },
  ];

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

  return [...statis, ...produkUrls, ...servisUrls];
}
