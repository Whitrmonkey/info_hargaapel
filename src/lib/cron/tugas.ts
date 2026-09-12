import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import { ambilAdapter } from "@/lib/scrape/adapters";
import { jalankanScrape, type SourceRow } from "@/lib/scrape/run";
import { hitungSinyalSemua } from "@/lib/data/hitung-sinyal-semua";
import { hargaSaatIniUntukWatchlist } from "@/lib/data/harga-watchlist";
import { verifikasiLaporanMenunggu } from "@/lib/data/verifikasi-laporan";
import { situsUrl } from "@/lib/situs";

type Admin = SupabaseClient<Database>;

// Empat tugas harian, dipisah dari rute HTTP-nya supaya bisa dijalankan
// BERURUTAN dalam satu proses.
//
// Sebelumnya tiap tugas punya jadwal sendiri di jam yang berbeda -- scrape
// 20:00, verifikasi 21:30, alert 22:00 -- dan tiap tugas cuma BERHARAP yang
// sebelumnya sudah selesai. Kalau scrape molor, verifikasi berjalan di atas
// data kemarin dan alert mengabarkan harga yang sudah basi. Jarak jam bukan
// urutan; ini yang memperbaikinya.

export const JENDELA_DEDUP_HARI = 7;

export interface HasilTugas {
  nama: string;
  ok: boolean;
  ringkas: string;
}

export async function tugasScrape(admin: Admin): Promise<HasilTugas> {
  const { data: sources, error } = await admin
    .from("sources")
    .select("*")
    .eq("aktif", true)
    .eq("cadence", "harian");
  if (error) return { nama: "scrape", ok: false, ringkas: error.message };

  let sukses = 0;
  let gagal = 0;
  for (const source of (sources ?? []) as SourceRow[]) {
    const adapter = ambilAdapter(source.adapter);
    if (!adapter) {
      gagal++;
      continue;
    }
    const h = await jalankanScrape(admin, source, adapter, "cron");
    if (h.status === "gagal") gagal++;
    else sukses++;
  }
  return { nama: "scrape", ok: gagal === 0, ringkas: `${sukses} sumber sukses, ${gagal} gagal` };
}

export async function tugasRefresh(admin: Admin): Promise<HasilTugas> {
  const { error } = await admin.rpc("refresh_agregat");
  if (error) return { nama: "refresh", ok: false, ringkas: error.message };
  const jumlahSinyal = await hitungSinyalSemua(admin);
  return { nama: "refresh", ok: true, ringkas: `agregat disegarkan, ${jumlahSinyal} sinyal` };
}

export async function tugasVerifikasi(admin: Admin): Promise<HasilTugas> {
  const h = await verifikasiLaporanMenunggu(admin);
  return {
    nama: "verifikasi",
    ok: true,
    ringkas: `${h.diperiksa} diperiksa, ${h.terverifikasi} terverifikasi, ${h.meleset} meleset, ${h.kedaluwarsa} kedaluwarsa`,
  };
}

async function kirimEmail(ke: string, subjek: string, teks: string): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return false; // belum dikonfigurasi -- lewati, jangan pura-pura terkirim

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "content-type": "application/json" },
    body: JSON.stringify({ from: process.env.EMAIL_FROM, to: ke, subject: subjek, text: teks }),
  });
  return res.ok;
}

export async function tugasAlert(admin: Admin): Promise<HasilTugas> {
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
          `Harga sekarang ${rupiah(hargaSekarang)}, target kamu ${rupiah(w.target_harga)}.\n\nCek di ${situsUrl()}/akun`,
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

  return { nama: "alert", ok: true, ringkas: `${dievaluasi} dievaluasi, ${terpicu} terpicu` };
}

// Urutannya yang jadi intinya:
//   scrape     data baru masuk
//   refresh    agregat menghitung ulang DI ATAS data baru itu
//   verifikasi laporan pembaca dinilai dengan observasi yang baru masuk
//   alert      pemberitahuan memakai angka yang sudah disegarkan
//
// Satu tugas gagal tidak menghentikan sisanya: scrape yang mati tidak boleh
// ikut membatalkan pemberitahuan harga yang sudah terlanjur turun kemarin.
export async function jalankanHarian(admin: Admin): Promise<HasilTugas[]> {
  const hasil: HasilTugas[] = [];
  for (const tugas of [tugasScrape, tugasRefresh, tugasVerifikasi, tugasAlert]) {
    try {
      hasil.push(await tugas(admin));
    } catch (e) {
      hasil.push({ nama: tugas.name, ok: false, ringkas: e instanceof Error ? e.message : "galat tidak dikenal" });
    }
  }
  return hasil;
}
