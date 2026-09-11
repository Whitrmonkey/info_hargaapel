"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { headers } from "next/headers";
import { PESAN_TOLAK, saringEmail } from "@/lib/saring-akun";

const BATAS_PERCOBAAN = 3;
const JENDELA_MS = 15 * 60_000;

// Rate limit in-memory per instance -- sengaja tidak hanya mengandalkan
// batas bawaan Supabase (SPEC.md BAGIAN 9). Cukup untuk skala situs ini;
// kalau trafik naik jauh, ganti dengan tabel/Redis, bukan Map ini.
const percobaan = new Map<string, number[]>();

function bolehCoba(kunci: string): boolean {
  const sekarang = Date.now();
  const daftar = (percobaan.get(kunci) ?? []).filter((t) => sekarang - t < JENDELA_MS);
  if (daftar.length >= BATAS_PERCOBAAN) {
    percobaan.set(kunci, daftar);
    return false;
  }
  daftar.push(sekarang);
  percobaan.set(kunci, daftar);
  return true;
}

async function turnstileValid(token: string, ip: string): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return true; // belum dikonfigurasi (lokal/dev) -- lihat SETUP.md daftar periksa

  const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ secret, response: token, remoteip: ip }),
  });
  const data = await res.json();
  return Boolean(data.success);
}

export interface KirimTautanHasil {
  ok: boolean;
  pesan: string;
}

export async function kirimTautanMasuk(email: string, turnstileToken: string): Promise<KirimTautanHasil> {
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";

  if (!bolehCoba(`ip:${ip}`) || !bolehCoba(`email:${email.toLowerCase()}`)) {
    return { ok: false, pesan: "Terlalu banyak percobaan. Coba lagi dalam beberapa menit." };
  }
  if (!(await turnstileValid(turnstileToken, ip))) {
    return { ok: false, pesan: "Verifikasi anti-bot gagal. Muat ulang halaman dan coba lagi." };
  }

  // Lapis 1 dan 2: domain sekali pakai, lalu pemeriksaan MX. Keduanya
  // dijalankan SEBELUM magic link dikirim, supaya reputasi domain pengirim
  // tidak terbakar oleh alamat yang memang tidak mungkin menerima apa pun.
  const saring = await saringEmail(email, async (domain) => {
    const admin = createAdminClient();
    const { data } = await admin.from("blokir_domain").select("domain").eq("domain", domain).maybeSingle();
    return data != null;
  });
  if (!saring.boleh) return { ok: false, pesan: PESAN_TOLAK[saring.alasan!] };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/akun` },
  });
  if (error) return { ok: false, pesan: "Gagal mengirim tautan. Coba lagi." };

  return { ok: true, pesan: "Tautan masuk sudah dikirim. Cek email kamu." };
}
