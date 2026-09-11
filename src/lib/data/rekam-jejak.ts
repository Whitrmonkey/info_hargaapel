import { createClient } from "@/lib/supabase/server";

export interface RekamJejak {
  userId: string;
  nama: string | null;
  bergabungAt: string;
  laporan: number;
  terverifikasi: number;
  meleset: number;
  diragukan: number;
  kategoriBerbobot: Array<{ kategori: string; bobot: number }>;
}

// Pengganti sesungguhnya dari budaya membongkar. Akun bayaran akan
// menampilkan dua belas laporan, nol terverifikasi, delapan diragukan --
// dan tidak ada yang perlu menuduh siapa pun. Angkanya berasal dari sistem,
// bukan dari penilaian seseorang.
//
// Karena itu di sini TIDAK ADA lencana negatif, gelar, julukan, peringkat,
// atau papan skor. Hanya angka. Menyebut seseorang tidak dapat dipercaya
// adalah penilaian; menampilkan nol dari dua belas adalah fakta.
export async function ambilRekamJejak(userId: string): Promise<RekamJejak | null> {
  const supabase = await createClient();

  const [{ data: profil }, { data: laporan }, { data: reputasi }] = await Promise.all([
    supabase.from("profil_publik").select("id, nama, bergabung_at").eq("id", userId).maybeSingle(),
    supabase.from("laporan_harga").select("id, status").eq("user_id", userId),
    supabase.from("reputasi").select("kategori, bobot").eq("user_id", userId).gt("bobot", 0),
  ]);

  if (!profil?.id || !profil.bergabung_at) return null;

  const daftar = laporan ?? [];
  // Laporan yang ditahan tidak ikut terhitung di mana pun: ia belum jadi
  // kiriman publik, jadi memasukkannya ke rekam jejak berarti menghukum
  // orang atas sesuatu yang belum ditinjau.
  const terhitung = daftar.filter((l) => l.status !== "ditahan");

  // Lewat view agregat: hitungannya terbaca publik, tapi siapa yang
  // meragukan dan dengan alasan apa tetap tidak.
  const idLaporan = terhitung.map((l) => l.id);
  let diragukan = 0;
  if (idLaporan.length > 0) {
    const { data: agregat } = await supabase
      .from("penilaian_agregat")
      .select("meragukan")
      .in("laporan_id", idLaporan);
    diragukan = (agregat ?? []).reduce((n, a) => n + (a.meragukan ?? 0), 0);
  }

  return {
    userId: profil.id,
    nama: profil.nama,
    bergabungAt: profil.bergabung_at,
    laporan: terhitung.length,
    terverifikasi: terhitung.filter((l) => l.status === "terverifikasi").length,
    meleset: terhitung.filter((l) => l.status === "meleset").length,
    diragukan,
    kategoriBerbobot: (reputasi ?? []).map((r) => ({ kategori: r.kategori, bobot: r.bobot })),
  };
}
