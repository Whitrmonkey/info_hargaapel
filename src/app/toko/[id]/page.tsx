import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { FooterLegal } from "@/components/footer-legal";

const rupiah = (n: number) => "Rp " + n.toLocaleString("id-ID");

function jamKeTeks(iso: string): string {
  const jam = Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / 3_600_000));
  if (jam < 24) return `${jam} jam lalu`;
  return `${Math.round(jam / 24)} hari lalu`;
}

// /toko/[id] cuma untuk penjual yang boleh disebut namanya -- yaitu sumber
// yang menerbitkan harganya sendiri di web (scraper), bukan hasil pencatatan
// manual (aturan keras 5, SPEC.md bagian penamaan penjual). Gerbangnya bukan
// dicek dari tabel sources (RLS-nya cuma service_role), tapi dari ada/tidaknya
// baris harga_terkini milik penjual ini dengan sumber = 'scraper'.
export default async function TokoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: seller }, { data: observasi }] = await Promise.all([
    supabase.from("sellers").select("id, nama, tipe, area").eq("id", id).single(),
    supabase.from("harga_terkini").select("*").eq("seller_id", id).eq("sumber", "scraper"),
  ]);

  if (!seller || !observasi || observasi.length === 0) notFound();

  const productIds = Array.from(new Set(observasi.map((o) => o.product_id).filter((v): v is string => v != null)));
  const { data: products } = await supabase
    .from("products")
    .select("id, slug, model, varian, kategori")
    .in("id", productIds);
  const productById = new Map((products ?? []).map((p) => [p.id, p]));

  const baris = observasi
    .filter(
      (o): o is typeof o & { id: number; product_id: string; harga: number; observed_at: string } =>
        o.id != null && o.product_id != null && o.harga != null && o.observed_at != null && productById.has(o.product_id),
    )
    .map((o) => ({ ...o, produk: productById.get(o.product_id)! }))
    .sort((a, b) => a.produk.model.localeCompare(b.produk.model));

  return (
    <div className="mx-auto max-w-[760px] px-5 pb-20 sm:px-6">

      <div className="py-8">
        <p className="mb-1 text-sm text-muted-foreground">{seller.area} · {seller.tipe}</p>
        <h1 className="mb-2 text-2xl font-bold tracking-tight sm:text-3xl">{seller.nama}</h1>
        <p className="mb-8 max-w-prose text-sm text-muted-foreground">
          Semua harga yang terpantau dari penjual ini. Ditampilkan dengan nama karena penjual ini menerbitkan
          harganya sendiri di web dan setiap baris bisa dicek langsung ke sumbernya.
        </p>

        <div className="space-y-3">
          {baris.map((o) => (
            <div key={o.id} className="rounded-lg border border-border p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <Link href={`/p/${o.produk.slug}`} className="font-medium underline underline-offset-2">
                    {o.produk.model} {o.produk.varian}
                  </Link>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {o.kondisi === "baru" ? "Baru" : `Second · ${o.grade ?? "?"}`} · garansi {o.garansi} · dicek{" "}
                    {jamKeTeks(o.observed_at)}
                  </p>
                </div>
                <p className="whitespace-nowrap text-right font-semibold">{rupiah(o.harga)}</p>
              </div>
              {o.url && (
                <a href={o.url} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block text-xs underline underline-offset-2">
                  Lihat sumber →
                </a>
              )}
            </div>
          ))}
        </div>

        <FooterLegal />
      </div>
    </div>
  );
}
