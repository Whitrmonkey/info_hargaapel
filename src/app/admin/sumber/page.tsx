import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { jalankanSekarang } from "./actions";
import { AntreanPemetaan } from "./antrean-pemetaan";

export default async function AdminSumberPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/masuk");
  const { data: profil } = await supabase.from("profiles").select("peran").eq("id", user.id).single();
  if (profil?.peran !== "admin") redirect("/");

  const admin = createAdminClient();
  const [{ data: sources }, { data: runTerakhir }, { data: antrean }, { data: products }] = await Promise.all([
    admin.from("sources").select("*, sellers(nama)").order("aktif", { ascending: false }),
    admin.from("scrape_runs").select("*").order("mulai_at", { ascending: false }).limit(20),
    admin.from("source_product_map").select("*").is("product_id", null).eq("abaikan", false),
    admin.from("products").select("id, model, varian").order("model"),
  ]);

  const runBySource = new Map<string, typeof runTerakhir>();
  for (const r of runTerakhir ?? []) {
    const arr = runBySource.get(r.source_id) ?? [];
    arr.push(r);
    runBySource.set(r.source_id, arr);
  }

  return (
    <div className="mx-auto max-w-3xl px-5 py-10">
      <h1 className="mb-6 text-xl font-bold tracking-tight">Sumber scraper</h1>

      <section className="mb-10">
        <h2 className="mb-3 text-sm font-semibold">Sumber terdaftar</h2>
        <ul className="space-y-3">
          {(sources ?? []).map((s) => (
            <li key={s.id} className="rounded-lg border border-border p-3">
              <div className="mb-1 flex items-center justify-between">
                <span className="text-sm font-medium">
                  {s.sellers?.nama} · {s.adapter} · {s.sisi}
                </span>
                <form action={async () => { "use server"; await jalankanSekarang(s.id); }}>
                  <button type="submit" className="rounded-md border border-foreground px-2.5 py-1 text-xs font-medium">
                    Jalankan sekarang
                  </button>
                </form>
              </div>
              <p className="text-xs text-muted-foreground">{s.base_url} · {s.cadence} · {s.aktif ? "aktif" : "nonaktif"}</p>
              <ul className="mt-2 space-y-0.5 text-xs text-muted-foreground">
                {(runBySource.get(s.id) ?? []).slice(0, 3).map((r) => (
                  <li key={r.id}>
                    {new Date(r.mulai_at).toLocaleString("id-ID")} — {r.status} ({r.jumlah_baru ?? 0} baru,{" "}
                    {r.jumlah_tak_terpetakan ?? 0} belum terpetakan){r.pesan ? `: ${r.pesan}` : ""}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold">Belum terpetakan ({antrean?.length ?? 0})</h2>
        <AntreanPemetaan antrean={antrean ?? []} produk={products ?? []} />
      </section>
    </div>
  );
}
