// Pose untuk 404 dan halaman galat: menoleh ke belakang, seolah barusan
// mendengar sesuatu yang tidak ada.
export function KucingTersesat() {
  return (
    <>
      <path d="M34 50 L28 30 L48 42" className="kc-s" />
      <path d="M84 50 L90 30 L70 42" className="kc-s" />
      <path
        d="M59 36 c20 0 30 13 30 28 c0 15 -13 24 -30 24 c-17 0 -30 -9 -30 -24 c0 -15 10 -28 30 -28 z"
        className="kc-s"
      />
      <circle cx="48" cy="60" r="2.6" className="kc-f" />
      <circle cx="70" cy="60" r="2.6" className="kc-f" />
      <path d="M55 70 h8 l-4 4 z" className="kc-f" />
      <path d="M59 74 v4" className="kc-s" />
      <path d="M29 64 h-15 M29 70 h-13 M89 64 h15 M89 70 h13" className="kc-t" />
      <path d="M44 88 c10 4 20 4 30 0" className="kc-s" />
      <path d="M22 40 v-8 M18 46 l-7 -5 M30 34 l4 -7" className="kc-t" />
    </>
  );
}
