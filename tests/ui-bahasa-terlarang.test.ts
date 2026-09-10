import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

// Aturan keras #7: kata-kata ini tidak boleh muncul di UI mana pun, device
// maupun servis. Frasa dua-kata dicek sebagai frasa utuh supaya kata sehari-
// hari yang legal (mis. "standar" sebagai nama grade, "resmi" pada "garansi
// resmi") tidak ikut kena.
const KATA_TERLARANG = [
  "prediksi",
  "ramalan",
  "dijamin",
  "standar harga",
  "patokan",
  "kiblat",
  "harga resmi",
];

const SRC_DIR = join(__dirname, "..", "src");

function semuaFileSumber(dir: string): string[] {
  const hasil: string[] = [];
  for (const nama of readdirSync(dir)) {
    const path = join(dir, nama);
    const s = statSync(path);
    if (s.isDirectory()) {
      hasil.push(...semuaFileSumber(path));
      continue;
    }
    if (!/\.(ts|tsx)$/.test(nama)) continue;
    if (/\.test\.(ts|tsx)$/.test(nama)) continue;
    if (nama === "database.types.ts") continue; // digenerate, bukan salinan UI
    hasil.push(path);
  }
  return hasil;
}

describe("bahasa UI: kata terlarang aturan 7", () => {
  const file = semuaFileSumber(SRC_DIR);

  it("menemukan setidaknya satu file sumber untuk dipindai", () => {
    expect(file.length).toBeGreaterThan(0);
  });

  for (const path of file) {
    const relatif = path.slice(SRC_DIR.length + 1);
    it(`${relatif} bebas dari kata terlarang`, () => {
      const isi = readFileSync(path, "utf8").toLowerCase();
      const ditemukan = KATA_TERLARANG.filter((kata) => isi.includes(kata));
      expect(ditemukan, `ditemukan kata terlarang: ${ditemukan.join(", ")}`).toEqual([]);
    });
  }
});
