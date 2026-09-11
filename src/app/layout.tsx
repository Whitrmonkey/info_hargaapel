import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { TemaProvider } from "@/components/tema-provider";
import { Rangka } from "@/components/rangka";
import { createClient } from "@/lib/supabase/server";
import { modeSekarang } from "@/lib/mode";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: "hargaapel — pembanding harga Apple Jabodetabek",
  description: "Pembanding harga produk dan servis Apple untuk pembeli di Jabodetabek.",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <html
      lang="id"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <TemaProvider>
          <Rangka masuk={user != null} mode={modeSekarang()} />
          {children}
        </TemaProvider>
      </body>
    </html>
  );
}
