"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { Garansi, Grade, Kondisi } from "@/lib/pasaran";

export async function pantauDevice(
  productId: string,
  kondisi: Kondisi,
  grade: Grade | null,
  garansi: Garansi,
  medianSaatIni: number | null,
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Belum masuk.");

  const { error } = await supabase.from("watchlists").insert({
    user_id: user.id,
    jenis: "device",
    product_id: productId,
    kondisi,
    grade,
    garansi,
    target_harga: medianSaatIni,
    kanal: "email",
  });
  if (error) throw new Error(error.message);
  revalidatePath("/p");
}
