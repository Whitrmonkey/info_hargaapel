import type { BagianGrade } from "@/lib/data/sebaran-per-grade";
import { vonisServis } from "@/lib/servis";
import { JUDUL_VONIS_SERVIS, SALINAN_VONIS_SERVIS } from "@/lib/salinan-servis";
import { BarSebaran } from "@/components/bar-sebaran";

const rupiah = (n: number) => "Rp " + n.toLocaleString("id-ID");

export function BagianGradeView({
  bagian,
  areaWorkshop,
  tanda,
}: {
  bagian: BagianGrade;
  areaWorkshop: Map<string, string>;
  tanda?: number;
}) {
  const vonis = bagian.sebaran && tanda != null ? vonisServis(tanda, bagian.sebaran) : null;

  return (
    <section className="rounded-lg border border-border p-4">
      {bagian.grade && (
        <div className="mb-3">
          <p className="text-sm font-semibold">{bagian.grade.nama}</p>
          <p className="text-xs text-muted-foreground">{bagian.grade.penjelasan}</p>
        </div>
      )}

      {bagian.gerbangTerbuka && bagian.sebaran ? (
        <div>
          <BarSebaran
            p10={bagian.sebaran.p10}
            p25={bagian.sebaran.p25}
            p50={bagian.sebaran.p50}
            p75={bagian.sebaran.p75}
            p90={bagian.sebaran.p90}
            tanda={tanda}
          />
          <p className="mt-2 text-xs text-muted-foreground">
            Median {rupiah(bagian.sebaran.p50)}, dipasang oleh {bagian.sebaran.jumlah_bengkel} bengkel yang terpantau.
          </p>
          {vonis && (
            <div className="mt-3 border-l-2 border-foreground/30 pl-3">
              <p className="text-sm font-semibold">{JUDUL_VONIS_SERVIS[vonis]}</p>
              <p className="mt-1 text-sm text-muted-foreground">{SALINAN_VONIS_SERVIS[vonis]}</p>
            </div>
          )}
        </div>
      ) : (
        <div>
          <p className="mb-2 text-xs text-muted-foreground">
            Baru {bagian.jumlahBengkel} bengkel tercatat (butuh minimal 5 untuk sebaran) — daftar harga apa adanya. Nama bengkel tidak
            ditampilkan, hanya area:
          </p>
          <ul className="space-y-1 text-sm">
            {bagian.observasi.map((o) => (
              <li key={o.id} className="flex justify-between">
                <span className="text-muted-foreground">{areaWorkshop.get(o.workshop_id) ?? "—"}</span>
                <span>{rupiah(o.harga)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
