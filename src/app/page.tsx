import Link from "next/link";
import { ambilDataBeranda } from "@/lib/data/beranda";
import { BentukKeluarga } from "@/components/bentuk-keluarga";
import { FooterLegal } from "@/components/footer-legal";

const rupiah = (n: number) => "Rp " + n.toLocaleString("id-ID");
const jt = (n: number) => {
  const v = n / 1e6;
  return (v >= 10 ? v.toFixed(1) : v.toFixed(2)).replace(".", ",") + " jt";
};

function umur(iso: string): string {
  const jam = Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / 3_600_000));
  if (jam < 24) return `${jam} jam lalu`;
  return `${Math.round(jam / 24)} hari lalu`;
}

export default async function Beranda() {
  const { gerakan, keluarga, laporan, pintasan } = await ambilDataBeranda();

  return (
    <div className="mx-auto max-w-[1100px] px-5 pb-24 sm:px-6">
      {/* Alat dulu. Yang datang ke sini hampir selalu sedang memegang satu
          pertanyaan, dan itu pertanyaannya. */}
      <section className="border-b border-border py-6">
        <div className="flex flex-wrap items-center gap-3 sm:gap-4">
          <h1 className="w-full flex-none text-[17px] font-semibold tracking-tight sm:w-auto sm:text-[19px]">
            Ditawari berapa?
          </h1>
          <Link
            href="/cek-harga"
            className="flex min-w-0 flex-1 flex-col gap-0.5 rounded border border-foreground px-4 py-3 hover:bg-sorot"
          >
            <span className="text-[15.5px]">Pilih perangkat</span>
            <span className="text-[11.5px] text-muted-foreground">lalu geser harga yang ditawarkan</span>
          </Link>
          <span aria-hidden className="hidden h-5 w-5 flex-none text-muted-foreground sm:block">
            <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 10 h11 M11 6 l4 4 -4 4" />
            </svg>
          </span>
        </div>
        {pintasan.length > 0 && (
          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            <span className="mr-0.5 text-[11px] text-muted-foreground">sering dicek</span>
            {pintasan.map((x) => (
              <Link
                key={x}
                href="/cek-harga"
                className="rounded-full border border-dashed border-border px-2.5 py-1 text-xs text-muted-foreground hover:border-solid hover:border-foreground hover:text-foreground"
              >
                {x}
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Blok yang belum punya cukup isi TIDAK dirender, bukan dirender
          kosong. Beranda harus tetap berguna saat isinya masih sedikit. */}
      {gerakan.length > 0 && (
        <section className="border-b border-border py-6">
          <div className="mb-2 flex flex-wrap items-baseline justify-between gap-3">
            <h2 className="text-[18px] font-semibold tracking-tight">Bergerak minggu ini</h2>
            <Link href="/pasaran" className="border-b border-border text-[12.5px] text-muted-foreground hover:border-foreground hover:text-foreground">
              semua pergerakan
            </Link>
          </div>
          <div className="mt-3 flex flex-col">
            {gerakan.map((g) => {
              const naik = g.ubah > 0;
              return (
                <Link
                  key={g.slug}
                  href={`/p/${g.slug}`}
                  className="grid grid-cols-[1fr_74px] items-center gap-x-3 gap-y-1 border-t border-border py-2.5 last:border-b sm:grid-cols-[1fr_96px_78px]"
                >
                  <span className="col-start-1 row-start-1 text-[14.5px]">
                    {g.model}
                    <span className="mt-0.5 block text-[11.5px] text-muted-foreground">
                      {g.varian} · {g.toko} toko
                    </span>
                  </span>
                  <span className="col-start-1 row-start-2 text-[13.5px] font-bold sm:col-start-2 sm:row-start-1 sm:text-right sm:text-[14.5px]">
                    {jt(g.harga)}
                  </span>
                  <span
                    className={`col-start-2 row-start-1 text-right text-[12.5px] font-semibold sm:col-start-3 ${naik ? "text-mahal" : "text-murah"}`}
                  >
                    {naik ? "▲" : "▼"} {Math.abs(Math.round(g.ubah * 1000) / 10)}%
                  </span>
                </Link>
              );
            })}
          </div>
          <p className="mt-3 max-w-[62ch] text-[11.5px] leading-relaxed text-muted-foreground">
            Dibanding tujuh hari lalu, grade standar jalur resmi. Hanya model dengan minimal lima toko terpantau.
          </p>
        </section>
      )}

      {keluarga.length > 0 && (
        <section className={`py-6 ${laporan.length > 0 ? "border-b border-border" : ""}`}>
          <h2 className="text-[18px] font-semibold tracking-tight">Jelajahi</h2>
          <div className="mt-3 grid grid-cols-2 gap-2.5 min-[881px]:grid-cols-4">
            {keluarga.map((k) => (
              <Link
                key={k.kode}
                href={`/${k.kode}`}
                className="flex items-center gap-3 border border-border px-3.5 py-3 hover:border-foreground hover:bg-sorot"
              >
                <BentukKeluarga kategori={k.kategori} />
                <span className="min-w-0">
                  <span className="block text-[15px] font-semibold tracking-tight">{k.nama}</span>
                  <span className="mt-0.5 block text-[11px] text-muted-foreground">
                    {k.seri} generasi{k.dari != null && ` · mulai ${jt(k.dari)}`}
                  </span>
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {laporan.length > 0 && (
        <section className="py-6">
          <div className="mb-2 flex flex-wrap items-baseline justify-between gap-3">
            <h2 className="text-[18px] font-semibold tracking-tight">Laporan terbaru dari pembaca</h2>
          </div>
          <div className="mt-3 flex flex-col">
            {laporan.map((l) => (
              <Link
                key={l.id}
                href={`/p/${l.slug}`}
                className="grid grid-cols-1 gap-1 border-t border-border py-2.5 last:border-b sm:grid-cols-[118px_1fr] sm:items-center sm:gap-3.5"
              >
                <span className="text-[15px] font-bold">{rupiah(l.harga)}</span>
                <span className="text-[13px]">
                  {l.model} {l.varian} · {l.area} · jalur {l.garansi}
                  {l.grade && ` · ${l.grade}`}
                  <span className="mt-0.5 block text-[11.5px] text-muted-foreground">
                    {umur(l.dibuatAt)}
                    {l.masukAkal > 0 && ` · ${l.masukAkal} pembaca menilai masuk akal`}
                  </span>
                </span>
              </Link>
            ))}
          </div>
          <p className="mt-3 max-w-[62ch] text-[11.5px] leading-relaxed text-muted-foreground">
            Laporan pembaca tidak langsung masuk perhitungan harga pasaran. Ia baru ikut setelah ada harga toko yang masuk sesudahnya
            dan angkanya cocok.
          </p>
        </section>
      )}

      <FooterLegal />
    </div>
  );
}
