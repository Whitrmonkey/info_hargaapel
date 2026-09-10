import React, { useMemo, useState } from "react";

/*
  ============================================================
  hargaapel — pembanding harga Apple Jabodetabek
  Mockup UI. Data di bawah masih contoh.

  Prinsip yang dipakai di sini dan wajib dibawa ke versi produksi:
  1. Satu grup = model + varian + kondisi + garansi. Inter dan
     resmi tidak pernah dicampur.
  2. Vonis murah/mahal dihitung ke MEDIAN, bukan ke termurah.
  3. Sinyal (tahan/beli) WAJIB menampilkan alasannya.
  4. Observasi < 4 titik  ->  sinyal tidak ditampilkan sama sekali.
  5. Harga tidak pernah di-update. Setiap pengecekan = baris baru.
  ============================================================
*/

const HARI_INI = new Date("2026-09-09T00:00:00");
const MINGGU = 13; // 90 hari riwayat, dicek mingguan

const EVENTS = [
  { iso: "2026-09-09", label: "Rilis iPhone generasi baru", kena: ["iphone"] },
  { iso: "2026-11-11", label: "Harbolnas 11.11", kena: ["iphone", "ipad", "mac", "watch", "audio"] },
  { iso: "2026-12-12", label: "Harbolnas 12.12", kena: ["iphone", "ipad", "mac", "watch", "audio"] },
];

