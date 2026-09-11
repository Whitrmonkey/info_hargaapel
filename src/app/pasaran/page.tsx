import { createClient } from "@/lib/supabase/server";
import { saringObservasi } from "@/lib/mode";
import { hitungBidAsk, kelompokkanPasaran, type Garansi, type Grade, type Kondisi } from "@/lib/pasaran";
import { PasaranClient, type ItemGabungan } from "./pasaran-client";

export const metadata = {
  title: "Semua harga pasaran Apple di Jabodetabek — hargaapel",
  description: "Seluruh model yang terpantau, bisa disaring per kategori, kondisi, jalur garansi, dan area.",
};

export default async function PasaranPage() {
  const supabase = await createClient();

  const [{ data: observasi }, { data: products }, { data: sellers }, { data: sinyalSemua }] = await Promise.all([
    supabase.from("harga_terkini").select("*"),
    supabase.from("products").select("id, kategori, model, varian, slug"),
    supabase.from("sellers").select("id, nama, tipe, area"),
    supabase.from("sinyal_cache").select("*"),
  ]);

  const productById = new Map((products ?? []).map((p) => [p.id, p]));
  const sellerById = new Map((sellers ?? []).map((s) => [s.id, s]));

  const gabungan: ItemGabungan[] = saringObservasi(observasi ?? [])
    // harga_terkini adalah view, kolomnya nullable secara tipe walau
    // `distinct on` di atas tabel non-null pada praktiknya tidak pernah null.
    .filter(
      (o): o is typeof o & { id: number; product_id: string; seller_id: string; harga: number; observed_at: string } =>
        o.id != null &&
        o.product_id != null &&
        o.seller_id != null &&
        o.harga != null &&
        o.observed_at != null &&
        productById.has(o.product_id) &&
        sellerById.has(o.seller_id),
    )
    .map((o) => {
      const p = productById.get(o.product_id)!;
      const s = sellerById.get(o.seller_id)!;
      // Penjual hasil pencatatan manual TIDAK PERNAH disebut namanya di
      // halaman publik (aturan keras 5) -- nama dan tautan hanya dikirim ke
      // klien untuk sumber yang menerbitkan harganya sendiri (scraper).
      const bisaDisebut = o.sumber === "scraper";
      return {
        id: o.id,
        product_id: o.product_id,
        seller_id: o.seller_id,
        sisi: (o.sisi as "jual" | "beli") ?? "jual",
        kondisi: o.kondisi as Kondisi,
        grade: o.grade as Grade | null,
        garansi: o.garansi as Garansi,
        harga: o.harga,
        observed_at: o.observed_at,
        perlu_verifikasi: o.perlu_verifikasi ?? false,
        url: bisaDisebut ? o.url : null,
        model: p.model,
        varian: p.varian,
        kategori: p.kategori,
        slug: p.slug,
        toko: bisaDisebut ? s.nama : null,
        bisaDisebut,
        tipe_toko: s.tipe,
        area: s.area,
      };
    });

  const grup = kelompokkanPasaran(gabungan);

  const bidAskByKey: Record<string, ReturnType<typeof hitungBidAsk>> = {};
  for (const g of grup) {
    if (g.kondisi !== "second") continue;
    bidAskByKey[g.key] = hitungBidAsk(gabungan, g.product_id, g.kondisi);
  }

  const sinyalByKey = new Map(
    (sinyalSemua ?? []).map((s) => [`${s.product_id}|${s.kondisi}|${s.grade ?? ""}|${s.garansi}`, s]),
  );

  const area = Array.from(new Set((sellers ?? []).map((s) => s.area))).sort();

  return (
    <PasaranClient
      grup={grup}
      daftarArea={area}
      totalToko={sellerById.size}
      bidAskByKey={bidAskByKey}
      sinyalByKey={Object.fromEntries(sinyalByKey)}
    />
  );
}
