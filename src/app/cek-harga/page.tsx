import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { hitungKelayakan } from "@/lib/kelayakan";
import { ambilHargaUnitSecondStandar } from "@/lib/data/harga-unit";
import { ambilSebaranPerGrade } from "@/lib/data/sebaran-per-grade";
import { JUDUL_KELAYAKAN, pertanyaanUntukKategori } from "@/lib/salinan-servis";
import { BagianGradeView } from "@/components/bagian-grade";
import { TombolSaluranWa } from "@/components/tombol-saluran-wa";
import { pantauServis } from "./actions";

const rupiah = (n: number) => "Rp " + n.toLocaleString("id-ID");

function jamKeTeks(iso: string): string {
  const jam = Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / 3_600_000));
  if (jam < 24) return `${jam} jam lalu`;
  return `${Math.round(jam / 24)} hari lalu`;
}

export default async function CekHargaPage({
  searchParams,
}: {
  searchParams: Promise<{ produk?: string; jenis?: string; harga?: string }>;
}) {
  const sp = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: produkSemua }, { data: jenisSemua }] = await Promise.all([
    supabase.from("products").select("slug, model, varian").eq("aktif", true).order("model"),
    supabase.from("service_types").select("slug, nama").order("nama"),
  ]);

  const harga = sp.harga ? Number(sp.harga) : null;
  const inputLengkap = Boolean(sp.produk && sp.jenis && harga && harga > 0);

  let jawaban: React.ReactNode = null;
  if (inputLengkap) {
    const [{ data: produk }, { data: jenisServis }] = await Promise.all([
      supabase.from("products").select("*").eq("slug", sp.produk!).single(),
      supabase.from("service_types").select("*").eq("slug", sp.jenis!).single(),
    ]);

    if (produk && jenisServis) {
      const [bagian, { data: workshopSemua }, hargaUnit] = await Promise.all([
        ambilSebaranPerGrade(produk.id, jenisServis),
        supabase.from("workshops").select("id, nama"),
        ambilHargaUnitSecondStandar(produk.id),
      ]);
      const namaWorkshop = new Map((workshopSemua ?? []).map((w) => [w.id, w.nama]));
      const representatif = bagian.filter((b) => b.sebaran).sort((a, b) => b.sebaran!.jumlah_bengkel - a.sebaran!.jumlah_bengkel)[0];
      const kelayakan = representatif?.sebaran ? hitungKelayakan(representatif.sebaran.p50, hargaUnit) : null;
      const pertanyaan = pertanyaanUntukKategori(jenisServis.kategori);
      const terakhir = bagian.reduce<string | null>((t, b) => {
        if (!b.sebaran) return t;
        return !t || b.sebaran.terakhir > t ? b.sebaran.terakhir : t;
      }, null);

      jawaban = (
        <div className="mt-8 space-y-6">
          <div className="rounded-lg border border-foreground p-4">
            <p className="text-xs text-muted-foreground">Ditawarkan</p>
            <p className="text-lg font-bold">{rupiah(harga!)}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {produk.model} {produk.varian} · {jenisServis.nama}
            </p>
          </div>

          {bagian.length === 0 ? (
            <p className="text-sm text-muted-foreground">Belum ada data servis untuk kombinasi ini.</p>
          ) : (
            <div className="space-y-4">
              {bagian.map((b) => (
                <BagianGradeView key={b.partGradeId ?? "board"} bagian={b} namaWorkshop={namaWorkshop} tanda={harga!} />
              ))}
            </div>
          )}

          {terakhir && <p className="text-xs text-muted-foreground">Terakhir diperbarui {jamKeTeks(terakhir)}.</p>}

          {kelayakan && (
            <div className="rounded-lg border border-border bg-muted/40 p-4">
              <p className="text-xs text-muted-foreground">Rasio kelayakan perbaikan</p>
              <p className="mt-1 text-sm font-semibold">{JUDUL_KELAYAKAN[kelayakan.label]}</p>
            </div>
          )}

          {pertanyaan.length > 0 && (
            <div>
              <p className="mb-2 text-sm font-semibold">Bisa dibacakan langsung ke tukang servis</p>
              <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
                {pertanyaan.map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="border-t border-border pt-4 text-sm">
            {user ? (
              <form
                action={async () => {
                  "use server";
                  await pantauServis(
                    produk.id,
                    jenisServis.id,
                    representatif?.partGradeId ?? null,
                    representatif?.sebaran?.p50 ?? null,
                  );
                }}
              >
                <p className="mb-2">Mau dikabari kalau harga ini turun?</p>
                <button type="submit" className="rounded-lg border border-foreground px-3 py-1.5 text-sm font-medium">
                  Ya, kabari saya
                </button>
              </form>
            ) : (
              <p>
                Mau dikabari kalau harga ini turun?{" "}
                <Link href="/masuk" className="underline underline-offset-2">
                  Masuk dulu
                </Link>
                .
              </p>
            )}
          </div>
        </div>
      );
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 pb-20">
      <header className="flex items-center justify-between border-b border-foreground py-4">
        <Link href="/" className="text-lg font-bold tracking-tight">
          hargaapel
        </Link>
        <Link href="/servis" className="text-xs text-muted-foreground underline underline-offset-2">
          Lihat sebaran
        </Link>
      </header>

      <div className="py-6">
        <h1 className="mb-1 text-xl font-bold tracking-tight">Cek harga servis</h1>
        <p className="mb-6 text-sm text-muted-foreground">Perangkat, kerusakan, harga yang ditawarkan — langsung dapat jawaban.</p>

        <form method="get" className="space-y-4">
          <Field label="Perangkat apa">
            <select name="produk" defaultValue={sp.produk ?? ""} required className="w-full rounded-lg border border-border bg-transparent p-3 text-base">
              <option value="" disabled>
                Pilih perangkat
              </option>
              {(produkSemua ?? []).map((p) => (
                <option key={p.slug} value={p.slug}>
                  {p.model} {p.varian}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Kerusakan apa">
            <select name="jenis" defaultValue={sp.jenis ?? ""} required className="w-full rounded-lg border border-border bg-transparent p-3 text-base">
              <option value="" disabled>
                Pilih kerusakan
              </option>
              {(jenisSemua ?? []).map((j) => (
                <option key={j.slug} value={j.slug}>
                  {j.nama}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Ditawarkan berapa">
            <input
              type="number"
              inputMode="numeric"
              name="harga"
              defaultValue={sp.harga ?? ""}
              placeholder="mis. 350000"
              required
              min={1}
              className="w-full rounded-lg border border-border bg-transparent p-3 text-base"
            />
          </Field>

          <button type="submit" className="w-full rounded-lg bg-foreground p-3.5 text-base font-medium text-background">
            Cek harga ini
          </button>
        </form>

        {jawaban}

        <div className="mt-10 border-t border-border pt-4 text-xs text-muted-foreground">
          <TombolSaluranWa />
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium">{label}</span>
      {children}
    </label>
  );
}