const LISTINGS = [
  { id: 1, kategori: "iphone", model: "iPhone 16 Pro Max", varian: "256GB", kondisi: "bnib", garansi: "ibox", toko: "iBox Grand Indonesia", tipe_toko: "resmi", area: "Jakarta Pusat", harga: 24499000, jam_lalu: 14 },
  { id: 2, kategori: "iphone", model: "iPhone 16 Pro Max", varian: "256GB", kondisi: "bnib", garansi: "ibox", toko: "Digimap Pondok Indah Mall", tipe_toko: "resmi", area: "Jakarta Selatan", harga: 24499000, jam_lalu: 20 },
  { id: 3, kategori: "iphone", model: "iPhone 16 Pro Max", varian: "256GB", kondisi: "bnib", garansi: "ibox", toko: "Eraspace Central Park", tipe_toko: "resmi", area: "Jakarta Barat", harga: 23799000, jam_lalu: 62 },
  { id: 4, kategori: "iphone", model: "iPhone 16 Pro Max", varian: "256GB", kondisi: "bnib", garansi: "inter", toko: "Kios ITC Roxy Mas lt.2", tipe_toko: "grey", area: "Jakarta Pusat", harga: 20900000, jam_lalu: 3 },
  { id: 5, kategori: "iphone", model: "iPhone 16 Pro Max", varian: "256GB", kondisi: "bnib", garansi: "inter", toko: "Tokopedia · Gadget Mangga Dua", tipe_toko: "marketplace", area: "Jakarta Utara", harga: 21350000, jam_lalu: 6 },
  { id: 6, kategori: "iphone", model: "iPhone 16 Pro Max", varian: "256GB", kondisi: "bnib", garansi: "inter", toko: "ITC Kuningan lt.1", tipe_toko: "grey", area: "Jakarta Selatan", harga: 22100000, jam_lalu: 96 },

  { id: 7, kategori: "iphone", model: "iPhone 16 Pro", varian: "128GB", kondisi: "bnib", garansi: "ibox", toko: "iBox Summarecon Bekasi", tipe_toko: "resmi", area: "Bekasi", harga: 19999000, jam_lalu: 18 },
  { id: 8, kategori: "iphone", model: "iPhone 16 Pro", varian: "128GB", kondisi: "bnib", garansi: "ibox", toko: "Infinite Living World Alam Sutera", tipe_toko: "resmi", area: "Tangerang", harga: 19999000, jam_lalu: 40 },
  { id: 9, kategori: "iphone", model: "iPhone 16 Pro", varian: "128GB", kondisi: "bnib", garansi: "inter", toko: "Kios ITC Roxy Mas lt.1", tipe_toko: "grey", area: "Jakarta Pusat", harga: 16850000, jam_lalu: 2 },
  { id: 10, kategori: "iphone", model: "iPhone 16 Pro", varian: "128GB", kondisi: "bnib", garansi: "inter", toko: "Tokopedia · Serpong Cell", tipe_toko: "marketplace", area: "Tangerang", harga: 17490000, jam_lalu: 5 },
  { id: 11, kategori: "iphone", model: "iPhone 16 Pro", varian: "128GB", kondisi: "second", garansi: "ibox", toko: "Roxy Mas · mulus 99%", tipe_toko: "grey", area: "Jakarta Pusat", harga: 15200000, jam_lalu: 2 },
  { id: 12, kategori: "iphone", model: "iPhone 16 Pro", varian: "128GB", kondisi: "second", garansi: "ibox", toko: "Margo City Depok", tipe_toko: "grey", area: "Depok", harga: 16400000, jam_lalu: 110 },
  { id: 44, kategori: "iphone", model: "iPhone 16 Pro", varian: "128GB", kondisi: "second", garansi: "ibox", toko: "Blok M Square lt.3", tipe_toko: "grey", area: "Jakarta Selatan", harga: 15850000, jam_lalu: 26 },

  { id: 13, kategori: "iphone", model: "iPhone 16", varian: "128GB", kondisi: "bnib", garansi: "ibox", toko: "iBox Botani Square", tipe_toko: "resmi", area: "Bogor", harga: 14999000, jam_lalu: 30 },
  { id: 14, kategori: "iphone", model: "iPhone 16", varian: "128GB", kondisi: "bnib", garansi: "ibox", toko: "Eraspace Margo City", tipe_toko: "resmi", area: "Depok", harga: 14499000, jam_lalu: 22 },
  { id: 15, kategori: "iphone", model: "iPhone 16", varian: "128GB", kondisi: "bnib", garansi: "inter", toko: "Kios ITC Roxy Mas lt.2", tipe_toko: "grey", area: "Jakarta Pusat", harga: 12400000, jam_lalu: 3 },
  { id: 16, kategori: "iphone", model: "iPhone 16", varian: "128GB", kondisi: "bnib", garansi: "inter", toko: "Shopee · Bekasi Gadget Store", tipe_toko: "marketplace", area: "Bekasi", harga: 12950000, jam_lalu: 7 },

  { id: 17, kategori: "iphone", model: "iPhone 15", varian: "128GB", kondisi: "second", garansi: "ibox", toko: "Roxy Mas · fullset 92%", tipe_toko: "grey", area: "Jakarta Pusat", harga: 8900000, jam_lalu: 4 },
  { id: 18, kategori: "iphone", model: "iPhone 15", varian: "128GB", kondisi: "second", garansi: "ibox", toko: "Blok M Square lt.3", tipe_toko: "grey", area: "Jakarta Selatan", harga: 9750000, jam_lalu: 34 },
  { id: 19, kategori: "iphone", model: "iPhone 15", varian: "128GB", kondisi: "second", garansi: "ibox", toko: "Perorangan · Tangerang Selatan", tipe_toko: "perorangan", area: "Tangerang", harga: 8450000, jam_lalu: 12 },
  { id: 20, kategori: "iphone", model: "iPhone 15", varian: "128GB", kondisi: "second", garansi: "ibox", toko: "Tokopedia · Depok Second Phone", tipe_toko: "marketplace", area: "Depok", harga: 10450000, jam_lalu: 80 },

  { id: 21, kategori: "iphone", model: "iPhone 14", varian: "128GB", kondisi: "second", garansi: "ibox", toko: "Roxy Mas · baterai 86%", tipe_toko: "grey", area: "Jakarta Pusat", harga: 6950000, jam_lalu: 5 },
  { id: 22, kategori: "iphone", model: "iPhone 14", varian: "128GB", kondisi: "second", garansi: "ibox", toko: "ITC Kuningan lt.2", tipe_toko: "grey", area: "Jakarta Selatan", harga: 7600000, jam_lalu: 48 },
  { id: 23, kategori: "iphone", model: "iPhone 14", varian: "128GB", kondisi: "second", garansi: "ibox", toko: "Mangga Dua Mall lt.4", tipe_toko: "grey", area: "Jakarta Utara", harga: 7250000, jam_lalu: 16 },

  { id: 24, kategori: "ipad", model: "iPad Air 11\" M3", varian: "128GB WiFi", kondisi: "bnib", garansi: "ibox", toko: "iBox Plaza Indonesia", tipe_toko: "resmi", area: "Jakarta Pusat", harga: 11499000, jam_lalu: 25 },
  { id: 25, kategori: "ipad", model: "iPad Air 11\" M3", varian: "128GB WiFi", kondisi: "bnib", garansi: "ibox", toko: "Digimap Summarecon Serpong", tipe_toko: "resmi", area: "Tangerang", harga: 11299000, jam_lalu: 44 },
  { id: 26, kategori: "ipad", model: "iPad Air 11\" M3", varian: "128GB WiFi", kondisi: "bnib", garansi: "inter", toko: "Kios ITC Roxy Mas lt.1", tipe_toko: "grey", area: "Jakarta Pusat", harga: 9600000, jam_lalu: 3 },
  { id: 27, kategori: "ipad", model: "iPad (11th gen)", varian: "128GB WiFi", kondisi: "bnib", garansi: "ibox", toko: "Eraspace Taman Anggrek", tipe_toko: "resmi", area: "Jakarta Barat", harga: 6499000, jam_lalu: 28 },
  { id: 28, kategori: "ipad", model: "iPad (11th gen)", varian: "128GB WiFi", kondisi: "bnib", garansi: "inter", toko: "Tokopedia · Roxy Digital", tipe_toko: "marketplace", area: "Jakarta Pusat", harga: 5450000, jam_lalu: 9 },

  { id: 29, kategori: "mac", model: "MacBook Air 13\" M4", varian: "16GB/256GB", kondisi: "bnib", garansi: "ibox", toko: "iBox Kota Kasablanka", tipe_toko: "resmi", area: "Jakarta Selatan", harga: 18999000, jam_lalu: 19 },
  { id: 30, kategori: "mac", model: "MacBook Air 13\" M4", varian: "16GB/256GB", kondisi: "bnib", garansi: "ibox", toko: "Story-i Central Park", tipe_toko: "resmi", area: "Jakarta Barat", harga: 18499000, jam_lalu: 70 },
  { id: 31, kategori: "mac", model: "MacBook Air 13\" M4", varian: "16GB/256GB", kondisi: "bnib", garansi: "inter", toko: "Kios ITC Roxy Mas lt.2", tipe_toko: "grey", area: "Jakarta Pusat", harga: 16200000, jam_lalu: 2 },
  { id: 32, kategori: "mac", model: "MacBook Air 13\" M4", varian: "16GB/256GB", kondisi: "second", garansi: "toko", toko: "Roxy Mas · cycle 62", tipe_toko: "grey", area: "Jakarta Pusat", harga: 14200000, jam_lalu: 6 },
  { id: 33, kategori: "mac", model: "MacBook Air 13\" M4", varian: "16GB/256GB", kondisi: "second", garansi: "toko", toko: "Tokopedia · Bekasi Macstore", tipe_toko: "marketplace", area: "Bekasi", harga: 15900000, jam_lalu: 52 },
  { id: 34, kategori: "mac", model: "MacBook Pro 14\" M4", varian: "16GB/512GB", kondisi: "bnib", garansi: "ibox", toko: "iBox Grand Indonesia", tipe_toko: "resmi", area: "Jakarta Pusat", harga: 29999000, jam_lalu: 14 },
  { id: 35, kategori: "mac", model: "MacBook Pro 14\" M4", varian: "16GB/512GB", kondisi: "bnib", garansi: "inter", toko: "Mangga Dua Mall lt.4", tipe_toko: "grey", area: "Jakarta Utara", harga: 25400000, jam_lalu: 4 },

  { id: 36, kategori: "watch", model: "Apple Watch Series 10", varian: "42mm GPS", kondisi: "bnib", garansi: "ibox", toko: "iBox Pondok Indah Mall", tipe_toko: "resmi", area: "Jakarta Selatan", harga: 6499000, jam_lalu: 27 },
  { id: 37, kategori: "watch", model: "Apple Watch Series 10", varian: "42mm GPS", kondisi: "bnib", garansi: "inter", toko: "Kios ITC Roxy Mas lt.1", tipe_toko: "grey", area: "Jakarta Pusat", harga: 5350000, jam_lalu: 3 },

  { id: 39, kategori: "audio", model: "AirPods Pro 3", varian: "USB-C", kondisi: "bnib", garansi: "ibox", toko: "iBox Central Park", tipe_toko: "resmi", area: "Jakarta Barat", harga: 4199000, jam_lalu: 21 },
  { id: 40, kategori: "audio", model: "AirPods Pro 3", varian: "USB-C", kondisi: "bnib", garansi: "inter", toko: "Kios ITC Roxy Mas lt.2", tipe_toko: "grey", area: "Jakarta Pusat", harga: 3350000, jam_lalu: 3 },
  { id: 41, kategori: "audio", model: "AirPods Pro 3", varian: "USB-C", kondisi: "bnib", garansi: "inter", toko: "Shopee · Tangerang Audio", tipe_toko: "marketplace", area: "Tangerang", harga: 3690000, jam_lalu: 8 },
  { id: 42, kategori: "audio", model: "AirPods 4", varian: "ANC", kondisi: "bnib", garansi: "ibox", toko: "Eraspace Summarecon Bekasi", tipe_toko: "resmi", area: "Bekasi", harga: 2999000, jam_lalu: 36 },
  { id: 43, kategori: "audio", model: "AirPods 4", varian: "ANC", kondisi: "bnib", garansi: "inter", toko: "Tokopedia · Roxy Digital", tipe_toko: "marketplace", area: "Jakarta Pusat", harga: 2450000, jam_lalu: 7 },
];

