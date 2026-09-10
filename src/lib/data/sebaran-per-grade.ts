import { createClient } from "@/lib/supabase/server";
import { kelompokkanServis, type ObservasiServis, type SebaranServis } from "@/lib/servis";

const MIN_BENGKEL = 5;

export interface BagianGrade {
  partGradeId: string | null;
  grade: { nama: string; penjelasan: string } | null;
  observasi: ObservasiServis[];
  jumlahBengkel: number;
  gerbangTerbuka: boolean;
  sebaran: SebaranServis<ObservasiServis> | null;
}

function kategoriPartGrade(jenisKategori: string): "layar" | "baterai" | "umum" {
  if (jenisKategori === "layar") return "layar";
  if (jenisKategori === "baterai") return "baterai";
  return "umum";
}

// Dipakai /servis/[produk]/[jenis] dan /cek-harga -- sengaja disatukan
// supaya kedua halaman selalu menghitung sebaran dengan cara yang persis
// sama, sesuai gerbang 5 bengkel di SERVIS.md.
export async function ambilSebaranPerGrade(produkId: string, jenisServis: {
  id: string;
  kategori: string;
  butuh_grade: boolean;
}): Promise<BagianGrade[]> {
  const supabase = await createClient();

  const [{ data: gradeList }, { data: observasiMentah }] = await Promise.all([
    jenisServis.butuh_grade
      ? supabase.from("part_grades").select("*").eq("kategori", kategoriPartGrade(jenisServis.kategori)).order("urutan")
      : Promise.resolve({ data: null }),
    supabase
      .from("service_observations")
      .select("*")
      .eq("product_id", produkId)
      .eq("service_type_id", jenisServis.id),
  ]);

  // koreksi_atas diisi di baris koreksi (baru), bukan di baris lama yang
  // dikoreksi -- buang baris yang sudah dirujuk sebagai koreksi_atas oleh
  // baris lain, bukan baris yang koreksi_atas-nya sendiri null.
  const tertimpa = new Set((observasiMentah ?? []).map((o) => o.koreksi_atas).filter((v): v is number => v != null));

  const observasi: ObservasiServis[] = (observasiMentah ?? [])
    .filter(
      (o): o is typeof o & { id: number; workshop_id: string; harga: number; observed_at: string } =>
        o.id != null && o.workshop_id != null && o.harga != null && o.observed_at != null && !tertimpa.has(o.id),
    )
    .map((o) => ({
      id: o.id,
      product_id: produkId,
      workshop_id: o.workshop_id,
      service_type_id: jenisServis.id,
      part_grade_id: o.part_grade_id,
      harga: o.harga,
      termasuk_jasa: o.termasuk_jasa,
      observed_at: o.observed_at,
    }));

  const tergerbang = kelompokkanServis(observasi);
  const tergerbangByGrade = new Map(tergerbang.map((g) => [g.part_grade_id ?? "", g]));

  const kunciGrade = jenisServis.butuh_grade ? (gradeList ?? []).map((g) => g.id) : [null];

  return kunciGrade
    .map((partGradeId): BagianGrade => {
      const grade = partGradeId ? (gradeList ?? []).find((g) => g.id === partGradeId) ?? null : null;
      const observasiGrade = observasi.filter((o) => (o.part_grade_id ?? null) === (partGradeId ?? null));
      const bengkelUnik = new Set(observasiGrade.map((o) => o.workshop_id));
      return {
        partGradeId,
        grade,
        observasi: observasiGrade.sort((a, b) => a.harga - b.harga),
        jumlahBengkel: bengkelUnik.size,
        gerbangTerbuka: bengkelUnik.size >= MIN_BENGKEL,
        sebaran: tergerbangByGrade.get(partGradeId ?? "") ?? null,
      };
    })
    .filter((b) => b.observasi.length > 0);
}
