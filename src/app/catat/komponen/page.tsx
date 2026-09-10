import { createClient } from "@/lib/supabase/server";
import { CatatKomponenForm } from "./catat-komponen-form";

function hariLaluIso(n: number): string {
  return new Date(Date.now() - n * 86_400_000).toISOString();
}

export default async function CatatKomponenPage() {
  const supabase = await createClient();
  const batas30Hari = hariLaluIso(30);

  const [{ data: produk }, { data: seller }, { data: observasi30Hari }, { data: componentTypes }, { data: boardGrades }, { data: partGrades }] =
    await Promise.all([
      supabase.from("products").select("id, model, varian").eq("aktif", true),
      supabase.from("sellers").select("id, nama").eq("aktif", true).order("nama"),
      supabase.from("component_observations").select("product_id").gte("observed_at", batas30Hari),
      supabase.from("component_types").select("id, kode, nama, kategori_grade").order("urutan"),
      supabase.from("board_grades").select("id, kode, nama").order("urutan", { ascending: false }),
      supabase.from("part_grades").select("id, kode, nama, kategori").order("urutan", { ascending: false }),
    ]);

  const frekuensi: Record<string, number> = {};
  for (const o of observasi30Hari ?? []) {
    frekuensi[o.product_id] = (frekuensi[o.product_id] ?? 0) + 1;
  }

  return (
    <CatatKomponenForm
      produk={produk ?? []}
      seller={seller ?? []}
      frekuensi={frekuensi}
      componentTypes={componentTypes ?? []}
      boardGrades={boardGrades ?? []}
      partGrades={partGrades ?? []}
    />
  );
}
