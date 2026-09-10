import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { hitungKelayakanPemilik, hitungKelayakanPedagang } from "@/lib/kelayakan";
import { ambilHargaUnitSecondStandar } from "@/lib/data/harga-unit";
import { ambilRasioKomponenProduk, kunciRasioKomponen } from "@/lib/data/rasio-komponen-produk";
import { FooterLegal } from "@/components/footer-legal";
import { PilihKomponenGrade } from "./pilih-grade";

const rupiah = (n: number) => "Rp " + n.toLocaleString("id-ID");

type Mode = "pemilik" | "pedagang";

export default async function HitungPage({
  searchParams,
}: {
  searchParams: Promise<{
    mode?: string;
    produk?: string;
    komponen?: string;
    grade?: string;
    jasa?: string;
    beli?: string;
  }>;
}) {
  const sp = await searchParams;
  const mode: Mode = sp.mode === "pedagang" ? "pedagang" : "pemilik";
  const supabase = await createClient();

  const [{ data: produkSemua }, { data: componentTypes }, { data: boardGrades }, { data: partGrades }] =
    await Promise.all([
      supabase.from("products").select("id, slug, model, varian").eq("aktif", true).order("model"),
      supabase.from("component_types").select("id, kode, nama, kategori_grade").order("urutan"),
      supabase.from("board_grades").select("id, nama").order("urutan", { ascending: false }),
      supabase.from("part_grades").select("id, nama, kategori").order("urutan", { ascending: false }),
    ]);

  const gradesUntukPilihan = [
    ...(boardGrades ?? []).map((g) => ({ id: g.id, nama: g.nama, kategori: "mesin" })),
    ...(partGrades ?? []).map((g) => ({ id: g.id, nama: g.nama, kategori: g.kategori })),
  ];

  const jasa = sp.jasa ? Number(sp.jasa) : null;
  const beli = sp.beli ? Number(sp.beli) : null;
  const inputLengkap = Boolean(
    sp.produk && sp.komponen && sp.grade && jasa && jasa > 0 && (mode === "pemilik" || (beli && beli > 0)),
  );

  let jawaban: React.ReactNode = null;
  if (inputLengkap) {
    const { data: produk } = await supabase.from("products").select("*").eq("slug", sp.produk!).single();
    const komponenDipilih = (componentTypes ?? []).find((c) => c.id === sp.komponen);

    if (produk && komponenDipilih) {
      const [rasioMap, nilaiUnit] = await Promise.all([
        ambilRasioKomponenProduk(produk),
        ambilHargaUnitSecondStandar(produk.id),
      ]);

      const mesin = komponenDipilih.kode === "mesin";
      const key = kunciRasioKomponen(komponenDipilih.id, mesin ? sp.grade! : null, mesin ? null : sp.grade!);
      const rasio = rasioMap.get(key);
      const hargaKomponen = rasio ? Math.round(rasio.rasio * (nilaiUnit ?? 0)) : null;

      const gradeNama = gradesUntukPilihan.find((g) => g.id === sp.grade)?.nama ?? "";

      const rincianPemilik = mode === "pemilik" ? hitungKelayakanPemilik(hargaKomponen, jasa, nilaiUnit) : null;
      const rincianPedagang =
        mode === "pedagang" ? hitungKelayakanPedagang(beli, hargaKomponen, jasa, nilaiUnit) : null;

      if (hargaKomponen == null || nilaiUnit == null) {
        jawaban = (
          <div className="mt-8 rounded-lg border border-border bg-muted/40 p-4 text-sm text-muted-foreground">
            Belum ada cukup data harga untuk {komponenDipilih.nama.toLowerCase()} grade {gradeNama} di {produk.model}{" "}
            {produk.varian}, atau belum ada harga pasaran unit second standar-nya. Belum bisa dihitung.
          </div>
        );
      } else {
        jawaban = (
          <div className="mt-8 space-y-4">
            <div className="rounded-lg border border-foreground p-4">
              <p className="text-xs text-muted-foreground">
                {produk.model} {produk.varian} · {komponenDipilih.nama} grade {gradeNama}
                {rasio?.estimasi && " · rasio dipinjam dari " + rasio.dipinjamDariModel}
              </p>
            </div>

            <div className="space-y-2 rounded-lg border border-border p-4 text-sm">
              <Baris label="Harga komponen" nilai={rupiah(hargaKomponen)} />
              <Baris label="Jasa pasang" nilai={rupiah(jasa!)} />
              {mode === "pedagang" && <Baris label="Harga beli unit rusak" nilai={rupiah(beli!)} />}
              <div className="border-t border-border pt-2">
                <Baris
                  label={mode === "pemilik" ? "Biaya total" : "Modal total"}
                  nilai={rupiah(mode === "pemilik" ? rincianPemilik!.biaya : rincianPedagang!.modal)}
                  tebal
                />
              </div>
              <Baris
                label={mode === "pemilik" ? "Nilai unit hasil akhir" : "Hasil jual unit setelah dibetulkan"}
                nilai={rupiah(nilaiUnit)}
              />
              {mode === "pedagang" && (
                <div className="border-t border-border pt-2">
                  <Baris
                    label="Margin"
                    nilai={`${rupiah(rincianPedagang!.margin)} (${Math.round(rincianPedagang!.margin_persen * 100)}% dari modal)`}
                    tebal
                  />
                </div>
              )}
            </div>

            <div className="rounded-lg border border-border bg-muted/40 p-4">
              <p className="text-sm font-semibold">
                {mode === "pemilik" ? rincianPemilik!.judul : (() => {
                  const r = rincianPedagang!.margin / rincianPedagang!.modal;
                  if (r > 0.15) return "Marginnya cukup lebar di atas kertas";
                  if (r > 0) return "Marginnya tipis, hitung dulu ongkos lain-lainnya";
                  return "Di atas kertas rugi pada hitungan ini";
                })()}
              </p>
              {mode === "pemilik" && (
                <p className="mt-1 text-xs text-muted-foreground">
                  Biaya sekitar {Math.round(rincianPemilik!.rasio * 100)}% dari nilai unit hasil akhir.
                </p>
              )}
            </div>

            <p className="max-w-prose text-xs leading-relaxed text-muted-foreground">
              Hitungan ini mengabaikan hal-hal yang nyata: waktu kerja, risiko unit bertambah rusak di tangan, part
              yang ternyata tidak cocok, dan garansi yang harus ditanggung setelah dijual. Ini hitungan, bukan
              anjuran untuk membeli, menjual, atau memasang harga tertentu.
            </p>
          </div>
        );
      }
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 pb-20">
      <header className="flex items-center justify-between border-b border-foreground py-4">
        <Link href="/" className="text-lg font-bold tracking-tight">
          hargaapel
        </Link>
        <Link href="/cek-harga" className="text-xs text-muted-foreground underline underline-offset-2">
          Cek harga servis
        </Link>
      </header>

      <div className="py-6">
        <h1 className="mb-1 text-xl font-bold tracking-tight">Kalkulator kelayakan</h1>
        <p className="mb-6 text-sm text-muted-foreground">
          Bandingkan biaya benerin/ganti part dengan nilai unitnya. Bukan anjuran, cuma hitungan.
        </p>

        <div className="mb-6 flex rounded-lg border border-border p-1 text-sm">
          <TabMode aktif={mode === "pemilik"} href={buatUrl({ ...sp, mode: "pemilik" })}>
            Pemilik HP
          </TabMode>
          <TabMode aktif={mode === "pedagang"} href={buatUrl({ ...sp, mode: "pedagang" })}>
            Pedagang
          </TabMode>
        </div>

        <form method="get" className="space-y-4">
          <input type="hidden" name="mode" value={mode} />

          <label className="block">
            <span className="mb-1.5 block text-sm font-medium">Perangkat</span>
            <select
              name="produk"
              defaultValue={sp.produk ?? ""}
              required
              className="w-full rounded-lg border border-border bg-transparent p-3 text-base"
            >
              <option value="" disabled>
                Pilih perangkat
              </option>
              {(produkSemua ?? []).map((p) => (
                <option key={p.slug} value={p.slug}>
                  {p.model} {p.varian}
                </option>
              ))}
            </select>
          </label>

          <PilihKomponenGrade
            componentTypes={componentTypes ?? []}
            grades={gradesUntukPilihan}
            defaultKomponen={sp.komponen ?? ""}
            defaultGrade={sp.grade ?? ""}
          />

          {mode === "pedagang" && (
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium">Harga beli unit rusak</span>
              <input
                type="number"
                inputMode="numeric"
                name="beli"
                defaultValue={sp.beli ?? ""}
                placeholder="mis. 2000000"
                required
                min={1}
                className="w-full rounded-lg border border-border bg-transparent p-3 text-base"
              />
            </label>
          )}

          <label className="block">
            <span className="mb-1.5 block text-sm font-medium">Jasa pasang</span>
            <input
              type="number"
              inputMode="numeric"
              name="jasa"
              defaultValue={sp.jasa ?? ""}
              placeholder="mis. 150000"
              required
              min={1}
              className="w-full rounded-lg border border-border bg-transparent p-3 text-base"
            />
          </label>

          <button type="submit" className="w-full rounded-lg bg-foreground p-3.5 text-base font-medium text-background">
            Hitung
          </button>
        </form>

        {jawaban}

        <FooterLegal />
      </div>
    </div>
  );
}

function Baris({ label, nilai, tebal }: { label: string; nilai: string; tebal?: boolean }) {
  return (
    <div className={`flex items-center justify-between ${tebal ? "font-semibold" : ""}`}>
      <span className={tebal ? "" : "text-muted-foreground"}>{label}</span>
      <span>{nilai}</span>
    </div>
  );
}

function TabMode({ aktif, href, children }: { aktif: boolean; href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className={`flex-1 rounded-md px-3 py-1.5 text-center ${aktif ? "bg-foreground text-background" : "text-muted-foreground"}`}
    >
      {children}
    </Link>
  );
}

function buatUrl(sp: Record<string, string | undefined>): string {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(sp)) if (v) params.set(k, v);
  return `/hitung?${params.toString()}`;
}
