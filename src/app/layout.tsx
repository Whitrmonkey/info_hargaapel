import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { TemaProvider } from "@/components/tema-provider";
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

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="id"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <TemaProvider>{children}</TemaProvider>
      </body>
    </html>
  );
}
