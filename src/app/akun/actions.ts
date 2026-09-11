"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

// Nomor WA opsional, belum ada verifikasi OTP di fase ini -- disimpan apa
// adanya dengan wa_terverifikasi tetap false. Jangan pernah dipakai untuk
// apa pun selain ditampilkan ke pemiliknya sendiri (SPEC.md BAGIAN 9).
export async function perbaruiWa(waE164: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Belum masuk.");

  const { error } = await supabase
    .from("profiles")
    .update({ wa_e164: waE164 || null, wa_terverifikasi: false })
    .eq("id", user.id);
  if (error) throw new Error(error.message);
  revalidatePath("/akun");
}

export async function nonaktifkanWatchlist(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Belum masuk.");

  const { error } = await supabase.from("watchlists").update({ aktif: false }).eq("id", id).eq("user_id", user.id);
  if (error) throw new Error(error.message);
  revalidatePath("/akun");
}

export async function keluar() {
  const supabase = await createClient();
  await supabase.auth.signOut();
}

// Perangkat yang dimiliki adalah BOBOT, bukan syarat mendaftar. Pemilik model
// tertentu dapat penanda pemilik pada laporan dan diskusi tentang model itu
// saja. Kesehatan baterai opsional dan tidak pernah terbaca publik.
// IMEI tidak pernah diminta dan tidak pernah disimpan.
export async function nyatakanPerangkat(productId: string, kesehatanBaterai: number | null) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Belum masuk.");

  const sehat = kesehatanBaterai != null && kesehatanBaterai >= 1 && kesehatanBaterai <= 100 ? kesehatanBaterai : null;
  const { error } = await supabase
    .from("perangkat_dimiliki")
    .upsert({ user_id: user.id, product_id: productId, kesehatan_baterai: sehat }, { onConflict: "user_id,product_id" });
  if (error) throw new Error(error.message);
  revalidatePath("/akun");
}

export async function hapusPerangkat(productId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Belum masuk.");
  await supabase.from("perangkat_dimiliki").delete().eq("user_id", user.id).eq("product_id", productId);
  revalidatePath("/akun");
}
