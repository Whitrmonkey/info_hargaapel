// Siluet digambar dari atribut produk (products.bentuk.siluet), bukan dari
// foto. Tanpa warna, memakai var(--foreground) supaya ikut mode gelap.
//
// Yang dibedakan cuma hal yang benar-benar membedakan satu generasi dari
// yang lain di mata orang: bentuk muka, jumlah lensa belakang, bahan rangka,
// dan ukuran layar. Menambah detail di luar itu tidak membuat siluetnya
// lebih informatif, cuma lebih ramai.
export interface AtributSiluet {
  muka?: string; // "island" | "notch" | "notch-lebar" | "tombol" | "polos"
  kamera?: number;
  bahan?: string; // "titanium" | "baja" | "aluminium"
  layar_inci?: number;
}

const W = 76;
const H = 148;

// Lebar badan diskalakan dari ukuran layar supaya iPhone mini dan Pro Max
// benar-benar terlihat beda besarnya saat kartunya berjajar.
function lebarBadan(inci: number | undefined): number {
  if (inci == null) return 62;
  const n = Math.max(5.4, Math.min(6.9, inci));
  return Math.round(52 + ((n - 5.4) / 1.5) * 16); // 52..68
}

function Muka({ muka, x, w }: { muka: string; x: number; w: number }) {
  const tengah = x + w / 2;
  if (muka === "island") {
    // Pil Dynamic Island: melayang, tidak menempel tepi atas.
    return <rect x={tengah - 9} y={11} width={18} height={5.5} rx={2.75} className="sl-s" />;
  }
  if (muka === "notch" || muka === "notch-lebar") {
    const lebar = muka === "notch-lebar" ? Math.min(w - 14, 40) : Math.min(w - 20, 32);
    return (
      <path
        d={`M${tengah - lebar / 2} 5 h${lebar} v5 a5 5 0 0 1 -5 5 h-${lebar - 10} a5 5 0 0 1 -5 -5 z`}
        className="sl-s"
      />
    );
  }
  if (muka === "tombol") {
    // Generasi bertombol Home: lingkaran di dagu, bukan takik di dahi.
    return <circle cx={tengah} cy={H - 14} r={6} className="sl-t" />;
  }
  return null;
}

// Modul kamera: satu lensa di kiri atas, dua diagonal, tiga segitiga.
function Kamera({ n, x }: { n: number; x: number }) {
  const kx = x + 5;
  const ky = 11;
  if (n <= 0) return null;
  if (n === 1) {
    return (
      <>
        <circle cx={kx + 9} cy={ky + 9} r={5.2} className="sl-t" />
        <circle cx={kx + 9} cy={ky + 9} r={2} className="sl-s" />
      </>
    );
  }
  const lensa =
    n === 2
      ? [
          [kx + 8, ky + 8],
          [kx + 18, ky + 18],
        ]
      : [
          [kx + 8, ky + 8],
          [kx + 18, ky + 8],
          [kx + 8, ky + 18],
        ];
  return (
    <>
      <rect x={kx - 1} y={ky - 1} width={n === 2 ? 27 : 28} height={n === 2 ? 27 : 28} rx={8} className="sl-i" />
      {lensa.map(([cx, cy]) => (
        <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={4.4} className="sl-t" />
      ))}
    </>
  );
}

function Telepon({ atribut }: { atribut: AtributSiluet }) {
  const w = lebarBadan(atribut.layar_inci);
  const x = (W - w) / 2;
  const muka = atribut.muka ?? "polos";
  // Rangka titanium dan baja digambar sedikit lebih tebal daripada
  // aluminium. Bedanya halus dan memang begitu maksudnya.
  const tebal = atribut.bahan === "titanium" || atribut.bahan === "baja" ? 2.6 : 2;
  return (
    <>
      <rect x={x} y={3} width={w} height={H - 6} rx={12} className="sl-b" strokeWidth={tebal} />
      <rect x={x + 4} y={7} width={w - 8} height={H - 14} rx={8} className="sl-i" />
      <Muka muka={muka} x={x} w={w} />
      <Kamera n={atribut.kamera ?? 0} x={x} />
    </>
  );
}

function Datar({ kamera }: { kamera: number }) {
  return (
    <>
      <rect x="4" y="14" width="68" height="120" rx="8" className="sl-b" />
      <rect x="9" y="19" width="58" height="110" rx="5" className="sl-i" />
      {kamera >= 1 && <circle cx="19" cy="28" r="4" className="sl-t" />}
    </>
  );
}

function Jam() {
  return (
    <>
      <rect x="18" y="34" width="40" height="52" rx="13" className="sl-b" />
      <rect x="24" y="40" width="28" height="40" rx="8" className="sl-i" />
      <path d="M28 34 v-14 h20 v14 M28 86 v14 h20 v-14" className="sl-t" />
      <rect x="58" y="50" width="4" height="10" rx="2" className="sl-s" />
    </>
  );
}

export function Siluet({ kategori, atribut }: { kategori: string; atribut: AtributSiluet | null }) {
  const a = atribut ?? {};
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="sl" aria-hidden="true">
      {kategori === "watch" ? <Jam /> : kategori === "iphone" ? <Telepon atribut={a} /> : <Datar kamera={a.kamera ?? 0} />}
    </svg>
  );
}
