export function BarSebaran({
  p10,
  p25,
  p50,
  p75,
  p90,
  tanda,
}: {
  p10: number;
  p25: number;
  p50: number;
  p75: number;
  p90: number;
  tanda?: number;
}) {
  const posisi = (n: number) => (Math.min(Math.max(n, p10), p90) - p10) / (p90 - p10 || 1) * 100;
  return (
    <div>
      <div className="relative h-2 rounded-full bg-muted">
        <div
          className="absolute inset-y-0 rounded-full bg-foreground/25"
          style={{ left: `${posisi(p25)}%`, right: `${100 - posisi(p75)}%` }}
        />
        <div className="absolute top-1/2 h-3 w-0.5 -translate-y-1/2 bg-foreground" style={{ left: `${posisi(p50)}%` }} />
        {tanda != null && (
          <div
            className="absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-background bg-mahal shadow"
            style={{ left: `${posisi(tanda)}%` }}
          />
        )}
      </div>
      <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
        <span>p10 {Math.round(p10 / 1000).toLocaleString("id-ID")}rb</span>
        <span>p90 {Math.round(p90 / 1000).toLocaleString("id-ID")}rb</span>
      </div>
    </div>
  );
}
