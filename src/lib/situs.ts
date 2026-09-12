// Alamat situs, satu tempat.
//
// Ditulis setelah build di Vercel gagal dengan `TypeError: Invalid URL`,
// input `''`. Penyebabnya NEXT_PUBLIC_SITE_URL terisi STRING KOSONG, bukan
// tidak ada. Operator `??` cuma jatuh ke cadangan pada null/undefined, jadi
// string kosong lolos begitu saja sampai ke `new URL("")` dan meledak di
// tengah build.
//
// Pelajarannya: env yang "ada tapi kosong" adalah keadaan yang normal di
// panel mana pun, dan kode yang cuma memeriksa keberadaan akan kecolongan.
// Yang diperiksa harus isinya.

const BAWAAN = "http://localhost:3000";

function bersih(v: string | undefined): string | null {
  const s = v?.trim();
  return s && s.length > 0 ? s : null;
}

export function situsUrl(): string {
  const eksplisit = bersih(process.env.NEXT_PUBLIC_SITE_URL);
  if (eksplisit && /^https?:\/\//i.test(eksplisit)) return eksplisit.replace(/\/+$/, "");

  // Vercel mengisi keduanya sendiri. Dipakai sebagai jaring supaya tautan
  // dan metadata tetap menunjuk ke host yang benar walau env-nya lupa
  // diisi -- yang pertama alamat produksi, yang kedua alamat deployment ini.
  const produksi = bersih(process.env.VERCEL_PROJECT_PRODUCTION_URL);
  if (produksi) return `https://${produksi.replace(/\/+$/, "")}`;

  const deployment = bersih(process.env.VERCEL_URL);
  if (deployment) return `https://${deployment.replace(/\/+$/, "")}`;

  return BAWAAN;
}

// Dipakai metadataBase, yang menuntut objek URL dan melempar kalau isinya
// bukan alamat sah.
export function situsUrlObjek(): URL {
  try {
    return new URL(situsUrl());
  } catch {
    return new URL(BAWAAN);
  }
}
