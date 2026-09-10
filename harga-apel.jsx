import React, { useCallback, useMemo, useState } from "react";

/* ============================================================
   hargaapel — halaman produk

   Struktur berkas:
     1. KONFIGURASI    angka dan ambang yang boleh diubah
     2. DATA           contoh; di produksi datang dari Supabase
     3. UTILITAS       fungsi murni, tanpa React
     4. ILUSTRASI      SVG. geometri dikelompokkan per tampilan
                       supaya gampang disetel manual
     5. BAGIAN         komponen kecil per blok halaman
     6. HALAMAN        perakitan

   Aturan yang dijaga di sini:
   - Nilai komponen disimpan sebagai RASIO terhadap harga unit,
     bukan rupiah. Rupiah dihitung saat render, jadi ikut segar
     ketika harga unit bergerak.
   - Penjual tidak pernah disebut namanya. Hanya area dan jumlah.
     Kredibilitas dibawa oleh ukuran sampel dan kesegaran data.
   - Warna tidak memengaruhi harga. Ia hanya informasi rilis.
   - Ilustrasi tanpa warna, memakai var(--ink), jadi satu aset
     melayani mode terang dan gelap.
   ============================================================ */

/* ---------- 1. KONFIGURASI ---------- */

const CFG = {
  /* dasar semua rasio: unit second grade standar, kapasitas terkecil */
  hargaDasar: 7_800_000,
  pembulatan: 50_000,
  rasioMesinPenuh: 0.31,
  bulanRiwayat: { mulai: "2022-09-01", kini: "2026-09-01" },
  benih: 20220916,
};

/* ---------- 2. DATA ---------- */

const PRODUK = {
  nama: "iPhone 14",
  keluarga: "iphone",
  rilisTeks: "16 September 2022",
  umurTeks: "4 tahun di pasar",
  hargaRilis: 15_999_000,
  ringkas:
    "Generasi terakhir sebelum Apple pindah ke USB-C. Masih dapat update iOS, part-nya melimpah, dan harganya sudah lewat fase turun cepat.",
};

/* rona adalah perkiraan visual, bukan kode warna resmi Apple.
   tidak ada delta harga: di pasar bekas Jakarta warna tidak
   menggerakkan harga, hanya kecepatan laku. */
const WARNA = [
  { kode: "midnight", nama: "Midnight", hex: "#1F2124" },
  { kode: "starlight", nama: "Starlight", hex: "#F0EBE3" },
  { kode: "blue", nama: "Blue", hex: "#A6BACE" },
  { kode: "purple", nama: "Purple", hex: "#DEDAE8" },
  { kode: "red", nama: "(PRODUCT)RED", hex: "#B3262F" },
  { kode: "yellow", nama: "Yellow", hex: "#F4E4A4", catatan: "menyusul Maret 2023" },
];

/* kapasitas MEMANG menggerakkan harga, dan selisihnya jauh
   lebih kecil di pasar bekas daripada di pasar baru. */
const STORAGE = [
  { size: "128GB", delta: 0 },
  { size: "256GB", delta: 850_000 },
  { size: "512GB", delta: 1_900_000 },
];

/* tangga diurutkan dari termahal ke termurah.
   naikDari menjelaskan apa yang dibeli saat naik satu anak tangga
   dari baris di bawahnya. selalu terisi, tidak ada pencarian pasangan. */
const TANGGA = [
  {
    kode: "rilis", label: "Harga rilis resmi", sub: "September 2022",
    harga: 15_999_000, gaya: "arsip",
    naikDari: "Ini jangkar sejarah, bukan harga yang bisa dibeli hari ini.",
  },
  {
    kode: "baru_resmi", label: "Baru, garansi resmi", sub: "sudah tidak diproduksi",
    harga: null,
  },
  {
    kode: "baru_inter", label: "Baru, unit inter", sub: "3 toko",
    harga: 11_200_000, gaya: "inter",
    naikDari:
      "Belum pernah dipakai, tapi garansinya toko dan bukan resmi. Yang kamu bayar di sini adalah segel, bukan jaminan purna jual.",
  },
  {
    kode: "mulus", label: "Second, mulus", sub: "7 toko", harga: 9_400_000,
    naikDari:
      "Selisih ini murni kondisi fisik. Fungsinya sama persis dengan standar.",
  },
  {
    kode: "standar", label: "Second, standar", sub: "11 toko", harga: 7_800_000,
    naikDari:
      "Ekonomis biasanya sudah ganti layar aftermarket atau baterainya di bawah 80%. Hitung biaya itu dulu sebelum memilih yang lebih murah.",
  },
  {
    kode: "ekonomis", label: "Second, ekonomis", sub: "6 toko", harga: 6_950_000,
    naikDari:
      "Toko memberi garansi dan sudah mengecek unitnya. Perorangan tidak. Selisih ini adalah harga rasa aman.",
  },
  {
    kode: "perorangan", label: "Perorangan", sub: "rata-rata iklan minggu ini",
    harga: 6_400_000,
    naikDari:
      "Di atas lantai pasar. Penjual perorangan menahan harga sedikit di atas tawaran buyback karena selisih itulah untungnya menjual sendiri.",
  },
  {
    kode: "buyback", label: "Ditawar platform buyback", sub: "3 platform",
    harga: 5_600_000, gaya: "lantai",
    naikDari:
      "Lantai pasar. Tidak ada yang menjual di bawah angka ini, karena dia tinggal menjual ke platform buyback.",
  },
];

