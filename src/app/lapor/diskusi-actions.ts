"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { alasanLaporSah, PESAN_TAHAN, periksaIsi, saringTeks } from "@/lib/diskusi";

export interface HasilDiskusi {
  ok: boolean;
  pesan: string;
  ditahan?: boolean;
}

async function ambilKataTahan(): Promise<Array<{ kata: string }>> {
  const admin = createAdminClient();
  const { data } = await admin.from("kata_tahan").select("kata").eq("aktif", true);
  return data ?? [];
}

export async function kirimDiskusi(
  productId: string | null,
  indukId: number | null,
  isi: string,
): Promise<HasilDiskusi> {
  const periksa = periksaIsi(isi);
  if (!periksa.boleh) return { ok: false, pesan: periksa.pesan! };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, pesan: "Masuk dulu untuk ikut diskusi." };

  // Kata tuduhan MENAHAN, tidak memblokir: kirimannya tetap tersimpan dengan
  // status ditahan, penulisnya diberi tahu alasannya, dan ia bisa menyusun
  // ulang. Tidak ada yang dibuang diam-diam.
  const { tahan } = saringTeks(isi, await ambilKataTahan());

  const { error } = await supabase.from("diskusi").insert({
    product_id: productId,
    induk_id: indukId,
    user_id: user.id,
    isi: isi.trim(),
    status: tahan ? "ditahan" : "tampil",
  });
  if (error) return { ok: false, pesan: "Gagal menyimpan kiriman." };

  revalidatePath("/");
  return tahan
    ? { ok: true, ditahan: true, pesan: PESAN_TAHAN }
    : { ok: true, pesan: "Terkirim." };
}

// Riwayat penyuntingan disimpan. Kiriman yang diubah setelah dibalas
// menampilkan penanda, dan isi lamanya tidak hilang.
export async function suntingDiskusi(diskusiId: number, isiBaru: string): Promise<HasilDiskusi> {
  const periksa = periksaIsi(isiBaru);
  if (!periksa.boleh) return { ok: false, pesan: periksa.pesan! };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, pesan: "Masuk dulu." };

  const admin = createAdminClient();
  const { data: lama } = await admin
    .from("diskusi")
    .select("id, user_id, isi, status")
    .eq("id", diskusiId)
    .single();
  if (!lama || lama.user_id !== user.id) return { ok: false, pesan: "Kiriman ini bukan milikmu." };

  const { tahan } = saringTeks(isiBaru, await ambilKataTahan());

  await admin.from("diskusi_revisi").insert({ diskusi_id: diskusiId, isi_lama: lama.isi });
  const { error } = await admin
    .from("diskusi")
    .update({
      isi: isiBaru.trim(),
      disunting_at: new Date().toISOString(),
      // Menyusun ulang kiriman yang tertahan boleh melepaskannya, tapi
      // menulis tuduhan baru menahannya lagi.
      status: tahan ? "ditahan" : lama.status === "ditahan" ? "tampil" : lama.status,
    })
    .eq("id", diskusiId);
  if (error) return { ok: false, pesan: "Gagal menyimpan suntingan." };

  revalidatePath("/");
  return tahan ? { ok: true, ditahan: true, pesan: PESAN_TAHAN } : { ok: true, pesan: "Tersimpan." };
}

export async function laporkan(
  target: { diskusiId?: number; laporanId?: number },
  alasan: string,
): Promise<HasilDiskusi> {
  if (!alasanLaporSah(alasan)) return { ok: false, pesan: "Pilih alasannya dulu." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, pesan: "Masuk dulu untuk melapor." };

  const { error } = await supabase.from("laporan_pelanggaran").insert({
    diskusi_id: target.diskusiId ?? null,
    laporan_id: target.laporanId ?? null,
    user_id: user.id,
    alasan,
  });
  if (error) return { ok: false, pesan: "Gagal mengirim laporan." };
  return { ok: true, pesan: "Terkirim ke peninjau. Terima kasih." };
}
