import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { tugasVerifikasi } from "@/lib/cron/tugas";

export const runtime = "nodejs";
export const maxDuration = 120;

// Tugas ini bagian dari rangkaian /api/cron/harian. Rute tersendiri ini
// dipertahankan supaya bisa dipicu manual saat menelusuri masalah, tapi
// TIDAK lagi punya jadwal cron sendiri -- lihat vercel.json.
export async function GET(req: Request) {
  const rahasia = process.env.CRON_SECRET;
  if (rahasia && req.headers.get("authorization") !== `Bearer ${rahasia}`) {
    return new NextResponse(null, { status: 401 });
  }
  const hasil = await tugasVerifikasi(createAdminClient());
  return NextResponse.json(hasil, { status: hasil.ok ? 200 : 500 });
}
