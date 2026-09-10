import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { hitungBidAsk, kelompokkanPasaran, type Garansi, type Grade, type Kondisi } from "@/lib/pasaran";
import { ambilSeriPasaran } from "@/lib/data/ambil-seri";
import { bangunTanggaHarga } from "@/lib/data/tangga-harga";
import { ambilRasioKomponenProduk } from "@/lib/data/rasio-komponen-produk";
import { ProdukClient, type PenawaranAnonim } from "./produk-client";
import type { Bentuk } from "@/components/ilustrasi-produk";

export default async function ProdukPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: produk } = await supabase.from("products").select("*").eq("slug", slug).single();
  if (!produk) notFound();

  const [
    { data: warna },
    { data: siblingVarian },
    { data: observasi },
    { data: sellers },
    { data: sinyalCache },
    { data: componentTypes },
    { data: boardGrades },
    tangga,
    rasioKomponenMap,
  ] = await Promise.all([
    supabase.from("product_colors").select("*").eq("product_id", produk.id).order("nama"),
    supabase.from("products").select("id, slug, varian").eq("model", produk.model).order("varian"),
    supabase.from("harga_terkini").select("*").eq("product_id", produk.id),
    supabase.from("sellers").select("id, nama, tipe, area"),
    supabase.from("sinyal_cache").select("*").eq("product_id", produk.id),
    supabase.from("component_types").select("*").order("urutan"),
    supabase.from("board_grades").select("*").order("urutan", { ascending: false }),
    bangunTanggaHarga(produk),
    ambilRasioKomponenProduk(produk),
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
  let utama = kandidat[0] ?? null;
  let seriJual: Awaited<ReturnType<typeof ambilSeriPasaran>> = [];
  for (const g of kandidat.slice(0, 4)) {
    const seri = await ambilSeriPasaran({ productId: produk.id, kondisi: g.kondisi, grade: g.grade, garansi: g.garansi });
    if (seri.filter((s) => s.median != null).length >= 2) {
      utama = g;
      seriJual = seri;
      break;
    }
  }
  const bidAsk = grup.some((g) => g.kondisi === "second") ? hitungBidAsk(gabunganSemua, produk.id, "second") : null;
  const seriBeli = bidAsk ? await ambilSeriPasaran({ productId: produk.id, sisi: "beli", kondisi: "second" }) : null;

  const sinyalByKey = new Map((sinyalCache ?? []).map((s) => [`${s.kondisi}|${s.grade ?? ""}|${s.garansi}`, s]));
  const sinyalUtama = utama ? sinyalByKey.get(`${utama.kondisi}|${utama.grade ?? ""}|${utama.garansi}`) ?? null : null;

  // Penjual yang dikumpulkan manual TIDAK PERNAH disebut namanya di halaman
  // publik (aturan keras 5) -- hanya area dan jumlah. Sumber yang menerbitkan
  // harganya sendiri (scraper) boleh disebut dan wajib ditautkan.
  const penawaran: PenawaranAnonim[] = gabunganJual.map((o) => {
    const s = sellerById.get(o.seller_id);
    const asli = (observasi ?? []).find((x) => x.id === o.id);
    const bisaDisebut = asli?.sumber === "scraper";
    return {
      id: o.id,
      harga: o.harga,
      kondisi: o.kondisi,
      grade: o.grade,
      garansi: o.garansi,
      area: s?.area ?? "",
      observed_at: o.observed_at,
      perlu_verifikasi: o.perlu_verifikasi,
      // Nama HANYA disertakan untuk sumber yang menerbitkan harganya sendiri
      // di web (scraper). Untuk hasil pencatatan manual, field ini tidak
      // pernah diisi sama sekali -- bukan disembunyikan di UI saja.
      nama: bisaDisebut ? s?.nama ?? null : null,
      url: bisaDisebut ? asli?.url ?? null : null,
      bisaDisebut,
    };
  });
  const jumlahToko = new Set(gabunganJual.map((o) => o.seller_id)).size;

  return (
    <ProdukClient
      produk={{
        id: produk.id,
        model: produk.model,
        varian: produk.varian,
        kategori: produk.kategori,
        slug: produk.slug,
        rilis_at: produk.rilis_at,
        harga_rilis_id: produk.harga_rilis_id,
        bentuk: (produk.bentuk as Bentuk) ?? {},
      }}
      warna={(warna ?? []).map((w) => ({ nama: w.nama, hex: w.hex, catatan: w.catatan }))}
      siblingVarian={(siblingVarian ?? []).map((s) => ({ slug: s.slug, varian: s.varian }))}
      tangga={tangga}
      rasioKomponen={Object.fromEntries(rasioKomponenMap)}
      componentTypes={(componentTypes ?? []).map((c) => ({
        id: c.id,
        kode: c.kode,
        nama: c.nama,
        gambar: c.gambar,
        penjelasan: c.penjelasan,
      }))}
      boardGrades={(boardGrades ?? []).map((b) => ({ id: b.id, kode: b.kode, nama: b.nama, penjelasan: b.penjelasan }))}
      seriJual={seriJual}
      seriBeli={seriBeli}
      sinyal={sinyalUtama ? { kode: sinyalUtama.kode, judul: sinyalUtama.judul, alasan: sinyalUtama.alasan } : null}
      penawaran={penawaran}
      jumlahToko={jumlahToko}
    />
  );
}
