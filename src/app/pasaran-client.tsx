"use client";

import { useMemo, useState } from "react";
import type { BidAsk, Garansi, Grade, GrupPasaran, Kondisi, ObservasiHarga, Vonis } from "@/lib/pasaran";
import { useRealtimeObservasi } from "@/lib/realtime/use-realtime-observasi";
import { TombolSaluranWa } from "@/components/tombol-saluran-wa";

interface SinyalRingkas {
  kode: string;
  judul: string;
  alasan: string;
}

export interface ItemGabungan extends ObservasiHarga {
  model: string;
  varian: string;
  kategori: string;
  slug: string;
  // Hanya terisi untuk sumber yang menerbitkan harganya sendiri (scraper).
  // Untuk pencatatan manual, ini selalu null -- namanya tidak pernah
  // dikirim ke klien sama sekali (aturan keras 5).
  toko: string | null;
  bisaDisebut: boolean;
  tipe_toko: string;
  area: string;
  url: string | null;
}

const LABEL_KATEGORI: Record<string, string> = {
  iphone: "iPhone",
  ipad: "iPad",
  mac: "Mac",
  watch: "Watch",
  audio: "Audio",
  aksesoris: "Aksesoris",
};
const LABEL_KONDISI: Record<Kondisi, string> = { baru: "Baru segel", second: "Second", refurb: "Refurbished" };
const LABEL_GARANSI: Record<Garansi, string> = { resmi: "Garansi resmi", inter: "Inter", toko: "Garansi toko" };
const LABEL_GRADE: Record<Grade, string> = { mulus: "Mulus", standar: "Standar", ekonomis: "Ekonomis" };

const rupiah = (n: number) => "Rp " + n.toLocaleString("id-ID");

function segarLabel(iso: string): { teks: string; kelas: string } {
  const jam = (Date.now() - new Date(iso).getTime()) / 3_600_000;
  if (jam < 48) return { teks: `${Math.max(1, Math.round(jam))} jam lalu`, kelas: "bg-murah" };
  if (jam < 168) return { teks: `${Math.round(jam / 24)} hari lalu`, kelas: "bg-amber-500" };
  return { teks: `${Math.round(jam / 24)} hari lalu`, kelas: "bg-muted-foreground/40" };
}

function warnaVonis(v: Vonis): string {
  if (v === "murah") return "text-murah";
  if (v === "mahal") return "text-mahal";
  return "text-muted-foreground";
}

