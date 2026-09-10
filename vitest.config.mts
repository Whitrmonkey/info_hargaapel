import { loadEnv } from "vite";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    environment: "node",
    passWithNoTests: true,
    // .env.local dst tidak dimuat otomatis oleh vitest (itu kebiasaan
    // Next.js, bukan Vite) -- muat manual supaya test yang bicara ke
    // Supabase lokal (mis. src/lib/scrape/run.test.ts) kebagian
    // NEXT_PUBLIC_SUPABASE_URL dkk.
    env: loadEnv("", process.cwd(), ""),
  },
});
