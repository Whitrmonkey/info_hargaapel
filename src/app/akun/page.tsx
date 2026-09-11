import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { hapusPerangkat, keluar, nonaktifkanWatchlist, nyatakanPerangkat, perbaruiWa } from "./actions";

export default async function AkunPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/masuk");

  const [{ data: profil }, { data: watchlist }, { data: produkSemua }, { data: dimiliki }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).single(),
    supabase
      .from("watchlists")
      .select("*, products(model, varian)")
      .eq("user_id", user.id)
      .eq("aktif", true)
      .order("created_at", { ascending: false }),
    supabase.from("products").select("id, model, varian").eq("aktif", true).order("model"),
    supabase.from("perangkat_dimiliki").select("product_id, kesehatan_baterai").eq("user_id", user.id),
  ]);
  const punyaId = new Set((dimiliki ?? []).map((d) => d.product_id));

  async function simpanWa(formData: FormData) {
    "use server";
    await perbaruiWa(String(formData.get("wa") ?? ""));
  }

  return (
    <div className="mx-auto max-w-md px-5 py-10">
      <div className="mb-6 flex items-center justify-between">
        <Link href="/" className="text-lg font-bold tracking-tight">
          hargaapel
        </Link>
        <form action={keluar}>
          <button type="submit" className="text-xs text-muted-foreground underline underline-offset-2">
            Keluar
          </button>
        </form>
      </div>

      <h1 className="mb-1 text-xl font-bold tracking-tight">Akun</h1>
      <p className="mb-6 text-sm text-muted-foreground">{user.email}</p>

      <section className="mb-8">
        <h2 className="mb-2 text-sm font-semibold">Nomor WhatsApp (opsional)</h2>
        <form action={simpanWa} className="flex gap-2">
          <input
            name="wa"
            defaultValue={profil?.wa_e164 ?? ""}
            placeholder="+628xxxxxxxxxx"
            className="flex-1 rounded-lg border border-border bg-transparent p-2.5 text-sm"
          />
          <button type="submit" className="rounded-lg border border-foreground px-3 text-sm font-medium">
            Simpan
          </button>
        </form>
        <p className="mt-1.5 text-xs text-muted-foreground">
          Belum diverifikasi. Hanya ditampilkan ke kamu sendiri, tidak dipakai mengirim apa pun secara otomatis.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="mb-2 text-sm font-semibold">Perangkat yang kamu punya (opsional)</h2>
        <p className="mb-3 text-xs leading-relaxed text-muted-foreground">
          Bukan syarat apa pun. Gunanya cuma satu: laporan dan komentarmu tentang model yang kamu punya diberi penanda pemilik, dan
          bobotnya di kategori itu naik lebih cepat. Kesehatan baterai boleh dikosongkan, dan tidak pernah terbaca orang lain. Kami
          tidak pernah meminta IMEI.
        </p>
        <ul className="space-y-2">
          {(produkSemua ?? []).map((p) => {
            const punya = punyaId.has(p.id);
            const isi = (dimiliki ?? []).find((d) => d.product_id === p.id);
            return (
              <li key={p.id} className="flex items-center justify-between gap-3 rounded-lg border border-border p-3 text-sm">
                <span>
                  {p.model} {p.varian}
                  {punya && isi?.kesehatan_baterai != null && (
                    <span className="block text-xs text-muted-foreground">baterai {isi.kesehatan_baterai}%</span>
                  )}
                </span>
                {punya ? (
                  <form action={async () => { "use server"; await hapusPerangkat(p.id); }}>
                    <button type="submit" className="text-xs text-muted-foreground underline underline-offset-2">
                      Hapus
                    </button>
                  </form>
                ) : (
                  <form
                    action={async (fd: FormData) => {
                      "use server";
                      const b = String(fd.get("baterai") ?? "").trim();
                      await nyatakanPerangkat(p.id, b ? Number(b) : null);
                    }}
                    className="flex items-center gap-1.5"
                  >
                    <input
                      name="baterai"
                      inputMode="numeric"
                      placeholder="baterai %"
                      className="w-24 rounded border border-border bg-transparent p-1.5 text-xs"
                    />
                    <button type="submit" className="rounded border border-foreground px-2 py-1.5 text-xs font-medium">
                      Saya punya
                    </button>
                  </form>
                )}
              </li>
            );
          })}
        </ul>
      </section>

      <section>
        <h2 className="mb-2 text-sm font-semibold">Pantauan harga</h2>
        {watchlist && watchlist.length > 0 ? (
          <ul className="space-y-2">
            {watchlist.map((w) => (
              <li key={w.id} className="flex items-center justify-between rounded-lg border border-border p-3 text-sm">
                <span>
                  {w.products?.model} {w.products?.varian}
                  {w.target_harga && ` · target ${("Rp " + w.target_harga.toLocaleString("id-ID"))}`}
                </span>
                <form action={async () => { "use server"; await nonaktifkanWatchlist(w.id); }}>
                  <button type="submit" className="text-xs text-muted-foreground underline underline-offset-2">
                    Berhenti
                  </button>
                </form>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">Belum ada pantauan harga. Tambahkan dari halaman produk atau /cek-harga.</p>
        )}
      </section>
    </div>
  );
}
