import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

// SUPABASE_SERVICE_ROLE_KEY melewati seluruh RLS. Baris "server-only" di atas
// membuat build gagal kalau file ini sampai tertarik ke bundle klien.
// Lihat hargaapel-SETUP.md C2. Hanya dipakai di Route Handler, Server Action,
// dan skrip cron/scraper -- tidak pernah di file yang punya "use client".
export function createAdminClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}
