import type { TitikSeri } from "@/lib/seri";

const rupiah = (n: number) => "Rp " + n.toLocaleString("id-ID");

// Grafik 90 hari, dua seri berdampingan (mis. jual vs beli, atau dua grade
// part) -- BAGIAN 10 "/p/[slug] dan /servis/[produk]/[jenis] dengan grafik
// dua seri". SVG polos, tanpa library chart, sama seperti Sparkline.
export function GrafikDuaSeri({
  seriA,
  labelA,
  seriB,
  labelB,
  width = 600,
  height = 160,
}: {
  seriA: TitikSeri[];
  labelA: string;
  seriB?: TitikSeri[] | null;
  labelB?: string;
  width?: number;
  height?: number;
}) {
  const validA = seriA.filter((s) => s.median != null);
  const validB = (seriB ?? []).filter((s) => s.median != null);
  if (validA.length < 2 && validB.length < 2) {
    return <p className="text-sm text-muted-foreground">Belum cukup riwayat untuk grafik.</p>;
  }

  const semuaNilai = [...validA, ...validB].map((s) => s.median!);
  const lo = Math.min(...semuaNilai);
  const hi = Math.max(...semuaNilai);
  const rentang = hi - lo || 1;
  const p = 8;

  function jalur(seri: { median: number | null }[]) {
    const v = seri.filter((s) => s.median != null);
    if (v.length < 2) return "";
    return v
      .map((s, i) => {
        const x = p + (i / (v.length - 1)) * (width - p * 2);
        const y = height - p - ((s.median! - lo) / rentang) * (height - p * 2);
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(" ");
  }

  return (
    <div>
      <svg viewBox={`0 0 ${width} ${height}`} width="100%" height={height} role="img" aria-label="Grafik tren 90 hari">
        {validA.length >= 2 && (
          <polyline points={jalur(validA)} fill="none" strokeWidth={2} className="stroke-foreground" strokeLinejoin="round" strokeLinecap="round" />
        )}
        {validB.length >= 2 && (
          <polyline points={jalur(validB)} fill="none" strokeWidth={2} strokeDasharray="4 3" className="stroke-mahal" strokeLinejoin="round" strokeLinecap="round" />
        )}
      </svg>
      <div className="mt-2 flex flex-wrap gap-4 text-xs text-muted-foreground">
        {validA.length > 0 && (
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-0.5 w-4 bg-foreground" /> {labelA} ({rupiah(validA[validA.length - 1].median!)})
          </span>
        )}
        {seriB && validB.length > 0 && (
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-0.5 w-4 bg-mahal" style={{ borderTop: "2px dashed" }} /> {labelB} ({rupiah(validB[validB.length - 1].median!)})
          </span>
        )}
      </div>
    </div>
  );
}
