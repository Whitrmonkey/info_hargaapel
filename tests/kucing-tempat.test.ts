import { readFileSync } from "node:fs";
import { execSync } from "node:child_process";
import { describe, expect, it } from "vitest";

// Kucing punya pekerjaan, bukan hiasan. Ia muncul HANYA di keadaan kosong,
// hasil nihil, 404, halaman galat, dan pesan data belum cukup.
//
// Ia TIDAK PERNAH muncul di dekat harga, vonis, tangga harga, framewall,
// atau linimasa. Di sana kelucuan mengurangi kepercayaan, dan kepercayaan
// adalah satu-satunya modal situs ini. Test ini yang menjaganya, karena
// aturan seperti ini paling gampang dilanggar tanpa sengaja.

function berkasPemakai(): string[] {
  const keluar = execSync('grep -rl "components/kucing" src --include="*.tsx" || true', { encoding: "utf8" });
  return keluar
    .split("\n")
    .map((b) => b.trim())
    .filter((b) => b.length > 0 && !b.includes("components/kucing/"));
}

const DILARANG = [
  "components/framewall",
  "components/linimasa",
  "components/pita-ukur",
  "data/tangga-harga",
];

describe("tempat kemunculan kucing", () => {
  it("tidak pernah diimpor oleh komponen harga, vonis, tangga, framewall, atau linimasa", () => {
    for (const larangan of DILARANG) {
      const isi = readFileSync(
        larangan.startsWith("components/") ? `src/${larangan}.tsx` : `src/lib/${larangan}.ts`,
        "utf8",
      );
      expect(isi).not.toContain("components/kucing");
    }
  });

  it("hanya dipakai di berkas yang memang punya keadaan kosong atau galat", () => {
    const diizinkan = [
      "src/app/cek-harga/cek-client.tsx", // keadaan kosong dan data belum cukup
      "src/app/not-found.tsx", // 404
      "src/app/error.tsx", // halaman galat
    ];
    for (const berkas of berkasPemakai()) {
      expect(diizinkan, `kucing dipakai di tempat yang belum diizinkan: ${berkas}`).toContain(berkas);
    }
  });

  it("halaman produk tidak pernah memanggil kucing", () => {
    const isi = readFileSync("src/app/p/[slug]/produk-client.tsx", "utf8");
    expect(isi).not.toContain("kucing");
    expect(isi).not.toContain("Kucing");
  });
});
