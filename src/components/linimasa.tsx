"use client";

import { useMemo, useRef, useState } from "react";
import type { TitikLinimasa } from "@/lib/data/linimasa";

const rupiah = (n: number) => "Rp " + n.toLocaleString("id-ID");
const jt = (n: number) => {
  const v = n / 1e6;
  return (v >= 10 ? v.toFixed(1) : v.toFixed(2)).replace(".", ",") + " jt";
};

// viewBox normal dengan width:100% dan height:auto -- TIDAK memakai
// preserveAspectRatio="none", supaya garis dan teks tidak ikut teregang
// mengikuti lebar layar.
const G = { W: 880, H: 330, kiri: 62, kanan: 26, atas: 22, bawah: 42 };
const TIK = 4;

type Jalur = "resmi" | "inter";

export function Linimasa({ titik, adaResmi, adaInter }: { titik: TitikLinimasa[]; adaResmi: boolean; adaInter: boolean }) {
  const [idx, setIdx] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const plot = useMemo(() => {
    const semua = titik.flatMap((d) => [d.resmi, d.inter]).filter((v): v is number => v != null);
    const hi = Math.max(...semua) * 1.03;
    const lo = Math.min(...semua) * 0.9;
    const X = (i: number) => G.kiri + (titik.length === 1 ? 0.5 : i / (titik.length - 1)) * (G.W - G.kiri - G.kanan);
    const Y = (v: number) => G.H - G.bawah - ((v - lo) / (hi - lo || 1)) * (G.H - G.atas - G.bawah);
    const garis = (k: Jalur) =>
      titik
        .map((d, i) => (d[k] == null ? null : `${X(i).toFixed(1)},${Y(d[k]!).toFixed(1)}`))
        .filter((s): s is string => s != null)
        .join(" ");
    const tik = Array.from({ length: TIK + 1 }, (_, t) => {
      const v = lo + ((hi - lo) * t) / TIK;
      return { v: Math.round(v), y: Y(v) };
    });
    // Label tahun diambil dari titik data bulan Januari; titik pertama ikut
    // diberi label supaya sumbu tidak pernah kosong sama sekali.
    const tahun = titik
      .map((d, i) => ({ d, i }))
      .filter(({ d, i }) => d.bulan.endsWith("-01") || i === 0)
      .map(({ d, i }) => ({ i, tahun: d.bulan.slice(0, 4) }));
    const september = titik.map((d, i) => ({ d, i })).filter(({ d, i }) => d.bulan.endsWith("-09") && i > 0);
    return { X, Y, garis, tik, tahun, september };
  }, [titik]);

  if (titik.length < 2) {
    return <p className="text-sm text-muted-foreground">Belum cukup riwayat bulanan untuk menggambar grafik.</p>;
  }

  // onPointerLeave mengembalikan panel ke nilai TERAKHIR, bukan mengosongkannya.
  const baca = idx === null ? titik[titik.length - 1] : titik[idx];
  const terakhirResmi = [...titik].reverse().find((d) => d.resmi != null)?.resmi ?? null;
  const terakhirInter = [...titik].reverse().find((d) => d.inter != null)?.inter ?? null;

  function gerak(e: React.PointerEvent<SVGSVGElement>) {
    const svg = svgRef.current;
    if (!svg) return;
    const r = svg.getBoundingClientRect();
    const px = ((e.clientX - r.left) / r.width) * G.W;
    const rel = (px - G.kiri) / (G.W - G.kiri - G.kanan);
    setIdx(Math.max(0, Math.min(titik.length - 1, Math.round(rel * (titik.length - 1)))));
  }

  return (
    <div>
      <div
        className="mb-4 flex flex-wrap items-baseline gap-x-5 gap-y-2 border-b border-border pb-3 text-[13px] text-muted-foreground"
        aria-live="polite"
      >
        <span className="min-w-[86px] font-semibold text-foreground">{baca.label}</span>
        {adaResmi && (
          <span>
            <i className="mr-1.5 inline-block h-[2.5px] w-2.5 bg-foreground align-middle" aria-hidden /> jalur resmi{" "}
            <b className="ml-0.5 font-bold text-foreground">{baca.resmi != null ? rupiah(baca.resmi) : "—"}</b>
          </span>
        )}
        {adaInter && (
          <span>
            <i className="mr-1.5 inline-block h-[2.5px] w-2.5 bg-tanah align-middle" aria-hidden /> jalur inter{" "}
            <b className="ml-0.5 font-bold text-foreground">{baca.inter != null ? rupiah(baca.inter) : "—"}</b>
          </span>
        )}
        {baca.resmi != null && baca.inter != null && (
          <span className="sm:ml-auto">selisih {rupiah(baca.resmi - baca.inter)}</span>
        )}
      </div>

      <svg
        ref={svgRef}
        viewBox={`0 0 ${G.W} ${G.H}`}
        className="block h-auto w-full cursor-crosshair touch-none"
        onPointerMove={gerak}
        onPointerLeave={() => setIdx(null)}
        role="img"
        aria-label="Grafik harga bulanan sejak data pertama terpantau"
      >
        {plot.tik.map((t) => (
          <g key={t.v}>
            <line className="stroke-border" strokeWidth={1} x1={G.kiri} y1={t.y} x2={G.W - G.kanan} y2={t.y} />
            <text className="fill-muted-foreground text-[11px]" x={G.kiri - 10} y={t.y + 3.5} textAnchor="end">
              {jt(t.v)}
            </text>
          </g>
        ))}
        {plot.september.map(({ i }) => (
          <line
            key={i}
            className="stroke-border"
            strokeWidth={1}
            strokeDasharray="2 5"
            x1={plot.X(i)}
            y1={G.atas}
            x2={plot.X(i)}
            y2={G.H - G.bawah}
          />
        ))}
        {plot.tahun.map(({ i, tahun }) => (
          <text key={i} className="fill-muted-foreground text-[11px]" x={plot.X(i)} y={G.H - 22} textAnchor="middle">
            {tahun}
          </text>
        ))}
        <line className="stroke-border" strokeWidth={1} x1={G.kiri} y1={G.H - G.bawah} x2={G.W - G.kanan} y2={G.H - G.bawah} />

        {adaInter && (
          <polyline className="fill-none stroke-tanah" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" points={plot.garis("inter")} />
        )}
        {adaResmi && (
          <polyline
            className="fill-none stroke-foreground"
            strokeWidth={2}
            strokeLinejoin="round"
            strokeLinecap="round"
            points={plot.garis("resmi")}
          />
        )}

        {idx !== null && (
          <>
            <line className="stroke-muted-foreground" strokeWidth={1} x1={plot.X(idx)} y1={G.atas} x2={plot.X(idx)} y2={G.H - G.bawah} />
            {titik[idx].resmi != null && <circle cx={plot.X(idx)} cy={plot.Y(titik[idx].resmi!)} r="4.5" className="fill-foreground" />}
            {titik[idx].inter != null && <circle cx={plot.X(idx)} cy={plot.Y(titik[idx].inter!)} r="4.5" className="fill-tanah" />}
          </>
        )}

        {/* Label di ujung kanan garis, bukan cuma di legenda. */}
        {adaResmi && terakhirResmi != null && (
          <text className="fill-foreground text-[11.5px] font-semibold" x={G.W - G.kanan} y={plot.Y(terakhirResmi) - 9} textAnchor="end">
            resmi
          </text>
        )}
        {adaInter && terakhirInter != null && (
          <text className="fill-tanah text-[11.5px] font-semibold" x={G.W - G.kanan} y={plot.Y(terakhirInter) + 15} textAnchor="end">
            inter
          </text>
        )}
      </svg>
    </div>
  );
}
