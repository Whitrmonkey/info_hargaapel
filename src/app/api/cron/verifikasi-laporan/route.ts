import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifikasiLaporanMenunggu } from "@/lib/data/verifikasi-laporan";

export const maxDuration = 120;

export async function GET(request: Request) {
  const rahasia = process.env.CRON_SECRET;
  if (rahasia && request.headers.get("authorization") !== `Bearer ${rahasia}`) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const hasil = await verifikasiLaporanMenunggu(createAdminClient());
  return NextResponse.json({ ok: true, ...hasil });
}