const KOMPONEN = [
  {
    id: "layar", nama: "Layar", zona: "screen", tampak: "depan",
    rasio: 0.16, penjual: 9,
    ket: "Ori copotan. Aftermarket soft OLED sekitar setengahnya, dan itu selisih yang paling sering tidak disebutkan saat menawar.",
  },
  {
    id: "kamera_depan", nama: "Kamera depan dan Face ID", zona: "notch", tampak: "depan",
    rasio: 0.05, penjual: 4,
    ket: "Modulnya berpasangan dengan mesin sejak pabrik. Diambil dari unit lain berarti Face ID mati permanen.",
  },
  {
    id: "tombol", nama: "Set tombol", zona: "buttons", tampak: "depan",
    rasio: 0.02, penjual: 5,
    ket: "Volume, power, dan saklar bisu dijual sebagai satu flexible.",
  },
  {
    id: "backglass", nama: "Kaca belakang", zona: "glass", tampak: "belakang",
    rasio: 0.09, penjual: 7,
    ket: "Termasuk frame. Kalau hanya kacanya, jauh lebih murah tapi pengerjaannya berisiko merusak antena.",
  },
  {
    id: "kamera_belakang", nama: "Kamera belakang", zona: "camera", tampak: "belakang",
    rasio: 0.07, penjual: 6,
    ket: "Dijual sepasang. Terpisah ada, tapi jarang dan tidak selalu lebih murah.",
  },
  {
    id: "baterai", nama: "Baterai", zona: "battery", tampak: "belakang",
    rasio: 0.06, penjual: 12,
    ket: "Service pack. Aftermarket sekitar sepertiganya, dan biasanya tidak menampilkan kesehatan baterai di iOS.",
  },
];

const GRADE_MESIN = [
  { kode: "normal", nama: "Normal", rasio: 0.31 },
  { kode: "minus_faceid", nama: "Minus Face ID", rasio: 0.24 },
  { kode: "minus_touch", nama: "Minus touch", rasio: 0.21 },
  { kode: "minus_sinyal", nama: "Minus sinyal", rasio: 0.19 },
  { kode: "minus_multi", nama: "Minus lebih dari satu", rasio: 0.14 },
  { kode: "matot", nama: "Mati total", rasio: 0.08 },
];

/* zona mesin: diagram fungsi, bukan tata letak papan sebenarnya.
   x, y, w, h dalam sistem koordinat MESIN.viewBox. */
const ZONA_MESIN = [
  {
    id: "konektor_layar", nama: "Konektor layar", sisi: "depan",
    x: 24, y: 30, w: 78, h: 22, grade: "minus_touch", gejala: "layar tidak sentuh, bergaris, atau mati",
    ket: "Paling sering rusak karena bongkar pasang layar yang kasar, bukan karena pemakaian.",
  },
  {
    id: "soc", nama: "SoC A15", sisi: "depan",
    x: 24, y: 62, w: 62, h: 46, grade: "matot", gejala: "mati total",
    ket: "Kalau ini yang kena, mesinnya praktis tinggal jadi sumber part. Hampir tidak ada yang memperbaikinya.",
  },
  {
    id: "nand", nama: "NAND", sisi: "depan",
    x: 24, y: 116, w: 40, h: 28, grade: "minus_multi", gejala: "bootloop, data tidak terbaca",
    ket: "Bisa diganti dan dinaikkan kapasitasnya, tapi datanya hilang. Kalau datanya yang penting, itu pekerjaan lain dengan harga lain lagi.",
  },
  {
    id: "faceid", nama: "Jalur Face ID", sisi: "depan",
    x: 72, y: 116, w: 30, h: 28, grade: "minus_faceid", gejala: "Face ID mati",
    ket: "Kerusakan paling umum sekaligus paling sering tidak disebutkan penjual. Selalu uji Face ID sebelum bayar.",
  },
  {
    id: "baseband", nama: "Baseband", sisi: "belakang",
    x: 24, y: 58, w: 58, h: 40, grade: "minus_sinyal", gejala: "tidak dapat sinyal",
    ket: "Bisa diselamatkan dengan reball, tapi tidak semua teknisi sanggup. Ini pekerjaan microsolder kelas menengah.",
  },
  {
    id: "pmic", nama: "PMIC", sisi: "belakang",
    x: 24, y: 106, w: 40, h: 32, grade: "minus_multi", gejala: "panas berlebih, mati sendiri",
    ket: "Gejalanya mirip baterai rusak, jadi sering salah didiagnosa dan pemilik membayar baterai baru dua kali.",
  },
  {
    id: "tristar", nama: "IC pengisian daya", sisi: "belakang",
    x: 72, y: 106, w: 30, h: 32, grade: "normal", gejala: "tidak mengisi daya",
    ket: "Paling sering rusak, paling murah diperbaiki. Setelah diganti mesinnya kembali normal penuh, jadi nilainya pulih.",
  },
  {
    id: "audio", nama: "IC audio", sisi: "belakang",
    x: 24, y: 148, w: 78, h: 24, grade: "minus_multi", gejala: "mic mati saat menelepon",
    ket: "Gejala khasnya suara hilang hanya di panggilan, sementara rekaman suara tetap normal.",
  },
];

/* ---------- 3. UTILITAS ---------- */

const rupiah = (n) => "Rp " + n.toLocaleString("id-ID");

const jt = (n) => {
  const v = n / 1e6;
  return (v >= 10 ? v.toFixed(1) : v.toFixed(2)).replace(".", ",") + " jt";
};

