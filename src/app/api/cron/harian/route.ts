import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { jalankanHarian } from "@/lib/cron/tugas";

export const runtime = "nodejs";
export const maxDuration = 300;

// Satu cron harian yang menjalankan keempat tugas BERURUTAN, menggantikan
// empat jadwal terpisah di jam yang berbeda.
//
// Pemicunya batasan plan Hobby: cron paling sering sekali sehari, jadi
// refresh tiap jam ditolak saat deploy. (Jumlah cron BUKAN masalahnya --
// Hobby mengizinkan 100.)
//
// Tapi alasan sebenarnya menggabungkan, bukan sekadar menjarangkan, ada di
// baris lain dokumentasi Vercel: pada Hobby ketepatan jadwalnya cuma
// per-jam, +/- 59 menit. Artinya scrape yang dijadwalkan 20:00 bisa
// benar-benar jalan 20:59, sementara verifikasi yang dijadwalkan 21:30
// jalan tepat 21:30 -- verifikasi mendahului scrape, dan menilai laporan
// memakai data kemarin.
//
// Jarak jam tidak pernah jadi urutan. Dirangkai dalam satu proses, tugas
// berikutnya menunggu yang sebelumnya selesai, dan itu berlaku di plan mana
// pun.
export async function GET(req: Request) {
  const rahasia = process.env.CRON_SECRET;
  if (rahasia && req.headers.get("authorization") !== `Bearer ${rahasia}`) {
    return new NextResponse(null, { status: 401 });
  }

  const mulai = Date.now();
  const hasil = await jalankanHarian(createAdminClient());
  const gagal = hasil.filter((h) => !h.ok);

  return NextResponse.json(
    {
      ok: gagal.length === 0,
      detik: Math.round((Date.now() - mulai) / 1000),
      tugas: hasil,
    },
    // 207: sebagian tugas gagal tapi sisanya jalan. Bukan 500, karena
    // menandai seluruh proses gagal akan menyembunyikan yang berhasil.
    { status: gagal.length === 0 ? 200 : 207 },
  );
}
