"use client";

import { useRef } from "react";
import { LANGKAH_PITA, rentangPita, type SebaranDevice } from "@/lib/cek";

const rupiah = (n: number) => "Rp " + n.toLocaleString("id-ID");
const jt = (n: number) => {
  const v = n / 1e6;
  return (v >= 10 ? v.toFixed(1) : v.toFixed(2)).replace(".", ",") + " jt";
};

const PX = 11; // lebar satu langkah di layar

// Kontrol masukannya sekaligus visualisasinya: harga tidak diketik, tapi
// digeser di atas pita yang sudah diarsir zona. Sambil menggeser,
// penggunanya melihat dirinya berpindah dari zona wajar ke zona mahal.
export function PitaUkur({
  sebaran,
  nilai,
  setNilai,
  label = "Harga yang ditawarkan",
}: {
  sebaran: SebaranDevice;
  nilai: number;
  setNilai: (n: number) => void;
  label?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const seret = useRef<{ x: number; awal: number } | null>(null);

  const { min, max } = rentangPita(sebaran);
  const jumlah = Math.max(1, (max - min) / LANGKAH_PITA);
  const keX = (v: number) => ((v - min) / LANGKAH_PITA) * PX;
  const batas = (v: number) => Math.max(min, Math.min(max, v));

  function mulai(e: React.PointerEvent<HTMLDivElement>) {
    ref.current?.setPointerCapture(e.pointerId);
    seret.current = { x: e.clientX, awal: nilai };
  }
  function gerak(e: React.PointerEvent<HTMLDivElement>) {
    if (!seret.current) return;
    const d = e.clientX - seret.current.x;
    setNilai(batas(seret.current.awal - Math.round(d / PX) * LANGKAH_PITA));
  }
  function henti() {
    seret.current = null;
  }
  const geserLangkah = (arah: number) => setNilai(batas(nilai + arah * LANGKAH_PITA));

  const zona = [
    { dari: min, sampai: sebaran.p10, k: "bawah" },
    { dari: sebaran.p10, sampai: sebaran.p25, k: "agak" },
    { dari: sebaran.p25, sampai: sebaran.p75, k: "umum" },
    { dari: sebaran.p75, sampai: sebaran.p90, k: "agak" },
    { dari: sebaran.p90, sampai: max, k: "atas" },
  ];

  const tik: Array<{ v: number; x: number; besar: boolean }> = [];
  for (let i = 0; i <= jumlah; i++) {
    const v = min + i * LANGKAH_PITA;
    tik.push({ v, x: i * PX, besar: v % 500_000 === 0 });
  }

  return (
    <div>
      <div className="mb-2.5 flex flex-wrap gap-4 text-[11px] text-muted-foreground">
        <span>
          <i className="mr-1.5 inline-block h-2.5 w-3.5 align-[-1px] bg-mahal/20" /> jauh di bawah
        </span>
        <span>
          <i className="mr-1.5 inline-block h-2.5 w-3.5 align-[-1px] bg-murah/25" /> rentang umum
        </span>
        <span>
          <i className="mr-1.5 inline-block h-2.5 w-3.5 align-[-1px] bg-mahal/20" /> jauh di atas
        </span>
      </div>

      <div
        ref={ref}
        className="pt-jendela border border-border bg-sorot"
        onPointerDown={mulai}
        onPointerMove={gerak}
        onPointerUp={henti}
        onPointerCancel={henti}
        role="slider"
        tabIndex={0}
        aria-label={label}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={nilai}
        aria-valuetext={rupiah(nilai)}
        onKeyDown={(e) => {
          if (e.key === "ArrowLeft") {
            e.preventDefault();
            geserLangkah(-1);
          }
          if (e.key === "ArrowRight") {
            e.preventDefault();
            geserLangkah(1);
          }
        }}
      >
        <div className="pt-isi" style={{ transform: `translateX(${-keX(nilai)}px)` }}>
          {/* Kunci pakai indeks, bukan nilai: pada sebaran tipis dua batas
              persentil bisa jatuh di angka yang sama persis. */}
          {zona.map((z, i) => (
            <span
              key={i}
              className={`pt-zona ${z.k}`}
              style={{ left: keX(z.dari), width: Math.max(0, keX(z.sampai) - keX(z.dari)) }}
            />
          ))}
          <span className="pt-median" style={{ left: keX(sebaran.p50) }} />
          {tik.map((g) => (
            <span key={g.v} className={`pt-tik${g.besar ? " besar" : ""}`} style={{ left: g.x }} />
          ))}
          {tik
            .filter((g) => g.besar)
            .map((g) => (
              <span key={"l" + g.v} className="pt-lb" style={{ left: g.x }}>
                {jt(g.v)}
              </span>
            ))}
        </div>
        <span className="pt-jarum" aria-hidden />
      </div>

      <div className="mt-3.5 flex items-center justify-center gap-4">
        <button
          type="button"
          onClick={() => geserLangkah(-1)}
          aria-label="Kurangi lima puluh ribu"
          className="rounded border border-border px-3 py-2 text-[12.5px] text-muted-foreground hover:border-foreground hover:text-foreground"
        >
          −50rb
        </button>
        <span className="min-w-[150px] text-center text-[22px] font-bold tracking-tight sm:min-w-[190px] sm:text-[26px]">
          {rupiah(nilai)}
        </span>
        <button
          type="button"
          onClick={() => geserLangkah(1)}
          aria-label="Tambah lima puluh ribu"
          className="rounded border border-border px-3 py-2 text-[12.5px] text-muted-foreground hover:border-foreground hover:text-foreground"
        >
          +50rb
        </button>
      </div>
    </div>
  );
}
