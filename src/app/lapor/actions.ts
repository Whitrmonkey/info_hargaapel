"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { bobotUntukKategori } from "@/lib/data/verifikasi-laporan";

export interface LaporInput {
  productId: string;
  kondisi: string;
  grade: string | null;
  garansi: string;
  area: string;
  hargaJadi: number;
  hargaBuka: number | null;
  tanggalBeli: string | null;
  kelengkapan: string[];
  catatan: string | null;
}

export interface LaporHasil {
  ok: boolean;
  pesan: string;
}

const KELENGKAPAN_SAH = ["dus", "carger", "kabel", "nota", "kartu_garansi"];

export async function kirimLaporan(input: LaporInput): Promise<LaporHasil> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, pesan: "Masuk dulu untuk melapor." };

  if (input.hargaJadi <= 0) return { ok: false, pesan: "Harga jadinya belum diisi." };
  if (input.hargaBuka != null && input.hargaBuka < input.hargaJadi) {
    return { ok: false, pesan: "Harga buka tidak mungkin lebih rendah dari harga jadi." };
  }

  const admin = createAdminClient();
  const { data: produk } = await admin.from("products").select("kategori").eq("id", input.productId).maybeSingle();
  if (!produk) return { ok: false, pesan: "Produknya tidak dikenali." };

  // Bobot DIBEKUKAN saat lapor, per kategori produk itu. Reputasi yang
  // didapat belakangan tidak boleh menghidupkan laporan lama secara surut.
  const bobot = await bobotUntukKategori(admin, user.id, produk.kategori);

  const { error } = await supabase.from("laporan_harga").insert({
    user_id: user.id,
    product_id: input.productId,
    kondisi: input.kondisi,
    grade: input.grade,
    garansi: input.garansi,
    area: input.area,
    harga_jadi: input.hargaJadi,
    harga_buka: input.hargaBuka,
    tanggal_beli: input.tanggalBeli,
    kelengkapan: input.kelengkapan.filter((k) => KELENGKAPAN_SAH.includes(k)),
    catatan: input.catatan,
    bobot_saat_lapor: bobot,
    // status dibiarkan 'baru'. Tidak ada jalur mana pun dari sini yang bisa
    // menuliskannya jadi terverifikasi -- itu hanya milik cron verifikasi.
  });
  if (error) return { ok: false, pesan: "Gagal menyimpan laporan." };

  revalidatePath("/");
  return {
    ok: true,
    pesan:
      input.hargaBuka != null
        ? "Tersimpan. Karena harga bukanya ikut disebut, laporan ini masuk jalur verifikasi yang lebih cepat."
        : "Tersimpan. Laporan ini menunggu dibandingkan dengan harga toko yang masuk setelah ini.",
  };
}
