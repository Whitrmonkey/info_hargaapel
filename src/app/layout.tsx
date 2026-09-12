import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { TemaProvider } from "@/components/tema-provider";
import { Rangka } from "@/components/rangka";
import { createClient } from "@/lib/supabase/server";
import { modeSekarang } from "@/lib/mode";
import { supabaseSiap } from "@/lib/supabase/siap";
import { BelumTerkonfigurasi } from "@/components/belum-terkonfigurasi";
import "./globals.css";
import { situsUrlObjek } from "@/lib/situs";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: situsUrlObjek(),
  title: "hargaapel — pembanding harga Apple Jabodetabek",
  description: "Pembanding harga produk dan servis Apple untuk pembeli di Jabodetabek.",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  // Kalau kredensialnya belum ada, tampilkan satu layar yang menyebutkan apa
  // yang kurang -- jangan biarkan seluruh situs 500 tanpa penjelasan.
  const siap = supabaseSiap();

  // Gagalnya pencarian sesi TIDAK boleh menjatuhkan halaman. Yang hilang
  // kalau ini gagal cuma tombol "Masuk" berubah jadi "Akun", dan itu tidak
  // sepadan dengan menjatuhkan seluruh situs.
  let user: { id: string } | null = null;
  if (siap) {
    try {
      const supabase = await createClient();
      const { data } = await supabase.auth.getUser();
      user = data.user ?? null;
    } catch {
      user = null;
    }
  }

  return (
    <html
      lang="id"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <TemaProvider>
          {siap ? (
            <>
              <Rangka masuk={user != null} mode={modeSekarang()} />
              {children}
            </>
          ) : (
            <BelumTerkonfigurasi />
          )}
        </TemaProvider>
      </body>
    </html>
  );
}
