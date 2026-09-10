"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useTheme } from "next-themes";
import { IlustrasiProduk, TAMPAK, type Bentuk } from "@/components/ilustrasi-produk";
import { GrafikDuaSeri } from "@/components/grafik-dua-seri";
import { TombolSaluranWa } from "@/components/tombol-saluran-wa";
import type { KodeTangga, TanggaHarga } from "@/lib/data/tangga-harga";
import type { RasioTerpinjam } from "@/lib/komponen";
import type { TitikSeri } from "@/lib/seri";
import type { Garansi, Grade, Kondisi } from "@/lib/pasaran";
import { pantauDevice } from "./actions";

const rupiah = (n: number) => "Rp " + n.toLocaleString("id-ID");
const persen = (r: number) => Math.round(r * 100);

// Hanya anak tangga bekas yang bisa dipantau: dua yang lain adalah jangkar
// sejarah, bukan harga yang bergerak. Grade standar dipakai karena itu yang
// jadi angka kepala anak tangganya.
const TIER_KE_GRUP: Partial<Record<KodeTangga, { kondisi: Kondisi; grade: Grade | null; garansi: Garansi | null }>> = {
  bekas_resmi: { kondisi: "second", grade: "standar", garansi: "resmi" },
  bekas_inter: { kondisi: "second", grade: "standar", garansi: "inter" },
};
const LABEL_KONDISI: Record<Kondisi, string> = { baru: "Baru segel", second: "Second", refurb: "Refurbished" };
const LABEL_GARANSI: Record<Garansi, string> = { resmi: "Garansi resmi", inter: "Inter", toko: "Garansi toko" };
const LABEL_GRADE: Record<Grade, string> = { mulus: "Mulus", standar: "Standar", ekonomis: "Ekonomis" };

export interface PenawaranAnonim {
  id: number;
  harga: number;
  kondisi: Kondisi;
  grade: Grade | null;
  garansi: Garansi;
  area: string;
  observed_at: string;
  perlu_verifikasi: boolean;
  nama: string | null;
  url: string | null;
  bisaDisebut: boolean;
}

interface ProdukRingkas {
  id: string;
  model: string;
  varian: string;
  kategori: string;
  slug: string;
  rilis_at: string | null;
  harga_rilis_id: number | null;
  bentuk: Bentuk;
}

function kunci(componentTypeId: string, boardGradeId: string | null, partGradeId: string | null): string {
  return `${componentTypeId}|${boardGradeId ?? ""}|${partGradeId ?? ""}`;
}

