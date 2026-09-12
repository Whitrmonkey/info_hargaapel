# Menaikkan prototipe ke online

Keadaan sekarang: aplikasinya siap, basis datanya belum. Supabase masih
berjalan di Docker lokal (`http://127.0.0.1:54321`), dan alamat itu tidak
bisa dihubungi dari internet. Jadi urutannya selalu Supabase dulu, baru
Vercel.

---

## 1. Supabase ter-host

1. Buat proyek baru di https://supabase.com/dashboard (region terdekat:
   Singapore).
2. Sambungkan repo lokal ke proyek itu:

   ```bash
   npx supabase link --project-ref <ref-proyek>
   npx supabase db push
   ```

   `db push` menjalankan seluruh berkas di `supabase/migrations/` secara
   berurutan. Yang di `supabase/demo/` TIDAK ikut — itu memang disengaja.

3. Ambil tiga nilai dari Project Settings → API:
   - Project URL
   - `anon` public key
   - `service_role` key (rahasia, jangan pernah masuk ke berkas yang ikut
     commit)

## 2. Isi data

Tanpa data, situsnya benar dan kosong: tiap blok akan menampilkan keadaan
kosongnya masing-masing. Dua pilihan:

**Untuk peragaan** — muat data demo ke proyek ter-host:

```bash
psql "<connection string dari Supabase>" -f supabase/demo/isi.sql
```

Ingat konsekuensinya: angka di situs itu buatan. Kalau prototipenya
ditunjukkan ke orang luar, katakan itu di depan.

**Untuk sungguhan** — jalankan scraper dan mulai mencatat lewat `/catat`.
Situs akan terisi sendiri seiring waktu, dan blok yang belum cukup datanya
tetap tidak dirender.

## 3. Vercel

```bash
npm i -g vercel
vercel login
vercel link
vercel deploy --prod
```

Atau: push ke GitHub lalu Import Project di dashboard Vercel. Cara kedua
lebih enak karena tiap push dapat preview sendiri.

### Variabel lingkungan yang harus diisi di Vercel

Wajib, situs tidak jalan tanpa ini:

| Nama | Isi |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Project URL dari langkah 1 |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | service_role key |
| `NEXT_PUBLIC_SITE_URL` | alamat produksinya, mis. `https://hargaapel.vercel.app` |

Perlu untuk fitur tertentu, boleh menyusul:

| Nama | Dipakai untuk | Kalau kosong |
|---|---|---|
| `CRON_SECRET` | menjaga rute cron | rute cron terbuka untuk siapa saja |
| `SCRAPE_TOKEN` | menjaga `/api/scrape/run` | sama |
| `RESEND_API_KEY`, `EMAIL_FROM` | alert email | alert tidak terkirim |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY` | anti-bot di `/masuk` | pendaftaran jalan tanpa penyaring bot |
| `NEXT_PUBLIC_WA_CHANNEL_URL` | tombol saluran WA | tombolnya tidak dirender sama sekali |
| `BLOKIR_DOMAIN_URL` | sumber daftar domain sekali pakai | pakai sumber bawaan |

Kolom terakhir itu bukan basa-basi: tiap fitur memang sudah dirancang mati
dengan rapi kalau env-nya kosong, jadi prototipe bisa naik dengan empat
variabel pertama saja.

## 4. Setelah naik

1. Buka `/` — beranda harus tampil walau datanya kosong
2. Buka `/p/<slug>` salah satu iPhone — pastikan ilustrasinya bukan siluet
   generik
3. Buka `/tidak-ada` — harus 404 dengan kucing, bukan galat
4. Cek Supabase → Authentication → URL Configuration, tambahkan alamat
   produksi ke redirect URL, kalau tidak magic link akan memantul ke
   localhost
5. Cron di `vercel.json` ikut aktif sendiri

## 5. Yang belum aman untuk publik luas

- Batas laju masuk masih `Map` di memori tiap instance, jadi di serverless
  batasnya lebih longgar dari yang tertulis
- Tabel `blokir_domain` kosong sampai cron bulanannya jalan sekali; boleh
  dipicu manual dengan memanggil `/api/cron/blokir-domain`
- Belum ada backup terjadwal di sisi Supabase


---

## 6. Cron dan batasan plan Hobby

Vercel Hobby mengizinkan 100 cron job, tapi **paling sering sekali sehari**,
dengan ketepatan +/- 59 menit. Ekspresi seperti `0 * * * *` (tiap jam) akan
menggagalkan deploy dengan pesan:

> Hobby accounts are limited to daily cron jobs.

Karena itu keempat tugas harian dirangkai jadi satu rute, `/api/cron/harian`,
yang menjalankannya berurutan: scrape, refresh agregat, verifikasi laporan,
lalu alert. Dua cron saja yang terdaftar sekarang:

| Rute | Jadwal | Isi |
|---|---|---|
| `/api/cron/harian` | `0 20 * * *` | empat tugas harian, berurutan |
| `/api/cron/blokir-domain` | `0 3 1 * *` | segarkan daftar domain sekali pakai |

Penggabungan ini bukan cuma untuk memenuhi batasan. Dengan ketepatan +/- 59
menit, jadwal terpisah justru bisa terbalik urutannya: scrape yang
dijadwalkan 20:00 bisa jalan 20:59 sementara verifikasi 21:30 jalan tepat
waktu, jadi laporan dinilai memakai data kemarin. Dirangkai dalam satu
proses, urutannya tidak bergantung pada ketepatan jadwal sama sekali.

Satu tugas gagal tidak menghentikan sisanya, dan rutenya membalas **207**
kalau sebagian gagal — bukan 500, karena menandai seluruh proses gagal akan
menyembunyikan tugas yang sebenarnya berhasil.

### Kalau agregat perlu lebih segar dari sekali sehari

Perlu diingat dulu: **harga terkini tidak terpengaruh.** `harga_terkini`
adalah view biasa, bukan materialized, jadi harga di tangga harga,
/cek-harga, dan /pasaran selalu segar. Yang menunggu refresh cuma agregat
riwayat: linimasa, "bergerak minggu ini", sebaran servis, dan rasio
komponen.

Kalau itu pun perlu lebih sering, ada dua jalan tanpa upgrade:

1. **pg_cron di Supabase.** Refresh agregat sebenarnya urusan basis data,
   bukan urusan web. Supabase menyediakan ekstensi `pg_cron`:

   ```sql
   create extension if not exists pg_cron;
   select cron.schedule('refresh-agregat', '0 * * * *', 'select refresh_agregat()');
   ```

   Ini berjalan tiap jam tanpa menyentuh batasan Vercel sama sekali.

2. **Panggil `/api/cron/refresh-pasaran` dari penjadwal lain** (GitHub
   Actions, cron-job.org). Rutenya masih ada dan tetap dijaga `CRON_SECRET`.

Keempat rute lama (`scrape-harian`, `refresh-pasaran`, `alert-harian`,
`verifikasi-laporan`) sengaja dipertahankan untuk dipicu manual saat
menelusuri masalah, tapi tidak lagi punya jadwal sendiri.
