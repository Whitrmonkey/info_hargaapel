"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { periksaPenilaian, statusDariSkor, type NilaiLaporan, type StatusDiskusi } from "@/lib/suara";

export interface HasilSuara {
  ok: boolean;
  pesan: string;
}

// Menilai laporan harga. Ini TIDAK menggerakkan harga dan tidak bisa
// membuat laporan masuk hitungan -- ia hanya mempercepat atau menahan
// antrean verifikasi. Satu-satunya yang memutuskan tetap cron verifikasi.
export async function nilaiLaporanHarga(
  laporanId: number,
  nilai: NilaiLaporan,
  alasan: string | null,
): Promise<HasilSuara> {
  const periksa = periksaPenilaian(nilai, alasan);
  if (!periksa.boleh) return { ok: false, pesan: periksa.pesan! };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, pesan: "Masuk dulu untuk menilai." };

  const { error } = await supabase
    .from("penilaian_laporan")
    .upsert(
      { laporan_id: laporanId, user_id: user.id, nilai, alasan: nilai === "meragukan" ? alasan : null },
      { onConflict: "laporan_id,user_id" },
    );
  if (error) return { ok: false, pesan: "Gagal menyimpan penilaian." };

  revalidatePath("/");
  return { ok: true, pesan: nilai === "masuk_akal" ? "Tercatat masuk akal." : "Tercatat meragukan, berikut alasannya." };
}

// Suara diskusi: naik dan turun, skor bersih menentukan urutan. Skor sangat
// rendah melipat kiriman, tidak pernah menghapusnya.
export async function suaraDiskusi(diskusiId: number, arah: 1 | -1): Promise<HasilSuara> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, pesan: "Masuk dulu untuk memberi suara." };

  const { error } = await supabase
    .from("suara_diskusi")
    .upsert({ diskusi_id: diskusiId, user_id: user.id, arah }, { onConflict: "diskusi_id,user_id" });
  if (error) return { ok: false, pesan: "Gagal menyimpan suara." };

  // Skor dan status dihitung ulang service role: keduanya kolom turunan,
  // bukan sesuatu yang boleh ditulis klien.
  const admin = createAdminClient();
  const [{ data: semua }, { data: kiriman }] = await Promise.all([
    admin.from("suara_diskusi").select("arah").eq("diskusi_id", diskusiId),
    admin.from("diskusi").select("status").eq("id", diskusiId).single(),
  ]);
  const skor = (semua ?? []).reduce((n, s) => n + s.arah, 0);
  const status = statusDariSkor(skor, (kiriman?.status ?? "tampil") as StatusDiskusi);
  await admin.from("diskusi").update({ skor, status }).eq("id", diskusiId);

  revalidatePath("/");
  return { ok: true, pesan: "Suara tercatat." };
}
