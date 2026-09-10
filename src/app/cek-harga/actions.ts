"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

// target_harga diisi dari median SAAT INI (bukan diminta ke user secara
// eksplisit) -- itu acuan "turun dari sini" yang dipakai cron alert nanti.
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
  revalidatePath("/cek-harga");
}
