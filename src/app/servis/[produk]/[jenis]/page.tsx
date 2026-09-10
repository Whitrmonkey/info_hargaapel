import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { hitungKelayakan } from "@/lib/kelayakan";
import { ambilHargaUnitSecondStandar } from "@/lib/data/harga-unit";
import { ambilSebaranPerGrade } from "@/lib/data/sebaran-per-grade";
import { ambilSeriServis } from "@/lib/data/ambil-seri";
import { JUDUL_KELAYAKAN, pertanyaanUntukKategori } from "@/lib/salinan-servis";
import { BagianGradeView } from "@/components/bagian-grade";
import { GrafikDuaSeri } from "@/components/grafik-dua-seri";
import { FooterLegal } from "@/components/footer-legal";

const rupiah = (n: number) => "Rp " + n.toLocaleString("id-ID");

export default async function DetailServisPage({
  params,
}: {
  params: Promise<{ produk: string; jenis: string }>;
}) {
  const { produk: produkSlug, jenis: jenisSlug } = await params;
  const supabase = await createClient();

  const [{ data: produk }, { data: jenisServis }] = await Promise.all([
    supabase.from("products").select("*").eq("slug", produkSlug).single(),
    supabase.from("service_types").select("*").eq("slug", jenisSlug).single(),
  ]);
  if (!produk || !jenisServis) notFound();

  const [bagian, { data: workshopSemua }] = await Promise.all([
    ambilSebaranPerGrade(produk.id, jenisServis),
    supabase.from("workshops").select("id, area"),
  ]);
  const areaWorkshop = new Map((workshopSemua ?? []).map((w) => [w.id, w.area]));

  const hargaUnit = await ambilHargaUnitSecondStandar(produk.id);
  const representatif = bagian.filter((b) => b.sebaran).sort((a, b) => (b.sebaran!.jumlah_bengkel) - (a.sebaran!.jumlah_bengkel))[0];
  const kelayakan = representatif?.sebaran ? hitungKelayakan(representatif.sebaran.p50, hargaUnit) : null;

  const pertanyaan = pertanyaanUntukKategori(jenisServis.kategori);

  const duaTeratas = [...bagian].filter((b) => b.sebaran).sort((a, b) => b.sebaran!.jumlah_bengkel - a.sebaran!.jumlah_bengkel).slice(0, 2);
  const [seriA, seriB] = await Promise.all(
    duaTeratas.map((b) => ambilSeriServis({ productId: produk.id, serviceTypeId: jenisServis.id, partGradeId: b.partGradeId })),
  );

  return (
    <div className="mx-auto max-w-3xl px-5 pb-20">
      <header className="flex items-center justify-between border-b border-foreground py-5">
        <Link href="/" className="text-xl font-bold tracking-tight">
          hargaapel
        </Link>
        <Link href="/servis" className="text-sm text-muted-foreground underline underline-offset-2">
          Cari lagi
        </Link>
      </header>

      <div className="py-8">
        <p className="mb-1 text-sm text-muted-foreground">{jenisServis.nama}</p>
        <h1 className="mb-2 text-2xl font-bold tracking-tight sm:text-3xl">
          {produk.model} {produk.varian}
        </h1>
        {jenisServis.deskripsi && <p className="mb-6 max-w-prose text-sm text-muted-foreground">{jenisServis.deskripsi}</p>}

        {kelayakan && (
          <div className="mb-8 rounded-lg border border-border bg-muted/40 p-4">
            <p className="text-xs text-muted-foreground">Rasio kelayakan perbaikan</p>
            <p className="mt-1 text-sm font-semibold">{JUDUL_KELAYAKAN[kelayakan.label]}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Kira-kira {Math.round(kelayakan.rasio * 100)}% dari harga unit second standar ({rupiah(hargaUnit!)}).
            </p>
          </div>
        )}

        {seriA && duaTeratas.length > 0 && (
          <div className="mb-8">
            <GrafikDuaSeri
              seriA={seriA}
              labelA={duaTeratas[0].grade?.nama ?? "Median"}
              seriB={seriB}
              labelB={duaTeratas[1]?.grade?.nama}
            />
          </div>
        )}

        {bagian.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">Belum ada data servis untuk kombinasi ini.</p>
        ) : (
          <div className="space-y-6">
            {bagian.map((b) => (
              <BagianGradeView key={b.partGradeId ?? "board"} bagian={b} areaWorkshop={areaWorkshop} />
            ))}
          </div>
        )}

        {pertanyaan.length > 0 && (
          <div className="mt-8">
            <p className="mb-2 text-sm font-semibold">Pertanyaan untuk tukang servis</p>
            <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
              {pertanyaan.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-8">
          <Link
            href={`/cek-harga?produk=${produk.slug}&jenis=${jenisServis.slug}`}
            className="inline-block rounded-lg border border-foreground px-4 py-2.5 text-sm font-medium"
          >
            Ada harga yang ditawarkan? Cek di sini →
          </Link>
        </div>

        <FooterLegal />
      </div>
    </div>
  );
}
