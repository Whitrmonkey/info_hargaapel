import type { MetadataRoute } from "next";
import { situsUrl } from "@/lib/situs";

export default function robots(): MetadataRoute.Robots {
  const base = situsUrl();
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
