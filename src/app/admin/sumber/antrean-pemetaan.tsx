"use client";

import { useState } from "react";
import { abaikanPemetaan, petakanProduk } from "./actions";

interface MapRow {
  id: string;
  external_key: string;
}
interface ProdukRingkas {
  id: string;
  model: string;
  varian: string;
}

export function AntreanPemetaan({ antrean, produk }: { antrean: MapRow[]; produk: ProdukRingkas[] }) {
  const [pilihan, setPilihan] = useState<Record<string, string>>({});

  if (antrean.length === 0) return <p className="text-sm text-muted-foreground">Tidak ada yang menunggu pemetaan.</p>;

  return (
    <ul className="space-y-2">
      {antrean.map((a) => (
        <li key={a.id} className="flex items-center gap-2 rounded-lg border border-border p-2.5 text-sm">
          <span className="flex-1 truncate">{a.external_key}</span>
          <select
            value={pilihan[a.id] ?? ""}
            onChange={(e) => setPilihan((p) => ({ ...p, [a.id]: e.target.value }))}
            className="rounded border border-border bg-transparent px-2 py-1 text-xs"
          >
            <option value="">Pilih produk</option>
            {produk.map((p) => (
              <option key={p.id} value={p.id}>
                {p.model} {p.varian}
              </option>
            ))}
          </select>
          <button
            type="button"
            disabled={!pilihan[a.id]}
            onClick={() => petakanProduk(a.id, pilihan[a.id], null)}
            className="rounded-md border border-foreground px-2 py-1 text-xs font-medium disabled:opacity-40"
          >
            Petakan
          </button>
          <button
            type="button"
            onClick={() => abaikanPemetaan(a.id)}
            className="text-xs text-muted-foreground underline underline-offset-2"
          >
            Abaikan
          </button>
        </li>
      ))}
    </ul>
  );
}
