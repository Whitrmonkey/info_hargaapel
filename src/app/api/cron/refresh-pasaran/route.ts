import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { hitungSinyalSemua } from "@/lib/data/hitung-sinyal-semua";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization") ?? "";
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse(null, { status: 401 });
  }

  const admin = createAdminClient();
  const { error } = await admin.rpc("refresh_agregat");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const jumlahSinyal = await hitungSinyalSemua(admin);

  return NextResponse.json({ status: "sukses", jumlah_sinyal: jumlahSinyal });
}
