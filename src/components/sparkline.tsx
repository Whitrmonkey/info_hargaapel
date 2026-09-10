import type { TitikSeri } from "@/lib/seri";

// SVG polyline sederhana, tanpa library chart -- BAGIAN 7 minta sparkline
// ringan untuk kartu kecil, bukan chart interaktif penuh.
export function Sparkline({ seri, width = 120, height = 32 }: { seri: TitikSeri[]; width?: number; height?: number }) {
  const nilai = seri.map((s) => s.median).filter((n): n is number => n != null);
  if (nilai.length < 2) return null;

  const lo = Math.min(...nilai);
  const hi = Math.max(...nilai);
  const rentang = hi - lo || 1;
  const p = 3;

  const valid = seri.filter((s) => s.median != null);
  const titik = valid.map((s, i) => {
    const x = p + (i / (valid.length - 1)) * (width - p * 2);
    const y = height - p - ((s.median! - lo) / rentang) * (height - p * 2);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });

  const naik = valid[valid.length - 1].median! >= valid[0].median!;
  const [lx, ly] = titik[titik.length - 1].split(",");

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width={width}
      height={height}
      role="img"
      aria-label={`Tren harga, ${naik ? "naik" : "turun"}`}
    >
      <polyline
        points={titik.join(" ")}
        fill="none"
        strokeWidth={1.5}
        className={naik ? "stroke-mahal" : "stroke-murah"}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <circle cx={lx} cy={ly} r={2.6} className={naik ? "fill-mahal" : "fill-murah"} />
    </svg>
  );
}

export function TitikKesegaran({ observedAt }: { observedAt: string }) {
  const jam = (Date.now() - new Date(observedAt).getTime()) / 3_600_000;
  const kelas = jam < 48 ? "bg-murah" : jam < 168 ? "bg-amber-500" : "bg-muted-foreground/40";
  return <span className={`inline-block h-1.5 w-1.5 rounded-full ${kelas}`} aria-hidden />;
}
