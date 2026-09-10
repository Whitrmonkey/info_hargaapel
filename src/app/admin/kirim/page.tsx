import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { KirimList, type BarisKirim } from "./kirim-list";

const rupiah = (n: number) => "Rp " + n.toLocaleString("id-ID");

export default async function AdminKirimPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/masuk");

  const { data: profilSendiri } = await supabase.from("profiles").select("peran").eq("id", user.id).single();
  if (profilSendiri?.peran !== "admin") redirect("/");

  const admin = createAdminClient();
  const { data: menunggu } = await admin
    .from("alert_deliveries")
    .select("*, watchlists(*, products(model, varian))")
    .eq("kanal", "wa")
    .eq("status", "menunggu")
    .order("dikirim_at", { ascending: false });

  const baris: BarisKirim[] = [];
  for (const d of menunggu ?? []) {
    const w = d.watchlists;
    if (!w) continue;
    // wa_e164 sengaja hanya diambil di sini (alat admin bergerbang /admin,
    // service_role) -- tidak pernah lewat jalur anon/authenticated biasa.
    const { data: profilPemilik } = await admin.from("profiles").select("wa_e164").eq("id", w.user_id).single();
    if (!profilPemilik?.wa_e164) continue;

    baris.push({
      id: d.id,
      nomorWa: profilPemilik.wa_e164,
      teks: `Halo, harga ${w.products?.model ?? ""} ${w.products?.varian ?? ""} yang kamu pantau di hargaapel sekarang ${rupiah(d.harga_pemicu)}. Cek: ${process.env.NEXT_PUBLIC_SITE_URL}/akun`,
    });
  }

  return (
    <div className="mx-auto max-w-2xl px-5 py-10">
      <h1 className="mb-1 text-xl font-bold tracking-tight">Kirim alert WhatsApp</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Tidak dikirim otomatis. Salin teksnya, tempel dan kirim manual di aplikasi WhatsApp.
      </p>
      <KirimList baris={baris} />
    </div>
  );
}
