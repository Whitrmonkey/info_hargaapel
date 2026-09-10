import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import { kelompokkanPasaran, type Garansi, type Grade, type Kondisi } from "@/lib/pasaran";
import { isiMaju, perubahan30Hari } from "@/lib/seri";
import { evaluasiSinyal, type EventPromoTerdekat } from "@/lib/sinyal";

const JENDELA_SERI_HARI = 90;
const JENDELA_PROMO_HARI = 75;

function kunciGrup(o: { product_id: string; kondisi: string; grade: string | null; garansi: string }): string {
  return `${o.product_id}|${o.kondisi}|${o.grade ?? ""}|${o.garansi}`;
}

// Dipanggil cron (refresh-pasaran) setelah pasaran_harian di-refresh.
// Mengumpulkan semua fakta yang diminta sinyal.ts, lalu menyimpan hasilnya
// ke sinyal_cache. Klien tidak pernah menghitung ini sendiri.
export async function hitungSinyalSemua(admin: SupabaseClient<Database>): Promise<number> {
  const dariSeri = new Date(Date.now() - JENDELA_SERI_HARI * 86_400_000).toISOString().slice(0, 10);
  const ke = new Date().toISOString().slice(0, 10);
  const hariIni = new Date();

  const [{ data: hargaTerkini }, { data: observasi90Hari }, { data: pasaranHarian }, { data: products }, { data: fxRates }, { data: marketEvents }] =
    await Promise.all([
      admin.from("harga_terkini").select("*").eq("sisi", "jual"),
      admin
        .from("price_observations")
        .select("product_id, kondisi, grade, garansi")
        .eq("sisi", "jual")
        .gte("observed_at", dariSeri),
      admin.from("pasaran_harian").select("*").eq("sisi", "jual").gte("tanggal", dariSeri),
      admin.from("products").select("id, kategori, penerus_id, rilis_at"),
      admin.from("fx_rates").select("*").order("tanggal", { ascending: false }).limit(40),
      admin.from("market_events").select("*").eq("jenis", "promo"),
    ]);

  const productById = new Map((products ?? []).map((p) => [p.id, p]));

  const jumlahObservasiPerKunci = new Map<string, number>();
  for (const o of observasi90Hari ?? []) {
    const key = kunciGrup(o);
    jumlahObservasiPerKunci.set(key, (jumlahObservasiPerKunci.get(key) ?? 0) + 1);
  }

  const observasiTerkini = (hargaTerkini ?? [])
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

  const grup = kelompokkanPasaran(observasiTerkini);

  const fxHariIni = fxRates?.[0];
  const batasFx30 = new Date(Date.now() - 30 * 86_400_000).toISOString().slice(0, 10);
  const fx30HariLalu = fxRates?.find((f) => f.tanggal <= batasFx30);
  const kursNaik30Hari =
    fxHariIni && fx30HariLalu && fx30HariLalu.usd_idr > 0
      ? (fxHariIni.usd_idr - fx30HariLalu.usd_idr) / fx30HariLalu.usd_idr
      : null;

  const baris = grup.map((g) => {
    const produk = productById.get(g.product_id);
    const penerus = produk?.penerus_id ? productById.get(produk.penerus_id) : null;
    const hariKeRilisPenerus = penerus?.rilis_at
      ? Math.round((new Date(penerus.rilis_at).getTime() - hariIni.getTime()) / 86_400_000)
      : null;

    const seriHarian = (pasaranHarian ?? [])
      .filter(
        (p) =>
          p.product_id === g.product_id &&
          p.kondisi === g.kondisi &&
          (p.grade ?? null) === (g.grade ?? null) &&
          p.garansi === g.garansi &&
          p.tanggal != null &&
          p.median != null,
      )
      .map((p) => ({ tanggal: p.tanggal!, median: p.median! }));
    const tren30 = perubahan30Hari(isiMaju(seriHarian, dariSeri, ke)) ?? 0;

    const eventTerdekat = (marketEvents ?? [])
      .filter((e) => e.kategori?.includes(produk?.kategori ?? ""))
      .map((e) => ({ label: e.label, hari: Math.round((new Date(e.tanggal).getTime() - hariIni.getTime()) / 86_400_000) }))
      .filter((e) => e.hari > 0 && e.hari <= JENDELA_PROMO_HARI)
      .sort((a, b) => a.hari - b.hari)[0];
    const eventPromo: EventPromoTerdekat | null = eventTerdekat
      ? { label: eventTerdekat.label, hari_lagi: eventTerdekat.hari }
      : null;

    const hasil = evaluasiSinyal({
      jumlah_observasi: jumlahObservasiPerKunci.get(g.key) ?? g.items.length,
      jumlah_toko: g.jumlah_toko,
      kondisi: g.kondisi,
      garansi: g.garansi,
      tren30,
      hari_ke_rilis_penerus: hariKeRilisPenerus,
      kurs_naik_30_hari: kursNaik30Hari,
      event_promo: eventPromo,
    });

    return {
      product_id: g.product_id,
      kondisi: g.kondisi,
      grade: g.grade,
      garansi: g.garansi,
      kode: hasil.kode,
      judul: hasil.judul,
      alasan: hasil.alasan,
    };
  });

  if (baris.length > 0) {
    await admin.from("sinyal_cache").upsert(baris, { onConflict: "product_id,kondisi,grade,garansi" });
  }
  return baris.length;
}
