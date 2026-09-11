"use client";

import { useState } from "react";
import Link from "next/link";
import { PitaUkur } from "@/components/pita-ukur";
import { kirimLaporan } from "@/app/lapor/actions";
import type { SebaranDevice } from "@/lib/cek";

const rupiah = (n: number) => "Rp " + n.toLocaleString("id-ID");

const KELENGKAPAN: Array<{ kode: string; label: string }> = [
  { kode: "dus", label: "Dus" },
  { kode: "carger", label: "Charger" },
  { kode: "kabel", label: "Kabel" },
  { kode: "nota", label: "Nota" },
  { kode: "kartu_garansi", label: "Kartu garansi" },
];

// Satu tempat yang paling penting untuk meminta laporan: tepat setelah hasil
// di /cek-harga muncul penuh. Penggunanya sudah memasukkan angkanya, tinggal
// disesuaikan. Volume datang dari orang yang kebetulan sedang membeli HP,
// bukan dari orang yang peduli pada komunitas.
//
// Tidak ada modal, popup, overlay, atau exit intent di sini. Kalau ia tidak
// jadi melapor, tidak terjadi apa-apa.
export function AjakLapor({
  productId,
  kondisi,
  grade,
  garansi,
  area,
  sebaran,
  hargaAwal,
  masuk,
}: {
  productId: string;
  kondisi: string;
  grade: string | null;
  garansi: string;
  area: string;
  sebaran: SebaranDevice;
  hargaAwal: number;
  masuk: boolean;
}) {
  const [buka, setBuka] = useState(false);
  const [hargaJadi, setHargaJadi] = useState(hargaAwal);
  const [pakaiBuka, setPakaiBuka] = useState(false);
  const [hargaBuka, setHargaBuka] = useState(hargaAwal);
  const [kelengkapan, setKelengkapan] = useState<string[]>([]);
  const [kirim, setKirim] = useState(false);
  const [pesan, setPesan] = useState<string | null>(null);

  async function simpan() {
    setKirim(true);
    const h = await kirimLaporan({
      productId,
      kondisi,
      grade,
      garansi,
      area,
      hargaJadi,
      hargaBuka: pakaiBuka && hargaBuka >= hargaJadi ? hargaBuka : null,
      tanggalBeli: new Date().toISOString().slice(0, 10),
      kelengkapan,
      catatan: null,
    });
    setPesan(h.pesan);
    setKirim(false);
    if (h.ok) setBuka(false);
  }

  if (pesan && !buka) {
    return (
      <section className="mt-8 border-t border-border pt-7">
        <p className="max-w-prose text-sm leading-relaxed">{pesan}</p>
      </section>
    );
  }

  return (
    <section className="mt-8 border-t border-border pt-7">
      <h2 className="mb-1.5 text-sm font-semibold">Jadi beli?</h2>
      <p className="mb-4 max-w-[60ch] text-[13.5px] leading-relaxed text-muted-foreground">
        Kalau jadi, sebutkan harga jadinya dan harga bukanya. Dua angka itu yang paling sulit ditiru orang yang tidak benar-benar
        membeli, dan laporan yang menyertakannya jauh lebih cepat terverifikasi.
      </p>

      {!masuk ? (
        <p className="text-sm text-muted-foreground">
          <Link href="/masuk" className="underline underline-offset-2">
            Masuk dulu
          </Link>{" "}
          untuk melapor. Laporanmu baru ikut perhitungan setelah ada harga toko yang cocok masuk sesudahnya.
        </p>
      ) : !buka ? (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setBuka(true)}
            className="min-h-[46px] rounded bg-foreground px-5 py-3 text-[15px] text-background"
          >
            Lapor harga jadi
          </button>
        </div>
      ) : (
        <div className="space-y-5">
          <div>
            <p className="mb-2 text-xs text-muted-foreground">Harga jadinya berapa</p>
            <PitaUkur sebaran={sebaran} nilai={hargaJadi} setNilai={setHargaJadi} label="Harga jadi" />
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={pakaiBuka} onChange={(e) => setPakaiBuka(e.target.checked)} />
              Sebutkan juga harga bukanya (nego dari berapa)
            </label>
            {pakaiBuka && (
              <div className="mt-3">
                <PitaUkur sebaran={sebaran} nilai={hargaBuka} setNilai={setHargaBuka} label="Harga buka" />
                {hargaBuka < hargaJadi && (
                  <p className="mt-2 text-xs text-mahal">
                    Harga buka tidak mungkin lebih rendah dari harga jadi. Geser ke atas dulu.
                  </p>
                )}
              </div>
            )}
          </div>

          <div>
            <p className="mb-2 text-xs text-muted-foreground">Kelengkapan yang ikut (opsional)</p>
            <div className="flex flex-wrap gap-2">
              {KELENGKAPAN.map((k) => {
                const aktif = kelengkapan.includes(k.kode);
                return (
                  <button
                    key={k.kode}
                    type="button"
                    aria-pressed={aktif}
                    onClick={() => setKelengkapan((s) => (aktif ? s.filter((x) => x !== k.kode) : [...s, k.kode]))}
                    className={`rounded px-3 py-2 text-sm ${aktif ? "bg-foreground text-background" : "border border-border"}`}
                  >
                    {k.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              disabled={kirim || (pakaiBuka && hargaBuka < hargaJadi)}
              onClick={simpan}
              className="min-h-[46px] rounded bg-foreground px-5 py-3 text-[15px] text-background disabled:opacity-40"
            >
              {kirim ? "Menyimpan…" : `Kirim laporan ${rupiah(hargaJadi)}`}
            </button>
            <button type="button" onClick={() => setBuka(false)} className="text-sm text-muted-foreground underline underline-offset-2">
              Belum, simpan dulu
            </button>
          </div>
          {pesan && <p className="text-sm text-muted-foreground">{pesan}</p>}
        </div>
      )}
    </section>
  );
}
