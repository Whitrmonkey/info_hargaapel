// Bentuk ringkas per keluarga untuk ubin "Jelajahi". Beda dari Siluet di
// indeks seri: yang ini tidak menggambarkan satu generasi tertentu, cuma
// jenis perangkatnya, jadi tidak membaca atribut produk apa pun.
const BENTUK: Record<string, React.ReactElement> = {
  iphone: (
    <>
      <rect x="16" y="4" width="24" height="44" rx="6" />
      <rect x="22" y="7" width="12" height="3" rx="1.5" className="bk-isi" />
    </>
  ),
  ipad: (
    <>
      <rect x="10" y="6" width="36" height="42" rx="4" />
      <rect x="24" y="9" width="8" height="2.4" rx="1.2" className="bk-isi" />
    </>
  ),
  mac: (
    <>
      <rect x="8" y="10" width="40" height="26" rx="3" />
      <path d="M4 40 H52 L48 36 H8 Z" className="bk-isi" />
    </>
  ),
  watch: (
    <>
      <rect x="18" y="14" width="20" height="26" rx="6" />
      <path d="M23 14 V7 h10 v7 M23 40 v7 h10 v-7" />
    </>
  ),
};

export function BentukKeluarga({ kategori }: { kategori: string }) {
  const isi = BENTUK[kategori] ?? BENTUK.iphone;
  return (
    <svg viewBox="0 0 56 54" className="bk" aria-hidden="true">
      {isi}
    </svg>
  );
}
