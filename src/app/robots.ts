import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "https://hargaapel.com";
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/catat", "/catat/servis", "/admin", "/admin/*", "/akun", "/masuk"],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}
