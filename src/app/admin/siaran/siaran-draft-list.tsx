"use client";

import { useState } from "react";
import { tandaiDisalin } from "./actions";

interface Draft {
  id: string;
  judul: string;
  isi: string;
  status: string;
}

export function SiaranDraftList({ draft }: { draft: Draft[] }) {
  const [disalin, setDisalin] = useState<string | null>(null);

  async function salin(d: Draft) {
    await navigator.clipboard.writeText(d.isi);
    setDisalin(d.id);
    await tandaiDisalin(d.id);
  }

  if (draft.length === 0) return <p className="text-sm text-muted-foreground">Belum ada draf.</p>;

  return (
    <ul className="space-y-4">
      {draft.map((d) => (
        <li key={d.id} className="rounded-lg border border-border p-4">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm font-semibold">{d.judul}</p>
            <span className="text-xs text-muted-foreground">{d.status}</span>
          </div>
          <pre className="mb-3 whitespace-pre-wrap font-sans text-sm">{d.isi}</pre>
          <button
            type="button"
            onClick={() => salin(d)}
            className="rounded-md border border-foreground px-3 py-1 text-xs font-medium"
          >
            {disalin === d.id ? "Tersalin" : "Salin teks"}
          </button>
        </li>
      ))}
    </ul>
  );
}
