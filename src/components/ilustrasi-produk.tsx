"use client";

export interface ZonaDatar {
  id: string;
  nama: string;
  component_kode: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface ZonaMesin {
  id: string;
  nama: string;
  x: number;
  y: number;
  w: number;
  h: number;
  board_grade: string;
  gejala: string;
  ket: string;
}

export interface Bentuk {
  keluarga?: string;
  zona_depan?: ZonaDatar[];
  zona_belakang?: ZonaDatar[];
  zona_mesin_depan?: ZonaMesin[];
  zona_mesin_belakang?: ZonaMesin[];
}

// Tekan zona untuk melihat nilai komponennya (device) atau gejala kerusakan +
// grade mesin (mesin). Skema mesin adalah diagram FUNGSI, bukan tata letak
// papan sebenarnya -- lihat catatan di kaki halaman produk.
function Hotspot({
  id,
  nama,
  aktif,
  onPilih,
  ...rect
}: {
  id: string;
  nama: string;
  aktif: boolean;
  onPilih: (id: string | null) => void;
  x: number;
  y: number;
  width: number;
  height: number;
}) {
  const pilih = () => onPilih(aktif ? null : id);
  return (
    <rect
      {...rect}
      rx={4}
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

const TELEPON = { W: 120, H: 240, r: 19, bodi: { x: 4, y: 4, w: 112, h: 232 } };
const MESIN = { W: 132, H: 200 };

function TampakDepan({ zona, aktif, onPilih }: { zona: ZonaDatar[]; aktif: string | null; onPilih: (id: string | null) => void }) {
  const { W, H, bodi, r } = TELEPON;
  const notch = { x: 38, w: 44, h: 15 };
  const layar = { x: 10, y: 10, w: 100, h: 220, r: 14 };
  const tombolKiri = [
    { y: 46, h: 11 },
    { y: 66, h: 24 },
    { y: 96, h: 24 },
  ];
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="ilo" aria-label="Tampilan depan">
      <rect x={bodi.x} y={bodi.y} width={bodi.w} height={bodi.h} rx={r} className="ilo-body" />
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
      {zona.map((z) => (
        <Hotspot key={z.id} id={z.id} nama={z.nama} aktif={aktif === z.id} onPilih={onPilih} x={z.x} y={z.y} width={z.w} height={z.h} />
      ))}
    </svg>
  );
}

function TampakBelakang({ zona, aktif, onPilih }: { zona: ZonaDatar[]; aktif: string | null; onPilih: (id: string | null) => void }) {
  const { W, H, bodi, r } = TELEPON;
  const modul = { x: 14, y: 14, s: 46, r: 14 };
  const lensa = [
    { cx: 28, cy: 28 },
    { cx: 46, cy: 46 },
  ];
  const magsafe = { cx: 60, cy: 124, luar: 23, dalam: 15 };
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="ilo" aria-label="Tampilan belakang">
      <rect x={bodi.x} y={bodi.y} width={bodi.w} height={bodi.h} rx={r} className="ilo-body" />
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
      {zona.map((z) => (
        <Hotspot key={z.id} id={z.id} nama={z.nama} aktif={aktif === z.id} onPilih={onPilih} x={z.x} y={z.y} width={z.w} height={z.h} />
      ))}
    </svg>
  );
}

function TampakMesin({ zona, aktif, onPilih, sisi }: { zona: ZonaMesin[]; aktif: string | null; onPilih: (id: string | null) => void; sisi: string }) {
  const papan =
    "M8 6 h110 a6 6 0 0 1 6 6 v172 a6 6 0 0 1 -6 6 h-88 a6 6 0 0 1 -6 -6 v-42 h-16 a6 6 0 0 1 -6 -6 v-124 a6 6 0 0 1 6 -6 z";
  return (
    <svg viewBox={`0 0 ${MESIN.W} ${MESIN.H}`} className="ilo" aria-label={`Skema fungsi mesin tampak ${sisi}`}>
      <path d={papan} className="ilo-body" />
      {zona.map((z) => (
        <g key={z.id}>
          <rect x={z.x} y={z.y} width={z.w} height={z.h} rx="3" className="ilo-zone" />
          <Hotspot id={z.id} nama={z.nama} aktif={aktif === z.id} onPilih={onPilih} x={z.x} y={z.y} width={z.w} height={z.h} />
        </g>
      ))}
    </svg>
  );
}

function SiluetGenerik() {
  return (
    <svg viewBox="0 0 120 200" className="ilo" aria-label="Siluet produk">
      <rect x={6} y={6} width={108} height={188} rx={16} className="ilo-body" />
      <rect x={16} y={16} width={88} height={168} rx={10} className="ilo-in" />
    </svg>
  );
}

export const TAMPAK = [
  { kode: "depan", label: "Depan" },
  { kode: "belakang", label: "Belakang" },
  { kode: "mesin-depan", label: "Mesin depan" },
  { kode: "mesin-belakang", label: "Mesin belakang" },
] as const;

export function IlustrasiProduk({
  bentuk,
  tampak,
  aktif,
  onPilih,
}: {
  bentuk: Bentuk;
  tampak: string;
  aktif: string | null;
  onPilih: (id: string | null) => void;
}) {
  if (bentuk.keluarga !== "iphone") return <SiluetGenerik />;

  if (tampak === "depan") return <TampakDepan zona={bentuk.zona_depan ?? []} aktif={aktif} onPilih={onPilih} />;
  if (tampak === "belakang") return <TampakBelakang zona={bentuk.zona_belakang ?? []} aktif={aktif} onPilih={onPilih} />;
  if (tampak === "mesin-depan") return <TampakMesin zona={bentuk.zona_mesin_depan ?? []} aktif={aktif} onPilih={onPilih} sisi="depan" />;
  return <TampakMesin zona={bentuk.zona_mesin_belakang ?? []} aktif={aktif} onPilih={onPilih} sisi="belakang" />;
}
