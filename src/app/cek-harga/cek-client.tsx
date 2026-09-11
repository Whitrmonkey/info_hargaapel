"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { PitaUkur } from "@/components/pita-ukur";
import { Kucing } from "@/components/kucing";
import { FooterLegal } from "@/components/footer-legal";
import { kunciSebaran, nilaiVonis } from "@/lib/cek";
import { KELUARGA } from "@/lib/keluarga";
import type { DataCek, Pintasan } from "@/lib/data/sebaran-device";
import type { Garansi, Grade, Kondisi } from "@/lib/pasaran";
import { catatPengecekan } from "./actions";

const rupiah = (n: number) => "Rp " + n.toLocaleString("id-ID");
const jt = (n: number) => {
  const v = n / 1e6;
  return (v >= 10 ? v.toFixed(1) : v.toFixed(2)).replace(".", ",") + " jt";
};

// Grade di layar menggabungkan kondisi dan grade jadi satu pilihan, karena
// bagi pembaca "baru segel" dan "mulus" adalah jenis pilihan yang sama.
const KONDISI_PILIHAN: Array<{ v: string; l: string; kondisi: Kondisi; grade: Grade | null }> = [
  { v: "baru", l: "Baru segel", kondisi: "baru", grade: null },
  { v: "mulus", l: "Mulus", kondisi: "second", grade: "mulus" },
  { v: "standar", l: "Standar", kondisi: "second", grade: "standar" },
  { v: "ekonomis", l: "Ekonomis", kondisi: "second", grade: "ekonomis" },
];
const JALUR: Array<{ v: Garansi; l: string }> = [
  { v: "resmi", l: "Garansi resmi" },
  { v: "inter", l: "Inter" },
  { v: "toko", l: "Garansi toko" },
];

interface Pilihan {
  keluarga: string | null;
  model: string | null;
  varian: string | null;
  jalur: Garansi | null;
  kondisi: string | null;
}

const KOSONG: Pilihan = { keluarga: null, model: null, varian: null, jalur: null, kondisi: null };

