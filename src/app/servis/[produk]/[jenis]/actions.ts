"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

// Dipindah ke sini dari /cek-harga: halaman itu sekarang untuk harga device,
// sedangkan pantauan harga servis memang milik halaman servisnya sendiri.
// target_harga diisi dari median SAAT INI, bukan diminta ke pengguna -- itu
// acuan "turun dari sini" yang dipakai cron alert.
export async function pantauServis(
  productId: string,
  serviceTypeId: string,
  partGradeId: string | null,
  medianSaatIni: number | null,
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Belum masuk.");

  const { error } = await supabase.from("watchlists").insert({
    user_id: user.id,
    jenis: "servis",
    product_id: productId,
    service_type_id: serviceTypeId,
    part_grade_id: partGradeId,
    target_harga: medianSaatIni,
    kanal: "email",
  });
  if (error) throw new Error(error.message);
  revalidatePath("/servis");
}