const bulat = (n) => Math.round(n / CFG.pembulatan) * CFG.pembulatan;

const persen = (r) => Math.round(r * 100);

const dariRasio = (rasio) => bulat(CFG.hargaDasar * rasio);

const acak = (benih) => {
  let s = benih >>> 0;
  return () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296;
};

const selisihBulan = (a, b) =>
  (b.getFullYear() - a.getFullYear()) * 12 + (b.getMonth() - a.getMonth());

/* riwayat bulanan sejak rilis.
   di produksi ini datang dari materialized view pasaran_harian. */
function bangunRiwayat() {
  const mulai = new Date(CFG.bulanRiwayat.mulai);
  const kini = new Date(CFG.bulanRiwayat.kini);
  const n = selisihBulan(mulai, kini);
  const rnd = acak(CFG.benih);
  const titik = [];
  let harga = PRODUK.hargaRilis;

  for (let i = 0; i <= n; i++) {
    const d = new Date(mulai);
    d.setMonth(d.getMonth() + i);
    const september = d.getMonth() === 8 && i > 0;
    const umur = i / 12;
    const laju = september ? 0.072 : umur < 1 ? 0.021 : umur < 2 ? 0.016 : 0.011;
    harga *= 1 - laju - (rnd() - 0.5) * 0.004;
    titik.push({ i, september, harga: bulat(harga) });
  }
  titik[titik.length - 1].harga = CFG.hargaDasar;
  return titik;
}

/* ---------- 4. ILUSTRASI ----------
   Geometri sengaja ditulis sebagai konstanta bernama di atas tiap
   komponen supaya bisa disetel manual tanpa menelusuri JSX. */

const TELEPON = { W: 120, H: 240, r: 19, bodi: { x: 4, y: 4, w: 112, h: 232 } };
const MESIN = { W: 132, H: 200 };

function Hotspot({ id, nama, aktif, onPilih, ...rect }) {
  const pilih = () => onPilih(aktif ? null : id);
  return (
    <rect
      {...rect}
      rx="4"
      className={`ilo-hot${aktif ? " on" : ""}`}
      role="button"
      aria-label={nama}
      aria-pressed={aktif}
      tabIndex={0}
      onClick={pilih}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          pilih();
        }
      }}
    />
  );
}

function TampakDepan({ aktif, onPilih }) {
  const { W, H, bodi, r } = TELEPON;
  const notch = { x: 38, w: 44, h: 15 };
  const layar = { x: 10, y: 10, w: 100, h: 220, r: 14 };
  const tombolKiri = [
    { y: 46, h: 11 },   // saklar bisu
    { y: 66, h: 24 },   // volume naik
    { y: 96, h: 24 },   // volume turun
  ];

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="ilo" aria-label="Tampilan depan">
      <rect {...{ x: bodi.x, y: bodi.y, width: bodi.w, height: bodi.h }} rx={r} className="ilo-body" />
      <rect x={layar.x} y={layar.y} width={layar.w} height={layar.h} rx={layar.r} className="ilo-in" />
      <path
        d={`M${notch.x} 10 h${notch.w} v8 a7 7 0 0 1 -7 7 h-${notch.w - 14} a7 7 0 0 1 -7 -7 z`}
        className="ilo-solid"
      />
      <circle cx="71" cy="16" r="2.4" className="ilo-hole" />
      <rect x="47" y="14.5" width="13" height="3" rx="1.5" className="ilo-hole" />
      {tombolKiri.map((t) => (
        <rect key={t.y} x="1.5" y={t.y} width="3" height={t.h} rx="1.5" className="ilo-solid" />
      ))}
      <rect x="115.5" y="76" width="3" height="38" rx="1.5" className="ilo-solid" />

      <Hotspot id="screen" nama="Layar" aktif={aktif === "screen"} onPilih={onPilih}
        x={12} y={28} width={96} height={200} />
      <Hotspot id="notch" nama="Kamera depan dan Face ID" aktif={aktif === "notch"} onPilih={onPilih}
        x={36} y={8} width={48} height={19} />
      <Hotspot id="buttons" nama="Set tombol" aktif={aktif === "buttons"} onPilih={onPilih}
        x={-1} y={44} width={8} height={78} />
    </svg>
  );
}

function TampakBelakang({ aktif, onPilih }) {
  const { W, H, bodi, r } = TELEPON;
  const modul = { x: 14, y: 14, s: 46, r: 14 };
  const lensa = [
    { cx: 28, cy: 28 },
    { cx: 46, cy: 46 },
  ];
  const magsafe = { cx: 60, cy: 124, luar: 23, dalam: 15 };

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="ilo" aria-label="Tampilan belakang">
      <rect {...{ x: bodi.x, y: bodi.y, width: bodi.w, height: bodi.h }} rx={r} className="ilo-body" />
      <rect x={modul.x} y={modul.y} width={modul.s} height={modul.s} rx={modul.r} className="ilo-in" />
      {lensa.map((l) => (
        <g key={l.cx}>
          <circle cx={l.cx} cy={l.cy} r="8.5" className="ilo-lens" />
          <circle cx={l.cx} cy={l.cy} r="4" className="ilo-lens" />
        </g>
      ))}
      <circle cx="46.5" cy="25" r="3.4" className="ilo-lens" />
      <circle cx={magsafe.cx} cy={magsafe.cy} r={magsafe.luar} className="ilo-dash" />
      <circle cx={magsafe.cx} cy={magsafe.cy} r={magsafe.dalam} className="ilo-dash" />

      <Hotspot id="camera" nama="Kamera belakang" aktif={aktif === "camera"} onPilih={onPilih}
        x={12} y={12} width={50} height={50} />
      <Hotspot id="battery" nama="Baterai" aktif={aktif === "battery"} onPilih={onPilih}
        x={22} y={78} width={76} height={92} />
      <Hotspot id="glass" nama="Kaca belakang" aktif={aktif === "glass"} onPilih={onPilih}
        x={8} y={176} width={104} height={56} />
    </svg>
  );
}