export function ProdukClient({
  produk,
  warna,
  siblingVarian,
  tangga,
  rasioKomponen,
  componentTypes,
  boardGrades,
  seriJual,
  seriBeli,
  sinyal,
  penawaran,
  jumlahToko,
}: {
  produk: ProdukRingkas;
  warna: Array<{ nama: string; hex: string; catatan: string | null }>;
  siblingVarian: Array<{ slug: string; varian: string }>;
  tangga: TanggaHarga;
  rasioKomponen: Record<string, RasioTerpinjam>;
  componentTypes: Array<{ id: string; kode: string; nama: string }>;
  boardGrades: Array<{ id: string; kode: string; nama: string }>;
  seriJual: TitikSeri[];
  seriBeli: TitikSeri[] | null;
  sinyal: { kode: string; judul: string; alasan: string } | null;
  penawaran: PenawaranAnonim[];
  jumlahToko: number;
}) {
  const { theme, setTheme } = useTheme();
  const [tampak, setTampak] = useState("depan");
  const [aktif, setAktif] = useState<string | null>(null);
  const [warnaTerpilih, setWarnaTerpilih] = useState(warna[0]?.nama ?? "");
  // Dasar semua rasio komponen: harga unit bekas jalur resmi. Kalau jalur itu
  // belum ada datanya, pakai jalur inter -- tapi tidak pernah harga rilis,
  // karena itu bukan harga unit yang bisa dibeli hari ini.
  const bekasResmi = tangga.anak.find((t) => t.kode === "bekas_resmi");
  const bekasInter = tangga.anak.find((t) => t.kode === "bekas_inter");
  const unitAcuan = bekasResmi ?? bekasInter ?? null;
  const hargaUnitStandar = unitAcuan?.harga ?? null;
  const [jarakAktif, setJarakAktif] = useState(0);
  const [buka, setBuka] = useState(false);
  const [pesanPantau, setPesanPantau] = useState<string | null>(null);

  async function pantauTierIni(kode: KodeTangga, harga: number) {
    const g = TIER_KE_GRUP[kode];
    if (!g) return;
    try {
      await pantauDevice(produk.id, g.kondisi, g.grade, g.garansi, harga);
      setPesanPantau("Tersimpan. Kamu akan dikabari lewat email kalau harga ini turun.");
    } catch {
      setPesanPantau("Masuk dulu untuk memantau harga ini.");
    }
  }

  const componentByKode = useMemo(() => new Map(componentTypes.map((c) => [c.kode, c])), [componentTypes]);
  const mesinType = componentByKode.get("mesin");

  const zonaAktifDepan = produk.bentuk.zona_depan?.find((z) => z.id === aktif);
  const zonaAktifBelakang = produk.bentuk.zona_belakang?.find((z) => z.id === aktif);
  const zonaDatarAktif = zonaAktifDepan ?? zonaAktifBelakang;
  const zonaMesinAktif =
    produk.bentuk.zona_mesin_depan?.find((z) => z.id === aktif) ?? produk.bentuk.zona_mesin_belakang?.find((z) => z.id === aktif);

  const rasioZonaDatar = zonaDatarAktif
    ? rasioKomponen[kunci(componentByKode.get(zonaDatarAktif.component_kode)?.id ?? "", null, null)] ??
      Object.entries(rasioKomponen).find(([k]) => k.startsWith(`${componentByKode.get(zonaDatarAktif.component_kode)?.id}|`))?.[1]
    : null;

  const rasioZonaMesin = zonaMesinAktif
    ? rasioKomponen[kunci(mesinType?.id ?? "", boardGrades.find((b) => b.kode === zonaMesinAktif.board_grade)?.id ?? "", null)]
    : null;

  const maxHarga = Math.max(1, ...tangga.anak.map((t) => t.harga!));
  const jarak = tangga.jarak[Math.min(jarakAktif, tangga.jarak.length - 1)] ?? null;

  const nilaiKomponenList = useMemo(() => {
    return componentTypes
      .filter((c) => c.kode !== "mesin")
      .map((c) => {
        const entri = Object.entries(rasioKomponen).find(([k]) => k.startsWith(`${c.id}|`));
        return entri ? { ...c, dipinjam: entri[1] } : null;
      })
      .filter((x): x is NonNullable<typeof x> => x != null)
      .sort((a, b) => b.dipinjam.rasio - a.dipinjam.rasio);
  }, [componentTypes, rasioKomponen]);

  const mesinList = useMemo(() => {
    return boardGrades
      .map((g) => {
        const dipinjam = mesinType ? rasioKomponen[kunci(mesinType.id, g.id, null)] : undefined;
        return dipinjam ? { ...g, dipinjam } : null;
      })
      .filter((x): x is NonNullable<typeof x> => x != null);
  }, [boardGrades, mesinType, rasioKomponen]);
  const mesinTertinggi = Math.max(1, ...mesinList.map((m) => m.dipinjam.rasio));

  return (
    <div className="mx-auto max-w-5xl px-5 pb-24">
      <nav className="flex items-center justify-between border-b border-foreground py-4">
        <Link href="/" className="text-lg font-bold tracking-tight">
          hargaapel
        </Link>
        <div className="flex items-center gap-4 text-xs">
          <Link href="/servis" className="text-muted-foreground underline underline-offset-2">
            Servis
          </Link>
          <Link href="/hitung" className="text-muted-foreground underline underline-offset-2">
            Hitung kelayakan
          </Link>
          <button
            type="button"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="rounded-full border border-border px-2.5 py-1 text-muted-foreground hover:border-foreground hover:text-foreground"
          >
            {theme === "dark" ? "mode terang" : "mode gelap"}
          </button>
        </div>
      </nav>

      <header className="grid grid-cols-1 gap-10 border-b border-border py-8 md:grid-cols-[280px_1fr]">
        <div className="md:sticky md:top-4 md:self-start">
          <IlustrasiProduk bentuk={produk.bentuk} tampak={tampak} aktif={aktif} onPilih={setAktif} />
          <div className="mt-3 flex flex-wrap justify-center gap-1.5" role="group" aria-label="Pilih tampilan">
            {TAMPAK.map((t) => (
              <button
                key={t.kode}
                type="button"
                aria-pressed={tampak === t.kode}
                onClick={() => {
                  setTampak(t.kode);
                  setAktif(null);
                }}
                className={`rounded border px-2.5 py-1 text-[11px] ${tampak === t.kode ? "border-foreground bg-foreground text-background" : "border-border text-muted-foreground"}`}
              >
                {t.label}
              </button>
            ))}
          </div>
          <p className="mt-3 text-center text-[11px] leading-relaxed text-muted-foreground">
            {tampak.startsWith("mesin")
              ? "Tekan zona untuk melihat kerusakan apa yang muncul dari situ dan berapa nilai mesinnya jadi."
              : "Tekan bagian perangkat untuk melihat nilai komponennya."}
          </p>
        </div>

        <div>
          <h1 className="mb-1 text-3xl font-bold tracking-tight sm:text-4xl">
            {produk.model} {produk.varian}
          </h1>
          {produk.rilis_at && (
            <p className="mb-5 text-sm text-muted-foreground">
              Dirilis {new Date(produk.rilis_at).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })} · harga
              pasaran Jabodetabek
            </p>
          )}

          {(zonaDatarAktif || zonaMesinAktif) && (
            <div aria-live="polite" className="mb-6 border border-border p-4">
              {zonaDatarAktif && (
                <>
                  <p className="text-base font-semibold">{zonaDatarAktif.nama}</p>
                  {rasioZonaDatar ? (
                    <>
                      <p className="text-xl font-bold">{rupiah(Math.round(rasioZonaDatar.rasio * (hargaUnitStandar ?? 0)))}</p>
                      <p className="mb-2 text-xs text-muted-foreground">
                        {persen(rasioZonaDatar.rasio)}% dari harga unit
                        {rasioZonaDatar.estimasi
                          ? ` · estimasi, dipinjam dari ${rasioZonaDatar.dipinjamDariModel}`
                          : ` · ${rasioZonaDatar.jumlah_penjual} penjual terpantau`}
                      </p>
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground">Belum ada data komponen ini.</p>
                  )}
                </>
              )}
              {zonaMesinAktif && (
                <>
                  <p className="text-base font-semibold">{zonaMesinAktif.nama}</p>
                  <p className="mb-2 text-sm">{zonaMesinAktif.ket}</p>
                  {rasioZonaMesin && (
                    <p className="text-sm">
                      Kalau bagian ini rusak, gejalanya <b>{zonaMesinAktif.gejala}</b>, dan mesinnya diperdagangkan sekitar{" "}
                      <b>{rupiah(Math.round(rasioZonaMesin.rasio * (hargaUnitStandar ?? 0)))}</b> ({persen(rasioZonaMesin.rasio)}% dari
                      harga unit utuh).
                    </p>
                  )}
                </>
              )}
            </div>
          )}

          {warna.length > 0 && (
            <div className="mb-5 border-t border-border pt-5">
              <p className="mb-2 text-xs text-muted-foreground">Warna yang pernah dirilis Apple</p>
              <div className="mb-4 flex flex-wrap gap-2" role="group" aria-label="Pilih warna">
                {warna.map((w) => (
                  <button
                    key={w.nama}
                    type="button"
                    title={w.nama}
                    aria-label={w.nama}
                    aria-pressed={warnaTerpilih === w.nama}
                    onClick={() => setWarnaTerpilih(w.nama)}
                    className={`h-8 w-8 rounded-full border border-border ${warnaTerpilih === w.nama ? "ring-2 ring-foreground ring-offset-2 ring-offset-background" : ""}`}
                    style={{ background: w.hex }}
                  />
                ))}
              </div>
              <p className="max-w-prose text-xs leading-relaxed text-muted-foreground">
                Warna tidak menggerakkan harga di pasar bekas, hanya kecepatan lakunya.
              </p>
            </div>
          )}

          {siblingVarian.length > 1 && (
            <div className="mb-5">
              <p className="mb-2 text-xs text-muted-foreground">Kapasitas</p>
              <div className="flex flex-wrap gap-1.5">
                {siblingVarian.map((s) => (
                  <Link
                    key={s.slug}
                    href={`/p/${s.slug}`}
                    aria-current={s.slug === produk.slug}
                    className={`rounded border px-3 py-1.5 text-sm ${s.slug === produk.slug ? "border-foreground bg-foreground text-background" : "border-border"}`}
                  >
                    {s.varian}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {unitAcuan?.harga != null && (
            <div>
              <p className="text-3xl font-bold">{rupiah(unitAcuan.harga)}</p>
              <p className="mb-2 text-xs text-muted-foreground">
                {unitAcuan.label}
                {unitAcuan.kondisi.some((k) => k.grade === "standar") ? ", grade standar" : ""} · {unitAcuan.sub}
              </p>
              {TIER_KE_GRUP[unitAcuan.kode] && !pesanPantau && (
                <button
                  type="button"
                  onClick={() => pantauTierIni(unitAcuan.kode, unitAcuan.harga!)}
                  className="text-xs underline underline-offset-2"
                >
                  pantau harga ini
                </button>
              )}
              {pesanPantau && <p className="text-xs text-muted-foreground">{pesanPantau}</p>}
            </div>
          )}
        </div>
      </header>

      <section className="border-b border-border py-10">
        <h2 className="mb-1 text-xl font-bold tracking-tight">Tangga harga</h2>
        <p className="mb-6 max-w-prose text-sm text-muted-foreground">
          Disusun menurut jalur masuk unit ke Indonesia, bukan menurut kondisi fisiknya. Tekan salah satu jarak untuk melihat apa yang
          sebenarnya terkandung di dalam selisih itu.
        </p>

        {tangga.anak.length === 0 ? (
          <p className="text-sm text-muted-foreground">Belum ada harga terpantau untuk model ini.</p>
        ) : (
          <div className="flex flex-col">
            {tangga.anak.map((t, i) => {
              const berikut = tangga.anak[i + 1];
              const indeksJarak = berikut ? tangga.jarak.findIndex((j) => j.atas === t.kode && j.bawah === berikut.kode) : -1;
              const j = indeksJarak >= 0 ? tangga.jarak[indeksJarak] : null;
              return (
                <div key={t.kode}>
                  <div className="grid grid-cols-[minmax(0,150px)_1fr_auto] items-center gap-3 py-2.5 sm:grid-cols-[minmax(0,210px)_1fr_auto]">
                    <span className="text-sm leading-tight">
                      {t.label}
                      <span className="mt-0.5 block text-[11px] text-muted-foreground">{t.sub}</span>
                    </span>
                    <span className="hidden h-6 bg-muted sm:block">
                      <span
                        className={`block h-full ${t.gaya === "arsip" ? "bg-border" : t.gaya === "inter" ? "bg-tanah" : "bg-foreground"}`}
                        style={{ width: `${(t.harga! / maxHarga) * 100}%` }}
                      />
                    </span>
                    <span className="text-right text-sm font-bold">{rupiah(t.harga!)}</span>
                    {t.kondisi.length > 0 && (
                      <span className="col-span-full flex flex-wrap gap-1.5 pb-1 text-[11px] text-muted-foreground">
                        {t.kondisi.map((k) => (
                          <span key={k.grade} className="rounded border border-border px-1.5 py-0.5">
                            {LABEL_GRADE[k.grade]} {rupiah(k.median)} · {k.jumlah_toko} toko
                          </span>
                        ))}
                      </span>
                    )}
                  </div>

                  {j && (
                    <button
                      type="button"
                      aria-pressed={jarakAktif === indeksJarak}
                      onClick={() => setJarakAktif(indeksJarak)}
                      className={`grid w-full grid-cols-[minmax(0,150px)_1fr_auto] items-center gap-3 py-1 text-left sm:grid-cols-[minmax(0,210px)_1fr_auto] ${
                        jarakAktif === indeksJarak ? "text-tanah" : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <span
                        aria-hidden
                        className={`ml-2 hidden h-5 border-l-2 border-dotted sm:block ${
                          jarakAktif === indeksJarak ? "border-tanah" : "border-border"
                        }`}
                      />
                      <span className={`text-xs ${jarakAktif === indeksJarak ? "font-semibold" : ""}`}>{j.nama}</span>
                      <span className="text-right text-xs">
                        {j.beda >= 0 ? "" : "−"}
                        {rupiah(Math.abs(j.beda))}
                      </span>
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {jarak && (
          <div className="mt-6 max-w-prose border-l-2 border-tanah bg-sorot p-4 text-sm leading-relaxed" aria-live="polite">
            <b>
              {jarak.nama} — {jarak.beda >= 0 ? "" : "−"}
              {rupiah(Math.abs(jarak.beda))}
            </b>
            , atau {Math.abs(persen(jarak.beda / jarak.bawahHarga))}%{" "}
            {jarak.beda >= 0 ? "di atas" : "di bawah"} {tangga.anak.find((a) => a.kode === jarak.bawah)?.label.toLowerCase()}.{" "}
            {jarak.ket}
            {jarak.beda < 0 && (
              <>
                {" "}
                Pada model ini selisihnya justru terbalik: harga daftar di luar belum termasuk pajak penjualan setempat, sementara harga
                Indonesia sudah termasuk PPN.
              </>
            )}
          </div>
        )}
      </section>

      {mesinList.length > 0 && (
        <section className="border-b border-border py-10">
          <h2 className="mb-1 text-xl font-bold tracking-tight">Nilai mesin menurut fungsi yang hidup</h2>
          <p className="mb-6 max-w-prose text-sm text-muted-foreground">
            Mesin tidak hidup atau mati. Ia diperdagangkan menurut fungsi apa yang masih jalan, dan selisih antar tingkat adalah harga
            dari satu fungsi.
          </p>
          {mesinList.map((g) => (
            <div key={g.id} className="grid grid-cols-[180px_1fr_auto] items-center gap-3 border-t border-border py-2.5 text-sm first:border-t-0">
              <span>{g.nama}</span>
              <span className="h-3.5 bg-muted">
                <span className="block h-full bg-foreground" style={{ width: `${(g.dipinjam.rasio / mesinTertinggi) * 100}%` }} />
              </span>
              <span className="text-right font-semibold">
                {hargaUnitStandar != null ? rupiah(Math.round(g.dipinjam.rasio * hargaUnitStandar)) : `${persen(g.dipinjam.rasio)}%`}
                {g.dipinjam.estimasi && <span className="ml-1 text-[10px] font-normal text-muted-foreground">estimasi</span>}
              </span>
            </div>
          ))}
        </section>
      )}

      {nilaiKomponenList.length > 0 && (
        <section className="border-b border-border py-10">
          <h2 className="mb-1 text-xl font-bold tracking-tight">Nilai per komponen</h2>
          <p className="mb-6 max-w-prose text-sm text-muted-foreground">
            Komponen diurutkan dari rasio terbesar. Rupiahnya dihitung dari harga unit terkini, jadi ikut segar ketika harga unit
            bergerak.
          </p>
          {nilaiKomponenList.map((c) => (
            <div key={c.id} className="grid grid-cols-[180px_1fr_auto] items-center gap-3 border-t border-border py-2.5 text-sm first:border-t-0">
              <span>{c.nama}</span>
              <span className="h-3.5 bg-muted">
                <span className="block h-full bg-foreground" style={{ width: `${Math.min(c.dipinjam.rasio * 100 * 3, 100)}%` }} />
              </span>
              <span className="text-right">
                <span className="font-semibold">{hargaUnitStandar != null ? rupiah(Math.round(c.dipinjam.rasio * hargaUnitStandar)) : "—"}</span>
                <span className="block text-[11px] text-muted-foreground">
                  {persen(c.dipinjam.rasio)}%{c.dipinjam.estimasi ? " · estimasi" : ` · ${c.dipinjam.jumlah_penjual} penjual`}
                </span>
              </span>
            </div>
          ))}
        </section>
      )}

      <section className="border-b border-border py-10">
        <h2 className="mb-1 text-xl font-bold tracking-tight">Sejak rilis sampai sekarang</h2>
        <p className="mb-6 max-w-prose text-sm text-muted-foreground">
          Harga pasaran 90 hari terakhir. Garis putus-putus adalah sisi beli platform buyback, kalau datanya ada.
        </p>
        {sinyal && sinyal.kode !== "sepi" && (
          <div
            className={`mb-4 border-l-2 pl-3 ${sinyal.kode === "tahan" ? "border-mahal" : sinyal.kode === "beli" ? "border-murah" : "border-border"}`}
          >
            <p className={`text-sm font-semibold ${sinyal.kode === "tahan" ? "text-mahal" : sinyal.kode === "beli" ? "text-murah" : ""}`}>
              {sinyal.judul}
            </p>
            <p className="text-sm text-muted-foreground">{sinyal.alasan}</p>
          </div>
        )}
        <GrafikDuaSeri seriA={seriJual} labelA="Jual (toko)" seriB={seriBeli} labelB="Beli (buyback)" />
      </section>

      <section className="py-6">
        <button
          type="button"
          aria-expanded={buka}
          onClick={() => setBuka(!buka)}
          className="flex w-full items-center justify-between border-y border-border py-4 text-left"
        >
          <span className="text-lg font-semibold">{buka ? "Tutup daftar penawaran" : "Lihat semua penawaran"}</span>
          <em className="text-sm not-italic text-muted-foreground">
            {penawaran.length} penawaran dari {jumlahToko} toko
          </em>
        </button>
        {buka && (
          <div className="mt-4">
            <p className="mb-4 max-w-prose text-sm text-muted-foreground">
              Harga, area, grade, dan kapan terakhir dicek. Nama toko tidak ditampilkan untuk hasil pencatatan lapangan — yang
              ditampilkan area dan jumlah, karena itu yang bisa diverifikasi pembaca tanpa merugikan penjual yang harganya kami catat.
            </p>
            <ul className="space-y-1.5 text-sm">
              {penawaran
                .sort((a, b) => a.harga - b.harga)
                .map((p) => (
                  <li key={p.id} className="flex flex-wrap items-center justify-between gap-2 border-t border-border/60 py-2 first:border-t-0">
                    <span className="font-semibold">{rupiah(p.harga)}</span>
                    <span className="text-muted-foreground">
                      {LABEL_KONDISI[p.kondisi]}
                      {p.grade ? ` · ${LABEL_GRADE[p.grade]}` : ""} · {LABEL_GARANSI[p.garansi]}
                    </span>
                    <span className="text-muted-foreground">
                      {p.bisaDisebut && p.url ? (
                        <a href={p.url} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">
                          {p.nama}
                        </a>
                      ) : (
                        p.area
                      )}
                      {p.perlu_verifikasi && <span className="ml-1 text-amber-600 dark:text-amber-400">· perlu verifikasi</span>}
                    </span>
                  </li>
                ))}
            </ul>
          </div>
        )}
      </section>

      <footer className="space-y-2 border-t border-border pt-6 text-xs leading-relaxed text-muted-foreground">
        <p className="max-w-prose">
          Angka di halaman ini adalah harga yang terpantau dari toko dan bengkel di Jabodetabek, bukan harga yang dianjurkan. Nilai
          komponen disimpan sebagai persentase dari harga unit, jadi rupiahnya ikut menyesuaikan ketika harga unit bergerak. Harga bisa
          berubah, dan ini bukan saran keuangan.
        </p>
        <p className="max-w-prose">
          Skema mesin bersifat diagram fungsi, bukan tata letak papan yang sebenarnya. Rona warna adalah perkiraan visual, bukan kode
          warna resmi Apple. Penjual yang namanya muncul di halaman ini adalah sumber yang menerbitkan harganya sendiri di web; kalau
          kelak ada yang berbayar, ia akan ditandai jelas sebagai iklan dan tidak ikut perhitungan mana pun.
        </p>
        <TombolSaluranWa />
      </footer>
    </div>
  );
}
