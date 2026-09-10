import { SpesimenBaterai } from "./baterai";
import { SpesimenFaceId } from "./faceid";
import { SpesimenKaca } from "./kaca";
import { SpesimenKamera } from "./kamera";
import { SpesimenKameraDepan } from "./kamera-depan";
import { SpesimenKonektor } from "./konektor";
import { SpesimenLayar } from "./layar";
import { SpesimenMesin } from "./mesin";
import { SpesimenTombol } from "./tombol";

// Dipetakan dari component_types.gambar, bukan dari kode komponennya, supaya
// dua jenis komponen boleh berbagi satu gambar tanpa menyentuh kode.
const GAMBAR: Record<string, () => React.ReactElement> = {
  baterai: SpesimenBaterai,
  faceid: SpesimenFaceId,
  kaca: SpesimenKaca,
  kamera: SpesimenKamera,
  kamera_depan: SpesimenKameraDepan,
  konektor: SpesimenKonektor,
  layar: SpesimenLayar,
  mesin: SpesimenMesin,
  tombol: SpesimenTombol,
};

function SpesimenKosong() {
  return (
    <>
      <rect x="24" y="24" width="52" height="52" rx="6" className="sp-dash" />
      <path d="M42 50 h16" className="sp-thin" />
    </>
  );
}

// Gambar spesimen adalah ilustrasi diagram, bukan tampilan fisik part yang
// sebenarnya -- kalimat itu wajib ikut muncul di halaman yang memakainya.
export function GambarSpesimen({ gambar }: { gambar: string | null }) {
  const Isi = (gambar && GAMBAR[gambar]) || SpesimenKosong;
  return (
    <svg viewBox="0 0 100 100" className="sp-gb" aria-hidden="true">
      <Isi />
    </svg>
  );
}

export const NAMA_GAMBAR = Object.keys(GAMBAR);