function TampakMesin({ sisi, aktif, onPilih }) {
  const zona = ZONA_MESIN.filter((z) => z.sisi === sisi);
  const papan =
    "M8 6 h110 a6 6 0 0 1 6 6 v172 a6 6 0 0 1 -6 6 h-88 a6 6 0 0 1 -6 -6 v-42 h-16 a6 6 0 0 1 -6 -6 v-124 a6 6 0 0 1 6 -6 z";

  return (
    <svg viewBox={`0 0 ${MESIN.W} ${MESIN.H}`} className="ilo"
      aria-label={`Skema fungsi mesin tampak ${sisi}`}>
      <path d={papan} className="ilo-body" />
      {zona.map((z) => (
        <g key={z.id}>
          <rect x={z.x} y={z.y} width={z.w} height={z.h} rx="3" className="ilo-zone" />
          <Hotspot id={z.id} nama={z.nama} aktif={aktif === z.id} onPilih={onPilih}
            x={z.x} y={z.y} width={z.w} height={z.h} />
        </g>
      ))}
    </svg>
  );
}

const TAMPAK = [
  { kode: "depan", label: "Depan" },
  { kode: "belakang", label: "Belakang" },
  { kode: "mesin-depan", label: "Mesin depan" },
  { kode: "mesin-belakang", label: "Mesin belakang" },
];

function Unit({ tampak, aktif, onPilih }) {
  if (tampak === "depan") return <TampakDepan aktif={aktif} onPilih={onPilih} />;
  if (tampak === "belakang") return <TampakBelakang aktif={aktif} onPilih={onPilih} />;
  return <TampakMesin sisi={tampak === "mesin-depan" ? "depan" : "belakang"}
    aktif={aktif} onPilih={onPilih} />;
}

/* ---------- 5. BAGIAN ---------- */

function PanelUnit({ tampak, setTampak, aktif, setAktif }) {
  const mesin = tampak.startsWith("mesin");
  const ganti = (kode) => {
    setTampak(kode);
    setAktif(null);
  };
  return (
    <div className="hp-panel">
      <Unit tampak={tampak} aktif={aktif} onPilih={setAktif} />
      <div className="hp-tampak" role="group" aria-label="Pilih tampilan">
        {TAMPAK.map((t) => (
          <button key={t.kode} type="button" className="hp-tb"
            aria-pressed={tampak === t.kode} onClick={() => ganti(t.kode)}>
            {t.label}
          </button>
        ))}
      </div>
      <p className="hp-hint">
        {mesin
          ? "Tekan zona untuk melihat kerusakan apa yang muncul dari situ dan berapa nilai mesinnya jadi."
          : "Tekan bagian perangkat untuk melihat nilai komponennya."}
      </p>
    </div>
  );
}

function PemilihVarian({ warna, setWarna, size, setSize, harga }) {
  const w = WARNA.find((x) => x.kode === warna);
  const s = STORAGE.find((x) => x.size === size);
  return (
    <div className="hp-pilih">
      <p className="hp-plabel">Warna yang pernah dirilis Apple</p>
      <div className="hp-bola" role="group" aria-label="Pilih warna">
        {WARNA.map((c) => (
          <button key={c.kode} type="button" className="hp-b" style={{ background: c.hex }}
            aria-pressed={warna === c.kode} aria-label={c.nama} title={c.nama}
            onClick={() => setWarna(c.kode)} />
        ))}
      </div>

      <p className="hp-plabel">Kapasitas</p>
      <div className="hp-chip" role="group" aria-label="Pilih kapasitas">
        {STORAGE.map((x) => (
          <button key={x.size} type="button" className="hp-c"
            aria-pressed={size === x.size} onClick={() => setSize(x.size)}>
            {x.size}
          </button>
        ))}
      </div>

      <p className="hp-hv hp-sd">{rupiah(harga)}</p>
      <p className="hp-hk">
        {w.nama} {size}, second grade standar.
        {w.catatan && ` Warna ini ${w.catatan}.`} Warna tidak menggerakkan harga di
        pasar bekas, hanya kecepatan lakunya.
        {s.delta > 0 &&
          ` Kapasitas menambah ${rupiah(s.delta)} — di unit baru selisihnya jauh lebih besar, dan itu menyusut cepat begitu masuk pasar bekas.`}
      </p>
    </div>
  );
}

function PanelPilihan({ komponen, zona }) {
  if (!komponen && !zona) return null;
  const grade = zona && GRADE_MESIN.find((g) => g.kode === zona.grade);

  return (
    <div className="hp-sel" aria-live="polite">
      {komponen && (
        <>
          <p className="hp-sn hp-sd">{komponen.nama}</p>
          <p className="hp-sh">{rupiah(dariRasio(komponen.rasio))}</p>
          <p className="hp-sp">
            {persen(komponen.rasio)}% dari harga unit · {komponen.penjual} penjual terpantau
          </p>
          <p className="hp-sk">{komponen.ket}</p>
        </>
      )}
      {zona && (
        <>
          <p className="hp-sn hp-sd">{zona.nama}</p>
          <p className="hp-sk">{zona.ket}</p>
          <p className="hp-srusak">
            Kalau bagian ini rusak, gejalanya <b>{zona.gejala}</b>, dan mesinnya
            diperdagangkan sebagai <b>{grade.nama.toLowerCase()}</b> di sekitar{" "}
            <b>{rupiah(dariRasio(grade.rasio))}</b>, atau {persen(grade.rasio)}% dari harga
            unit utuh.
          </p>
        </>
      )}
    </div>
  );
}