export function CekClient({ produk, sebaran, pintasan }: DataCek) {
  const [p, setP] = useState<Pilihan>(KOSONG);
  const [harga, setHarga] = useState<number | null>(null);
  const [cari, setCari] = useState("");
  const dicatat = useRef<string | null>(null);

  const keluargaAda = useMemo(
    () => Object.entries(KELUARGA).filter(([, k]) => produk.some((x) => x.kategori === k.kategori)),
    [produk],
  );
  const modelAda = useMemo(() => {
    const kat = p.keluarga ? KELUARGA[p.keluarga]?.kategori : null;
    return [...new Set(produk.filter((x) => x.kategori === kat).map((x) => x.model))];
  }, [produk, p.keluarga]);
  const varianAda = useMemo(
    () => produk.filter((x) => x.model === p.model).map((x) => x.varian),
    [produk, p.model],
  );

  const produkTerpilih = produk.find((x) => x.model === p.model && x.varian === p.varian) ?? null;
  const kondisiTerpilih = KONDISI_PILIHAN.find((k) => k.v === p.kondisi) ?? null;

  const kunci =
    produkTerpilih && kondisiTerpilih && p.jalur
      ? kunciSebaran(produkTerpilih.id, kondisiTerpilih.kondisi, kondisiTerpilih.grade, p.jalur)
      : null;
  const s = kunci ? sebaran[kunci] ?? null : null;

  // Nilai awal = median, supaya layarnya tidak pernah kosong.
  const hargaAktif = harga ?? s?.p50 ?? null;
  const vonis = s && hargaAktif != null ? nilaiVonis(hargaAktif, s) : null;

  // Dicatat sekali per kombinasi, buat menyusun pintasan "sering dicek".
  // Gagalnya dibiarkan diam: ini catatan statistik, bukan bagian dari
  // jawaban yang sedang dibaca orang.
  useEffect(() => {
    if (!kunci || !s || dicatat.current === kunci) return;
    dicatat.current = kunci;
    const [productId, kondisi, grade, garansi] = kunci.split("|");
    void catatPengecekan(productId, kondisi, grade || null, garansi).catch(() => {});
  }, [kunci, s]);

  function pilih(k: keyof Pilihan, v: string) {
    setP((s) => {
      const baru: Pilihan = { ...s, [k]: s[k] === v ? null : v };
      if (k === "keluarga") {
        baru.model = null;
        baru.varian = null;
      }
      if (k === "model") baru.varian = null;
      return baru;
    });
    setHarga(null);
  }

  function pakaiPintasan(x: Pintasan) {
    const keluarga = Object.entries(KELUARGA).find(([, k]) => k.kategori === x.kategori)?.[0] ?? null;
    const kondisi = KONDISI_PILIHAN.find((k) => k.kondisi === x.kondisi && k.grade === x.grade)?.v ?? null;
    setP({ keluarga, model: x.model, varian: x.varian, jalur: x.garansi, kondisi });
    setHarga(null);
  }

  const cocokCari = cari.trim().length >= 2
    ? produk.filter((x) => `${x.model} ${x.varian}`.toLowerCase().includes(cari.trim().toLowerCase())).slice(0, 6)
    : [];

  const langkah: Array<{ kunci: keyof Pilihan; judul: string; opsi: Array<{ v: string; l: string }> }> = [
    { kunci: "keluarga", judul: "Perangkat apa", opsi: keluargaAda.map(([kode, k]) => ({ v: kode, l: k.judul })) },
    { kunci: "model", judul: "Model", opsi: modelAda.map((m) => ({ v: m, l: m })) },
    { kunci: "varian", judul: "Kapasitas", opsi: varianAda.map((v) => ({ v, l: v })) },
    { kunci: "jalur", judul: "Jalur garansi", opsi: JALUR.map((j) => ({ v: j.v, l: j.l })) },
    { kunci: "kondisi", judul: "Kondisi", opsi: KONDISI_PILIHAN.map((k) => ({ v: k.v, l: k.l })) },
  ];
  // Tiap langkah baru muncul setelah langkah sebelumnya terisi, jadi layarnya
  // tidak pernah penuh sekaligus.
  const tampil = langkah.filter((l, i) => i === 0 || p[langkah[i - 1].kunci] != null);

  return (
    <div className="mx-auto max-w-3xl px-5 pb-24">
      <nav className="flex items-center justify-between border-b border-foreground py-4">
        <Link href="/" className="text-lg font-bold tracking-tight">
          hargaapel
        </Link>
        <Link href="/servis" className="text-xs text-muted-foreground underline underline-offset-2">
          Harga servis
        </Link>
      </nav>

      <header className="border-b border-border py-9">
        <h1 className="mb-3 text-3xl font-bold tracking-tight sm:text-[44px] sm:leading-none">Ditawari berapa?</h1>
        <p className="mb-5 max-w-[52ch] text-[15px] leading-relaxed text-muted-foreground">
          Pilih dengan mengetuk, lalu geser pita untuk harga yang ditawarkan. Jawabannya muncul sambil kamu menggeser.
        </p>
        {pintasan.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11.5px] text-muted-foreground">sering dicek</span>
            {pintasan.map((x) => (
              <button
                key={`${x.productId}${x.kondisi}${x.grade}${x.garansi}`}
                type="button"
                onClick={() => pakaiPintasan(x)}
                className="rounded-full border border-dashed border-border px-3 py-1.5 text-[12.5px] text-muted-foreground hover:border-solid hover:border-foreground hover:text-foreground"
              >
                {x.label}
              </button>
            ))}
          </div>
        )}
      </header>

      {tampil.map((l) => (
        <section key={l.kunci} className="pt-5">
          <p className="mb-2.5 text-xs text-muted-foreground">{l.judul}</p>
          <div className="flex flex-wrap gap-2">
            {l.opsi.map((o) => (
              <button
                key={o.v}
                type="button"
                aria-pressed={p[l.kunci] === o.v}
                onClick={() => pilih(l.kunci, o.v)}
                className={`min-h-[46px] rounded px-4 py-3 text-[15px] sm:px-5 ${
                  p[l.kunci] === o.v ? "bg-foreground text-background" : "border border-border hover:border-foreground"
                }`}
              >
                {o.l}
              </button>
            ))}
          </div>
        </section>
      ))}

      {s && hargaAktif != null && vonis ? (
        <>
          <section className="pt-8">
            <p className="mb-2.5 text-xs text-muted-foreground">Harga yang ditawarkan</p>
            <PitaUkur sebaran={s} nilai={hargaAktif} setNilai={setHarga} />
          </section>

          <section
            aria-live="polite"
            className={`mt-7 border-l-[3px] bg-sorot px-6 py-5 ${
              vonis.sisi === "umum" ? "border-murah" : vonis.sisi === "atas" ? "border-mahal" : "border-tanah"
            }`}
          >
            <p
              className={`mb-2 text-xl font-semibold tracking-tight ${
                vonis.sisi === "umum" ? "text-murah" : vonis.sisi === "atas" ? "text-mahal" : "text-tanah"
              }`}
            >
              {vonis.judul}
            </p>
            <p className="mb-4 max-w-[60ch] text-sm leading-relaxed">{vonis.teks}</p>
            <div className="flex flex-wrap gap-x-7 gap-y-3 border-t border-border pt-4 text-[11.5px] text-muted-foreground">
              <span>
                <b className="mb-0.5 block text-base text-foreground">{rupiah(s.p50)}</b>harga pasaran
              </span>
              <span>
                <b className="mb-0.5 block text-base text-foreground">
                  {jt(s.p25)} – {jt(s.p75)}
                </b>
                rentang umum
              </span>
              <span>
                <b className="mb-0.5 block text-base text-foreground">{s.jumlah_toko} toko</b>dasar perhitungan
              </span>
            </div>
          </section>
        </>
      ) : (
        <section className="py-14 text-center">
          <Kucing />
          <p className="mb-1.5 text-lg font-semibold tracking-tight">
            {kunci ? "Belum cukup toko terpantau" : p.keluarga ? "Lanjutkan pilihannya" : "Mulai dari perangkatnya"}
          </p>
          <p className="mx-auto max-w-[44ch] text-sm leading-relaxed text-muted-foreground">
            {kunci
              ? "Kombinasi ini belum dipantau di cukup toko untuk diberi vonis. Angka dari satu-dua toko belum bisa membedakan harga wajar dari kebetulan."
              : p.keluarga
                ? "Pita harga muncul begitu kombinasinya lengkap dan ada cukup toko yang terpantau."
                : "Ketuk salah satu di atas. Tidak ada yang perlu diketik."}
          </p>
        </section>
      )}

      {/* Kotak pencarian bukan jalan utama, jadi ia di bawah, bukan paling atas. */}
      <section className="mt-10 border-t border-border pt-6">
        <label className="block">
          <span className="mb-2 block text-xs text-muted-foreground">Atau cari modelnya kalau lebih cepat mengetik</span>
          <input
            value={cari}
            onChange={(e) => setCari(e.target.value)}
            placeholder="mis. iPhone 14"
            className="w-full rounded-lg border border-border bg-transparent p-3 text-base"
          />
        </label>
        {cocokCari.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {cocokCari.map((x) => {
              const keluarga = Object.entries(KELUARGA).find(([, k]) => k.kategori === x.kategori)?.[0] ?? null;
              return (
                <button
                  key={x.id}
                  type="button"
                  onClick={() => {
                    setP({ keluarga, model: x.model, varian: x.varian, jalur: null, kondisi: null });
                    setHarga(null);
                    setCari("");
                  }}
                  className="rounded border border-border px-3 py-2 text-sm hover:border-foreground"
                >
                  {x.model} {x.varian}
                </button>
              );
            })}
          </div>
        )}
      </section>

      <FooterLegal>
        <p className="max-w-prose">
          Kombinasi dengan kurang dari lima toko terpantau tidak diberi vonis. Bukan karena angkanya tidak ada, tapi karena angka dari
          satu-dua toko tidak bisa membedakan harga wajar dari kebetulan.
        </p>
      </FooterLegal>
    </div>
  );
}