const KATEGORI = [
  { key: "all", label: "Semua" }, { key: "iphone", label: "iPhone" },
  { key: "ipad", label: "iPad" }, { key: "mac", label: "Mac" },
  { key: "watch", label: "Watch" }, { key: "audio", label: "Audio" },
];
const KONDISI = [
  { key: "all", label: "Semua kondisi" }, { key: "bnib", label: "Baru segel" },
  { key: "second", label: "Second" }, { key: "refurb", label: "Refurbished" },
];
const GARANSI = [
  { key: "all", label: "Semua garansi" }, { key: "ibox", label: "Garansi resmi" },
  { key: "inter", label: "Inter / non-resmi" }, { key: "toko", label: "Garansi toko" },
];
const AREA = ["Semua area", "Jakarta Pusat", "Jakarta Selatan", "Jakarta Barat",
  "Jakarta Utara", "Bogor", "Depok", "Tangerang", "Bekasi"];

const L_KONDISI = { bnib: "Baru segel", second: "Second", refurb: "Refurbished" };
const L_GARANSI = { ibox: "Garansi resmi", inter: "Inter", toko: "Garansi toko" };
const L_TOKO = { resmi: "Reseller resmi", grey: "Toko fisik", marketplace: "Marketplace", perorangan: "Perorangan" };

