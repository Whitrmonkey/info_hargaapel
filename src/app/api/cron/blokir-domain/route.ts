import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const maxDuration = 60;

// Daftar terbuka domain email sekali pakai, dipelihara komunitas dan gratis.
// Disimpan sebagai env supaya sumbernya bisa diganti tanpa deploy kalau
// daftarnya pindah atau mati.
const SUMBER_BAWAAN = "https://raw.githubusercontent.com/disposable-email-domains/disposable-email-domains/master/disposable_email_blocklist.conf";
const BATAS_DOMAIN = 100_000;

export async function GET(request: Request) {
  const rahasia = process.env.CRON_SECRET;
  if (rahasia && request.headers.get("authorization") !== `Bearer ${rahasia}`) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const sumber = process.env.BLOKIR_DOMAIN_URL ?? SUMBER_BAWAAN;
  const res = await fetch(sumber, { cache: "no-store" });
  if (!res.ok) {
    return NextResponse.json({ ok: false, pesan: `sumber balas ${res.status}` }, { status: 502 });
  }

  const domain = (await res.text())
    .split("\n")
    .map((b) => b.trim().toLowerCase())
    .filter((b) => b.length > 0 && !b.startsWith("#") && b.includes("."))
    .slice(0, BATAS_DOMAIN);

  if (domain.length === 0) {
    // Daftar kosong hampir pasti berarti sumbernya rusak, bukan berarti
    // tidak ada lagi domain sekali pakai. Jangan pernah menimpa daftar yang
    // sudah ada dengan kekosongan.
    return NextResponse.json({ ok: false, pesan: "daftar kosong, tidak ditimpa" }, { status: 502 });
  }

  const admin = createAdminClient();
  const baris = domain.map((d) => ({ domain: d, sumber }));
  let masuk = 0;
  for (let i = 0; i < baris.length; i += 1000) {
    const { error } = await admin.from("blokir_domain").upsert(baris.slice(i, i + 1000), { onConflict: "domain" });
    if (error) return NextResponse.json({ ok: false, pesan: error.message }, { status: 500 });
    masuk += Math.min(1000, baris.length - i);
  }

  return NextResponse.json({ ok: true, domain: masuk });
}
