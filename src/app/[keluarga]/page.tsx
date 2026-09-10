import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ambilIndeksSeri } from "@/lib/data/indeks-seri";
import { KELUARGA } from "@/lib/keluarga";
import { IndeksSeriClient } from "./indeks-seri-client";

export async function generateMetadata({ params }: { params: Promise<{ keluarga: string }> }): Promise<Metadata> {
  const { keluarga } = await params;
  const k = KELUARGA[keluarga];
  if (!k) return {};
  return {
    title: `Harga bekas ${k.judul} di Jabodetabek — hargaapel`,
    description: `Rentang harga bekas jalur resmi tiap generasi ${k.judul}, berikut laju penurunannya per bulan.`,
  };
}

export default async function KeluargaPage({ params }: { params: Promise<{ keluarga: string }> }) {
  const { keluarga } = await params;
  const k = KELUARGA[keluarga];
  // Rute hanya sah untuk keluarga yang terdaftar; selain itu 404, bukan
  // halaman kosong yang menyerap seluruh path satu segmen.
  if (!k) notFound();

  const { kartu, maks } = await ambilIndeksSeri(k.kategori);

  return <IndeksSeriClient judul={k.judul} kategori={k.kategori} kartu={kartu} maks={maks} />;
}