function TanggaHarga({ banding, setBanding }) {
  const { maxHarga, acuan, terpilih } = useMemo(() => {
    const berisi = TANGGA.filter((t) => t.harga !== null);
    return {
      maxHarga: Math.max(...berisi.map((t) => t.harga)),
      acuan: TANGGA.find((t) => t.kode === banding),
      terpilih: TANGGA.find((t) => t.kode === banding),
    };
  }, [banding]);

  return (
    <section className="hp-blok">
      <h2 className="hp-h2 hp-sd">Tangga harga</h2>
      <p className="hp-lead">
        Seluruh pasar {PRODUK.nama} di Jakarta dalam satu gambar. Tekan salah satu baris
        untuk menjadikannya pembanding, lalu lihat selisihnya ke baris lain dan apa yang
        sebenarnya kamu bayar di selisih itu.
      </p>

      <div className="hp-tangga" role="group" aria-label="Tingkatan harga">
        {TANGGA.map((t) => {
          const kosong = t.harga === null;
          const aktif = banding === t.kode;
          const beda = kosong ? null : t.harga - acuan.harga;
          return (
            <button key={t.kode} type="button" className="hp-anak" aria-pressed={aktif}
              disabled={kosong} onClick={() => setBanding(t.kode)}>
              <span className="hp-al">
                {t.label}
                <span>{t.sub}</span>
              </span>
              {kosong ? (
                <span className="hp-none">tidak tersedia</span>
              ) : (
                <>
                  <span className="hp-bar">
                    <span className={`hp-fill${t.gaya ? " " + t.gaya : ""}`}
                      style={{ width: `${(t.harga / maxHarga) * 100}%` }} />
                  </span>
                  <span className="hp-ah">{jt(t.harga)}</span>
                  <span className="hp-ad">
                    {aktif ? (
                      <b>pembanding</b>
                    ) : beda === 0 ? (
                      "sama"
                    ) : (
                      <>
                        {beda > 0 ? "+" : "−"}
                        <b>{jt(Math.abs(beda))}</b>
                      </>
                    )}
                  </span>
                </>
              )}
            </button>
          );
        })}
      </div>

      <div className="hp-baca">
        {terpilih.naikDari} Baris teratas adalah harga rilisnya empat tahun lalu — unit
        standar sekarang tinggal{" "}
        <b>{persen(CFG.hargaDasar / PRODUK.hargaRilis)}%</b> dari angka itu.
      </div>
    </section>
  );
}

function NilaiMesin() {
  const penuh = GRADE_MESIN[0].rasio;
  const faceid = GRADE_MESIN.find((g) => g.kode === "minus_faceid").rasio;
  return (
    <section className="hp-blok">
      <h2 className="hp-h2 hp-sd">Nilai mesin menurut fungsi yang hidup</h2>
      <p className="hp-lead">
        Mesin tidak hidup atau mati. Ia diperdagangkan menurut fungsi apa yang masih jalan,
        dan selisih antar tingkat adalah harga dari satu fungsi.
      </p>
      {GRADE_MESIN.map((g) => (
        <div className="hp-mg" key={g.kode}>
          <span>{g.nama}</span>
          <span className="hp-mbar">
            <span className="hp-mfill" style={{ width: `${(g.rasio / CFG.rasioMesinPenuh) * 100}%` }} />
          </span>
          <span className="hp-mh">{rupiah(dariRasio(g.rasio))}</span>
        </div>
      ))}
      <div className="hp-baca">
        Face ID yang hidup bernilai sekitar <b>{rupiah(dariRasio(penuh - faceid))}</b> — itu
        selisih antara mesin normal dan mesin minus Face ID. Angka seperti ini tidak
        diterbitkan siapa pun, dan hanya bisa dikumpulkan dari orang yang berdiri di pasar
        partnya sendiri.
      </div>
    </section>
  );
}

