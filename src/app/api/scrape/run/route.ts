import { timingSafeEqual } from "node:crypto";
import { after } from "next/server";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { ambilAdapter } from "@/lib/scrape/adapters";
import { jalankanScrape, type SourceRow } from "@/lib/scrape/run";

export const runtime = "nodejs";

function cocokAman(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

async function jalankanSatuSumber(source: SourceRow) {
  const admin = createAdminClient();
  const adapter = ambilAdapter(source.adapter);
  if (!adapter) {
    return { source_id: source.id, status: "gagal" as const, pesan: `adapter '${source.adapter}' tidak dikenal` };
  }
  const hasil = await jalankanScrape(admin, source, adapter, "manual");
  return { source_id: source.id, ...hasil };
}

export async function POST(req: Request) {
  const authHeader = req.headers.get("authorization") ?? "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice("Bearer ".length) : "";
  const tokenValid = process.env.SCRAPE_TOKEN;

  if (!tokenValid || !token || !cocokAman(token, tokenValid)) {
    return new NextResponse(null, { status: 401 });
  }

  let body: { source_id?: string; semua?: boolean };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "body harus JSON" }, { status: 400 });
  }

  const admin = createAdminClient();

  if (body.semua) {
    const { data: sources, error } = await admin.from("sources").select("*").eq("aktif", true);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    after(async () => {
      for (const source of sources ?? []) {
        await jalankanSatuSumber(source as SourceRow);
      }
    });

    return NextResponse.json({ status: "berjalan_di_background", jumlah_sumber: sources?.length ?? 0 }, { status: 202 });
  }

  if (body.source_id) {
    const { data: source, error } = await admin.from("sources").select("*").eq("id", body.source_id).single();
    if (error || !source) return NextResponse.json({ error: "source_id tidak ditemukan" }, { status: 404 });

    const hasil = await jalankanSatuSumber(source as SourceRow);
    return NextResponse.json(hasil);
  }

  return NextResponse.json({ error: "body harus berisi source_id atau semua: true" }, { status: 400 });
}
