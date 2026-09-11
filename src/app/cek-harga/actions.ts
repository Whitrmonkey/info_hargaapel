"use server";

import { createAdminClient } from "@/lib/supabase/admin";

const KONDISI_SAH = ["baru", "second", "refurb"];
const GRADE_SAH = ["mulus", "standar", "ekonomis"];
const GARANSI_SAH = ["resmi", "inter", "toko"];

// Catatan untuk menyusun pintasan "sering dicek". Tidak menyimpan siapa yang
// mengecek -- tanpa user_id, IP, atau sesi. Ditulis lewat service role karena
// tabelnya sengaja tidak punya policy insert untuk klien.
export async function catatPengecekan(
  productId: string,
  kondisi: string,
  grade: string | null,
  garansi: string,
): Promise<void> {
  if (!KONDISI_SAH.includes(kondisi) || !GARANSI_SAH.includes(garansi)) return;
  if (grade != null && !GRADE_SAH.includes(grade)) return;

  const admin = createAdminClient();
  await admin.from("pengecekan").insert({ product_id: productId, kondisi, grade, garansi });
}
