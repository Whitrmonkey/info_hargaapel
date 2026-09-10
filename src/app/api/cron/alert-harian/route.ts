import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { hargaSaatIniUntukWatchlist } from "@/lib/data/harga-watchlist";

export const runtime = "nodejs";
export const maxDuration = 60;

const JENDELA_DEDUP_HARI = 7;

async function kirimEmail(ke: string, subjek: string, teks: string): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return false; // belum dikonfigurasi (SETUP.md) -- lewati, jangan pura-pura terkirim

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "content-type": "application/json" },
    body: JSON.stringify({ from: process.env.EMAIL_FROM, to: ke, subject: subjek, text: teks }),
  });
  return res.ok;
}

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization") ?? "";
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse(null, { status: 401 });
  }

  const admin = createAdminClient();
  const { data: watchlists } = await admin.from("watchlists").select("*").eq("aktif", true);

  let dievaluasi = 0;
  let terpicu = 0;

  for (const w of watchlists ?? []) {
    if (w.target_harga == null) continue;
    dievaluasi++;

    const hargaSekarang = await hargaSaatIniUntukWatchlist(admin, w);
    if (hargaSekarang == null || hargaSekarang > w.target_harga) continue;

    const batasDedup = new Date(Date.now() - JENDELA_DEDUP_HARI * 86_400_000).toISOString();
    const { data: sudahAda } = await admin
      .from("alert_deliveries")
      .select("id")
      .eq("watchlist_id", w.id)
      .eq("harga_pemicu", hargaSekarang)
      .gte("dikirim_at", batasDedup)
      .limit(1)
      .maybeSingle();
    if (sudahAda) continue;

    if (w.kanal === "wa") {
      // Tidak pernah dikirim otomatis -- masuk /admin/kirim untuk disalin manual.
      await admin.from("alert_deliveries").insert({
        watchlist_id: w.id,
        harga_pemicu: hargaSekarang,
        kanal: "wa",
        status: "menunggu",
      });
      terpicu++;
      continue;
    }

    const { data: authUser } = await admin.auth.admin.getUserById(w.user_id);
    const email = authUser?.user?.email;
    const rupiah = (n: number) => "Rp " + n.toLocaleString("id-ID");
    const terkirim = email
      ? await kirimEmail(
          email,
          "Harga yang kamu pantau turun",
          `Harga sekarang ${rupiah(hargaSekarang)}, target kamu ${rupiah(w.target_harga)}.\n\nCek di ${process.env.NEXT_PUBLIC_SITE_URL}/akun`,
        )
      : false;

    await admin.from("alert_deliveries").insert({
      watchlist_id: w.id,
      harga_pemicu: hargaSekarang,
      kanal: "email",
      status: terkirim ? "terkirim" : "gagal",
    });
    if (terkirim) terpicu++;
  }

  return NextResponse.json({ dievaluasi, terpicu });
}
