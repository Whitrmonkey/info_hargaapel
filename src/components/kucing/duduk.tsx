// Maskot: bahasa garis yang sama dengan ilustrasi lain -- tanpa warna,
// var(--foreground), tebal goresan sama. Ia punya pekerjaan, bukan hiasan:
// muncul hanya di keadaan kosong, hasil nihil, 404, halaman galat, dan
// pesan data belum cukup. TIDAK PERNAH di dekat harga, vonis, tangga harga,
// framewall, atau linimasa -- di sana kelucuan mengurangi kepercayaan.
export function KucingDuduk() {
  return (
    <>
      <path d="M34 46 L30 26 L46 38" className="kc-s" />
      <path d="M86 46 L90 26 L74 38" className="kc-s" />
      <path
        d="M60 32 c22 0 32 14 32 30 c0 16 -14 26 -32 26 c-18 0 -32 -10 -32 -26 c0 -16 10 -30 32 -30 z"
        className="kc-s"
      />
      <circle cx="48" cy="58" r="2.6" className="kc-f" />
      <circle cx="72" cy="58" r="2.6" className="kc-f" />
      <path d="M56 68 h8 l-4 4 z" className="kc-f" />
      <path d="M60 72 v4 M60 76 c-3 3 -8 2 -9 -1 M60 76 c3 3 8 2 9 -1" className="kc-s" />
      <path d="M28 62 h-16 M28 68 h-14 M92 62 h16 M92 68 h14" className="kc-t" />
      <path d="M40 88 c14 6 26 6 40 0" className="kc-s" />
    </>
  );
}
