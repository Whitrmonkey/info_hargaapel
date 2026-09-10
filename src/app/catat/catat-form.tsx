"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Garansi, Grade, GrupPasaran, Kondisi, ObservasiHarga } from "@/lib/pasaran";
import { simpanHarga, type SimpanHargaInput } from "./actions";

interface ProdukRingkas {
  id: string;
  slug: string;
  model: string;
  varian: string;
  kategori: string;
}
interface SellerRingkas {
  id: string;
  nama: string;
}

const KEY_TOKO = "hargaapel:toko-terakhir";
const KEY_ANTREAN = "hargaapel:antrean-catat";

type ItemAntrean = SimpanHargaInput & { idLokal: string };

function bacaAntrean(): ItemAntrean[] {
  try {
    return JSON.parse(localStorage.getItem(KEY_ANTREAN) ?? "[]");
  } catch {
    return [];
  }
}
function tulisAntrean(item: ItemAntrean[]) {
  localStorage.setItem(KEY_ANTREAN, JSON.stringify(item));
}
const formatRibuan = (n: number) => n.toLocaleString("id-ID");
const rupiah = (n: number) => "Rp " + formatRibuan(n);

export function CatatForm({
  produk,
  seller,
  frekuensi,
  grup,
  lantaiPasar,
}: {
  produk: ProdukRingkas[];
  seller: SellerRingkas[];
  frekuensi: Record<string, number>;
  grup: GrupPasaran<ObservasiHarga>[];
  lantaiPasar: Record<string, number>;
}) {
  const produkTerurut = useMemo(
    () => [...produk].sort((a, b) => (frekuensi[b.id] ?? 0) - (frekuensi[a.id] ?? 0)),
    [produk, frekuensi],
  );

  const [tokoId, setTokoId] = useState("");
  const [produkTerpilih, setProdukTerpilih] = useState<ProdukRingkas | null>(null);
  const [kondisi, setKondisi] = useState<Kondisi>("second");
  const [grade, setGrade] = useState<Grade>("standar");
  const [garansi, setGaransi] = useState<Garansi>("inter");
  const [hargaTeks, setHargaTeks] = useState("");
  const [antrean, setAntrean] = useState(0);
  const [status, setStatus] = useState<
    | { tipe: "idle" }
    | { tipe: "konfirmasi"; input: SimpanHargaInput; median: number }
    | { tipe: "menyimpan" }
    | { tipe: "tersimpan"; hasil: Awaited<ReturnType<typeof simpanHarga>>; harga: number }
    | { tipe: "antre" }
    | { tipe: "error"; pesan: string }
  >({ tipe: "idle" });

  const sedangFlush = useRef(false);

  useEffect(() => {
    // Sengaja dibaca setelah mount, bukan lewat initializer useState --
    // localStorage tidak ada saat SSR, dan initializer yang beda hasil antara
    // server/klien memicu hydration mismatch. Satu render ekstra di sini
    // lebih aman daripada itu.
    const tersimpan = localStorage.getItem(KEY_TOKO);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (tersimpan) setTokoId(tersimpan);
    setAntrean(bacaAntrean().length);
  }, []);

  useEffect(() => {
    async function flush() {
      if (sedangFlush.current) return;
      sedangFlush.current = true;
      let sisa = bacaAntrean();
      while (sisa.length > 0) {
        const [pertama, ...lainnya] = sisa;
        try {
          await simpanHarga(pertama);
          sisa = lainnya;
          tulisAntrean(sisa);
          setAntrean(sisa.length);
        } catch {
          break; // masih offline / gagal, coba lagi nanti
        }
      }
      sedangFlush.current = false;
    }
    flush();
    window.addEventListener("online", flush);
    return () => window.removeEventListener("online", flush);
  }, []);

  const harga = Number(hargaTeks.replace(/\D/g, "")) || 0;

  function medianSaatIni(input: Omit<SimpanHargaInput, "harga">): number | null {
    const g = grup.find(
      (g) =>
        g.product_id === input.productId &&
        g.kondisi === input.kondisi &&
        g.grade === input.grade &&
        g.garansi === input.garansi,
    );
    return g?.median ?? null;
  }

  async function kirim(input: SimpanHargaInput) {
    setStatus({ tipe: "menyimpan" });
    setHargaTeks("");
    try {
      const hasil = await simpanHarga(input);
      setStatus({ tipe: "tersimpan", hasil, harga: input.harga });
    } catch (e) {
      if (!navigator.onLine) {
        const item: ItemAntrean = { ...input, idLokal: crypto.randomUUID() };
        const baru = [...bacaAntrean(), item];
        tulisAntrean(baru);
        setAntrean(baru.length);
        setStatus({ tipe: "antre" });
      } else {
        setStatus({ tipe: "error", pesan: e instanceof Error ? e.message : "Gagal menyimpan" });
      }
    }
  }

  function submit() {
    if (!tokoId || !produkTerpilih || harga <= 0) return;
    localStorage.setItem(KEY_TOKO, tokoId);
    const input: SimpanHargaInput = {
      productId: produkTerpilih.id,
      sellerId: tokoId,
      kondisi,
      grade: kondisi === "baru" ? null : grade,
      garansi,
      harga,
    };
    const median = medianSaatIni(input);
    if (median != null && Math.abs(harga - median) / median > 0.25) {
      setStatus({ tipe: "konfirmasi", input, median });
      return;
    }
    kirim(input);
  }

  const siapSimpan = Boolean(tokoId && produkTerpilih && harga > 0);

  return (
    <div className="mx-auto flex h-dvh max-w-md flex-col px-4 py-3">
      <header className="flex items-center justify-between pb-2">
        <span className="text-base font-bold tracking-tight">catat harga</span>
        {antrean > 0 && (
          <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[11px] font-medium text-amber-600 dark:text-amber-400">
            {antrean} antre offline
          </span>
        )}
      </header>

      <select
        value={tokoId}
        onChange={(e) => setTokoId(e.target.value)}
        className="mb-2 w-full rounded-lg border border-border bg-transparent p-2.5 text-sm"
        aria-label="Toko"
      >
        <option value="" disabled>
          Toko mana
        </option>
        {seller.map((s) => (
          <option key={s.id} value={s.id}>
            {s.nama}
          </option>
        ))}
      </select>

      <div className="mb-2 flex-1 overflow-y-auto">
        <div className="flex flex-wrap gap-1.5">
          {produkTerurut.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setProdukTerpilih(p)}
              aria-pressed={produkTerpilih?.id === p.id}
              className={`rounded-lg border px-2.5 py-2 text-xs ${
                produkTerpilih?.id === p.id ? "border-foreground bg-foreground text-background" : "border-border"
              }`}
            >
              {p.model} {p.varian}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-2 flex gap-1.5">
        {(["baru", "second", "refurb"] as Kondisi[]).map((k) => (
          <Chip key={k} aktif={kondisi === k} onClick={() => setKondisi(k)}>
            {k}
          </Chip>
        ))}
      </div>
      {kondisi !== "baru" && (
        <div className="mb-2 flex gap-1.5">
          {(["mulus", "standar", "ekonomis"] as Grade[]).map((g) => (
            <Chip key={g} aktif={grade === g} onClick={() => setGrade(g)}>
              {g}
            </Chip>
          ))}
        </div>
      )}
      <div className="mb-3 flex gap-1.5">
        {(["resmi", "inter", "toko"] as Garansi[]).map((g) => (
          <Chip key={g} aktif={garansi === g} onClick={() => setGaransi(g)}>
            {g}
          </Chip>
        ))}
      </div>

      <input
        inputMode="numeric"
        value={hargaTeks}
        onChange={(e) => setHargaTeks(formatRibuan(Number(e.target.value.replace(/\D/g, "")) || 0))}
        placeholder="Harga"
        className="mb-1 w-full rounded-lg border border-border bg-transparent p-3 text-lg font-semibold"
      />
      {produkTerpilih && harga > 0 && (() => {
        const lantai = lantaiPasar[`${produkTerpilih.id}|${kondisi}`];
        if (lantai == null || harga >= lantai) return null;
        return (
          <p className="mb-2 text-xs text-amber-600 dark:text-amber-400">
            Di bawah lantai pasar ({rupiah(lantai)}, harga beli tertinggi platform buyback). Bukan berarti salah — pastikan
            saja bukan salah ketik atau ada minus yang belum dicatat.
          </p>
        );
      })()}

      <button
        type="button"
        disabled={!siapSimpan || status.tipe === "menyimpan"}
        onClick={submit}
        className="w-full rounded-lg bg-foreground p-3 text-base font-medium text-background disabled:opacity-40"
      >
        Simpan
      </button>

      <div className="pt-2 text-sm">
        {status.tipe === "tersimpan" && (
          <div className="text-murah">
            <p>
              Tersimpan.{" "}
              {status.hasil.posisi &&
                `Posisi ${rupiah(status.harga)} terhadap pasaran (median ${rupiah(status.hasil.posisi.median)}, ${status.hasil.posisi.jumlah_toko} toko): ${
                  status.hasil.posisi.delta > 0 ? "+" : ""
                }${Math.round(status.hasil.posisi.delta * 100)}%.`}
            </p>
            {status.hasil.dibawahLantai && (
              <p className="mt-1 text-amber-600 dark:text-amber-400">Ditandai perlu_verifikasi: di bawah lantai pasar.</p>
            )}
          </div>
        )}
        {status.tipe === "antre" && <p className="text-amber-600 dark:text-amber-400">Sedang offline, disimpan di antrean.</p>}
        {status.tipe === "error" && <p className="text-mahal">{status.pesan}</p>}
        {status.tipe === "konfirmasi" && (
          <div className="rounded-lg border border-amber-500/50 p-3">
            <p className="mb-2">
              {rupiah(status.input.harga)} beda {Math.round((Math.abs(status.input.harga - status.median) / status.median) * 100)}% dari
              median saat ini ({rupiah(status.median)}). Yakin?
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => kirim(status.input)}
                className="rounded-md bg-foreground px-3 py-1.5 text-xs font-medium text-background"
              >
                Ya, simpan
              </button>
              <button
                type="button"
                onClick={() => setStatus({ tipe: "idle" })}
                className="rounded-md border border-border px-3 py-1.5 text-xs"
              >
                Batal
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Chip({ aktif, onClick, children }: { aktif: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={aktif}
      className={`flex-1 rounded-lg border py-2 text-xs capitalize ${aktif ? "border-foreground bg-foreground text-background" : "border-border"}`}
    >
      {children}
    </button>
  );
}
