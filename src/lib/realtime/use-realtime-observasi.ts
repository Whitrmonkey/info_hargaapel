"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const DURASI_HIGHLIGHT_MS = 2_000;

// Satu channel untuk kedua tabel observasi (BAGIAN 7). router.refresh()
// menarik ulang data Server Component saat baris baru masuk; realtime-js
// menyambung ulang sendiri kalau koneksi putus -- sengaja tidak ada UI
// error untuk itu di sini.
export function useRealtimeObservasi() {
  const router = useRouter();
  const [idBaru, setIdBaru] = useState<ReadonlySet<number>>(new Set());
  const clientRef = useRef<ReturnType<typeof createClient> | null>(null);

  useEffect(() => {
    const supabase = createClient();
    clientRef.current = supabase;

    function tandaiBaru(id: number) {
      setIdBaru((s) => new Set(s).add(id));
      setTimeout(() => {
        setIdBaru((s) => {
          const n = new Set(s);
          n.delete(id);
          return n;
        });
      }, DURASI_HIGHLIGHT_MS);
    }

    const channel = supabase
      .channel("observasi-hargaapel")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "price_observations" },
        (payload) => {
          tandaiBaru(payload.new.id as number);
          router.refresh();
        },
      )
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "service_observations" }, () => {
        router.refresh();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [router]);

  return idBaru;
}