function Riwayat({ seri }) {
  const G = { W: 900, H: 210, kiri: 34, kanan: 14, atas: 12, bawah: 24 };
  const { titik, tanda, hi, akhir } = useMemo(() => {
    const hi = Math.max(...seri.map((d) => d.harga));
    const lo = Math.min(...seri.map((d) => d.harga)) * 0.94;
    const X = (i) => G.kiri + (i / (seri.length - 1)) * (G.W - G.kiri - G.kanan);
    const Y = (v) => G.H - G.bawah - ((v - lo) / (hi - lo)) * (G.H - G.atas - G.bawah - 12);
    return {
      hi,
      titik: seri.map((d) => `${X(d.i).toFixed(1)},${Y(d.harga).toFixed(1)}`).join(" "),
      tanda: seri.filter((d) => d.september).map((d) => X(d.i)),
      akhir: { x: X(seri.length - 1), y: Y(CFG.hargaDasar) },
    };
  }, [seri]);

  const turun = persen(1 - CFG.hargaDasar / PRODUK.hargaRilis);

  return (
    <section className="hp-blok">
      <h2 className="hp-h2 hp-sd">Sejak rilis sampai sekarang</h2>
      <p className="hp-lead">
        Harga pasaran second grade standar, bulanan. Garis putus menandai September, saat
        generasi baru masuk pasar.
      </p>
      <svg className="hp-graf" viewBox={`0 0 ${G.W} ${G.H}`} preserveAspectRatio="none"
        aria-label={`Grafik harga sejak rilis, turun ${turun} persen`}>
        {tanda.map((x, i) => (
          <line key={i} className="hp-gs" x1={x} y1={G.atas} x2={x} y2={G.H - G.bawah} />
        ))}
        <line className="hp-sumbu" x1={G.kiri} y1={G.H - G.bawah} x2={G.W - G.kanan} y2={G.H - G.bawah} />
        <polyline className="hp-gl" points={titik} />
        <circle cx={akhir.x} cy={akhir.y} r="4" className="hp-gd" />
        <text className="hp-gt" x={G.kiri} y={G.H - 9}>Sep 2022</text>
        <text className="hp-gt" x={G.W - G.kanan} y={G.H - 9} textAnchor="end">Sep 2026</text>
        <text className="hp-gt" x={G.kiri} y={G.atas + 10}>{jt(hi)}</text>
        <text className="hp-gt" x={akhir.x} y={akhir.y - 11} textAnchor="end">{jt(CFG.hargaDasar)}</text>
      </svg>
      <div className="hp-baca">
        Turun <b>{turun}%</b> dalam empat tahun, tapi tidak rata. Penurunan paling tajam
        semuanya jatuh di September. Kalau berencana menjual, jual sebelum September, bukan
        sesudahnya.
      </div>
    </section>
  );
}

function Penawaran() {
  const [buka, setBuka] = useState(false);
  return (
    <section className="hp-blok hp-akhir">
      <button type="button" className="hp-buka" aria-expanded={buka} onClick={() => setBuka(!buka)}>
        <span className="hp-sd hp-bukaj">
          {buka ? "Tutup daftar penawaran" : "Lihat semua penawaran"}
        </span>
        <em>27 penawaran dari 19 toko di Jakarta</em>
      </button>
      {buka && (
        <p className="hp-lead hp-bukai">
          Daftar per penawaran muncul di sini: harga, area, grade, dan kapan terakhir
          dicek. Nama toko tidak ditampilkan — yang ditampilkan area dan jumlah, karena
          itu yang bisa diverifikasi pembaca tanpa merugikan penjual yang harganya kami
          catat. Blok ini sengaja tertutup: jawabannya sudah ada di atas, ini buktinya.
        </p>
      )}
    </section>
  );
}

/* ---------- 6. HALAMAN ---------- */

export default function HalamanProduk() {
  const [gelap, setGelap] = useState(false);
  const [tampak, setTampak] = useState("depan");
  const [aktif, setAktif] = useState(null);
  const [warna, setWarna] = useState("midnight");
  const [size, setSize] = useState("128GB");
  const [banding, setBanding] = useState("standar");

  const seri = useMemo(bangunRiwayat, []);

  const hargaVarian = useMemo(() => {
    const s = STORAGE.find((x) => x.size === size);
    return bulat(CFG.hargaDasar + s.delta);
  }, [size]);

  const komponen = useMemo(() => KOMPONEN.find((k) => k.zona === aktif) ?? null, [aktif]);
  const zona = useMemo(() => ZONA_MESIN.find((z) => z.id === aktif) ?? null, [aktif]);

  const pilihZona = useCallback((id) => setAktif(id), []);

  return (
    <div className={`hp-root${gelap ? " gelap" : ""}`}>
      <style>{GAYA}</style>

      <div className="hp-wrap">
        <nav className="hp-nav">
          <span className="hp-sd">hargaapel</span>
          <button type="button" className="hp-tg" onClick={() => setGelap(!gelap)}>
            {gelap ? "mode terang" : "mode gelap"}
          </button>
        </nav>

        <header className="hp-kepala">
          <PanelUnit tampak={tampak} setTampak={setTampak} aktif={aktif} setAktif={pilihZona} />
          <div>
            <h1 className="hp-nama hp-jd">{PRODUK.nama}</h1>
            <p className="hp-meta">
              Dirilis {PRODUK.rilisTeks} · {PRODUK.umurTeks} · harga pasaran Jakarta
            </p>
            <p className="hp-ring">{PRODUK.ringkas}</p>
            <PemilihVarian warna={warna} setWarna={setWarna} size={size} setSize={setSize}
              harga={hargaVarian} />
          </div>
        </header>

        {(komponen || zona) && (
          <section className="hp-blok hp-blok-rapat">
            <PanelPilihan komponen={komponen} zona={zona} />
          </section>
        )}

        <TanggaHarga banding={banding} setBanding={setBanding} />
        <NilaiMesin />
        <Riwayat seri={seri} />
        <Penawaran />

        <footer className="hp-kaki">
          <p>
            Angka di halaman ini adalah harga yang terpantau dari toko dan bengkel di
            Jakarta, bukan harga yang dianjurkan. Nilai komponen disimpan sebagai
            persentase dari harga unit, jadi rupiahnya ikut menyesuaikan ketika harga unit
            bergerak.
          </p>
          <div className="hp-nota">
            Mockup. Seluruh angka masih contoh dan riwayatnya digenerate. Skema mesin
            bersifat diagram fungsi, bukan tata letak papan yang sebenarnya — ia
            menunjukkan zona mana bertanggung jawab atas gejala apa, bukan posisi fisik
            komponen. Rona warna adalah perkiraan visual, bukan kode warna resmi Apple.
          </div>
        </footer>
      </div>
    </div>
  );
}

