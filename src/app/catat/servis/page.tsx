import { createClient } from "@/lib/supabase/server";
import { CatatServisForm } from "./catat-servis-form";

export default async function CatatServisPage() {
  const supabase = await createClient();
  const [{ data: produk }, { data: workshop }, { data: jenis }, { data: grade }] = await Promise.all([
    supabase.from("products").select("id, model, varian").eq("aktif", true),
    supabase.from("workshops").select("id, nama").eq("aktif", true).order("nama"),
    supabase.from("service_types").select("id, nama, kategori, butuh_grade").order("kategori"),
    supabase.from("part_grades").select("id, kode, nama, kategori").order("urutan"),
  ]);

  return <CatatServisForm produk={produk ?? []} workshop={workshop ?? []} jenis={jenis ?? []} grade={grade ?? []} />;
}
