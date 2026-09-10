import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { hitungBidAsk, kelompokkanPasaran, type Garansi, type Grade, type Kondisi } from "@/lib/pasaran";
import { ambilSeriPasaran } from "@/lib/data/ambil-seri";
import { GrafikDuaSeri } from "@/components/grafik-dua-seri";
import { TombolSaluranWa } from "@/components/tombol-saluran-wa";
import { pantauDevice } from "./actions";

const rupiah = (n: number) => "Rp " + n.toLocaleString("id-ID");
const LABEL_KONDISI: Record<Kondisi, string> = { baru: "Baru segel", second: "Second", refurb: "Refurbished" };
const LABEL_GARANSI: Record<Garansi, string> = { resmi: "Garansi resmi", inter: "Inter", toko: "Garansi toko" };

export default async function ProdukPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: produk } = await supabase.from("products").select("*").eq("slug", slug).single();
  if (!produk) notFound();

  const [{ data: observasi }, { data: sellers }, { data: sinyalCache }] = await Promise.all([
    supabase.from("harga_terkini").select("*").eq("product_id", produk.id),
    supabase.from("sellers").select("id, nama"),
    supabase.from("sinyal_cache").select("*").eq("product_id", produk.id),
  ]);
  const sellerById = new Map((sellers ?? []).map((s) => [s.id, s]));

  const gabunganJual = (observasi ?? [])
    .filter(
      (o): o is typeof o & { id: number; seller_id: string; harga: number; observed_at: string } =>
        o.id != null && o.seller_id != null && o.harga != null && o.observed_at != null && o.sisi === "jual",
    )
    .map((o) => ({
      id: o.id,
      product_id: produk.id,
      seller_id: o.seller_id,
      sisi: "jual" as const,
      kondisi: o.kondisi as Kondisi,
      grade: o.grade as Grade | null,
      garansi: o.garansi as Garansi,
      harga: o.harga,
      observed_at: o.observed_at,
      perlu_verifikasi: o.perlu_verifikasi ?? false,
      toko: sellerById.get(o.seller_id)?.nama ?? "",
    }));

  const gabunganSemua = (observasi ?? [])
    .filter(
      (o): o is typeof o & { id: number; seller_id: string; harga: number; observed_at: string } =>
        o.id != null && o.seller_id != null && o.harga != null && o.observed_at != null,
    )
    .map((o) => ({
      id: o.id,
      product_id: produk.id,
      seller_id: o.seller_id,
      sisi: (o.sisi as "jual" | "beli") ?? "jual",
      kondisi: o.kondisi as Kondisi,
      grade: o.grade as Grade | null,
      garansi: o.garansi as Garansi,
      harga: o.harga,
      observed_at: o.observed_at,
      perlu_verifikasi: o.perlu_verifikasi ?? false,
    }));

  const grup = kelompokkanPasaran(gabunganJual);
  const kandidat = [...grup].sort((a, b) => b.jumlah_toko - a.jumlah_toko);

  // Pilih kandidat pertama yang riwayatnya cukup untuk grafik (bukan cuma
  // yang toko-nya terbanyak) -- beberapa grup dengan jumlah toko sama bisa
  // punya panjang riwayat yang jauh berbeda.
  let utama = kandidat[0];
  let seriJual: Awaited<ReturnType<typeof ambilSeriPasaran>> = [];
  for (const g of kandidat.slice(0, 4)) {
    const seri = await ambilSeriPasaran({ productId: produk.id, kondisi: g.kondisi, grade: g.grade, garansi: g.garansi });
    if (seri.filter((s) => s.median != null).length >= 2) {
      utama = g;
      seriJual = seri;
      break;
    }
  }

  const bidAskSecond = grup.some((g) => g.kondisi === "second") ? hitungBidAsk(gabunganSemua, produk.id, "second") : null;
  const seriBeli = bidAskSecond ? await ambilSeriPasaran({ productId: produk.id, sisi: "beli", kondisi: "second" }) : null;

  const sinyalByKey = new Map((sinyalCache ?? []).map((s) => [`${s.kondisi}|${s.grade ?? ""}|${s.garansi}`, s]));

  return (
    <div className="mx-auto max-w-3xl px-5 pb-20">
      <header className="flex items-center justify-between border-b border-foreground py-5">
        <Link href="/" className="text-xl font-bold tracking-tight">
          hargaapel
        </Link>
        <Link href="/" className="text-xs text-muted-foreground underline underline-offset-2">
          Semua produk
        </Link>
      </header>

      <div className="py-8">
        <h1 className="mb-1 text-2xl font-bold tracking-tight sm:text-3xl">
          {produk.model} {produk.varian}
        </h1>
        {utama && <p className="mb-6 text-sm text-muted-foreground">Harga pasaran saat ini {rupiah(utama.median)}</p>}

        {utama && (
          <div className="mb-8">
            <p className="mb-2 text-xs text-muted-foreground">
              Riwayat 90 hari — {LABEL_KONDISI[utama.kondisi]} · {LABEL_GARANSI[utama.garansi]}
            </p>
            <GrafikDuaSeri
              seriA={seriJual}
              labelA="Jual (toko)"
              seriB={seriBeli}
              labelB="Beli (buyback)"
            />
          </div>
        )}

        <div className="space-y-6">
          {grup.map((g) => {
            const sinyal = sinyalByKey.get(`${g.kondisi}|${g.grade ?? ""}|${g.garansi}`);
            return (
              <section key={g.key} className="rounded-lg border border-border p-4">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm font-semibold">
                    {LABEL_KONDISI[g.kondisi]} · {LABEL_GARANSI[g.garansi]}
                  </span>
                  <span className="text-sm font-semibold">{rupiah(g.median)}</span>
                </div>
                {sinyal && sinyal.kode !== "sepi" && (
                  <p className="mb-2 text-xs text-muted-foreground">
                    {sinyal.judul}: {sinyal.alasan}
                  </p>
                )}
                <ul className="space-y-1 text-sm">
                  {g.items.map((it) => (
                    <li key={it.id} className="flex justify-between">
                      <span className="text-muted-foreground">{it.toko}</span>
                      <span>{rupiah(it.harga)}</span>
                    </li>
                  ))}
                </ul>
                <form
                  action={async () => {
                    "use server";
                    await pantauDevice(produk.id, g.kondisi, g.grade, g.garansi, g.median);
                  }}
                  className="mt-3"
                >
                  <button type="submit" className="text-xs underline underline-offset-2">
                    pantau harga ini
                  </button>
                </form>
              </section>
            );
          })}
        </div>

        <footer className="mt-10 space-y-2 border-t border-border pt-4 text-xs text-muted-foreground">
          <p>Bukan saran keuangan. Harga bisa berubah. Harga yang ditampilkan adalah yang terpantau, bukan yang dianjurkan.</p>
          <TombolSaluranWa />
        </footer>
      </div>
    </div>
  );
}
