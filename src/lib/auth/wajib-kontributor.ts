import { createClient } from "@/lib/supabase/server";

// Dipanggil di setiap Server Function yang menulis data kontributor.
// Proxy (src/proxy.ts) sudah menjaga route-nya, tapi Next.js sendiri
// memperingatkan: Server Function bisa dipindah rute tanpa proxy ikut
// diperbarui, jadi pengecekan di sini tidak boleh hanya mengandalkan itu.
export async function wajibKontributor(): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Belum masuk.");

  const { data: profil } = await supabase.from("profiles").select("peran").eq("id", user.id).single();
  const peran = profil?.peran ?? "member";
  if (peran !== "kontributor" && peran !== "admin") {
    throw new Error("Akun ini belum jadi kontributor.");
  }
}

export async function wajibAdmin(): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Belum masuk.");

  const { data: profil } = await supabase.from("profiles").select("peran").eq("id", user.id).single();
  if ((profil?.peran ?? "member") !== "admin") throw new Error("Butuh peran admin.");
}
