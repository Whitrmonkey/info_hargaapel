import { createClient } from "@/lib/supabase/server";
import { saringObservasi } from "@/lib/mode";
import { kunciSebaran, sebaranDevice, type OpsiProduk, type SebaranDevice } from "@/lib/cek";
import type { Garansi, Grade, Kondisi } from "@/lib/pasaran";

export interface Pintasan {
  label: string;
  productId: string;
  kategori: string;
  model: string;
  varian: string;
  kondisi: Kondisi;
  grade: Grade | null;
  garansi: Garansi;
}

export type { OpsiProduk };

export interface DataCek {
  produk: OpsiProduk[];
  sebaran: Record<string, SebaranDevice>;
  pintasan: Pintasan[];
}

const HARI_PINTASAN = 30;
const JUMLAH_PINTASAN = 4;

export async function ambilDataCek(): Promise<DataCek> {
  const supabase = await createClient();
  const batas = new Date(Date.now() - HARI_PINTASAN * 86_400_000).toISOString();

  const [{ data: produk }, { data: observasi }, { data: pengecekan }] = await Promise.all([
    supabase.from("products").select("id, kategori, model, varian, slug").eq("aktif", true).order("model"),
    supabase.from("harga_terkini").select("*").eq("sisi", "jual"),
    supabase.from("pengecekan").select("product_id, kondisi, grade, garansi").gte("dibuat_at", batas),
  ]);

  const produkById = new Map((produk ?? []).map((p) => [p.id, p]));

  // Kumpulkan harga per grup pembanding, lalu hitung persentilnya. Penjual
  // unik dihitung per grup karena gerbangnya soal berapa TOKO, bukan berapa
  // baris harga -- satu toko yang mencatat sepuluh kali tetap satu toko.
  const perGrup = new Map<string, { harga: number[]; toko: Set<string> }>();
  for (const o of saringObservasi(observasi ?? [])) {
    if (o.product_id == null || o.harga == null || o.seller_id == null || o.garansi == null || o.kondisi == null) continue;
    if (!produkById.has(o.product_id)) continue;
    const k = kunciSebaran(o.product_id, o.kondisi, o.grade, o.garansi);
    const isi = perGrup.get(k) ?? { harga: [], toko: new Set<string>() };
    isi.harga.push(o.harga);
    isi.toko.add(o.seller_id);
    perGrup.set(k, isi);
  }

  const sebaran: Record<string, SebaranDevice> = {};
  for (const [k, isi] of perGrup) {
    const s = sebaranDevice(isi.harga, isi.toko.size);
    if (s) sebaran[k] = s;
  }

  // Pintasan dihitung dari frekuensi pengecekan nyata, bukan ditulis tangan.
  // Kombinasi yang belum punya sebaran tidak pernah jadi pintasan -- percuma
  // sekali ketuk kalau ujungnya keadaan kosong.
  const hitung = new Map<string, number>();
  for (const c of pengecekan ?? []) {
    if (c.product_id == null || c.kondisi == null || c.garansi == null) continue;
    const k = kunciSebaran(c.product_id, c.kondisi, c.grade, c.garansi);
    hitung.set(k, (hitung.get(k) ?? 0) + 1);
  }

  const pintasan: Pintasan[] = [...hitung.entries()]
    .filter(([k]) => sebaran[k] != null)
    .sort((a, b) => b[1] - a[1])
    .slice(0, JUMLAH_PINTASAN)
    .map(([k]) => {
      const [productId, kondisi, grade, garansi] = k.split("|");
      const p = produkById.get(productId)!;
      return {
        label: `${p.model} ${p.varian}`,
        productId,
        kategori: p.kategori,
        model: p.model,
        varian: p.varian,
        kondisi: kondisi as Kondisi,
        grade: (grade || null) as Grade | null,
        garansi: garansi as Garansi,
      };
    });

  return { produk: produk ?? [], sebaran, pintasan };
}
