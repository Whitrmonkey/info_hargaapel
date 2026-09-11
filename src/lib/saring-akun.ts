import { resolveMx } from "node:dns/promises";

export function domainDari(email: string): string | null {
  const bagian = email.trim().toLowerCase().split("@");
  if (bagian.length !== 2 || !bagian[1]) return null;
  return bagian[1];
}

const TIMEOUT_MX_MS = 3_000;

export type HasilMx = "ada" | "tidak_ada" | "gagal";

// Domain tanpa server surat tidak mungkin menerima apa pun, jadi magic link
// ke sana pasti sia-sia. Ini sekaligus menangkap salah ketik domain.
//
// Kalau pencariannya GAGAL (jaringan kita bermasalah, DNS timeout), hasilnya
// "gagal" dan pemanggilnya wajib MENGIZINKAN. Jangan pernah menghukum orang
// karena DNS kita sedang rewel.
export async function periksaMx(domain: string, lookup = resolveMx): Promise<HasilMx> {
  try {
    const hasil = await Promise.race([
      lookup(domain),
      new Promise<never>((_, tolak) => setTimeout(() => tolak(new Error("timeout")), TIMEOUT_MX_MS)),
    ]);
    return Array.isArray(hasil) && hasil.length > 0 ? "ada" : "tidak_ada";
  } catch (e) {
    // NXDOMAIN dan NODATA adalah jawaban yang pasti: domainnya memang tidak
    // punya server surat. Sisanya dianggap gagal dan diloloskan.
    const kode = (e as { code?: string }).code;
    if (kode === "ENOTFOUND" || kode === "ENODATA") return "tidak_ada";
    return "gagal";
  }
}

export type AlasanTolak = "format" | "domain_sekali_pakai" | "tanpa_server_surat";

export interface HasilSaring {
  boleh: boolean;
  alasan?: AlasanTolak;
}

// Lapis 1 dan 2 dari empat lapis penyaringan akun. Lapis 3 (magic link) dan
// lapis 4 (Turnstile + batas laju) sudah ada di alur masuk.
export async function saringEmail(
  email: string,
  diblokir: (domain: string) => Promise<boolean>,
  lookup?: typeof resolveMx,
): Promise<HasilSaring> {
  const domain = domainDari(email);
  if (!domain) return { boleh: false, alasan: "format" };
  if (await diblokir(domain)) return { boleh: false, alasan: "domain_sekali_pakai" };
  const mx = await periksaMx(domain, lookup);
  if (mx === "tidak_ada") return { boleh: false, alasan: "tanpa_server_surat" };
  return { boleh: true };
}

export const PESAN_TOLAK: Record<AlasanTolak, string> = {
  format: "Alamat emailnya belum lengkap.",
  domain_sekali_pakai:
    "Domain email sekali pakai tidak bisa dipakai mendaftar. Pakai alamat yang memang kamu baca sehari-hari.",
  tanpa_server_surat:
    "Domain itu tidak punya server surat, jadi tautan masuknya tidak akan pernah sampai. Periksa lagi ejaannya.",
};
