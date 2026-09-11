"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";

// Rangka aplikasi: navigasi atas di desktop, navigasi bawah di HP.
//
// Empat tujuan saja. Menambah yang kelima berarti ada yang harus keluar --
// navigasi bawah yang penuh berhenti jadi navigasi dan mulai jadi laci.
const NAV = [
  {
    kode: "beranda",
    label: "Beranda",
    href: "/",
    ikon: "M3 10 L11 3 L19 10 V19 H13 V14 H9 V19 H3 Z",
  },
  {
    kode: "jelajah",
    label: "Jelajah",
    href: "/pasaran",
    ikon: "M4 4 H18 M4 11 H18 M4 18 H12",
  },
  {
    kode: "lapor",
    label: "Lapor",
    href: "/cek-harga",
    ikon: "M11 4 V18 M4 11 H18",
  },
  {
    kode: "akun",
    label: "Akun",
    href: "/akun",
    ikon: "M11 11 m-4 0 a4 4 0 1 0 8 0 a4 4 0 1 0 -8 0 M4 19 a7 7 0 0 1 14 0",
  },
];

function Ikon({ d }: { d: string }) {
  return (
    <svg viewBox="0 0 22 22" className="nv-ik" aria-hidden="true">
      <path d={d} />
    </svg>
  );
}

function aktif(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(href + "/");
}

export function Rangka({ masuk }: { masuk: boolean }) {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();

  // Halaman pencatatan kontributor adalah alat lapangan satu layar penuh;
  // rangka di sana justru merebut ruang yang dipakai jempol.
  if (pathname.startsWith("/catat") || pathname.startsWith("/admin")) return null;

  return (
    <>
      <header className="sticky top-0 z-20 border-b border-foreground bg-background">
        <div className="mx-auto flex max-w-[1100px] items-center gap-6 px-5 py-3 sm:px-6">
          <Link href="/" className="text-[17px] font-semibold tracking-tight">
            hargaapel
          </Link>
          <nav className="hidden gap-5 min-[721px]:flex">
            {NAV.filter((n) => n.kode !== "akun").map((n) => (
              <Link
                key={n.kode}
                href={n.href}
                aria-current={aktif(pathname, n.href) ? "page" : undefined}
                className={`border-b-2 py-0.5 text-[13.5px] ${
                  aktif(pathname, n.href) ? "border-foreground text-foreground" : "border-transparent text-muted-foreground"
                }`}
              >
                {n.label}
              </Link>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <button
              type="button"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="rounded-full border border-border px-2.5 py-1 text-xs text-muted-foreground hover:border-foreground hover:text-foreground"
            >
              {theme === "dark" ? "terang" : "gelap"}
            </button>
            <Link
              href={masuk ? "/akun" : "/masuk"}
              className="rounded border border-foreground bg-foreground px-4 py-1.5 text-[13px] text-background"
            >
              {masuk ? "Akun" : "Masuk"}
            </Link>
          </div>
        </div>
      </header>

      <nav
        aria-label="Navigasi utama"
        className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-4 border-t border-border bg-background pb-[env(safe-area-inset-bottom)] min-[721px]:hidden"
      >
        {NAV.map((n) => (
          <Link
            key={n.kode}
            href={n.href}
            aria-current={aktif(pathname, n.href) ? "page" : undefined}
            className={`flex flex-col items-center gap-1 py-2.5 text-[10.5px] ${
              aktif(pathname, n.href) ? "text-foreground" : "text-muted-foreground"
            }`}
          >
            <Ikon d={n.ikon} />
            <span>{n.label}</span>
          </Link>
        ))}
      </nav>
    </>
  );
}
