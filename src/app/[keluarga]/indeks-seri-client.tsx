"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Siluet, type AtributSiluet } from "@/components/siluet";
import { FooterLegal } from "@/components/footer-legal";
import type { KartuSeri } from "@/lib/data/indeks-seri";

const jt = (n: number) => {
  const v = n / 1e6;
  return (v >= 10 ? v.toFixed(1) : v.toFixed(2)).replace(".", ",") + " jt";
};

type Urut = "baru" | "murah" | "stabil";

const URUT: Array<[Urut, string]> = [
  ["baru", "Terbaru"],
  ["murah", "Termurah"],
  ["stabil", "Paling stabil"],
];

const WARNA_FASE: Record<string, string> = {
  cepat: "text-tanah",
  sedang: "text-muted-foreground",
  landai: "text-murah",
  datar: "text-murah",
};

export function IndeksSeriClient({
  judul,
  kategori,
  kartu,
  maks,
}: {
  judul: string;
  kategori: string;
  kartu: KartuSeri[];
  maks: number;
}) {
  const [urut, setUrut] = useState<Urut>("baru");

  const daftar = useMemo(() => {
    const d = [...kartu];
    if (urut === "baru") d.sort((a, b) => (b.tahun ?? 0) - (a.tahun ?? 0));
    // Yang belum punya angkanya turun ke bawah, bukan dianggap nol.
    if (urut === "murah") d.sort((a, b) => (a.bekasBawah ?? Infinity) - (b.bekasBawah ?? Infinity));
    if (urut === "stabil") d.sort((a, b) => (b.laju ?? -Infinity) - (a.laju ?? -Infinity));
    return d;
  }, [kartu, urut]);

  return (
    <div className="mx-auto max-w-5xl px-5 pb-20">
      <nav className="flex items-center justify-between border-b border-foreground py-4 text-sm">
        <Link href="/" className="text-lg font-bold tracking-tight">
          hargaapel
        </Link>
        <Link href="/servis" className="text-xs text-muted-foreground underline underline-offset-2">
          Servis
        </Link>
      </nav>

      <header className="border-b border-border py-8">
        <h1 className="mb-3 text-3xl font-bold tracking-tight sm:text-4xl">{judul}</h1>
        <p className="mb-5 max-w-prose text-sm leading-relaxed text-muted-foreground">
          Generasi yang masih diperdagangkan di Jabodetabek, dengan rentang harga bekas jalur resmi minggu ini. Batang menunjukkan
          posisi tiap seri terhadap yang termahal di keluarga ini, jadi jarak antar generasi bisa dibaca langsung.
        </p>
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Urutkan">
          {URUT.map(([k, l]) => (
            <button
              key={k}
              type="button"
              aria-pressed={urut === k}
              onClick={() => setUrut(k)}
              className={`rounded border px-3.5 py-1.5 text-[13px] ${
                urut === k ? "border-foreground bg-foreground text-background" : "border-border text-muted-foreground"
              }`}
            >
              {l}
            </button>
          ))}
        </div>
      </header>

      {daftar.length === 0 ? (
        <p className="py-10 text-sm text-muted-foreground">Belum ada produk aktif di keluarga ini.</p>
      ) : (
        <div className="grid grid-cols-1 gap-x-8 md:grid-cols-2">
          {daftar.map((s) => {
            const kiri = s.bekasBawah != null ? (s.bekasBawah / maks) * 100 : 0;
            const lebar = s.bekasBawah != null && s.bekasAtas != null ? ((s.bekasAtas - s.bekasBawah) / maks) * 100 : 0;
            return (
              <Link
                key={s.id}
                href={`/p/${s.slug}`}
                className="block border-b border-border py-5 hover:bg-sorot"
              >
                <div className="flex items-start gap-4">
                  <Siluet kategori={kategori} atribut={(s.bentuk?.siluet as AtributSiluet | undefined) ?? null} />
                  <div className="min-w-0 flex-1">
                    <p className="text-lg font-semibold tracking-tight">
                      {s.model} <span className="font-normal text-muted-foreground">{s.varian}</span>
                    </p>
                    <p className="mb-3 text-[11.5px] text-muted-foreground">
                      {s.tahun ?? "tahun rilis belum dicatat"} · {s.jumlahToko} toko terpantau
                    </p>
                    {s.bekasBawah != null && s.bekasAtas != null ? (
                      <>
                        <p className="text-[19px] font-bold tracking-tight">
                          {jt(s.bekasBawah)} – {jt(s.bekasAtas)}
                        </p>
                        <p className="text-[11.5px] text-muted-foreground">bekas jalur resmi, semua kondisi</p>
                      </>
                    ) : (
                      <p className="text-sm text-muted-foreground">Belum ada harga bekas jalur resmi yang terpantau.</p>
                    )}
                  </div>
                </div>

                <div className="relative my-3 h-1 bg-muted" aria-hidden>
                  {lebar > 0 && (
                    <span className="absolute inset-y-0 min-w-[3px] bg-foreground" style={{ left: `${kiri}%`, width: `${lebar}%` }} />
                  )}
                </div>

                <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11.5px] text-muted-foreground">
                  {s.fase && s.laju != null ? (
                    <>
                      <span className={`font-semibold ${WARNA_FASE[s.fase.kode]}`}>{s.fase.teks}</span>
                      <span>{(s.laju * 100).toFixed(1).replace(".", ",")}% / bulan</span>
                    </>
                  ) : (
                    <span>belum cukup riwayat untuk laju bulanan</span>
                  )}
                  {s.turunDariRilis != null && (
                    <span className="sm:ml-auto">−{Math.round(s.turunDariRilis * 100)}% dari rilis</span>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}

      <FooterLegal>
        <p className="max-w-prose">
          Fase hidup dihitung dari laju penurunan bulanan, bukan dari umur. Dua model seumuran bisa berada di fase berbeda, dan itu
          memang informasinya. Angka rentang mencakup semua kondisi dari ekonomis sampai mulus, jadi ujung bawahnya bukan harga yang
          bisa langsung diharapkan. Siluet digambar dari atribut produk, bukan foto.
        </p>
      </FooterLegal>
    </div>
  );
}
