import Link from "next/link";
import { notFound } from "next/navigation";
import { ambilRekamJejak } from "@/lib/data/rekam-jejak";
import { KELUARGA } from "@/lib/keluarga";
import { FooterLegal } from "@/components/footer-legal";

const NAMA_KATEGORI: Record<string, string> = Object.fromEntries(
  Object.values(KELUARGA).map((k) => [k.kategori, k.judul]),
);

function tanggal(iso: string): string {
  return new Date(iso).toLocaleDateString("id-ID", { month: "long", year: "numeric" });
}

export default async function ProfilPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const jejak = await ambilRekamJejak(id);
  if (!jejak) notFound();

  const angka: Array<{ nilai: number; label: string }> = [
    { nilai: jejak.laporan, label: "laporan" },
    { nilai: jejak.terverifikasi, label: "terverifikasi data independen" },
    { nilai: jejak.meleset, label: "meleset" },
    { nilai: jejak.diragukan, label: "diragukan pembaca lain" },
  ];

  return (
    <div className="mx-auto max-w-3xl px-5 pb-20">
      <nav className="flex items-center justify-between border-b border-foreground py-4">
        <Link href="/" className="text-lg font-bold tracking-tight">
          hargaapel
        </Link>
      </nav>

      <header className="border-b border-border py-8">
        <h1 className="mb-1 text-2xl font-bold tracking-tight sm:text-3xl">{jejak.nama ?? "Kontributor"}</h1>
        <p className="text-sm text-muted-foreground">Bergabung {tanggal(jejak.bergabungAt)}</p>
      </header>

      {/* Angkanya saja. Tidak ada lencana, gelar, julukan, peringkat, atau
          papan skor -- menyebut seseorang tidak dapat dipercaya adalah
          penilaian, menampilkan nol dari dua belas adalah fakta. */}
      <section className="grid grid-cols-2 gap-px border-b border-border bg-border sm:grid-cols-4">
        {angka.map((a) => (
          <div key={a.label} className="bg-background px-4 py-5">
            <p className="text-2xl font-bold tracking-tight">{a.nilai}</p>
            <p className="mt-1 text-[11.5px] leading-snug text-muted-foreground">{a.label}</p>
          </div>
        ))}
      </section>

      <section className="border-b border-border py-7">
        <h2 className="mb-3 text-sm font-semibold">Kategori tempat ia punya bobot</h2>
        {jejak.kategoriBerbobot.length === 0 ? (
          <p className="max-w-prose text-sm text-muted-foreground">
            Belum punya bobot di kategori mana pun. Bobot datang dari laporan yang terverifikasi belakangan oleh data independen, dan
            itu memang butuh waktu.
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {jejak.kategoriBerbobot.map((k) => (
              <span key={k.kategori} className="rounded border border-border px-3 py-1.5 text-sm">
                {NAMA_KATEGORI[k.kategori] ?? k.kategori} · bobot {k.bobot}
              </span>
            ))}
          </div>
        )}
      </section>

      <FooterLegal>
        <p className="max-w-prose">
          Terverifikasi berarti ada harga toko yang masuk setelah laporan itu dan angkanya cocok. Bukan berarti ada yang menyetujuinya:
          suara pembaca tidak pernah memverifikasi apa pun, ia hanya mempercepat atau menahan antrean pemeriksaan. Bobot berlaku per
          kategori, jadi rekam jejak di satu kategori tidak berpindah ke kategori lain.
        </p>
      </FooterLegal>
    </div>
  );
}