const rupiah = (n) => "Rp " + n.toLocaleString("id-ID");
const singkat = (n) => (n / 1e6 >= 10 ? (n / 1e6).toFixed(1) : (n / 1e6).toFixed(2)).replace(".", ",") + " jt";
const ribuan = (n) => {
  const a = Math.abs(n);
  if (a >= 1e6) return (a / 1e6).toFixed(1).replace(".", ",") + " jt";
  return Math.round(a / 1000) + " rb";
};
const median = (arr) => {
  const s = [...arr].sort((a, b) => a - b), m = s.length >> 1;
  return s.length % 2 ? s[m] : Math.round((s[m - 1] + s[m]) / 2);
};
const seedRand = (seed) => { let s = seed >>> 0; return () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296; };

function isoMinggu(i) {
  const d = new Date(HARI_INI);
  d.setDate(d.getDate() - (MINGGU - 1 - i) * 7);
  return d;
}

/* riwayat dibangun mundur dari harga sekarang.
   di produksi ini datang dari tabel price_observations, bukan digenerate. */
function riwayat(l) {
  const rnd = seedRand(l.id * 7919 + 13);
  const drift = l.kondisi !== "bnib" ? -0.0075 : l.garansi === "ibox" ? -0.0008 : 0.0028;
  const noise = l.garansi === "ibox" ? 0.0015 : 0.008;
  const out = new Array(MINGGU);
  let h = l.harga;
  out[MINGGU - 1] = h;
  for (let i = MINGGU - 2; i >= 0; i--) {
    h = h / (1 + drift + (rnd() - 0.5) * noise);
    out[i] = Math.round(h / 50000) * 50000;
  }
  return out;
}

function segarLabel(jam) {
  if (jam < 6) return { t: `${jam} jam lalu`, k: "baru" };
  if (jam < 48) return { t: `${Math.round(jam / 24) || 1} hari lalu`, k: "baru" };
  if (jam < 168) return { t: `${Math.round(jam / 24)} hari lalu`, k: "sedang" };
  return { t: `${Math.round(jam / 24)} hari lalu`, k: "basi" };
}

function bikinGrup(rows) {
  const map = new Map();
  for (const r of rows) {
    const k = `${r.model}|${r.varian}|${r.kondisi}|${r.garansi}`;
    if (!map.has(k)) map.set(k, []);
    map.get(k).push({ ...r, riwayat: riwayat(r) });
  }
  const out = [];
  for (const [k, items] of map) {
    if (items.length < 2) continue;
    const harga = items.map((i) => i.harga);
    const min = Math.min(...harga), max = Math.max(...harga), med = median(harga);
    const seri = [];
    for (let w = 0; w < MINGGU; w++) seri.push(median(items.map((i) => i.riwayat[w])));
    const med30 = seri[MINGGU - 5];
    const tren30 = (med - med30) / med30;
    out.push({
      key: k, model: items[0].model, varian: items[0].varian,
      kondisi: items[0].kondisi, garansi: items[0].garansi, kategori: items[0].kategori,
      min, max, med, seri, tren30, selisih: max - min, selisihPct: (max - min) / min,
      items: items.map((i) => ({
        ...i,
        delta: (i.harga - med) / med,
        posisi: max === min ? 0.5 : (i.harga - min) / (max - min),
        ubah: i.harga - i.riwayat[MINGGU - 5],
      })).sort((a, b) => a.harga - b.harga),
    });
  }
  return out;
}

const vonis = (d) => (d <= -0.06 ? "murah" : d >= 0.06 ? "mahal" : "wajar");

function sinyal(g) {
  const obs = g.items.length * MINGGU;
  if (g.items.length < 2 || MINGGU < 4)
    return { kode: "sepi", judul: "Data belum cukup", alasan: "Butuh minimal 4 kali pengecekan sebelum tren bisa dibaca.", dasar: [] };

  const dasar = [`${obs} pengecekan dari ${g.items.length} toko`, "90 hari terakhir"];
  const pct = (x) => Math.abs(Math.round(x * 100));

  const rilis = EVENTS.find((e) => e.kena.includes(g.kategori) && e.label.startsWith("Rilis"));
  if (rilis && g.kondisi !== "bnib") {
    const hari = Math.round((new Date(rilis.iso) - HARI_INI) / 864e5);
    if (hari >= -14 && hari <= 45)
      return {
        kode: "tahan", judul: "Tunggu dulu",
        alasan: `${rilis.label} baru saja jalan. Unit second biasanya ikut turun 8–12% dalam 30 hari setelah generasi baru masuk pasar, karena banyak orang lepas unit lama sekaligus.`,
        dasar: [...dasar, rilis.label],
      };
  }
  if (g.tren30 <= -0.03)
    return {
      kode: "tahan", judul: "Masih turun",
      alasan: `Harga pasaran turun ${pct(g.tren30)}% dalam 30 hari terakhir dan belum berhenti. Belum ada alasan buru-buru.`,
      dasar,
    };
  if (g.tren30 >= 0.025)
    return {
      kode: "beli", judul: "Cenderung naik",
      alasan: `Harga pasaran naik ${pct(g.tren30)}% dalam 30 hari terakhir. Unit inter mengikuti kurs, jadi kenaikan rupiah lemah biasanya diteruskan ke harga jual dalam 1–2 minggu.`,
      dasar,
    };
  const promo = EVENTS.filter((e) => e.kena.includes(g.kategori) && e.label.startsWith("Harbolnas"))
    .map((e) => ({ e, hari: Math.round((new Date(e.iso) - HARI_INI) / 864e5) }))
    .filter((x) => x.hari > 0 && x.hari <= 75)[0];
  if (promo)
    return {
      kode: "tahan", judul: `Tunggu ${promo.e.label.replace("Harbolnas ", "")}`,
      alasan: `Harga pasaran datar (${pct(g.tren30)}%) 30 hari terakhir, dan ${promo.e.label} tinggal ${promo.hari} hari lagi. Kanal marketplace biasanya potong harga di tanggal itu.`,
      dasar: [...dasar, promo.e.label],
    };
  return {
    kode: "netral", judul: "Harga stabil",
    alasan: `Pasaran bergerak ${pct(g.tren30)}% saja dalam 30 hari. Tidak ada tanda akan turun maupun naik.`,
    dasar,
  };
}

