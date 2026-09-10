"use client";

import Script from "next/script";
import { useState } from "react";
import { kirimTautanMasuk } from "./actions";

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

export function MasukForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<{ tipe: "idle" | "kirim" | "selesai"; pesan?: string; ok?: boolean }>({ tipe: "idle" });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setStatus({ tipe: "kirim" });
    const token = SITE_KEY ? (window as unknown as { turnstile?: { getResponse: () => string } }).turnstile?.getResponse() ?? "" : "";
    const hasil = await kirimTautanMasuk(email, token);
    setStatus({ tipe: "selesai", pesan: hasil.pesan, ok: hasil.ok });
  }

  return (
    <div className="mx-auto max-w-sm px-5 py-16">
      <h1 className="mb-1 text-xl font-bold tracking-tight">Masuk</h1>
      <p className="mb-6 text-sm text-muted-foreground">Untuk kontributor. Tautan masuk dikirim ke email, tanpa kata sandi.</p>

      {SITE_KEY && <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer />}

      <form onSubmit={submit} className="space-y-3">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="email@contoh.com"
          className="w-full rounded-lg border border-border bg-transparent p-3 text-base"
        />
        {SITE_KEY && <div className="cf-turnstile" data-sitekey={SITE_KEY} />}
        <button
          type="submit"
          disabled={status.tipe === "kirim"}
          className="w-full rounded-lg bg-foreground p-3 text-base font-medium text-background disabled:opacity-50"
        >
          Kirim tautan masuk
        </button>
      </form>

      {status.tipe === "selesai" && (
        <p className={`mt-4 text-sm ${status.ok ? "text-murah" : "text-mahal"}`}>{status.pesan}</p>
      )}
    </div>
  );
}
