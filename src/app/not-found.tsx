import Link from "next/link";
import { Kucing } from "@/components/kucing";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-md px-5 py-24 text-center">
      <Kucing pose="tersesat" />
      <h1 className="mb-2 text-xl font-bold tracking-tight">Halamannya tidak ada</h1>
      <p className="mx-auto mb-6 max-w-[42ch] text-sm leading-relaxed text-muted-foreground">
        Mungkin tautannya salah ketik, atau produknya memang belum pernah ada di sini.
      </p>
      <div className="flex flex-wrap justify-center gap-2 text-sm">
        <Link href="/" className="rounded border border-foreground px-4 py-2.5 font-medium">
          Lihat harga pasaran
        </Link>
        <Link href="/cek-harga" className="rounded border border-border px-4 py-2.5">
          Cek harga yang ditawarkan
        </Link>
      </div>
    </div>
  );
}
