"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { kelompokkanPasaran, type Garansi, type Grade, type Kondisi } from "@/lib/pasaran";
import { wajibKontributor } from "@/lib/auth/wajib-kontributor";

export interface SimpanHargaInput {
  productId: string;
  sellerId: string;
  kondisi: Kondisi;
  grade: Grade | null;
  garansi: Garansi;
  harga: number;
}

export interface SimpanHargaHasil {
  ok: true;
  posisi: { median: number; terendah: number; tertinggi: number; delta: number; jumlah_toko: number } | null;
  dibawahLantai: boolean;
}

// Harga beli tertinggi dari platform buyback adalah lantai pasar -- di
// bawah itu bukan otomatis salah, tapi wajib ditandai perlu_verifikasi
// (SPEC.md "Sisi pasar: bid dan ask"). Dihitung server-side, bukan
// dipercayakan ke klien (aturan keras #8).
async function ambilLantaiPasar(productId: string, kondisi: Kondisi): Promise<number | null> {
  const supabase = await createClient();
  const batas = new Date(Date.now() - 30 * 86_400_000).toISOString();
  const { data } = await supabase
    .from("price_observations")
    .select("harga")
    .eq("product_id", productId)
    .eq("kondisi", kondisi)
    .eq("sisi", "beli")
    .gte("observed_at", batas);
  if (!data || data.length === 0) return null;
  return Math.max(...data.map((d) => d.harga));
}

export async function simpanHarga(input: SimpanHargaInput): Promise<SimpanHargaHasil> {
  await wajibKontributor();
  if (input.harga <= 0) throw new Error("Harga harus lebih dari nol.");

  const lantai = await ambilLantaiPasar(input.productId, input.kondisi);
  const dibawahLantai = lantai != null && input.harga < lantai;

  const admin = createAdminClient();
  const { error } = await admin.from("price_observations").insert({
    product_id: input.productId,
    seller_id: input.sellerId,
    sisi: "jual",
    kondisi: input.kondisi,
    grade: input.kondisi === "baru" ? null : input.grade,
    garansi: input.garansi,
    harga: input.harga,
    sumber: "manual",
    perlu_verifikasi: dibawahLantai,
  });
  if (error) throw new Error(error.message);

  const posisi = await hitungPosisi(input);
  return { ok: true, posisi, dibawahLantai };
}

async function hitungPosisi(input: SimpanHargaInput) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("harga_terkini")
    .select("*")
    .eq("product_id", input.productId)
    .eq("sisi", "jual")
    .eq("kondisi", input.kondisi)
    .eq("garansi", input.garansi);

  const observasi = (data ?? [])
    .filter((o): o is typeof o & { id: number; seller_id: string; harga: number; observed_at: string } =>
      o.id != null && o.seller_id != null && o.harga != null && o.observed_at != null,
    )
    .map((o) => ({
      id: o.id,
      product_id: input.productId,
      seller_id: o.seller_id,
      sisi: "jual" as const,
      kondisi: input.kondisi,
      grade: (o.grade as Grade | null) ?? null,
      garansi: input.garansi,
      harga: o.harga,
      observed_at: o.observed_at,
      perlu_verifikasi: o.perlu_verifikasi ?? false,
    }))
    .filter((o) => o.grade === (input.kondisi === "baru" ? null : input.grade));

  const [grup] = kelompokkanPasaran(observasi);
  if (!grup) return null;
  return {
    median: grup.median,
    terendah: grup.terendah,
    tertinggi: grup.tertinggi,
    delta: (input.harga - grup.median) / grup.median,
    jumlah_toko: grup.jumlah_toko,
  };
}
