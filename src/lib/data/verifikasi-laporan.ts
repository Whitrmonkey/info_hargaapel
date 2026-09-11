import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import { hitungBobot, melesetBeruntun, nilaiLaporan, type Pembanding, type StatusLaporan } from "@/lib/reputasi";

type Admin = SupabaseClient<Database>;

export interface HasilVerifikasi {
  diperiksa: number;
  terverifikasi: number;
  meleset: number;
  kedaluwarsa: number;
  reputasi_diperbarui: number;
}

// Dijalankan cron harian. Membandingkan laporan berstatus baru/menunggu
// dengan observasi independen yang masuk SESUDAH laporan dibuat.
//
// Observasi pembanding sengaja diambil dari price_observations -- hasil
// scrape dan pencatatan lapangan operator -- bukan dari laporan pembaca
// lain. Kalau laporan bisa memverifikasi laporan, sepuluh akun yang saling
// mengonfirmasi sudah cukup untuk menggerakkan angka, dan itu persis yang
// harus dicegah.
export async function verifikasiLaporanMenunggu(admin: Admin, sekarang = new Date()): Promise<HasilVerifikasi> {
  const { data: laporan } = await admin
    .from("laporan_harga")
    .select("id, user_id, product_id, kondisi, grade, garansi, harga_jadi, dibuat_at")
    .in("status", ["baru", "menunggu"])
    .order("dibuat_at");

  const hasil: HasilVerifikasi = {
    diperiksa: 0,
    terverifikasi: 0,
    meleset: 0,
    kedaluwarsa: 0,
    reputasi_diperbarui: 0,
  };
  if (!laporan || laporan.length === 0) return hasil;

  const perluHitungUlang = new Set<string>();

  for (const l of laporan) {
    hasil.diperiksa++;

    // Pembanding harus grup yang SAMA PERSIS: produk, kondisi, grade, dan
    // garansi. Membandingkan lintas grup berarti menilai laporan dengan
    // barang yang bukan barangnya.
    let q = admin
      .from("price_observations")
      .select("id, harga, observed_at")
      .eq("product_id", l.product_id)
      .eq("sisi", "jual")
      .eq("kondisi", l.kondisi)
      .eq("garansi", l.garansi)
      .gt("observed_at", l.dibuat_at)
      .order("observed_at");
    q = l.grade ? q.eq("grade", l.grade) : q.is("grade", null);
    const { data: obs } = await q;

    const pembanding: Pembanding[] = (obs ?? [])
      .filter((o): o is { id: number; harga: number; observed_at: string } =>
        o.id != null && o.harga != null && o.observed_at != null,
      )
      .map((o) => ({ harga: o.harga, observed_at: o.observed_at, observasi_id: o.id }));

    const nilai = nilaiLaporan({ harga_jadi: l.harga_jadi, dibuat_at: l.dibuat_at }, pembanding, sekarang);
    if (nilai.status === "menunggu") {
      await admin.from("laporan_harga").update({ status: "menunggu" }).eq("id", l.id);
      continue;
    }

    await admin
      .from("laporan_harga")
      .update({
        status: nilai.status,
        observasi_id: nilai.observasi_id ?? null,
        ditinjau_at: sekarang.toISOString(),
      })
      .eq("id", l.id);

    if (nilai.status === "terverifikasi") hasil.terverifikasi++;
    if (nilai.status === "meleset") hasil.meleset++;
    if (nilai.status === "kedaluwarsa") hasil.kedaluwarsa++;

    // Kedaluwarsa tidak mengubah apa pun soal bobot, jadi tidak perlu
    // memicu hitung ulang.
    if (nilai.status !== "kedaluwarsa") perluHitungUlang.add(l.user_id);
  }

  for (const userId of perluHitungUlang) {
    hasil.reputasi_diperbarui += await hitungUlangReputasi(admin, userId);
  }
  return hasil;
}

// Bobot berlaku PER KATEGORI PRODUK. Reputasi di iPhone tidak otomatis
// berlaku di Mac -- itu menutup jalan membangun reputasi murah di kategori
// ramai lalu memakainya di kategori sepi.
export async function hitungUlangReputasi(admin: Admin, userId: string): Promise<number> {
  const { data: laporan } = await admin
    .from("laporan_harga")
    .select("status, dibuat_at, products(kategori)")
    .eq("user_id", userId)
    .order("dibuat_at", { ascending: false });

  const perKategori = new Map<string, StatusLaporan[]>();
  for (const l of laporan ?? []) {
    const kategori = (l.products as { kategori: string } | null)?.kategori;
    if (!kategori) continue;
    const arr = perKategori.get(kategori) ?? [];
    arr.push(l.status as StatusLaporan);
    perKategori.set(kategori, arr);
  }

  let n = 0;
  for (const [kategori, status] of perKategori) {
    const terverifikasi = status.filter((s) => s === "terverifikasi").length;
    const meleset = status.filter((s) => s === "meleset").length;
    const bobot = hitungBobot(terverifikasi, meleset, melesetBeruntun(status));

    const { error } = await admin.from("reputasi").upsert(
      {
        user_id: userId,
        kategori,
        bobot,
        terverifikasi,
        meleset,
        diperbarui_at: new Date().toISOString(),
      },
      { onConflict: "user_id,kategori" },
    );
    if (!error) n++;
  }
  return n;
}

export async function bobotUntukKategori(admin: Admin, userId: string, kategori: string): Promise<number> {
  const { data } = await admin
    .from("reputasi")
    .select("bobot")
    .eq("user_id", userId)
    .eq("kategori", kategori)
    .maybeSingle();
  return data?.bobot ?? 0;
}
