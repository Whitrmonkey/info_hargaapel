"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { kelompokkanServis, vonisServis, type ObservasiServis } from "@/lib/servis";
import { wajibKontributor } from "@/lib/auth/wajib-kontributor";

export interface SimpanServisInput {
  workshopId: string;
  productId: string;
  serviceTypeId: string;
  partGradeId: string | null;
  harga: number;
  termasukJasa: boolean;
  noFixNoPay: boolean;
  garansiHari: number | null;
}

export interface SimpanServisHasil {
  ok: true;
  posisi: { p50: number; jumlah_bengkel: number; vonis: ReturnType<typeof vonisServis> } | null;
}

export async function simpanHargaServis(input: SimpanServisInput): Promise<SimpanServisHasil> {
  await wajibKontributor();
  if (input.harga <= 0) throw new Error("Harga harus lebih dari nol.");

  const admin = createAdminClient();
  const { error } = await admin.from("service_observations").insert({
    workshop_id: input.workshopId,
    product_id: input.productId,
    service_type_id: input.serviceTypeId,
    part_grade_id: input.partGradeId,
    harga: input.harga,
    termasuk_jasa: input.termasukJasa,
    no_fix_no_pay: input.noFixNoPay,
    garansi_hari: input.garansiHari,
    sumber: "manual",
  });
  if (error) throw new Error(error.message);

  const posisi = await hitungPosisi(input);
  return { ok: true, posisi };
}

async function hitungPosisi(input: SimpanServisInput) {
  if (!input.termasukJasa) return null; // hanya termasuk_jasa=true yang masuk sebaran

  const supabase = await createClient();
  const { data } = await supabase
    .from("service_observations")
    .select("*")
    .eq("product_id", input.productId)
    .eq("service_type_id", input.serviceTypeId)
    .is("koreksi_atas", null);

  const observasi: ObservasiServis[] = (data ?? [])
    .filter(
      (o): o is typeof o & { id: number; workshop_id: string; harga: number; observed_at: string } =>
        o.id != null && o.workshop_id != null && o.harga != null && o.observed_at != null,
    )
    .filter((o) => (o.part_grade_id ?? null) === (input.partGradeId ?? null))
    .map((o) => ({
      id: o.id,
      product_id: input.productId,
      workshop_id: o.workshop_id,
      service_type_id: input.serviceTypeId,
      part_grade_id: o.part_grade_id,
      harga: o.harga,
      termasuk_jasa: o.termasuk_jasa,
      observed_at: o.observed_at,
    }));

  const [grup] = kelompokkanServis(observasi);
  if (!grup) return null;
  return { p50: grup.p50, jumlah_bengkel: grup.jumlah_bengkel, vonis: vonisServis(input.harga, grup) };
}
