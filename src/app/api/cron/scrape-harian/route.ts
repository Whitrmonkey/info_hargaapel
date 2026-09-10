import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { ambilAdapter } from "@/lib/scrape/adapters";
import { jalankanScrape, type SourceRow } from "@/lib/scrape/run";

export const runtime = "nodejs";
export const maxDuration = 60;

// Vercel mengirim header ini otomatis kalau CRON_SECRET diset di environment.
export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization") ?? "";
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse(null, { status: 401 });
  }

  const admin = createAdminClient();
  const { data: sources, error } = await admin
    .from("sources")
    .select("*")
    .eq("aktif", true)
    .eq("cadence", "harian");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const hasil = [];
  for (const source of (sources ?? []) as SourceRow[]) {
    const adapter = ambilAdapter(source.adapter);
    if (!adapter) {
      hasil.push({ source_id: source.id, status: "gagal", pesan: `adapter '${source.adapter}' tidak dikenal` });
      continue;
    }
    hasil.push({ source_id: source.id, ...(await jalankanScrape(admin, source, adapter, "cron")) });
  }

  return NextResponse.json({ jumlah_sumber: hasil.length, hasil });
}
