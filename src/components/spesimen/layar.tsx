// Digambar di kotak 100x100, tanpa warna, memakai var(--ink) lewat kelas
// .sp-* di globals.css supaya ikut mode gelap. Diagram fungsi, bukan
// tampilan fisik part yang sebenarnya.
export function SpesimenLayar() {
  return (
    <>
      <rect x="26" y="8" width="48" height="84" rx="8" className="sp-out" />
      <rect x="30" y="12" width="40" height="76" rx="5" className="sp-in" />
      <path d="M40 12 h20 v4 a4 4 0 0 1 -4 4 h-12 a4 4 0 0 1 -4 -4 z" className="sp-solid" />
      <path d="M50 92 v6" className="sp-out" />
      <rect x="44" y="96" width="12" height="3" rx="1.5" className="sp-solid" />
    </>
  );
}
