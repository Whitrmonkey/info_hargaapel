import { createClient } from "@/lib/supabase/server";
import { ServisPicker } from "./servis-picker";
import { FooterLegal } from "@/components/footer-legal";

export default async function ServisPage() {
  const supabase = await createClient();
  const [{ data: produk }, { data: jenis }] = await Promise.all([
    supabase.from("products").select("slug, model, varian, kategori").eq("aktif", true).order("model"),
    supabase.from("service_types").select("slug, nama, kategori").order("kategori"),
  ]);

  return (
    <div className="mx-auto max-w-[760px] px-5 pb-20 sm:px-6">
      <div className="py-8">
        <p className="mb-1 text-sm text-muted-foreground">Servis</p>
        <h1 className="mb-8 text-2xl font-bold tracking-tight sm:text-3xl">Cari sebaran harga servis</h1>
        <ServisPicker produk={produk ?? []} jenis={jenis ?? []} />
        <FooterLegal />
      </div>
    </div>
  );
}