function Grafik({ seri }) {
  const w = 132, h = 34, p = 3;
  const lo = Math.min(...seri), hi = Math.max(...seri), rg = hi - lo || 1;
  const pts = seri.map((v, i) => {
    const x = p + (i / (seri.length - 1)) * (w - p * 2);
    const y = h - p - ((v - lo) / rg) * (h - p * 2);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  const [lx, ly] = pts[pts.length - 1].split(",");
  const naik = seri[seri.length - 1] >= seri[0];
  return (
    <svg className="ha-graf" viewBox={`0 0 ${w} ${h}`} width={w} height={h} role="img"
      aria-label={`Tren harga pasaran 90 hari, ${naik ? "naik" : "turun"}`}>
      <polyline points={pts.join(" ")} fill="none" strokeWidth="1.5"
        stroke={naik ? "var(--mahal)" : "var(--murah)"} strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={lx} cy={ly} r="2.6" fill={naik ? "var(--mahal)" : "var(--murah)"} />
    </svg>
  );
}

export default function HargaApel() {
  const [kategori, setKategori] = useState("all");
  const [kondisi, setKondisi] = useState("all");
  const [garansi, setGaransi] = useState("all");
  const [area, setArea] = useState("Semua area");
  const [cari, setCari] = useState("");
  const [urut, setUrut] = useState("selisih");
  const [buka, setBuka] = useState(null);

  const semua = useMemo(() => bikinGrup(LISTINGS), []);
  const sorotan = useMemo(() => [...semua].sort((a, b) => b.selisihPct - a.selisihPct)[0], [semua]);

  const grup = useMemo(() => {
    const q = cari.trim().toLowerCase();
    let rows = LISTINGS;
    if (kategori !== "all") rows = rows.filter((r) => r.kategori === kategori);
    if (kondisi !== "all") rows = rows.filter((r) => r.kondisi === kondisi);
    if (garansi !== "all") rows = rows.filter((r) => r.garansi === garansi);
    if (area !== "Semua area") rows = rows.filter((r) => r.area === area);
    if (q) rows = rows.filter((r) => (r.model + " " + r.varian + " " + r.toko).toLowerCase().includes(q));
    const g = bikinGrup(rows);
    if (urut === "selisih") g.sort((a, b) => b.selisihPct - a.selisihPct);
    if (urut === "turun") g.sort((a, b) => a.tren30 - b.tren30);
    if (urut === "murah") g.sort((a, b) => a.min - b.min);
    return g;
  }, [kategori, kondisi, garansi, area, cari, urut]);

  const totalToko = new Set(LISTINGS.map((l) => l.toko)).size;
  const terbaru = Math.min(...LISTINGS.map((l) => l.jam_lalu));

  return (
    <div className="ha-root">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,600;12..96,800&family=Archivo:wght@400;500;600;700&display=swap');
        .ha-root{
          --paper:#F7F6F3;--ink:#1B2430;--ink-2:#5A6472;--rule:#DCD9D1;--rule-2:#EAE8E2;
          --murah:#0B6E4F;--mahal:#A4302A;--wajar:#7A828E;--sorot:#F0EDE4;--live:#0B6E4F;
          background:var(--paper);color:var(--ink);font-family:'Archivo',ui-sans-serif,system-ui,sans-serif;
          font-variant-numeric:tabular-nums;min-height:100vh;-webkit-font-smoothing:antialiased;}
        .ha-root *{box-sizing:border-box;}
        .ha-wrap{max-width:920px;margin:0 auto;padding:0 20px 72px;}

        .ha-top{display:flex;justify-content:space-between;align-items:baseline;gap:16px;
          padding:20px 0 18px;border-bottom:1px solid var(--ink);flex-wrap:wrap;}
        .ha-logo{font-family:'Bricolage Grotesque',sans-serif;font-weight:800;font-size:22px;
          letter-spacing:-0.02em;line-height:1;}
        .ha-top-meta{font-size:12.5px;color:var(--ink-2);display:flex;align-items:center;gap:7px;}
        .ha-live{width:7px;height:7px;border-radius:50%;background:var(--live);
          animation:ha-nyala 2.4s ease-in-out infinite;}
        @keyframes ha-nyala{0%,100%{opacity:1}50%{opacity:.25}}

        .ha-sorot{padding:34px 0 30px;border-bottom:1px solid var(--rule);}
        .ha-kicker{font-size:13px;color:var(--ink-2);margin:0 0 10px;}
        .ha-judul{font-family:'Bricolage Grotesque',sans-serif;font-weight:800;
          font-size:clamp(28px,5.6vw,42px);line-height:1.02;letter-spacing:-0.03em;margin:0 0 4px;}
        .ha-sub{font-size:13.5px;color:var(--ink-2);margin:0 0 26px;}
        .ha-tangga{position:relative;height:3px;background:var(--ink);margin:44px 0 0;}
        .ha-titik{position:absolute;top:50%;width:11px;height:11px;border-radius:50%;
          background:var(--paper);border:3px solid var(--ink);transform:translate(-50%,-50%);}
        .ha-ujung{position:absolute;top:-38px;max-width:46%;}
        .ha-kiri{left:0}.ha-kanan{right:0;text-align:right}
        .ha-uh{font-family:'Bricolage Grotesque',sans-serif;font-weight:800;
          font-size:clamp(18px,3.4vw,26px);letter-spacing:-0.02em;line-height:1;display:block;}
        .ha-uh.murah{color:var(--murah)}.ha-uh.mahal{color:var(--mahal)}
        .ha-ut{font-size:12px;color:var(--ink-2);display:block;margin-top:5px;line-height:1.3;}
        .ha-selisih{margin-top:26px;font-size:14.5px;} .ha-selisih b{font-weight:700;}

        .ha-filter{position:sticky;top:0;z-index:5;background:var(--paper);padding:14px 0 12px;
          border-bottom:1px solid var(--rule);}
        .ha-baris{display:flex;gap:7px;flex-wrap:wrap;align-items:center;}
        .ha-baris+.ha-baris{margin-top:9px;}
        .ha-chip{font:inherit;font-size:13px;padding:6px 12px;border:1px solid var(--rule);
          background:transparent;color:var(--ink-2);border-radius:999px;cursor:pointer;}
        .ha-chip:hover{border-color:var(--ink);color:var(--ink);}
        .ha-chip[aria-pressed="true"]{background:var(--ink);border-color:var(--ink);color:var(--paper);}
        .ha-chip:focus-visible,.ha-input:focus-visible,.ha-select:focus-visible,
        .ha-buka:focus-visible{outline:2px solid var(--ink);outline-offset:2px;}
        .ha-input,.ha-select{font:inherit;font-size:13px;padding:6px 10px;border:1px solid var(--rule);
          background:transparent;color:var(--ink);border-radius:4px;}
        .ha-input{flex:1;min-width:150px;} .ha-input::placeholder{color:var(--ink-2);}

        .ha-grup{padding:26px 0 22px;border-bottom:1px solid var(--rule-2);}
        .ha-head{display:flex;justify-content:space-between;gap:14px;align-items:flex-start;
          flex-wrap:wrap;margin-bottom:14px;}
        .ha-nama{font-family:'Bricolage Grotesque',sans-serif;font-weight:600;font-size:19px;
          letter-spacing:-0.02em;margin:0 0 8px;}
        .ha-tags{display:flex;gap:6px;flex-wrap:wrap;}
        .ha-tag{font-size:11.5px;color:var(--ink-2);border:1px solid var(--rule);padding:2px 7px;border-radius:3px;}
        .ha-kanan-blok{display:flex;align-items:flex-start;gap:16px;}
        .ha-pasaran{text-align:right;font-size:12.5px;color:var(--ink-2);line-height:1.5;}
        .ha-pasaran strong{display:block;font-size:16px;color:var(--ink);font-weight:600;}
        .ha-graf{display:block;margin-top:2px;}

        .ha-sinyal{border-left:3px solid var(--ink);padding:2px 0 2px 13px;margin:0 0 16px;}
        .ha-sinyal.tahan{border-color:var(--mahal)} .ha-sinyal.beli{border-color:var(--murah)}
        .ha-sinyal.netral,.ha-sinyal.sepi{border-color:var(--rule)}
        .ha-sj{font-family:'Bricolage Grotesque',sans-serif;font-weight:600;font-size:14.5px;margin:0 0 4px;}
        .ha-sinyal.tahan .ha-sj{color:var(--mahal)} .ha-sinyal.beli .ha-sj{color:var(--murah)}
        .ha-sinyal.netral .ha-sj,.ha-sinyal.sepi .ha-sj{color:var(--ink-2)}
        .ha-sa{font-size:13px;line-height:1.55;margin:0;max-width:62ch;color:var(--ink);}
        .ha-sd{font-size:11.5px;color:var(--ink-2);margin:6px 0 0;}
        .ha-buka{font:inherit;font-size:12px;color:var(--ink-2);background:none;border:none;
          padding:5px 0 0;cursor:pointer;text-decoration:underline;text-underline-offset:3px;}
        .ha-buka:hover{color:var(--ink);}

        .ha-rows{display:flex;flex-direction:column;}
        .ha-row{display:grid;grid-template-columns:118px 1fr 96px;gap:14px;align-items:center;
          padding:11px 0;border-top:1px solid var(--rule-2);}
        .ha-row:first-child{border-top:1px solid var(--rule);}
        .ha-harga{font-weight:700;font-size:15px;letter-spacing:-0.01em;}
        .ha-harga.murah{color:var(--murah)} .ha-harga.mahal{color:var(--mahal)}
        .ha-ubah{display:block;font-size:11px;font-weight:400;color:var(--ink-2);margin-top:2px;}
        .ha-toko{font-size:13.5px;line-height:1.35;min-width:0;}
        .ha-meta{display:flex;align-items:center;gap:5px;font-size:11.5px;color:var(--ink-2);margin-top:3px;}
        .ha-dot{width:6px;height:6px;border-radius:50%;flex:none;}
        .ha-dot.baru{background:var(--murah)} .ha-dot.sedang{background:#C08A2E}
        .ha-dot.basi{background:var(--rule)}
        .ha-vonis{text-align:right;font-size:12px;font-weight:600;white-space:nowrap;}
        .ha-vonis.murah{color:var(--murah)} .ha-vonis.mahal{color:var(--mahal)}
        .ha-vonis.wajar{color:var(--wajar);font-weight:400;}
        .ha-bar{grid-column:1/-1;height:4px;background:var(--rule-2);position:relative;margin-top:2px;}
        .ha-isi{position:absolute;left:0;top:0;bottom:0;background:var(--ink);}
        .ha-isi.murah{background:var(--murah)} .ha-isi.mahal{background:var(--mahal)}

        .ha-kosong{padding:60px 0;text-align:center;}
        .ha-kosong p{font-size:15px;margin:0 0 6px;} .ha-kosong small{font-size:13px;color:var(--ink-2);}
        .ha-kaki{padding:28px 0 0;font-size:12.5px;color:var(--ink-2);line-height:1.65;}
        .ha-kaki p{margin:0 0 9px;max-width:62ch;}
        .ha-catatan{background:var(--sorot);border:1px solid var(--rule);padding:14px 16px;
          margin-top:18px;border-radius:4px;font-size:12.5px;line-height:1.6;max-width:62ch;}

        @media (max-width:600px){
          .ha-row{grid-template-columns:112px 1fr;row-gap:4px;}
          .ha-vonis{grid-column:2;text-align:left;font-size:11.5px;}
          .ha-pasaran{text-align:left;} .ha-kanan-blok{flex-direction:column-reverse;gap:8px;}
          .ha-tangga{margin-top:52px;} .ha-ujung{max-width:49%;}
        }
        @media (prefers-reduced-motion:reduce){.ha-root *{animation:none!important;transition:none!important;}}
      `}</style>

      <div className="ha-wrap">
        <header className="ha-top">
          <div className="ha-logo">hargaapel</div>
          <div className="ha-top-meta">
            <span className="ha-live" aria-hidden="true" />
            {LISTINGS.length} penawaran dari {totalToko} toko · update terakhir {terbaru} jam lalu
          </div>
        </header>

        {sorotan && (
          <section className="ha-sorot">
            <p className="ha-kicker">Selisih terbesar hari ini</p>
            <h1 className="ha-judul">{sorotan.model} {sorotan.varian}</h1>
            <p className="ha-sub">
              {L_KONDISI[sorotan.kondisi]}, {L_GARANSI[sorotan.garansi]} — dipantau di {sorotan.items.length} toko
            </p>
            <div className="ha-tangga">
              <div className="ha-ujung ha-kiri">
                <span className="ha-uh murah">{rupiah(sorotan.min)}</span>
                <span className="ha-ut">{sorotan.items[0].toko}</span>
              </div>
              <div className="ha-ujung ha-kanan">
                <span className="ha-uh mahal">{rupiah(sorotan.max)}</span>
                <span className="ha-ut">{sorotan.items[sorotan.items.length - 1].toko}</span>
              </div>
              {sorotan.items.map((i) => (
                <span key={i.id} className="ha-titik" style={{ left: `${i.posisi * 100}%` }} />
              ))}
            </div>
            <p className="ha-selisih">
              Beda <b>{rupiah(sorotan.selisih)}</b> ({Math.round(sorotan.selisihPct * 100)}%) untuk barang
              yang sama. Harga pasarannya {rupiah(sorotan.med)}.
            </p>
          </section>
        )}

        <div className="ha-filter">
          <div className="ha-baris">
            {KATEGORI.map((k) => (
              <button key={k.key} className="ha-chip" aria-pressed={kategori === k.key}
                onClick={() => setKategori(k.key)}>{k.label}</button>))}
          </div>
          <div className="ha-baris">
            {KONDISI.map((k) => (
              <button key={k.key} className="ha-chip" aria-pressed={kondisi === k.key}
                onClick={() => setKondisi(k.key)}>{k.label}</button>))}
          </div>
          <div className="ha-baris">
            {GARANSI.map((k) => (
              <button key={k.key} className="ha-chip" aria-pressed={garansi === k.key}
                onClick={() => setGaransi(k.key)}>{k.label}</button>))}
          </div>
          <div className="ha-baris">
            <input className="ha-input" value={cari} onChange={(e) => setCari(e.target.value)}
              placeholder="Cari model atau nama toko" aria-label="Cari model atau nama toko" />
            <select className="ha-select" value={area} onChange={(e) => setArea(e.target.value)} aria-label="Pilih area">
              {AREA.map((a) => <option key={a}>{a}</option>)}
            </select>
            <select className="ha-select" value={urut} onChange={(e) => setUrut(e.target.value)} aria-label="Urutkan">
              <option value="selisih">Selisih terbesar</option>
              <option value="turun">Paling banyak turun</option>
              <option value="murah">Termurah dulu</option>
            </select>
          </div>
        </div>

        {grup.length === 0 ? (
          <div className="ha-kosong">
            <p>Belum ada barang yang bisa dibandingkan di filter ini.</p>
            <small>Perbandingan butuh minimal dua toko untuk barang yang sama. Longgarkan filternya.</small>
          </div>
        ) : grup.map((g) => {
          const s = sinyal(g);
          const arah = g.tren30 <= -0.005 ? "turun" : g.tren30 >= 0.005 ? "naik" : "datar";
          return (
            <section className="ha-grup" key={g.key}>
              <div className="ha-head">
                <div>
                  <h2 className="ha-nama">{g.model} {g.varian}</h2>
                  <div className="ha-tags">
                    <span className="ha-tag">{L_KONDISI[g.kondisi]}</span>
                    <span className="ha-tag">{L_GARANSI[g.garansi]}</span>
                    <span className="ha-tag">{g.items.length} toko</span>
                  </div>
                </div>
                <div className="ha-kanan-blok">
                  <div className="ha-pasaran">
                    harga pasaran
                    <strong>{rupiah(g.med)}</strong>
                    {arah === "datar" ? "datar" : `${arah} ${Math.abs(Math.round(g.tren30 * 100))}%`} dalam 30 hari
                  </div>
                  <Grafik seri={g.seri} />
                </div>
              </div>

              <div className={`ha-sinyal ${s.kode}`}>
                <p className="ha-sj">{s.judul}</p>
                <p className="ha-sa">{s.alasan}</p>
                {buka === g.key && s.dasar.length > 0 && (
                  <p className="ha-sd">Dihitung dari {s.dasar.join(", ")}. Bukan jaminan harga.</p>
                )}
                {s.dasar.length > 0 && (
                  <button className="ha-buka" onClick={() => setBuka(buka === g.key ? null : g.key)}>
                    {buka === g.key ? "Tutup dasar hitungan" : "Lihat dasar hitungan"}
                  </button>
                )}
              </div>

              <div className="ha-rows">
                {g.items.map((i) => {
                  const v = vonis(i.delta), pct = Math.round(i.delta * 100);
                  const sg = segarLabel(i.jam_lalu);
                  return (
                    <div className="ha-row" key={i.id}>
                      <div className={`ha-harga ${v}`}>
                        {rupiah(i.harga)}
                        <span className="ha-ubah">
                          {i.ubah === 0 ? "tetap 30 hari" : `${i.ubah < 0 ? "−" : "+"}${ribuan(i.ubah)} / 30 hari`}
                        </span>
                      </div>
                      <div className="ha-toko">
                        {i.toko}
                        <span className="ha-meta">
                          <span className={`ha-dot ${sg.k}`} aria-hidden="true" />
                          {i.area} · {L_TOKO[i.tipe_toko]} · dicek {sg.t}
                        </span>
                      </div>
                      <div className={`ha-vonis ${v}`}>
                        {v === "wajar" ? "wajar" : `${pct > 0 ? "+" : ""}${pct}% ${v}`}
                      </div>
                      <div className="ha-bar">
                        <div className={`ha-isi ${v}`} style={{ width: `${Math.max(i.posisi * 100, 1.5)}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}

        <footer className="ha-kaki">
          <p>
            Harga pasaran adalah nilai tengah semua penawaran untuk barang yang benar-benar sebanding:
            model, varian, kondisi, dan status garansi yang sama. Unit inter dan unit garansi resmi
            tidak pernah dicampur dalam satu perbandingan.
          </p>
          <p>
            Sinyal tunggu dan beli disusun dari kalender rilis Apple, pergerakan kurs, jadwal Harbolnas,
            dan tren harga 30 hari. Semuanya aturan yang bisa dibaca, bukan tebakan model. Titik hijau
            berarti harga dicek kurang dari 2 hari lalu, kuning kurang dari seminggu, abu lebih lama.
          </p>
          <div className="ha-catatan">
            Angka di halaman ini masih data contoh untuk menguji tampilan. Riwayat harganya digenerate,
            bukan hasil pantauan. Ganti dengan data asli sebelum dipublikasikan.
          </div>
        </footer>
      </div>
    </div>
  );
}
