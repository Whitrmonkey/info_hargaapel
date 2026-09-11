import { ambilDataCek } from "@/lib/data/sebaran-device";
import { CekClient } from "./cek-client";

export const metadata = {
  title: "Ditawari berapa? — hargaapel",
  description: "Cek harga yang ditawarkan ke kamu terhadap sebaran harga toko terpantau di Jabodetabek. Tanpa mengetik.",
};

export default async function CekHargaPage() {
  const data = await ambilDataCek();
  return <CekClient {...data} />;
}
