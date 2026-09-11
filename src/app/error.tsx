"use client";

import { Kucing } from "@/components/kucing";

export default function Galat({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="mx-auto max-w-md px-5 py-24 text-center">
      <Kucing pose="tersesat" />
      <h1 className="mb-2 text-xl font-bold tracking-tight">Ada yang rusak di sisi kami</h1>
      <p className="mx-auto mb-6 max-w-[42ch] text-sm leading-relaxed text-muted-foreground">
        Bukan salah ketikanmu. Coba muat ulang; kalau masih begini, halamannya memang sedang bermasalah dan bukan angkanya yang
        hilang.
      </p>
      <button type="button" onClick={reset} className="rounded border border-foreground px-4 py-2.5 text-sm font-medium">
        Coba lagi
      </button>
    </div>
  );
}
