"use client";

import { useState } from "react";

export interface BarisKirim {
  id: string;
  nomorWa: string;
  teks: string;
}

export function KirimList({ baris }: { baris: BarisKirim[] }) {
  const [disalin, setDisalin] = useState<string | null>(null);

  async function salin(b: BarisKirim) {
    await navigator.clipboard.writeText(b.teks);
    setDisalin(b.id);
    setTimeout(() => setDisalin((d) => (d === b.id ? null : d)), 2000);
  }

  if (baris.length === 0) {
    return <p className="text-sm text-muted-foreground">Tidak ada alert WhatsApp yang menunggu dikirim.</p>;
  }

  return (
    <ul className="space-y-3">
      {baris.map((b) => (
        <li key={b.id} className="rounded-lg border border-border p-3">
          <p className="mb-1 text-xs text-muted-foreground">{b.nomorWa}</p>
          <p className="mb-2 text-sm">{b.teks}</p>
          <button
            type="button"
            onClick={() => salin(b)}
            className="rounded-md border border-foreground px-3 py-1 text-xs font-medium"
          >
            {disalin === b.id ? "Tersalin" : "Salin teks"}
          </button>
        </li>
      ))}
    </ul>
  );
}
