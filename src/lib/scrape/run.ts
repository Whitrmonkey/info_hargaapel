import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import type { Adapter, HasilItemAdapter, SourceRow } from "@/lib/adapters/shopify";

export type { Adapter, HasilItemAdapter, SourceRow };

export interface HasilScrape {
  status: "sukses" | "gagal" | "ditolak";
  jumlah_item: number;
  jumlah_baru: number;
  jumlah_tak_terpetakan: number;
  pesan: string | null;
}

const AMBANG_GERBANG_KEWARASAN = 0.3; // turun >30% dari run sukses terakhir -> ditolak
const JENDELA_DUPLIKAT_JAM = 20;

interface KonfigSumber {
  kondisi: "baru" | "second" | "refurb";
  garansi: "resmi" | "inter" | "toko";
}

function bacaKonfigSumber(source: SourceRow): KonfigSumber {
  const c = source.config as Partial<KonfigSumber> | null;
  if (!c?.kondisi || !c?.garansi) {
    throw new Error(
      `sources.config untuk ${source.id} tidak lengkap -- butuh "kondisi" dan "garansi" supaya baris harga tahu kunci grupnya.`,
    );
  }
  return { kondisi: c.kondisi, garansi: c.garansi };
}

async function tutupRun(
  supabase: SupabaseClient<Database>,
  runId: number,
  status: HasilScrape["status"],
  ringkas: Omit<HasilScrape, "status">,
) {
  await supabase
    .from("scrape_runs")
    .update({
      status,
      selesai_at: new Date().toISOString(),
      jumlah_item: ringkas.jumlah_item,
      jumlah_baru: ringkas.jumlah_baru,
      jumlah_tak_terpetakan: ringkas.jumlah_tak_terpetakan,
      pesan: ringkas.pesan,
    })
    .eq("id", runId);
}

export async function jalankanScrape(
  supabase: SupabaseClient<Database>,
  source: SourceRow,
  adapter: Adapter,
  dipicuOleh: "cron" | "manual",
): Promise<HasilScrape> {
  const { data: run, error: errMulai } = await supabase
    .from("scrape_runs")
    .insert({ source_id: source.id, dipicu_oleh: dipicuOleh, status: "jalan" })
    .select()
    .single();
  if (errMulai || !run) {
    throw new Error(`gagal mencatat scrape_runs: ${errMulai?.message ?? "tidak ada baris"}`);
  }

  try {
    const item = await adapter.ambil(source);

    // Gerbang kewarasan: dibandingkan dengan run SUKSES terakhir untuk
    // sumber yang sama. Diam (tidak menulis apa pun) lebih baik daripada
    // salah menimpa data dengan feed yang rusak/parsial.
    const { data: runTerakhir } = await supabase
      .from("scrape_runs")
      .select("jumlah_item")
      .eq("source_id", source.id)
      .eq("status", "sukses")
      .order("mulai_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (
      runTerakhir?.jumlah_item != null &&
      runTerakhir.jumlah_item > 0 &&
      item.length < runTerakhir.jumlah_item * (1 - AMBANG_GERBANG_KEWARASAN)
    ) {
      const ringkas = {
        jumlah_item: item.length,
        jumlah_baru: 0,
        jumlah_tak_terpetakan: 0,
        pesan: `Jumlah item turun dari ${runTerakhir.jumlah_item} menjadi ${item.length} (>30%). Ditolak, nol observasi ditulis.`,
      };
      await tutupRun(supabase, run.id, "ditolak", ringkas);
      return { status: "ditolak", ...ringkas };
    }

    const konfig = bacaKonfigSumber(source);

    const { data: peta } = await supabase
      .from("source_product_map")
      .select("*")
      .eq("source_id", source.id);
    const petaByKey = new Map((peta ?? []).map((p) => [p.external_key, p]));

    let jumlahBaru = 0;
    let jumlahTakTerpetakan = 0;

    for (const it of item) {
      let entriPeta = petaByKey.get(it.external_key);

      if (!entriPeta) {
        const { data: baru } = await supabase
          .from("source_product_map")
          .insert({
            source_id: source.id,
            external_key: it.external_key,
            product_id: null, // TIDAK PERNAH ditebak atau dicocokkan fuzzy
            grade: it.grade ?? null,
            fullset: it.fullset ?? null,
          })
          .select()
          .single();
        if (baru) {
          entriPeta = baru;
          petaByKey.set(it.external_key, baru);
        }
      }

      if (!entriPeta || entriPeta.product_id == null || entriPeta.abaikan) {
        jumlahTakTerpetakan++;
        continue;
      }
      if (!it.tersedia) continue;

      const batasDuplikat = new Date(Date.now() - JENDELA_DUPLIKAT_JAM * 3_600_000).toISOString();
      const { data: duplikat } = await supabase
        .from("price_observations")
        .select("id")
        .eq("product_id", entriPeta.product_id)
        .eq("seller_id", source.seller_id)
        .eq("source_id", source.id)
        .eq("harga", it.harga)
        .gte("observed_at", batasDuplikat)
        .limit(1)
        .maybeSingle();
      if (duplikat) continue;

      const { error: errInsert } = await supabase.from("price_observations").insert({
        product_id: entriPeta.product_id,
        seller_id: source.seller_id,
        source_id: source.id,
        sisi: source.sisi,
        kondisi: konfig.kondisi,
        grade: konfig.kondisi === "baru" ? null : entriPeta.grade,
        fullset: entriPeta.fullset,
        garansi: konfig.garansi,
        harga: it.harga,
        url: it.url,
        sumber: "scraper",
      });
      if (!errInsert) jumlahBaru++;
    }

    const ringkas = {
      jumlah_item: item.length,
      jumlah_baru: jumlahBaru,
      jumlah_tak_terpetakan: jumlahTakTerpetakan,
      pesan: null,
    };
    await tutupRun(supabase, run.id, "sukses", ringkas);
    await supabase.from("sources").update({ last_run_at: new Date().toISOString() }).eq("id", source.id);
    return { status: "sukses", ...ringkas };
  } catch (e) {
    const ringkas = {
      jumlah_item: 0,
      jumlah_baru: 0,
      jumlah_tak_terpetakan: 0,
      pesan: e instanceof Error ? e.message : String(e),
    };
    await tutupRun(supabase, run.id, "gagal", ringkas);
    return { status: "gagal", ...ringkas };
  }
}
