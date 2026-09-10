"use client";

import { GambarSpesimen } from "@/components/spesimen";

const rupiah = (n: number) => "Rp " + n.toLocaleString("id-ID");
const persen = (r: number) => Math.round(r * 100);

export interface SpesimenKomponen {
  id: string;
  kode: string;
  nama: string;
  gambar: string | null;
  penjelasan: string | null;
  rasio: number;
  estimasi: boolean;
  jumlah_penjual?: number;
  dipinjamDariModel?: string;
}

export interface GradeMesin {
  id: string;
  kode: string;
  nama: string;
  penjelasan: string;
  rasio: number;
}

// Batas jumlah spesimen dalam bingkai. Kisi 4 kolom, jadi delapan mengisi
// dua baris penuh. Kalau yang punya data kurang dari itu, yang dirender
// memang lebih sedikit -- tidak pernah ditambal.
const MUAT = 8;

export function Framewall({
  judul,
  subjudul,
  hargaUnit,
  spesimen,
  gradeMesin,
  aktif,
  onPilih,
}: {
  judul: string;
  subjudul: string;
  hargaUnit: number | null;
  spesimen: SpesimenKomponen[];
  gradeMesin: GradeMesin[];
  aktif: string | null;
  onPilih: (id: string | null) => void;
}) {
  // Urutan dihitung dari data, bukan ditulis tangan: membaca bingkai dari
  // kiri atas sama dengan membaca peringkat nilai.
  const terpasang = [...spesimen].sort((a, b) => b.rasio - a.rasio).slice(0, MUAT);
  if (terpasang.length === 0) return null;

  const tertinggi = terpasang[0].rasio;
  const total = terpasang.reduce((a, s) => a + s.rasio, 0);
  const dipilih = terpasang.find((s) => s.id === aktif) ?? null;
  const mesinTertinggi = Math.max(...gradeMesin.map((g) => g.rasio), 0.0001);

  return (
    <>
      <div className="border-2 border-foreground bg-background p-2">
        <div className="border border-border bg-sorot px-4 py-5 sm:px-6 sm:py-6">
          <div className="mb-5 border-b border-border pb-4 text-center">
            <span className="block text-lg font-bold tracking-tight">{judul}</span>
            <span className="mt-1 block text-[11px] leading-relaxed text-muted-foreground">{subjudul}</span>
          </div>

          <div className="grid grid-cols-2 gap-3 min-[820px]:grid-cols-4">
            {terpasang.map((s) => (
              <button
                key={s.id}
                type="button"
                aria-pressed={aktif === s.id}
                onClick={() => onPilih(aktif === s.id ? null : s.id)}
                className={`border bg-background px-2.5 py-3 text-center ${
                  aktif === s.id ? "border-tanah bg-tanah/10" : "border-border hover:border-tanah"
                }`}
              >
                <GambarSpesimen gambar={s.gambar} />
                <span className="block border-t border-border pt-2">
                  <span className="block text-xs font-semibold">{s.nama}</span>
                  <span className="mt-1.5 block h-[3px] bg-muted">
                    <span className="block h-full bg-tanah" style={{ width: `${(s.rasio / tertinggi) * 100}%` }} />
                  </span>
                  <span className="mt-1.5 block text-[13px] font-bold">
                    {hargaUnit != null ? rupiah(Math.round(s.rasio * hargaUnit)) : "—"}
                  </span>
                  <span className="mt-0.5 block text-[10px] text-muted-foreground">
                    {persen(s.rasio)}% nilai unit{s.estimasi ? " · estimasi" : ""}
                  </span>
                </span>
              </button>
            ))}
          </div>

          <p className="mt-5 border-t border-border pt-3 text-center text-[11px] leading-relaxed text-muted-foreground">
            {terpasang.length} komponen ini menutup {persen(total)}% nilai unit. Sisanya tersebar di rangka, antena, perekat, dan sekrup
            yang tidak diperdagangkan terpisah. Gambar spesimen adalah ilustrasi diagram, bukan tampilan fisik part yang sebenarnya.
          </p>
        </div>
      </div>

      {dipilih && (
        <div className="mt-5 border border-border p-5" aria-live="polite">
          <p className="text-base font-semibold">{dipilih.nama}</p>
          <p className="text-2xl font-bold">{hargaUnit != null ? rupiah(Math.round(dipilih.rasio * hargaUnit)) : "—"}</p>
          <p className="mb-3 text-xs text-muted-foreground">
            {persen(dipilih.rasio)}% dari harga unit ·{" "}
            {dipilih.estimasi
              ? `estimasi, rasio dipinjam dari ${dipilih.dipinjamDariModel}`
              : `${dipilih.jumlah_penjual} penjual terpantau`}
          </p>
          {dipilih.penjelasan && <p className="max-w-prose text-sm leading-relaxed">{dipilih.penjelasan}</p>}

          {dipilih.kode === "mesin" && gradeMesin.length > 0 && (
            <div className="mt-5 border-t border-border pt-4">
              {gradeMesin.map((g) => (
                <div
                  key={g.id}
                  className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 py-1.5 text-sm sm:grid-cols-[minmax(0,200px)_1fr_auto]"
                >
                  <span className="leading-tight">
                    {g.nama}
                    <span className="mt-0.5 block text-[11px] text-muted-foreground">{g.penjelasan}</span>
                  </span>
                  <span className="hidden h-3.5 bg-muted sm:block">
                    <span className="block h-full bg-foreground" style={{ width: `${(g.rasio / mesinTertinggi) * 100}%` }} />
                  </span>
                  <span className="text-right text-[13px] font-semibold">
                    {hargaUnit != null ? rupiah(Math.round(g.rasio * hargaUnit)) : `${persen(g.rasio)}%`}
                  </span>
                </div>
              ))}
              {gradeMesin.length >= 2 && hargaUnit != null && (
                <p className="mt-3 max-w-prose text-xs leading-relaxed text-muted-foreground">
                  Selisih antar tingkat adalah harga dari satu fungsi. Jarak antara {gradeMesin[0].nama.toLowerCase()} dan{" "}
                  {gradeMesin[1].nama.toLowerCase()} sekitar{" "}
                  <b className="text-foreground">{rupiah(Math.round((gradeMesin[0].rasio - gradeMesin[1].rasio) * hargaUnit))}</b>.
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </>
  );
}
