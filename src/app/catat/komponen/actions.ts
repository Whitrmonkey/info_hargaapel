"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { kelompokkanKomponen, type ObservasiKomponen } from "@/lib/komponen";
import { ambilHargaUnitSecondStandar } from "@/lib/data/harga-unit";
import { wajibKontributor } from "@/lib/auth/wajib-kontributor";

export interface SimpanKomponenInput {
  sellerId: string;
  productId: string;
  componentTypeId: string;
  boardGradeId: string | null;
  partGradeId: string | null;
  harga: number;
}

export interface SimpanKomponenHasil {
  ok: true;
  posisi: { rasio: number; jumlah_penjual: number } | null;
}

export async function simpanHargaKomponen(input: SimpanKomponenInput): Promise<SimpanKomponenHasil> {
  await wajibKontributor();
  if (input.harga <= 0) throw new Error("Harga harus lebih dari nol.");

  const admin = createAdminClient();
  const { error } = await admin.from("component_observations").insert({
    seller_id: input.sellerId,
    product_id: input.productId,
    component_type_id: input.componentTypeId,
    board_grade_id: input.boardGradeId,
    part_grade_id: input.partGradeId,
    harga: input.harga,
    sumber: "manual",
  });
  if (error) throw new Error(error.message);

  const posisi = await hitungPosisi(input);
  return { ok: true, posisi };
}

async function hitungPosisi(input: SimpanKomponenInput) {
  const supabase = await createClient();
  const [{ data }, hargaUnit] = await Promise.all([
    supabase
      .from("component_observations")
      .select("*")
      .eq("product_id", input.productId)
      .eq("component_type_id", input.componentTypeId),
    ambilHargaUnitSecondStandar(input.productId),
  ]);

  // koreksi_atas diisi di baris koreksi (baru), bukan di baris lama yang
  // dikoreksi -- buang baris yang sudah dirujuk sebagai koreksi_atas oleh
  // baris lain, bukan baris yang koreksi_atas-nya sendiri null.
  const tertimpa = new Set((data ?? []).map((o) => o.koreksi_atas).filter((v): v is number => v != null));

  const observasi: ObservasiKomponen[] = (data ?? [])
    .filter(
      (o): o is typeof o & { id: number; seller_id: string; harga: number; observed_at: string } =>
        o.id != null && o.seller_id != null && o.harga != null && o.observed_at != null && !tertimpa.has(o.id),
    )
    .filter((o) => (o.board_grade_id ?? null) === (input.boardGradeId ?? null) && (o.part_grade_id ?? null) === (input.partGradeId ?? null))
    .map((o) => ({
      id: o.id,
      product_id: input.productId,
      seller_id: o.seller_id,
      component_type_id: input.componentTypeId,
      board_grade_id: o.board_grade_id,
      part_grade_id: o.part_grade_id,
      harga: o.harga,
      observed_at: o.observed_at,
    }));

  const [grup] = kelompokkanKomponen(observasi, hargaUnit);
  if (!grup || grup.rasio == null) return null;
  return { rasio: grup.rasio, jumlah_penjual: grup.jumlah_penjual };
}
