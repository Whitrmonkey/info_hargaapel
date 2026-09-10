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
