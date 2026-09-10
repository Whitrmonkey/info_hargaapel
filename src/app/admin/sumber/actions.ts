"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { wajibAdmin } from "@/lib/auth/wajib-kontributor";
import { ambilAdapter } from "@/lib/scrape/adapters";
import { jalankanScrape, type SourceRow } from "@/lib/scrape/run";
import { revalidatePath } from "next/cache";

export async function jalankanSekarang(sourceId: string) {
  await wajibAdmin();
  const admin = createAdminClient();
  const { data: source } = await admin.from("sources").select("*").eq("id", sourceId).single();
  if (!source) throw new Error("Sumber tidak ditemukan.");

  const adapter = ambilAdapter(source.adapter);
  if (!adapter) throw new Error(`Adapter '${source.adapter}' tidak dikenal.`);

  await jalankanScrape(admin, source as SourceRow, adapter, "manual");
  revalidatePath("/admin/sumber");
}

export async function petakanProduk(mapId: string, productId: string, grade: string | null) {
  await wajibAdmin();
  const admin = createAdminClient();
  const { error } = await admin.from("source_product_map").update({ product_id: productId, grade }).eq("id", mapId);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/sumber");
}

export async function abaikanPemetaan(mapId: string) {
  await wajibAdmin();
  const admin = createAdminClient();
  await admin.from("source_product_map").update({ abaikan: true }).eq("id", mapId);
  revalidatePath("/admin/sumber");
}
