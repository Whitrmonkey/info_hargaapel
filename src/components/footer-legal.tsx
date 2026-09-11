import Link from "next/link";
import { TombolSaluranWa } from "@/components/tombol-saluran-wa";

/**
 * Footer disclaimer wajib (BAGIAN 10): bukan saran keuangan, harga bisa
 * berubah, angka yang tampil adalah yang terpantau bukan yang dianjurkan,
 * dan penjual yang namanya muncul adalah sumber yang menerbitkan harganya
 * sendiri -- bukan iklan berbayar yang ikut dalam perhitungan mana pun.
 */
export function FooterLegal({ children }: { children?: React.ReactNode }) {
  return (
    <footer className="mt-10 space-y-2 border-t border-border pt-6 text-xs leading-relaxed text-muted-foreground">
      {children}
      <p className="max-w-prose">
        Bukan saran keuangan. Harga bisa berubah, dan angka yang ditampilkan adalah yang terpantau, bukan yang
        dianjurkan. Penjual yang namanya muncul di halaman ini adalah sumber yang menerbitkan harganya sendiri di
        web; kalau kelak ada yang berbayar, ia akan ditandai jelas sebagai iklan dan tidak ikut perhitungan mana pun.
      </p>
      <p>
        <Link href="/cek-harga" className="underline underline-offset-2 hover:text-foreground">
          Baru beli perangkat Apple? Lapor harga jadinya
        </Link>{" "}
        — laporan pembaca yang belakangan cocok dengan harga toko adalah cara angka di sini tetap segar.
      </p>
      <TombolSaluranWa />
    </footer>
  );
}
