"use client";

import { useState } from "react";
import Link from "next/link";
import { LABEL_SENTIMEN } from "@/lib/ambang";
import { ALASAN_RAGU } from "@/lib/suara";
import type { KomunitasProduk } from "@/lib/data/komunitas-produk";
import { nilaiLaporanHarga, suaraDiskusi } from "@/app/lapor/suara-actions";

const rupiah = (n: number) => "Rp " + n.toLocaleString("id-ID");

function umur(iso: string): string {
  const hari = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (hari < 1) return "hari ini";
  if (hari === 1) return "kemarin";
  if (hari < 30) return `${hari} hari lalu`;
  return `${Math.round(hari / 30)} bulan lalu`;
}

const LABEL_STATUS: Record<string, string> = {
  baru: "belum diperiksa",
  menunggu: "menunggu pembanding",
  terverifikasi: "terverifikasi data independen",
  meleset: "meleset dari data yang masuk",
  kedaluwarsa: "lewat 30 hari tanpa pembanding",
};

export function BlokKomunitas({ data, masuk }: { data: KomunitasProduk; masuk: boolean }) {
  // Blok yang belum cukup isi tidak dirender sama sekali. Ruang kosongnya
  // tidak dipamerkan.
  const adaApaPun = data.sentimen != null || data.laporan.length > 0 || data.diskusi.length > 0;
  if (!adaApaPun) return null;

  return (
    <>
      {data.sentimen && (
        <section className="border-b border-border py-10">
          <h2 className="mb-1 text-xl font-bold tracking-tight">Kata pembaca soal harganya</h2>
          <p className="mb-5 max-w-prose text-sm text-muted-foreground">
            {data.sentimen.total} orang memberi pendapat. Ini pendapat, bukan data harga — ia tidak ikut perhitungan mana pun.
          </p>
          <div className="flex flex-col gap-2">
            {(Object.keys(data.sentimen.per) as Array<keyof typeof data.sentimen.per>).map((k) => {
              const n = data.sentimen!.per[k];
              const persen = Math.round((n / data.sentimen!.total) * 100);
              return (
                <div key={k} className="grid grid-cols-[minmax(0,150px)_1fr_auto] items-center gap-3 text-sm">
                  <span>{LABEL_SENTIMEN[k]}</span>
                  <span className="h-3.5 bg-muted">
                    <span className="block h-full bg-foreground" style={{ width: `${persen}%` }} />
                  </span>
                  <span className="text-right text-xs text-muted-foreground">{n}</span>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {data.laporan.length > 0 && (
        <section className="border-b border-border py-10">
          <h2 className="mb-1 text-xl font-bold tracking-tight">Laporan pembeli</h2>
          <p className="mb-5 max-w-prose text-sm text-muted-foreground">
            Harga jadi yang dilaporkan pembaca. Sebuah laporan baru ikut perhitungan setelah ada harga toko yang masuk sesudahnya dan
            angkanya cocok — bukan setelah ada yang menyetujuinya.
          </p>
          <ul className="space-y-3">
            {data.laporan.map((l) => (
              <BarisLaporan key={l.id} laporan={l} masuk={masuk} />
            ))}
          </ul>
        </section>
      )}

      {data.diskusi.length > 0 && (
        <section className="border-b border-border py-10">
          <h2 className="mb-1 text-xl font-bold tracking-tight">Diskusi</h2>
          <p className="mb-5 max-w-prose text-sm text-muted-foreground">
            Bantah datanya, jangan orangnya dan jangan tokonya.
          </p>
          <ul className="space-y-3">
            {data.diskusi.map((d) => (
              <BarisDiskusi key={d.id} kiriman={d} masuk={masuk} />
            ))}
          </ul>
        </section>
      )}
    </>
  );
}

function BarisLaporan({ laporan: l, masuk }: { laporan: KomunitasProduk["laporan"][number]; masuk: boolean }) {
  const [pesan, setPesan] = useState<string | null>(null);
  const [pilihAlasan, setPilihAlasan] = useState(false);

  async function nilai(n: "masuk_akal" | "meragukan", alasan: string | null) {
    const h = await nilaiLaporanHarga(l.id, n, alasan);
    setPesan(h.pesan);
    setPilihAlasan(false);
  }

  return (
    <li className="border border-border p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <span className="text-lg font-bold">{rupiah(l.hargaJadi)}</span>
        <span className="text-xs text-muted-foreground">
          {l.area} · {umur(l.dibuatAt)}
        </span>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        {l.kondisi}
        {l.grade ? ` · ${l.grade}` : ""} · garansi {l.garansi}
        {l.adaHargaBuka && l.hargaBuka != null && ` · nego dari ${rupiah(l.hargaBuka)}`}
      </p>

      <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px]">
        <span
          className={`rounded border px-1.5 py-0.5 ${
            l.status === "terverifikasi"
              ? "border-murah text-murah"
              : l.status === "meleset"
                ? "border-mahal text-mahal"
                : "border-border text-muted-foreground"
          }`}
        >
          {LABEL_STATUS[l.status] ?? l.status}
        </span>
        {!l.masukHitungan && <span className="text-muted-foreground">belum ikut perhitungan</span>}
        {l.pemilik && <span className="rounded border border-border px-1.5 py-0.5 text-muted-foreground">pemilik</span>}
        {l.adaHargaBuka && (
          <span className="rounded border border-tanah px-1.5 py-0.5 text-tanah">menyebut harga buka</span>
        )}
        <Link href={`/orang/${l.userId}`} className="text-muted-foreground underline underline-offset-2">
          {l.nama ?? "rekam jejak pelapor"}
        </Link>
      </div>

      {masuk && (
        <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-border pt-3 text-xs">
          <button
            type="button"
            onClick={() => nilai("masuk_akal", null)}
            className="rounded border border-border px-2.5 py-1.5 hover:border-foreground"
          >
            Masuk akal {l.masukAkal > 0 && `· ${l.masukAkal}`}
          </button>
          <button
            type="button"
            onClick={() => setPilihAlasan(!pilihAlasan)}
            className="rounded border border-border px-2.5 py-1.5 hover:border-foreground"
          >
            Meragukan {l.meragukan > 0 && `· ${l.meragukan}`}
          </button>
          {pilihAlasan && (
            <div className="mt-1 w-full">
              <p className="mb-1.5 text-[11px] text-muted-foreground">
                Pilih alasannya. Kecurigaan tanpa alasan tidak bisa dihitung jadi apa pun.
              </p>
              <div className="flex flex-wrap gap-1.5">
                {ALASAN_RAGU.map((a) => (
                  <button
                    key={a.kode}
                    type="button"
                    onClick={() => nilai("meragukan", a.kode)}
                    className="rounded border border-border px-2 py-1 text-[11px] hover:border-foreground"
                  >
                    {a.label}
                  </button>
                ))}
              </div>
            </div>
          )}
          {pesan && <span className="w-full text-[11px] text-muted-foreground">{pesan}</span>}
        </div>
      )}
    </li>
  );
}

function BarisDiskusi({ kiriman: d, masuk }: { kiriman: KomunitasProduk["diskusi"][number]; masuk: boolean }) {
  const [buka, setBuka] = useState(false);
  const [skor, setSkor] = useState(d.skor);

  async function pilih(arah: 1 | -1) {
    const h = await suaraDiskusi(d.id, arah);
    if (h.ok) setSkor((s) => s + arah);
  }

  // Yang skornya sangat rendah DILIPAT, tidak dihapus. Jejaknya tetap ada
  // dan siapa pun bisa membukanya.
  if (d.dilipat && !buka) {
    return (
      <li className="border border-dashed border-border p-3 text-xs text-muted-foreground">
        Kiriman ini dilipat karena skornya sangat rendah.{" "}
        <button type="button" onClick={() => setBuka(true)} className="underline underline-offset-2">
          Tetap lihat
        </button>
      </li>
    );
  }

  return (
    <li className="border border-border p-4">
      <p className="text-sm leading-relaxed">{d.isi}</p>
      <div className="mt-2 flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
        <Link href={`/orang/${d.userId}`} className="underline underline-offset-2">
          {d.nama ?? "kontributor"}
        </Link>
        {d.pemilik && <span className="rounded border border-border px-1.5 py-0.5">pemilik</span>}
        <span>{umur(d.dibuatAt)}</span>
        {d.disunting && <span>disunting</span>}
        <span>skor {skor}</span>
        {masuk && (
          <span className="flex gap-1.5">
            <button type="button" onClick={() => pilih(1)} aria-label="Naikkan" className="rounded border border-border px-1.5">
              ▲
            </button>
            <button type="button" onClick={() => pilih(-1)} aria-label="Turunkan" className="rounded border border-border px-1.5">
              ▼
            </button>
          </span>
        )}
      </div>
    </li>
  );
}