export function PasaranClient({
  grup,
  daftarArea,
  totalToko,
  bidAskByKey,
  sinyalByKey,
}: {
  grup: GrupPasaran<ItemGabungan>[];
  daftarArea: string[];
  totalToko: number;
  bidAskByKey: Record<string, BidAsk | null>;
  sinyalByKey: Record<string, SinyalRingkas>;
}) {
  const [kategori, setKategori] = useState("semua");
  const [kondisi, setKondisi] = useState("semua");
  const [garansi, setGaransi] = useState("semua");
  const [area, setArea] = useState("semua");
  const [cari, setCari] = useState("");
  const [urut, setUrut] = useState<"selisih" | "murah">("selisih");
  const idBaru = useRealtimeObservasi();

  const kategoriTersedia = useMemo(
    () => Array.from(new Set(grup.map((g) => g.items[0]?.kategori))).filter(Boolean),
    [grup],
  );

  const sorotan = useMemo(() => {
    if (grup.length === 0) return null;
    return [...grup].sort((a, b) => (b.tertinggi - b.terendah) / b.terendah - (a.tertinggi - a.terendah) / a.terendah)[0];
  }, [grup]);

  const grupTersaring = useMemo(() => {
    const q = cari.trim().toLowerCase();
    let hasil = grup.filter((g) => {
      const info = g.items[0];
      if (!info) return false;
      if (kategori !== "semua" && info.kategori !== kategori) return false;
      if (kondisi !== "semua" && g.kondisi !== kondisi) return false;
      if (garansi !== "semua" && g.garansi !== garansi) return false;
      if (area !== "semua" && !g.items.some((i) => i.area === area)) return false;
      if (q && !`${info.model} ${info.varian}`.toLowerCase().includes(q)) return false;
      return true;
    });
    hasil = [...hasil].sort((a, b) => {
      if (urut === "murah") return a.terendah - b.terendah;
      return (b.tertinggi - b.terendah) / b.terendah - (a.tertinggi - a.terendah) / a.terendah;
    });
    return hasil;
  }, [grup, kategori, kondisi, garansi, area, cari, urut]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-3xl px-5 pb-20">
        <header className="flex items-baseline justify-between gap-4 border-b border-foreground py-5">
          <span className="text-xl font-bold tracking-tight">hargaapel</span>
          <nav className="flex items-center gap-4 text-xs">
            <a href="/servis" className="text-muted-foreground underline underline-offset-2 hover:text-foreground">
              Servis
            </a>
            <a href="/cek-harga" className="text-muted-foreground underline underline-offset-2 hover:text-foreground">
              Cek harga servis
            </a>
          </nav>
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-murah" aria-hidden />
            {grup.reduce((n, g) => n + g.items.length, 0)} penawaran dari {totalToko} toko
          </span>
        </header>

        {sorotan && sorotan.items[0] && (
          <section className="border-b border-border py-8">
            <p className="mb-2 text-sm text-muted-foreground">Selisih terbesar hari ini</p>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              {sorotan.items[0].model} {sorotan.items[0].varian}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {LABEL_KONDISI[sorotan.kondisi]}, {LABEL_GARANSI[sorotan.garansi]} — dipantau di {sorotan.jumlah_toko} toko
            </p>
            <p className="mt-6 text-sm">
              Beda <b>{rupiah(sorotan.tertinggi - sorotan.terendah)}</b> (
              {Math.round(((sorotan.tertinggi - sorotan.terendah) / sorotan.terendah) * 100)}%) untuk barang yang
              sama. Harga pasaran {rupiah(sorotan.median)}.
            </p>
          </section>
        )}

        <div className="sticky top-0 z-10 space-y-2 border-b border-border bg-background py-3">
          <div className="flex flex-wrap gap-1.5">
            <Chip aktif={kategori === "semua"} onClick={() => setKategori("semua")}>
              Semua
            </Chip>
            {kategoriTersedia.map((k) => (
              <Chip key={k} aktif={kategori === k} onClick={() => setKategori(k)}>
                {LABEL_KATEGORI[k] ?? k}
              </Chip>
            ))}
          </div>
          <div className="flex flex-wrap gap-1.5">
            <Chip aktif={kondisi === "semua"} onClick={() => setKondisi("semua")}>
              Semua kondisi
            </Chip>
            {(Object.keys(LABEL_KONDISI) as Kondisi[]).map((k) => (
              <Chip key={k} aktif={kondisi === k} onClick={() => setKondisi(k)}>
                {LABEL_KONDISI[k]}
              </Chip>
            ))}
          </div>
          <div className="flex flex-wrap gap-1.5">
            <Chip aktif={garansi === "semua"} onClick={() => setGaransi("semua")}>
              Semua garansi
            </Chip>
            {(Object.keys(LABEL_GARANSI) as Garansi[]).map((g) => (
              <Chip key={g} aktif={garansi === g} onClick={() => setGaransi(g)}>
                {LABEL_GARANSI[g]}
              </Chip>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <input
              value={cari}
              onChange={(e) => setCari(e.target.value)}
              placeholder="Cari model"
              aria-label="Cari model"
              className="min-w-36 flex-1 rounded border border-border bg-transparent px-2.5 py-1.5 text-sm placeholder:text-muted-foreground"
            />
            <select
              value={area}
              onChange={(e) => setArea(e.target.value)}
              aria-label="Pilih area"
              className="rounded border border-border bg-transparent px-2.5 py-1.5 text-sm"
            >
              <option value="semua">Semua area</option>
              {daftarArea.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
            <select
              value={urut}
              onChange={(e) => setUrut(e.target.value as "selisih" | "murah")}
              aria-label="Urutkan"
              className="rounded border border-border bg-transparent px-2.5 py-1.5 text-sm"
            >
              <option value="selisih">Selisih terbesar</option>
              <option value="murah">Termurah dulu</option>
            </select>
          </div>
        </div>

        {grupTersaring.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-sm">Belum ada barang yang bisa dibandingkan di filter ini.</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Perbandingan butuh minimal dua toko untuk barang yang sama. Longgarkan filternya.
            </p>
          </div>
        ) : (
          grupTersaring.map((g) => {
            const info = g.items[0];
            return (
              <section key={g.key} className="border-b border-border py-6">
                <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-semibold tracking-tight">
                      <a href={`/p/${info.slug}`} className="hover:underline">
                        {info.model} {info.varian}
                      </a>
                    </h2>
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      <Tag>{LABEL_KONDISI[g.kondisi]}</Tag>
                      {g.grade && <Tag>{LABEL_GRADE[g.grade]}</Tag>}
                      <Tag>{LABEL_GARANSI[g.garansi]}</Tag>
                      <Tag>{g.jumlah_toko} toko</Tag>
                    </div>
                  </div>
                  <div className="text-right text-xs text-muted-foreground">
                    harga pasaran
                    <div className="text-base font-semibold text-foreground">{rupiah(g.median)}</div>
                  </div>
                </div>

                {(() => {
                  const sinyal = sinyalByKey[g.key];
                  if (!sinyal || sinyal.kode === "sepi") return null;
                  return (
                    <div
                      className={`mb-3 border-l-2 pl-3 ${
                        sinyal.kode === "tahan" ? "border-mahal" : sinyal.kode === "beli" ? "border-murah" : "border-border"
                      }`}
                    >
                      <p
                        className={`text-sm font-semibold ${
                          sinyal.kode === "tahan" ? "text-mahal" : sinyal.kode === "beli" ? "text-murah" : "text-muted-foreground"
                        }`}
                      >
                        {sinyal.judul}
                      </p>
                      <p className="text-sm text-muted-foreground">{sinyal.alasan}</p>
                    </div>
                  );
                })()}

                {(() => {
                  const bidAsk = bidAskByKey[g.key];
                  if (!bidAsk) return null;
                  return (
                    <div className="mb-3 flex items-center justify-between rounded-md bg-muted/50 px-3 py-2 text-xs">
                      <span>
                        <span className="text-muted-foreground">Beli (buyback) tertinggi</span>{" "}
                        <b>{rupiah(bidAsk.bid_tertinggi)}</b>
                      </span>
                      <span>
                        <span className="text-muted-foreground">Jual (toko) terendah</span> <b>{rupiah(bidAsk.ask_terendah)}</b>
                      </span>
                      <span className="text-muted-foreground">
                        selisih {rupiah(bidAsk.selisih)} ({Math.round(bidAsk.selisih_persen * 100)}%)
                      </span>
                    </div>
                  );
                })()}

                <div className="flex flex-col">
                  {g.items.map((it) => {
                    const segar = segarLabel(it.observed_at);
                    const baru = idBaru.has(it.id);
                    return (
                      <div
                        key={it.id}
                        className={`grid grid-cols-[auto_1fr_auto] items-center gap-3 border-t border-border/60 py-2.5 first:border-t-0 transition-colors duration-1000 ${baru ? "bg-murah/10" : "bg-transparent"}`}
                      >
                        <div className={`text-sm font-semibold ${warnaVonis(it.vonis)}`}>{rupiah(it.harga)}</div>
                        <div className="min-w-0 text-sm">
                          <div className="flex items-center gap-1.5">
                            {it.bisaDisebut && it.url && it.toko ? (
                              <a href={it.url} target="_blank" rel="noopener noreferrer" className="truncate underline underline-offset-2">
                                {it.toko}
                              </a>
                            ) : (
                              <span className="truncate">{it.area}</span>
                            )}
                            {it.perlu_verifikasi && (
                              <span
                                title="Di luar rentang referensi, perlu diverifikasi"
                                className="rounded-sm border border-amber-500/50 px-1 text-[10px] font-medium text-amber-600 dark:text-amber-400"
                              >
                                verifikasi
                              </span>
                            )}
                          </div>
                          <div className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                            <span className={`h-1.5 w-1.5 rounded-full ${segar.kelas}`} aria-hidden />
                            {it.bisaDisebut ? `${it.area} · ` : ""}dicek {segar.teks}
                          </div>
                        </div>
                        <div className={`text-xs font-medium whitespace-nowrap ${warnaVonis(it.vonis)}`}>
                          {it.vonis === "wajar" ? "wajar" : `${it.delta > 0 ? "+" : ""}${Math.round(it.delta * 100)}% ${it.vonis}`}
                        </div>
                        <div className="col-span-3 h-1 rounded-full bg-muted">
                          <div
                            className={`h-full rounded-full ${it.vonis === "murah" ? "bg-murah" : it.vonis === "mahal" ? "bg-mahal" : "bg-foreground/40"}`}
                            style={{ width: `${Math.max(it.posisi * 100, 1.5)}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            );
          })
        )}

        <footer className="space-y-3 pt-8 text-xs leading-relaxed text-muted-foreground">
          <p className="max-w-prose">
            Harga pasaran adalah nilai tengah semua penawaran untuk barang yang benar-benar sebanding: model, varian,
            kondisi, dan status garansi yang sama. Unit inter dan unit garansi resmi tidak pernah dicampur dalam satu
            perbandingan.
          </p>
          <p>Bukan saran keuangan. Harga bisa berubah. Harga yang ditampilkan adalah yang terpantau, bukan yang dianjurkan.</p>
          <p>
            Kontributor:{" "}
            <a href="/catat" className="underline underline-offset-2 hover:text-foreground">
              catat harga device
            </a>{" "}
            ·{" "}
            <a href="/catat/servis" className="underline underline-offset-2 hover:text-foreground">
              catat harga servis
            </a>{" "}
            ·{" "}
            <a href="/catat/komponen" className="underline underline-offset-2 hover:text-foreground">
              catat harga komponen
            </a>
          </p>
          <p>
            <a href="/masuk" className="underline underline-offset-2 hover:text-foreground">
              Mau dikabari kalau harga turun? Masuk
            </a>{" "}
            · <TombolSaluranWa />
          </p>
        </footer>
      </div>
    </div>
  );
}

function Chip({ aktif, onClick, children }: { aktif: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={aktif}
      onClick={onClick}
      className={`rounded-full border px-3 py-1.5 text-xs transition-colors ${
        aktif ? "border-foreground bg-foreground text-background" : "border-border text-muted-foreground hover:border-foreground hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}

function Tag({ children }: { children: React.ReactNode }) {
  return <span className="rounded-sm border border-border px-1.5 py-0.5 text-[11px] text-muted-foreground">{children}</span>;
}
