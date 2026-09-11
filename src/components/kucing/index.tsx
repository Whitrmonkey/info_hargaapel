import { KucingDuduk } from "./duduk";
import { KucingTersesat } from "./tersesat";
import { KucingTidur } from "./tidur";

// Satu berkas per pose di src/components/kucing/ supaya tiap pose bisa
// disetel manual. Pose dipilih lewat nama, bukan lewat impor langsung di
// halaman, supaya tempat kemunculannya gampang diaudit.
const POSE: Record<string, () => React.ReactElement> = {
  duduk: KucingDuduk,
  tersesat: KucingTersesat,
  tidur: KucingTidur,
};

export type PoseKucing = keyof typeof POSE;

export function Kucing({ pose = "duduk" }: { pose?: string }) {
  const Isi = POSE[pose] ?? KucingDuduk;
  return (
    <svg viewBox="0 0 120 100" className="kc" aria-hidden="true">
      <Isi />
    </svg>
  );
}
