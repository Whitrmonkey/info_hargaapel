// Fase hidup diturunkan dari LAJU penurunan bulanan, bukan dari umur. Dua
// model seumuran bisa berada di fase berbeda, dan itu memang informasinya.
export type KodeFase = "cepat" | "sedang" | "landai" | "datar";

export interface Fase {
  kode: KodeFase;
  teks: string;
}

export function fase(laju: number): Fase {
  if (laju <= -0.018) return { kode: "cepat", teks: "masih turun cepat" };
  if (laju <= -0.01) return { kode: "sedang", teks: "turun sedang" };
  if (laju <= -0.005) return { kode: "landai", teks: "sudah melandai" };
  return { kode: "datar", teks: "praktis datar" };
}

// Rute /iphone, /ipad, /mac, /watch dilayani satu templat /[keluarga].
// Daftar ini juga yang memutuskan rute mana yang sah -- selain ini 404,
// bukan halaman kosong.
export const KELUARGA: Record<string, { judul: string; kategori: string }> = {
  iphone: { judul: "iPhone", kategori: "iphone" },
  ipad: { judul: "iPad", kategori: "ipad" },
  mac: { judul: "Mac", kategori: "mac" },
  watch: { judul: "Apple Watch", kategori: "watch" },
};
