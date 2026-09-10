"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { simpanHargaKomponen, type SimpanKomponenInput } from "./actions";

interface ProdukRingkas {
  id: string;
  model: string;
  varian: string;
}
interface SellerRingkas {
  id: string;
  nama: string;
}
interface ComponentTypeRingkas {
  id: string;
  kode: string;
  nama: string;
  kategori_grade: string;
}
interface GradeRingkas {
  id: string;
  kode: string;
  nama: string;
  kategori?: string;
}

const KEY_TOKO = "hargaapel:toko-terakhir";
const KEY_ANTREAN = "hargaapel:antrean-catat-komponen";

type ItemAntrean = SimpanKomponenInput & { idLokal: string };
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

export function CatatKomponenForm({
  produk,
  seller,
  frekuensi,
  componentTypes,
  boardGrades,
  partGrades,
}: {
  produk: ProdukRingkas[];
  seller: SellerRingkas[];
  frekuensi: Record<string, number>;
  componentTypes: ComponentTypeRingkas[];
  boardGrades: GradeRingkas[];
  partGrades: GradeRingkas[];
}) {
  const produkTerurut = useMemo(
    () => [...produk].sort((a, b) => (frekuensi[b.id] ?? 0) - (frekuensi[a.id] ?? 0)),
    [produk, frekuensi],
  );

  const [tokoId, setTokoId] = useState("");
  const [produkTerpilih, setProdukTerpilih] = useState<ProdukRingkas | null>(null);
  const [komponenTerpilih, setKomponenTerpilih] = useState<ComponentTypeRingkas | null>(null);
  const [gradeTerpilih, setGradeTerpilih] = useState<GradeRingkas | null>(null);
  const [hargaTeks, setHargaTeks] = useState("");
  const [antrean, setAntrean] = useState(0);
  const [status, setStatus] = useState<
    | { tipe: "idle" }
    | { tipe: "menyimpan" }
    | { tipe: "tersimpan"; posisi: Awaited<ReturnType<typeof simpanHargaKomponen>>["posisi"]; harga: number }
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
          await simpanHargaKomponen(pertama);
          sisa = lainnya;
          tulisAntrean(sisa);
          setAntrean(sisa.length);
        } catch {
          break;
        }
      }
      sedangFlush.current = false;
    }
    flush();
    window.addEventListener("online", flush);
    return () => window.removeEventListener("online", flush);
  }, []);

  const mesin = komponenTerpilih?.kode === "mesin";
  const gradeTersedia = komponenTerpilih
    ? mesin
      ? boardGrades
      : partGrades.filter((g) => g.kategori === komponenTerpilih.kategori_grade)
    : [];

  const harga = Number(hargaTeks.replace(/\D/g, "")) || 0;
  const siapSimpan = Boolean(tokoId && produkTerpilih && komponenTerpilih && gradeTerpilih && harga > 0);

  async function submit() {
    if (!siapSimpan || !produkTerpilih || !komponenTerpilih || !gradeTerpilih) return;
    localStorage.setItem(KEY_TOKO, tokoId);
    const input: SimpanKomponenInput = {
      sellerId: tokoId,
      productId: produkTerpilih.id,
      componentTypeId: komponenTerpilih.id,
      boardGradeId: mesin ? gradeTerpilih.id : null,
      partGradeId: mesin ? null : gradeTerpilih.id,
      harga,
    };
    setStatus({ tipe: "menyimpan" });
    setHargaTeks("");
    try {
      const hasil = await simpanHargaKomponen(input);
      setStatus({ tipe: "tersimpan", posisi: hasil.posisi, harga: input.harga });
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

  return (
    <div className="mx-auto flex h-dvh max-w-md flex-col overflow-y-auto px-4 py-3">
      <header className="flex items-center justify-between pb-2">
        <span className="text-base font-bold tracking-tight">catat komponen</span>
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

      <div className="mb-2 flex flex-wrap gap-1.5">
        {produkTerurut.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => setProdukTerpilih(p)}
            aria-pressed={produkTerpilih?.id === p.id}
            className={`rounded-lg border px-2.5 py-2 text-xs ${produkTerpilih?.id === p.id ? "border-foreground bg-foreground text-background" : "border-border"}`}
          >
            {p.model} {p.varian}
          </button>
        ))}
      </div>

      <div className="mb-2 flex flex-wrap gap-1.5">
        {componentTypes.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => {
              setKomponenTerpilih(c);
              setGradeTerpilih(null);
            }}
            aria-pressed={komponenTerpilih?.id === c.id}
            className={`rounded-lg border px-2.5 py-2 text-xs ${komponenTerpilih?.id === c.id ? "border-foreground bg-foreground text-background" : "border-border"}`}
          >
            {c.nama}
          </button>
        ))}
      </div>

      {gradeTersedia.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-1.5">
          {gradeTersedia.map((g) => (
            <button
              key={g.id}
              type="button"
              onClick={() => setGradeTerpilih(g)}
              aria-pressed={gradeTerpilih?.id === g.id}
              className={`rounded-lg border px-2.5 py-1.5 text-xs ${gradeTerpilih?.id === g.id ? "border-foreground bg-foreground text-background" : "border-border"}`}
            >
              {g.nama}
            </button>
          ))}
        </div>
      )}

      <input
        inputMode="numeric"
        value={hargaTeks}
        onChange={(e) => setHargaTeks(formatRibuan(Number(e.target.value.replace(/\D/g, "")) || 0))}
        placeholder="Harga part"
        className="mb-3 w-full rounded-lg border border-border bg-transparent p-3 text-lg font-semibold"
      />

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
          <p className="text-murah">
            Tersimpan {rupiah(status.harga)}.{" "}
            {status.posisi
              ? `Rasio terhadap harga unit sekitar ${Math.round(status.posisi.rasio * 100)}% dari ${status.posisi.jumlah_penjual} penjual.`
              : "Belum cukup data (minimal 3 penjual) untuk menghitung rasio."}
          </p>
        )}
        {status.tipe === "antre" && <p className="text-amber-600 dark:text-amber-400">Sedang offline, disimpan di antrean.</p>}
        {status.tipe === "error" && <p className="text-mahal">{status.pesan}</p>}
      </div>
    </div>
  );
}
