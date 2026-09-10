"use client";

import Link from "next/link";
import { useState } from "react";

interface ProdukRingkas {
  slug: string;
  model: string;
  varian: string;
  kategori: string;
}
interface JenisServisRingkas {
  slug: string;
  nama: string;
  kategori: string;
}

const LABEL_KATEGORI: Record<string, string> = {
  iphone: "iPhone",
  ipad: "iPad",
  mac: "Mac",
  watch: "Watch",
  audio: "Audio",
  aksesoris: "Aksesoris",
};

export function ServisPicker({ produk, jenis }: { produk: ProdukRingkas[]; jenis: JenisServisRingkas[] }) {
  const [produkTerpilih, setProdukTerpilih] = useState<ProdukRingkas | null>(null);

  return (
    <div className="space-y-8">
      <div>
        <p className="mb-3 text-sm font-medium text-muted-foreground">1. Perangkat apa</p>
        <div className="flex flex-wrap gap-2">
          {produk.map((p) => (
            <button
              key={p.slug}
              type="button"
              onClick={() => setProdukTerpilih(p)}
              aria-pressed={produkTerpilih?.slug === p.slug}
              className={`rounded-lg border px-4 py-2.5 text-sm transition-colors ${
                produkTerpilih?.slug === p.slug
                  ? "border-foreground bg-foreground text-background"
                  : "border-border hover:border-foreground"
              }`}
            >
              <span className="block text-[10px] uppercase tracking-wide opacity-60">{LABEL_KATEGORI[p.kategori] ?? p.kategori}</span>
              {p.model} {p.varian}
            </button>
          ))}
        </div>
      </div>

      {produkTerpilih && (
        <div>
          <p className="mb-3 text-sm font-medium text-muted-foreground">2. Kerusakan apa</p>
          <div className="flex flex-wrap gap-2">
            {jenis.map((j) => (
              <Link
                key={j.slug}
                href={`/servis/${produkTerpilih.slug}/${j.slug}`}
                className="rounded-lg border border-border px-4 py-2.5 text-sm hover:border-foreground"
              >
                {j.nama}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
