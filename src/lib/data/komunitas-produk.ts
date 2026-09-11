import { createClient } from "@/lib/supabase/server";
import { ringkasSentimen, tampilkanDiskusi, tampilkanLaporan, type RingkasSentimen, type SuaraSentimen } from "@/lib/ambang";
import { bolehMasukHitungan, type StatusLaporan } from "@/lib/reputasi";
import { urutkanDiskusi } from "@/lib/suara";

export interface LaporanTampil {
  id: number;
  userId: string;
  nama: string | null;
  hargaJadi: number;
  hargaBuka: number | null;
  area: string;
  kondisi: string;
  grade: string | null;
  garansi: string;
  status: StatusLaporan;
  adaHargaBuka: boolean;
  masukHitungan: boolean;
  pemilik: boolean;
  dibuatAt: string;
  masukAkal: number;
  meragukan: number;
}

export interface KirimanTampil {
  id: number;
  indukId: number | null;
  userId: string;
  nama: string | null;
  isi: string;
  skor: number;
  dilipat: boolean;
  disunting: boolean;
  pemilik: boolean;
  dibuatAt: string;
}

export interface KomunitasProduk {
  sentimen: RingkasSentimen | null;
  laporan: LaporanTampil[];
  diskusi: KirimanTampil[];
}

export async function ambilKomunitasProduk(productId: string): Promise<KomunitasProduk> {
  const supabase = await createClient();

  const [{ data: sentimen }, { data: laporan }, { data: diskusi }, { data: pemilik }] = await Promise.all([
    supabase.from("sentimen_agregat").select("suara, jumlah").eq("product_id", productId),
    supabase
      .from("laporan_harga")
      .select("*")
      .eq("product_id", productId)
      .neq("status", "ditahan")
      .order("dibuat_at", { ascending: false })
      .limit(50),
    supabase
      .from("diskusi")
      .select("*")
      .eq("product_id", productId)
      .neq("status", "ditahan")
      .order("dibuat_at", { ascending: false })
      .limit(100),
    supabase.from("penanda_pemilik").select("user_id").eq("product_id", productId),
  ]);

  const hitungan: Partial<Record<SuaraSentimen, number>> = {};
  for (const s of sentimen ?? []) {
    if (s.suara != null && s.jumlah != null) hitungan[s.suara as SuaraSentimen] = s.jumlah;
  }

  const idPemilik = new Set((pemilik ?? []).map((p) => p.user_id));
  const userIds = [
    ...new Set([...(laporan ?? []).map((l) => l.user_id), ...(diskusi ?? []).map((d) => d.user_id)]),
  ];

  const [{ data: profil }, { data: penilaian }] = await Promise.all([
    userIds.length > 0
      ? supabase.from("profil_publik").select("id, nama").in("id", userIds)
      : Promise.resolve({ data: [] as Array<{ id: string; nama: string | null }> }),
    (laporan ?? []).length > 0
      ? supabase
          .from("penilaian_agregat")
          .select("laporan_id, masuk_akal, meragukan")
          .in("laporan_id", (laporan ?? []).map((l) => l.id))
      : Promise.resolve({ data: [] as Array<{ laporan_id: number; masuk_akal: number; meragukan: number }> }),
  ]);

  const namaById = new Map((profil ?? []).map((p) => [p.id, p.nama]));
  const nilaiById = new Map((penilaian ?? []).map((p) => [p.laporan_id, p]));

  const laporanTampil: LaporanTampil[] = (laporan ?? []).map((l) => {
    const n = nilaiById.get(l.id);
    return {
      id: l.id,
      userId: l.user_id,
      nama: namaById.get(l.user_id) ?? null,
      hargaJadi: l.harga_jadi,
      hargaBuka: l.harga_buka,
      area: l.area,
      kondisi: l.kondisi,
      grade: l.grade,
      garansi: l.garansi,
      status: l.status as StatusLaporan,
      adaHargaBuka: l.harga_buka != null,
      // Satu-satunya tempat pertanyaan "apakah ini ikut dihitung" dijawab,
      // dan jawabannya tidak pernah bergantung pada suara.
      masukHitungan: bolehMasukHitungan(l.status as StatusLaporan, l.bobot_saat_lapor),
      pemilik: idPemilik.has(l.user_id),
      dibuatAt: l.dibuat_at,
      masukAkal: n?.masuk_akal ?? 0,
      meragukan: n?.meragukan ?? 0,
    };
  });

  // Urutan dihitung pada baris mentahnya, sebelum dipetakan ke bentuk
  // tampilan, supaya urutkanDiskusi tetap bekerja pada satu bentuk saja.
  const kiriman: KirimanTampil[] = urutkanDiskusi(diskusi ?? []).map((d) => ({
    id: d.id,
    indukId: d.induk_id,
    userId: d.user_id,
    nama: namaById.get(d.user_id) ?? null,
    isi: d.isi,
    skor: d.skor,
    dilipat: d.status === "dilipat",
    disunting: d.disunting_at != null,
    pemilik: idPemilik.has(d.user_id),
    dibuatAt: d.dibuat_at,
  }));

  return {
    sentimen: ringkasSentimen(hitungan),
    laporan: tampilkanLaporan(laporanTampil.length) ? laporanTampil : [],
    diskusi: tampilkanDiskusi(kiriman.length) ? kiriman : [],
  };
}
