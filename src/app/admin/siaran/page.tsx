import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { susunDraftMingguan } from "./actions";
import { SiaranDraftList } from "./siaran-draft-list";

export default async function AdminSiaranPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/masuk");

  const { data: profil } = await supabase.from("profiles").select("peran").eq("id", user.id).single();
  if (profil?.peran !== "admin") redirect("/");

  // wa_broadcast_drafts sengaja tanpa policy anon/authenticated (bukan
  // konten publik, bukan data pribadi siapa pun) -- baca lewat admin client,
  // gerbang aslinya adalah pengecekan peran di atas.
  const { data: draft } = await createAdminClient()
    .from("wa_broadcast_drafts")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(10);

  return (
    <div className="mx-auto max-w-2xl px-5 py-10">
      <h1 className="mb-1 text-xl font-bold tracking-tight">Siaran WhatsApp mingguan</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Disusun dari data nyata. Kamu yang menempel dan mengirim di saluran WhatsApp.
      </p>

      <form action={susunDraftMingguan} className="mb-6">
        <button type="submit" className="rounded-lg bg-foreground px-4 py-2.5 text-sm font-medium text-background">
          Susun draf minggu ini
        </button>
      </form>

      <SiaranDraftList draft={draft ?? []} />
    </div>
  );
}
