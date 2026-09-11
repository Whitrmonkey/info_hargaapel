import { createClient } from "@/lib/supabase/server";
import { saringObservasi } from "@/lib/mode";
import { kelompokkanKomponen, pinjamRasioKomponen, type ObservasiKomponen, type RasioTerpinjam } from "@/lib/komponen";

function kunci(componentTypeId: string, boardGradeId: string | null, partGradeId: string | null): string {
  return `${componentTypeId}|${boardGradeId ?? ""}|${partGradeId ?? ""}`;
}

// KOMPONEN.md bagian 3: rasio boleh dipinjam ke SATU generasi bersebelahan
// dalam keluarga yang sama -- di sini diartikan sebagai pendahulu/penerus
// langsung lewat products.penerus_id, tidak pernah lintas kategori.
export async function ambilRasioKomponenProduk(produk: {
  id: string;
  kategori: string;
  penerus_id: string | null;
}): Promise<Map<string, RasioTerpinjam>> {
  const supabase = await createClient();

  const [{ data: pendahulu }, { data: hargaUnitRow }] = await Promise.all([
    supabase.from("products").select("id, model, kategori").eq("penerus_id", produk.id).eq("kategori", produk.kategori),
    supabase
      .from("harga_terkini")
      .select("harga")
      .eq("product_id", produk.id)
      .eq("sisi", "jual")
      .eq("kondisi", "second")
      .eq("grade", "standar"),
  ]);

  const kandidatId: Array<{ id: string; model: string }> = [...(pendahulu ?? [])];
  if (produk.penerus_id) {
    const { data: penerus } = await supabase.from("products").select("id, model, kategori").eq("id", produk.penerus_id).single();
    if (penerus && penerus.kategori === produk.kategori) kandidatId.push(penerus);
  }

  const semuaProductId = [produk.id, ...kandidatId.map((k) => k.id)];
  const { data: observasi } = await supabase
    .from("component_observations")
    .select("*")
    .in("product_id", semuaProductId);

  // koreksi_atas diisi di baris koreksi (baru), bukan di baris lama yang
  // dikoreksi -- buang baris yang sudah dirujuk sebagai koreksi_atas oleh
  // baris lain, bukan baris yang koreksi_atas-nya sendiri null.
  const tertimpa = new Set((observasi ?? []).map((o) => o.koreksi_atas).filter((v): v is number => v != null));

  const rows = saringObservasi(observasi ?? [])
    .filter(
      (o): o is typeof o & { id: number; product_id: string; seller_id: string; harga: number; observed_at: string } =>
        o.id != null && o.product_id != null && o.seller_id != null && o.harga != null && o.observed_at != null && !tertimpa.has(o.id),
    )
    .map((o) => ({
      id: o.id,
      product_id: o.product_id,
      seller_id: o.seller_id,
      component_type_id: o.component_type_id,
      board_grade_id: o.board_grade_id,
      part_grade_id: o.part_grade_id,
      harga: o.harga,
      observed_at: o.observed_at,
    }));

  const harga = (hargaUnitRow ?? []).map((h) => h.harga).filter((h): h is number => h != null);
  const hargaUnit = harga.length > 0 ? harga.sort((a, b) => a - b)[Math.floor(harga.length / 2)] : null;

  function grupUntuk(productId: string): Map<string, ReturnType<typeof kelompokkanKomponen>[number]> {
    const milikProduk = rows.filter((r) => r.product_id === productId) as ObservasiKomponen[];
    const grup = kelompokkanKomponen(milikProduk, hargaUnit);
    return new Map(grup.map((g) => [kunci(g.component_type_id, g.board_grade_id, g.part_grade_id), g]));
  }

  const grupSendiri = grupUntuk(produk.id);
  const grupKandidat = kandidatId.map((k) => ({ ...k, grup: grupUntuk(k.id) }));

  const semuaKunci = new Set<string>();
  for (const g of grupSendiri.keys()) semuaKunci.add(g);
  for (const k of grupKandidat) for (const g of k.grup.keys()) semuaKunci.add(g);

  const hasil = new Map<string, RasioTerpinjam>();
  for (const k of semuaKunci) {
    const langsung = grupSendiri.get(k);
    const kandidat = grupKandidat.map((c) => {
      const g = c.grup.get(k);
      return {
        productId: c.id,
        model: c.model,
        rasio: g?.rasio != null ? { rasio: g.rasio, jumlah_penjual: g.jumlah_penjual, terakhir: g.terakhir } : null,
      };
    });
    const dipinjam = pinjamRasioKomponen(
      langsung?.rasio != null ? { rasio: langsung.rasio, jumlah_penjual: langsung.jumlah_penjual, terakhir: langsung.terakhir } : null,
      kandidat,
    );
    if (dipinjam) hasil.set(k, dipinjam);
  }
  return hasil;
}

export { kunci as kunciRasioKomponen };
