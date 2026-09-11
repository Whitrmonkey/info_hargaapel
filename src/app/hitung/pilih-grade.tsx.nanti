"use client";

import { useState } from "react";

interface ComponentType {
  id: string;
  kode: string;
  nama: string;
  kategori_grade: string;
}

interface Grade {
  id: string;
  nama: string;
  kategori: string; // "mesin" untuk board_grades, kategori_grade part_grades untuk sisanya
}

// Select komponen dan select grade harus tampil sesuai satu sama lain (grade
// milik mesin beda tabel/arti dari grade part biasa) tanpa muatan JS di
// server -- satu-satunya bagian formulir /hitung yang perlu jadi client
// component, sisanya tetap form GET biasa.
export function PilihKomponenGrade({
  componentTypes,
  grades,
  defaultKomponen,
  defaultGrade,
}: {
  componentTypes: ComponentType[];
  grades: Grade[];
  defaultKomponen: string;
  defaultGrade: string;
}) {
  const [komponen, setKomponen] = useState(defaultKomponen);
  const aktif = componentTypes.find((c) => c.id === komponen);
  const gradeUntukKomponen = grades.filter((g) => g.kategori === (aktif?.kategori_grade ?? ""));

  return (
    <>
      <label className="block">
        <span className="mb-1.5 block text-sm font-medium">Apa yang mau dikerjakan</span>
        <select
          name="komponen"
          value={komponen}
          onChange={(e) => setKomponen(e.target.value)}
          required
          className="w-full rounded-lg border border-border bg-transparent p-3 text-base"
        >
          <option value="" disabled>
            Pilih komponen
          </option>
          {componentTypes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.kode === "mesin" ? "Ganti/benerin mesin" : `Ganti ${c.nama.toLowerCase()}`}
            </option>
          ))}
        </select>
      </label>

      <label className="block">
        <span className="mb-1.5 block text-sm font-medium">Pakai part / grade apa</span>
        <select
          name="grade"
          defaultValue={defaultGrade}
          required
          disabled={!aktif}
          className="w-full rounded-lg border border-border bg-transparent p-3 text-base disabled:opacity-50"
        >
          <option value="" disabled>
            {aktif ? "Pilih grade" : "Pilih komponen dulu"}
          </option>
          {gradeUntukKomponen.map((g) => (
            <option key={g.id} value={g.id}>
              {g.nama}
            </option>
          ))}
        </select>
      </label>
    </>
  );
}
