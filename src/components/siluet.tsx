// Siluet digambar dari atribut produk (products.bentuk.siluet), bukan dari
// foto. Tanpa warna, memakai var(--foreground) supaya ikut mode gelap.
export interface AtributSiluet {
  muka?: string; // "island" | "notch" | "polos"
  kamera?: number;
}

function Telepon({ muka, kamera }: { muka: string; kamera: number }) {
  return (
    <>
      <rect x="3" y="3" width="70" height="142" rx="13" className="sl-b" />
      <rect x="8" y="8" width="60" height="132" rx="9" className="sl-i" />
      {muka === "island" ? (
        <rect x="27" y="12" width="22" height="6.5" rx="3.2" className="sl-s" />
      ) : muka === "notch" ? (
        <path d="M19 8 h38 v6 a5 5 0 0 1 -5 5 h-28 a5 5 0 0 1 -5 -5 z" className="sl-s" />
      ) : null}
      <rect x="11" y="11" width="26" height="26" rx="8" className="sl-i" />
      <circle cx="19" cy="19" r="4.6" className="sl-t" />
      {kamera >= 2 && <circle cx="29" cy="29" r="4.6" className="sl-t" />}
      {kamera >= 3 && <circle cx="19" cy="29" r="4.6" className="sl-t" />}
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
  const muka = atribut?.muka ?? "polos";
  const kamera = atribut?.kamera ?? 0;
  return (
    <svg viewBox="0 0 76 148" className="sl" aria-hidden="true">
      {kategori === "watch" ? <Jam /> : kategori === "iphone" ? <Telepon muka={muka} kamera={kamera} /> : <Datar kamera={kamera} />}
    </svg>
  );
}
