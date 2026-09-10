"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { wajibAdmin } from "@/lib/auth/wajib-kontributor";
import { kelompokkanPasaran, type Garansi, type Grade, type Kondisi } from "@/lib/pasaran";
import { revalidatePath } from "next/cache";

const rupiah = (n: number) => "Rp " + n.toLocaleString("id-ID");

export async function susunDraftMingguan() {
  await wajibAdmin();
  const admin = createAdminClient();

  const sekarang = new Date();
  const mulai = new Date(sekarang.getTime() - 7 * 86_400_000);

  const [{ data: hargaTerkini }, { data: products }, { data: observasiBaru }, { data: pasaranHarian }] = await Promise.all([
    admin.from("harga_terkini").select("*").eq("sisi", "jual"),
    admin.from("products").select("id, model, varian"),
    admin.from("price_observations").select("id").eq("sisi", "jual").gte("observed_at", mulai.toISOString()),
    admin
      .from("pasaran_harian")
      .select("*")
      .eq("sisi", "jual")
      .gte("tanggal", mulai.toISOString().slice(0, 10)),
  ]);

  const productById = new Map((products ?? []).map((p) => [p.id, p]));

  const observasi = (hargaTerkini ?? [])
    .filter((o): o is typeof o & { id: number; product_id: string; seller_id: string; harga: number; observed_at: string } =>
      o.id != null && o.product_id != null && o.seller_id != null && o.harga != null && o.observed_at != null,
    )
    .map((o) => ({
      id: o.id,
      product_id: o.product_id,
      seller_id: o.seller_id,
      sisi: "jual" as const,
      kondisi: o.kondisi as Kondisi,
      grade: o.grade as Grade | null,
      garansi: o.garansi as Garansi,
      harga: o.harga,
      observed_at: o.observed_at,
      perlu_verifikasi: o.perlu_verifikasi ?? false,
    }));
  const grup = kelompokkanPasaran(observasi);

  const lima = [...grup]
    .sort((a, b) => (b.tertinggi - b.terendah) / b.terendah - (a.tertinggi - a.terendah) / a.terendah)
    .slice(0, 5);

  // Perubahan mingguan per grup, dari pasaran_harian (hari pertama vs
  // terakhir yang tercatat dalam jendela).
  let terbesarPerubahan: { nama: string; persen: number } | null = null;
  const byKey = new Map<string, { tanggal: string; median: number }[]>();
  for (const p of pasaranHarian ?? []) {
    if (p.tanggal == null || p.median == null) continue;
    const key = `${p.product_id}|${p.kondisi}|${p.grade ?? ""}|${p.garansi}`;
    const arr = byKey.get(key) ?? [];
    arr.push({ tanggal: p.tanggal, median: p.median });
    byKey.set(key, arr);
  }
  for (const [key, arr] of byKey) {
    if (arr.length < 2) continue;
    arr.sort((a, b) => a.tanggal.localeCompare(b.tanggal));
    const awal = arr[0].median;
    const akhir = arr[arr.length - 1].median;
    if (awal === 0) continue;
    const persen = (akhir - awal) / awal;
    if (!terbesarPerubahan || Math.abs(persen) > Math.abs(terbesarPerubahan.persen)) {
      const productId = key.split("|")[0];
      terbesarPerubahan = { nama: productById.get(productId)?.model ?? "?", persen };
    }
  }

  const baris = lima.map((g, i) => {
    const info = productById.get(g.product_id);
    const persen = Math.round(((g.tertinggi - g.terendah) / g.terendah) * 100);
    return `${i + 1}. ${info?.model ?? ""} ${info?.varian ?? ""}: beda ${rupiah(g.tertinggi - g.terendah)} (${persen}%)`;
  });

  const isi = [
    `Rekap hargaapel minggu ini`,
    ``,
    `Selisih terbesar antar toko:`,
    ...baris,
    ``,
    terbesarPerubahan
      ? `Paling banyak berubah: ${terbesarPerubahan.nama} (${terbesarPerubahan.persen > 0 ? "+" : ""}${Math.round(terbesarPerubahan.persen * 100)}%)`
      : `Belum ada data perubahan minggu ini.`,
    `${observasiBaru?.length ?? 0} harga baru masuk minggu ini.`,
    ``,
    `Lihat selengkapnya: ${process.env.NEXT_PUBLIC_SITE_URL}`,
  ].join("\n");

  await admin.from("wa_broadcast_drafts").insert({
    judul: `Rekap ${mulai.toISOString().slice(0, 10)} - ${sekarang.toISOString().slice(0, 10)}`,
    isi,
    periode_mulai: mulai.toISOString().slice(0, 10),
    periode_selesai: sekarang.toISOString().slice(0, 10),
  });

  revalidatePath("/admin/siaran");
}

export async function tandaiDisalin(id: string) {
  await wajibAdmin();
  const admin = createAdminClient();
  await admin.from("wa_broadcast_drafts").update({ status: "disalin" }).eq("id", id);
  revalidatePath("/admin/siaran");
}
