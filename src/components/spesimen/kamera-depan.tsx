// Kamera depan menyatu satu flex dengan sensor jarak, jadi digambar
// memanjang, bukan sebagai modul persegi seperti kamera belakang.
export function SpesimenKameraDepan() {
  return (
    <>
      <rect x="22" y="40" width="56" height="20" rx="7" className="sp-out" />
      <circle cx="36" cy="50" r="7" className="sp-thin" />
      <circle cx="36" cy="50" r="3" className="sp-solid" />
      <circle cx="58" cy="50" r="3.5" className="sp-thin" />
      <path d="M22 50 h-8 M78 50 h8" className="sp-thin" />
    </>
  );
}
