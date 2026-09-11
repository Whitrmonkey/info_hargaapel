import Link from "next/link";
import { Kucing } from "@/components/kucing";
import { FooterLegal } from "@/components/footer-legal";

// Kalkulator kelayakan ditahan dulu, bukan dibuang. Versi kerjanya ada di
// page.tsx.nanti dan pilih-grade.tsx.nanti di folder yang sama, lengkap
// dengan fungsi murni bertest di src/lib/kelayakan.ts.
//
// Alasan ditahan: hitungannya bertumpu pada harga jasa servis dan harga
// komponen, dan dua-duanya belum punya cukup data terpantau. Kalkulator yang
// mengeluarkan angka dari data kosong lebih berbahaya daripada kalkulator
// yang belum ada -- orang percaya angka, bukan catatan kakinya.
export const metadata = {
  title: "Hitung kelayakan — segera hadir",
  description: "Kalkulator kelayakan perbaikan sedang menunggu datanya cukup.",
};

export default function HitungSegera() {
  return (
    <div className="mx-auto max-w-md px-5 py-20 text-center">
      <Kucing pose="tidur" />
      <h1 className="mb-2 text-xl font-bold tracking-tight">Hitung kelayakan, segera</h1>
      <p className="mx-auto mb-6 max-w-[46ch] text-sm leading-relaxed text-muted-foreground">
        Hitungannya bertumpu pada harga jasa servis dan harga komponen bekas, dan keduanya belum punya cukup data terpantau di
        Jabodetabek. Kalkulator yang mengeluarkan angka dari data kosong lebih menyesatkan daripada kalkulator yang belum ada, jadi
        kami tahan dulu sampai angkanya benar-benar ada.
      </p>
      <div className="flex flex-wrap justify-center gap-2 text-sm">
        <Link href="/cek-harga" className="rounded border border-foreground px-4 py-2.5 font-medium">
          Cek harga yang ditawarkan
        </Link>
        <Link href="/" className="rounded border border-border px-4 py-2.5">
          Kembali ke beranda
        </Link>
      </div>
      <div className="mt-10 text-left">
        <FooterLegal />
      </div>
    </div>
  );
}
