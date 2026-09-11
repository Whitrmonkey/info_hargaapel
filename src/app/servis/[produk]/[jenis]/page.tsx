import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ambilSebaranPerGrade } from "@/lib/data/sebaran-per-grade";
import { ambilSeriServis } from "@/lib/data/ambil-seri";
import { pertanyaanUntukKategori } from "@/lib/salinan-servis";
import { BagianGradeView } from "@/components/bagian-grade";
import { GrafikDuaSeri } from "@/components/grafik-dua-seri";
import { FooterLegal } from "@/components/footer-legal";
import { pantauServis } from "./actions";

export default async function DetailServisPage({
  params,
}: {
  params: Promise<{ produk: string; jenis: string }>;
}) {
  const { produk: produkSlug, jenis: jenisSlug } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

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

  const representatif = bagian.filter((b) => b.sebaran).sort((a, b) => (b.sebaran!.jumlah_bengkel) - (a.sebaran!.jumlah_bengkel))[0];

  const pertanyaan = pertanyaanUntukKategori(jenisServis.kategori);

  const duaTeratas = [...bagian].filter((b) => b.sebaran).sort((a, b) => b.sebaran!.jumlah_bengkel - a.sebaran!.jumlah_bengkel).slice(0, 2);
  const [seriA, seriB] = await Promise.all(
    duaTeratas.map((b) => ambilSeriServis({ productId: produk.id, serviceTypeId: jenisServis.id, partGradeId: b.partGradeId })),
  );

  return (
    <div className="mx-auto max-w-[760px] px-5 pb-20 sm:px-6">

      <div className="py-8">
        <p className="mb-1 text-sm text-muted-foreground">{jenisServis.nama}</p>
        <h1 className="mb-2 text-2xl font-bold tracking-tight sm:text-3xl">
          {produk.model} {produk.varian}
        </h1>
        {jenisServis.deskripsi && <p className="mb-6 max-w-prose text-sm text-muted-foreground">{jenisServis.deskripsi}</p>}

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

        {representatif?.sebaran && (
          <div className="mt-8 border-t border-border pt-6 text-sm">
            {user ? (
              <form
                action={async () => {
                  "use server";
                  await pantauServis(
                    produk.id,
                    jenisServis.id,
                    representatif.partGradeId,
                    representatif.sebaran?.p50 ?? null,
                  );
                }}
              >
                <p className="mb-2">Mau dikabari kalau harga servis ini turun?</p>
                <button type="submit" className="rounded-lg border border-foreground px-3 py-1.5 text-sm font-medium">
                  Ya, kabari saya
                </button>
              </form>
            ) : (
              <p>
                Mau dikabari kalau harga servis ini turun?{" "}
                <Link href="/masuk" className="underline underline-offset-2">
                  Masuk dulu
                </Link>
                .
              </p>
            )}
          </div>
        )}

        <FooterLegal />
      </div>
    </div>
  );
}
