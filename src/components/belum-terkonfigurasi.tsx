import { Kucing } from "@/components/kucing";
import { ENV_WAJIB } from "@/lib/supabase/siap";

// Ditampilkan menggantikan seluruh isi situs ketika kredensial Supabase
// belum terpasang. Lebih baik satu layar yang menyebutkan persis apa yang
// kurang daripada 500 di setiap halaman tanpa penjelasan apa pun.
export function BelumTerkonfigurasi() {
  return (
    <div className="mx-auto max-w-md px-5 py-20 text-center">
      <Kucing pose="tidur" />
      <h1 className="mb-2 text-xl font-bold tracking-tight">Situs belum tersambung ke basis datanya</h1>
      <p className="mx-auto mb-6 max-w-[46ch] text-sm leading-relaxed text-muted-foreground">
        Aplikasinya jalan, tapi kredensial Supabase belum diisi, jadi tidak ada angka yang bisa ditampilkan. Isi variabel di bawah ini
        di pengaturan proyek, lalu deploy ulang.
      </p>
      <ul className="mx-auto mb-6 max-w-xs space-y-1.5 text-left">
        {ENV_WAJIB.map((nama) => (
          <li key={nama} className="rounded border border-border px-3 py-2 font-mono text-[11.5px]">
            {nama}
          </li>
        ))}
      </ul>
      <p className="mx-auto max-w-[46ch] text-xs leading-relaxed text-muted-foreground">
        Langkah lengkapnya ada di <span className="font-mono">docs/DEPLOY.md</span> di repositori.
      </p>
    </div>
  );
}
