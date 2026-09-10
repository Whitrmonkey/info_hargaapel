"use client";

import { useEffect, useRef, useState } from "react";
import { simpanHargaServis, type SimpanServisInput } from "./actions";
import { JUDUL_VONIS_SERVIS } from "@/lib/salinan-servis";

interface ProdukRingkas {
  id: string;
  model: string;
  varian: string;
}
interface WorkshopRingkas {
  id: string;
  nama: string;
}
interface JenisRingkas {
  id: string;
  nama: string;
  kategori: string;
  butuh_grade: boolean;
}
interface GradeRingkas {
  id: string;
  kode: string;
  nama: string;
  kategori: string;
}

const KEY_BENGKEL = "hargaapel:bengkel-terakhir";
const KEY_ANTREAN = "hargaapel:antrean-catat-servis";

type ItemAntrean = SimpanServisInput & { idLokal: string };
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
const rupiah = (n: number) => "Rp " + n.toLocaleString("id-ID");

function kategoriGrade(jenisKategori: string): "layar" | "baterai" | "umum" {
  if (jenisKategori === "layar") return "layar";
  if (jenisKategori === "baterai") return "baterai";
  return "umum";
}

export function CatatServisForm({
  produk,
  workshop,
  jenis,
  grade,
}: {
  produk: ProdukRingkas[];
  workshop: WorkshopRingkas[];
  jenis: JenisRingkas[];
  grade: GradeRingkas[];
}) {
  const [workshopId, setWorkshopId] = useState("");
  const [produkTerpilih, setProdukTerpilih] = useState<ProdukRingkas | null>(null);
  const [jenisTerpilih, setJenisTerpilih] = useState<JenisRingkas | null>(null);
  const [gradeTerpilih, setGradeTerpilih] = useState<GradeRingkas | null>(null);
  const [hargaTeks, setHargaTeks] = useState("");
  const [allIn, setAllIn] = useState(true);
  const [noFixNoPay, setNoFixNoPay] = useState(false);
  const [garansiHari, setGaransiHari] = useState("");
  const [antrean, setAntrean] = useState(0);
  const [status, setStatus] = useState<
    | { tipe: "idle" }
    | { tipe: "menyimpan" }
    | { tipe: "tersimpan"; posisi: Awaited<ReturnType<typeof simpanHargaServis>>["posisi"] }
    | { tipe: "antre" }
    | { tipe: "error"; pesan: string }
  >({ tipe: "idle" });
  const sedangFlush = useRef(false);

  useEffect(() => {
    // Sengaja dibaca setelah mount, bukan lewat initializer useState --
    // localStorage tidak ada saat SSR, dan initializer yang beda hasil antara
    // server/klien memicu hydration mismatch. Satu render ekstra di sini
    // lebih aman daripada itu.
    const tersimpan = localStorage.getItem(KEY_BENGKEL);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (tersimpan) setWorkshopId(tersimpan);
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
          await simpanHargaServis(pertama);
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

  const gradeTersedia = jenisTerpilih?.butuh_grade
    ? grade.filter((g) => g.kategori === kategoriGrade(jenisTerpilih.kategori))
    : [];
  const harga = Number(hargaTeks.replace(/\D/g, "")) || 0;
  const siapSimpan = Boolean(
    workshopId && produkTerpilih && jenisTerpilih && harga > 0 && (!jenisTerpilih?.butuh_grade || gradeTerpilih),
  );

  async function submit() {
    if (!siapSimpan || !produkTerpilih || !jenisTerpilih) return;
    localStorage.setItem(KEY_BENGKEL, workshopId);
    const input: SimpanServisInput = {
      workshopId,
      productId: produkTerpilih.id,
      serviceTypeId: jenisTerpilih.id,
      partGradeId: jenisTerpilih.butuh_grade ? gradeTerpilih!.id : null,
      harga,
      termasukJasa: allIn,
      noFixNoPay,
      garansiHari: garansiHari ? Number(garansiHari) : null,
    };
    setStatus({ tipe: "menyimpan" });
    setHargaTeks("");
    try {
      const hasil = await simpanHargaServis(input);
      setStatus({ tipe: "tersimpan", posisi: hasil.posisi });
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
        <span className="text-base font-bold tracking-tight">catat servis</span>
        {antrean > 0 && (
          <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[11px] font-medium text-amber-600 dark:text-amber-400">
            {antrean} antre offline
          </span>
        )}
      </header>

      <select
        value={workshopId}
        onChange={(e) => setWorkshopId(e.target.value)}
        className="mb-2 w-full rounded-lg border border-border bg-transparent p-2.5 text-sm"
        aria-label="Bengkel"
      >
        <option value="" disabled>
          Bengkel mana
        </option>
        {workshop.map((w) => (
          <option key={w.id} value={w.id}>
            {w.nama}
          </option>
        ))}
      </select>

      <div className="mb-2 flex flex-wrap gap-1.5">
        {produk.map((p) => (
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
        {jenis.map((j) => (
          <button
            key={j.id}
            type="button"
            onClick={() => {
              setJenisTerpilih(j);
              setGradeTerpilih(null);
            }}
            aria-pressed={jenisTerpilih?.id === j.id}
            className={`rounded-lg border px-2.5 py-2 text-xs ${jenisTerpilih?.id === j.id ? "border-foreground bg-foreground text-background" : "border-border"}`}
          >
            {j.nama}
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
        onChange={(e) => setHargaTeks(Number(e.target.value.replace(/\D/g, "") || 0).toLocaleString("id-ID"))}
        placeholder="Harga"
        className="mb-2 w-full rounded-lg border border-border bg-transparent p-3 text-lg font-semibold"
      />

      <div className="mb-2 flex gap-1.5">
        <ToggleChip aktif={allIn} onClick={() => setAllIn(!allIn)}>
          All-in
        </ToggleChip>
        <ToggleChip aktif={noFixNoPay} onClick={() => setNoFixNoPay(!noFixNoPay)}>
          No fix no pay
        </ToggleChip>
      </div>
      <input
        inputMode="numeric"
        value={garansiHari}
        onChange={(e) => setGaransiHari(e.target.value.replace(/\D/g, ""))}
        placeholder="Garansi berapa hari (opsional)"
        className="mb-3 w-full rounded-lg border border-border bg-transparent p-2.5 text-sm"
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
            Tersimpan.{" "}
            {status.posisi
              ? `Posisi ${rupiah(harga)} terhadap sebaran (median ${rupiah(status.posisi.p50)}, ${status.posisi.jumlah_bengkel} bengkel): ${JUDUL_VONIS_SERVIS[status.posisi.vonis]}.`
              : "Belum cukup data untuk menghitung posisi."}
          </p>
        )}
        {status.tipe === "antre" && <p className="text-amber-600 dark:text-amber-400">Sedang offline, disimpan di antrean.</p>}
        {status.tipe === "error" && <p className="text-mahal">{status.pesan}</p>}
      </div>
    </div>
  );
}

function ToggleChip({ aktif, onClick, children }: { aktif: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={aktif}
      className={`flex-1 rounded-lg border py-2 text-xs ${aktif ? "border-foreground bg-foreground text-background" : "border-border"}`}
    >
      {children}
    </button>
  );
}
