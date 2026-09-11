// Apakah kredensial Supabase sudah terpasang.
//
// Ini ada karena satu pelajaran dari deploy pertama: rangka aplikasi
// memanggil Supabase di tiap request untuk memutuskan tombol "Masuk" atau
// "Akun". Begitu env-nya belum diisi, createClient melempar, dan yang mati
// bukan satu fitur melainkan SELURUH halaman -- termasuk halaman 404 dan
// halaman galat, jadi tidak ada satu pun layar yang bisa menjelaskan apa
// yang salah.
//
// Satu titik gagal yang menjatuhkan semuanya adalah kesalahan rancangan,
// bukan kesalahan konfigurasi.

export function supabaseSiap(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const kunci = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return Boolean(url && kunci && url.startsWith("http"));
}

export const ENV_WAJIB = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "NEXT_PUBLIC_SITE_URL",
] as const;