/* ---------- gaya ---------- */

const GAYA = `
@import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,600;12..96,800&family=Archivo:wght@400;500;600;700&display=swap');

.hp-root{
  --paper:#F7F6F3;--ink:#1B2430;--ink-2:#5A6472;--rule:#DCD9D1;--rule-2:#EAE8E2;
  --murah:#0B6E4F;--mahal:#A4302A;--sorot:#F0EDE4;--tanah:#B8703A;--tanah-t:rgba(184,112,58,.16);
  background:var(--paper);color:var(--ink);
  font-family:'Archivo',ui-sans-serif,system-ui,sans-serif;
  font-variant-numeric:tabular-nums;min-height:100vh;-webkit-font-smoothing:antialiased;}
.hp-root.gelap{
  --paper:#14171C;--ink:#E8E6E1;--ink-2:#8E97A3;--rule:#2C3239;--rule-2:#232830;
  --murah:#4FBF92;--mahal:#E0705F;--sorot:#1C2027;--tanah:#D89660;--tanah-t:rgba(216,150,96,.18);}
.hp-root *{box-sizing:border-box;}
.hp-wrap{max-width:1180px;margin:0 auto;padding:0 24px 90px;}
.hp-jd{font-family:'Bricolage Grotesque',sans-serif;font-weight:800;letter-spacing:-0.03em;}
.hp-sd{font-family:'Bricolage Grotesque',sans-serif;font-weight:600;letter-spacing:-0.02em;}
.hp-root :focus-visible{outline:2px solid var(--ink);outline-offset:2px;}

/* nav */
.hp-nav{display:flex;justify-content:space-between;align-items:center;
  padding:16px 0;border-bottom:1px solid var(--ink);font-size:13px;}
.hp-tg{font:inherit;font-size:12px;padding:5px 11px;border:1px solid var(--rule);
  background:transparent;color:var(--ink-2);border-radius:999px;cursor:pointer;}
.hp-tg:hover{border-color:var(--ink);color:var(--ink);}

/* kepala */
.hp-kepala{display:grid;grid-template-columns:340px 1fr;gap:52px;
  padding:40px 0 38px;border-bottom:1px solid var(--rule);align-items:start;}
.hp-panel{position:sticky;top:20px;}
.hp-nama{font-size:clamp(34px,5vw,52px);line-height:1;margin:0 0 6px;}
.hp-meta{font-size:14px;color:var(--ink-2);margin:0 0 22px;}
.hp-ring{font-size:15px;line-height:1.65;max-width:54ch;margin:0 0 28px;}

/* ilustrasi */
.ilo{display:block;margin:0 auto;height:290px;}
.ilo-body{fill:none;stroke:var(--ink);stroke-width:2.2;}
.ilo-in{fill:var(--sorot);stroke:var(--rule);stroke-width:1;}
.ilo-solid{fill:var(--ink);}
.ilo-hole{fill:var(--paper);}
.ilo-lens{fill:none;stroke:var(--ink-2);stroke-width:1.4;}
.ilo-dash{fill:none;stroke:var(--rule);stroke-width:1;stroke-dasharray:3 4;}
.ilo-zone{fill:var(--sorot);stroke:var(--rule);stroke-width:1;}
.ilo-hot{fill:transparent;stroke:transparent;stroke-width:1.6;cursor:pointer;}
.ilo-hot:hover{fill:var(--tanah-t);stroke:var(--tanah);}
.ilo-hot.on{fill:var(--tanah-t);stroke:var(--tanah);stroke-width:2;}
.hp-tampak{display:flex;gap:5px;justify-content:center;margin:18px 0 0;flex-wrap:wrap;}
.hp-tb{font:inherit;font-size:11.5px;padding:5px 10px;border:1px solid var(--rule);
  background:transparent;color:var(--ink-2);cursor:pointer;border-radius:3px;}
.hp-tb[aria-pressed="true"]{background:var(--ink);border-color:var(--ink);color:var(--paper);}
.hp-hint{text-align:center;font-size:11.5px;color:var(--ink-2);margin:12px 0 0;line-height:1.5;}

/* varian */
.hp-pilih{border-top:1px solid var(--rule);padding-top:22px;}
.hp-plabel{font-size:11.5px;color:var(--ink-2);margin:0 0 10px;}
.hp-bola{display:flex;gap:9px;flex-wrap:wrap;margin-bottom:20px;}
.hp-b{width:32px;height:32px;border-radius:50%;border:1px solid var(--rule);cursor:pointer;padding:0;}
.hp-b[aria-pressed="true"]{box-shadow:0 0 0 2px var(--paper),0 0 0 4px var(--ink);}
.hp-chip{display:flex;gap:7px;flex-wrap:wrap;margin-bottom:20px;}
.hp-c{font:inherit;font-size:13px;padding:7px 14px;border:1px solid var(--rule);
  background:transparent;color:var(--ink-2);cursor:pointer;border-radius:3px;}
.hp-c[aria-pressed="true"]{background:var(--ink);border-color:var(--ink);color:var(--paper);}
.hp-hv{font-size:30px;margin:0 0 4px;}
.hp-hk{font-size:12.5px;color:var(--ink-2);margin:0;line-height:1.55;max-width:50ch;}

/* blok */
.hp-blok{padding:46px 0 40px;border-bottom:1px solid var(--rule-2);}
.hp-blok-rapat{padding-top:26px;padding-bottom:0;border-bottom:none;}
.hp-akhir{border-bottom:none;}
.hp-h2{font-size:23px;margin:0 0 6px;}
.hp-lead{font-size:14px;color:var(--ink-2);margin:0 0 28px;max-width:62ch;line-height:1.6;}
.hp-baca{margin-top:24px;padding:16px 18px;background:var(--sorot);
  border-left:3px solid var(--tanah);font-size:14.5px;line-height:1.6;max-width:64ch;}
.hp-baca b{font-weight:700;}

/* panel pilihan */
.hp-sel{border:1px solid var(--rule);padding:18px 20px;}
.hp-sn{font-size:17px;margin:0 0 4px;}
.hp-sh{font-size:24px;font-weight:700;margin:0 0 2px;}
.hp-sp{font-size:12px;color:var(--ink-2);margin:0 0 12px;}
.hp-sk{font-size:13.5px;line-height:1.6;margin:0;max-width:58ch;}
.hp-srusak{margin:12px 0 0;padding-top:12px;border-top:1px solid var(--rule-2);
  font-size:13.5px;line-height:1.6;max-width:58ch;}

/* tangga */
.hp-tangga{display:flex;flex-direction:column;}
.hp-anak{display:grid;grid-template-columns:176px 1fr 108px 96px;gap:14px;align-items:center;
  width:100%;background:none;border:none;border-top:1px solid var(--rule-2);
  font:inherit;color:inherit;cursor:pointer;text-align:left;padding:0;}
.hp-anak:first-child{border-top:1px solid var(--rule);}
.hp-anak:last-child{border-bottom:1px solid var(--rule);}
.hp-anak:hover:not(:disabled){background:var(--sorot);}
.hp-anak[aria-pressed="true"]{background:var(--sorot);}
.hp-anak:disabled{cursor:default;opacity:.6;}
.hp-anak > *{padding:11px 0;}
.hp-al{font-size:13.5px;line-height:1.3;}
.hp-al span{display:block;font-size:11px;color:var(--ink-2);margin-top:2px;}
.hp-bar{height:22px;position:relative;background:var(--rule-2);align-self:center;padding:0;}
.hp-fill{position:absolute;left:0;top:0;bottom:0;background:var(--ink);}
.hp-fill.lantai{background:repeating-linear-gradient(135deg,var(--ink-2),
  var(--ink-2) 3px,transparent 3px,transparent 7px);}
.hp-fill.arsip{background:var(--rule);}
.hp-fill.inter{background:var(--tanah);}
.hp-ah{font-size:15px;font-weight:700;text-align:right;}
.hp-ad{text-align:right;font-size:12.5px;color:var(--ink-2);}
.hp-ad b{font-weight:600;color:var(--ink);}
.hp-none{grid-column:2/5;font-size:12px;color:var(--ink-2);font-style:italic;}

/* mesin */
.hp-mg{display:grid;grid-template-columns:190px 1fr 96px;gap:14px;align-items:center;
  padding:10px 0;border-top:1px solid var(--rule-2);font-size:13.5px;}
.hp-mg:first-of-type{border-top:1px solid var(--rule);}
.hp-mbar{height:18px;background:var(--rule-2);position:relative;}
.hp-mfill{position:absolute;inset:0 auto 0 0;background:var(--ink);}
.hp-mh{text-align:right;font-weight:600;}

/* riwayat */
.hp-graf{width:100%;height:210px;display:block;}
.hp-gl{fill:none;stroke:var(--ink);stroke-width:1.8;stroke-linejoin:round;}
.hp-gd{fill:var(--ink);}
.hp-gs{stroke:var(--rule);stroke-width:1;stroke-dasharray:2 4;}
.hp-gt{font-size:9.5px;fill:var(--ink-2);}
.hp-sumbu{stroke:var(--rule);stroke-width:1;}

/* penawaran */
.hp-buka{font:inherit;font-size:14.5px;width:100%;text-align:left;padding:17px 0;
  background:none;border:none;border-top:1px solid var(--rule);border-bottom:1px solid var(--rule);
  cursor:pointer;color:var(--ink);display:flex;justify-content:space-between;
  align-items:center;gap:12px;}
.hp-buka:hover{color:var(--tanah);}
.hp-bukaj{font-size:17px;}
.hp-buka em{font-style:normal;color:var(--ink-2);font-size:13px;}
.hp-bukai{margin-top:18px;}

/* kaki */
.hp-kaki{padding:32px 0 0;font-size:12.5px;color:var(--ink-2);line-height:1.65;max-width:64ch;}
.hp-nota{background:var(--sorot);border:1px solid var(--rule);padding:14px 16px;
  margin-top:16px;font-size:12.5px;line-height:1.6;}

@media (max-width:900px){
  .hp-kepala{grid-template-columns:1fr;gap:30px;padding:28px 0;}
  .hp-panel{position:static;}
  .hp-anak{grid-template-columns:130px 1fr;}
  .hp-anak > *{padding:8px 0;}
  .hp-ah,.hp-ad{grid-column:2;text-align:left;}
  .hp-bar{height:16px;}
  .hp-none{grid-column:2;}
  .hp-mg{grid-template-columns:150px 1fr;}
  .hp-mh{grid-column:2;text-align:left;}
}
@media (prefers-reduced-motion:reduce){.hp-root *{transition:none!important;}}
`;
