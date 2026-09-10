# hargaapel — SETUP

Kredensial yang harus dibuat dan dikonfigurasi manual, dan aturan keamanan yang
mengikat seluruh kode. Dokumen ini menang di atas SPEC.md dan SERVIS.md untuk
hal kredensial dan keamanan.

Bagian A dan B dikerjakan manusia, bukan Claude Code. Bagian C ke bawah adalah
aturan yang ditegakkan di dalam kode.

---

# A. Yang harus dibuat sendiri sebelum deploy

## A1. Supabase — wajib, gratis untuk mulai

1. Buat project baru di supabase.com, pilih region **Southeast Asia (Singapore)**.
   Region terdekat dari Jakarta; salah pilih region berarti menambah 150-250ms
   di setiap query dan tidak bisa diubah tanpa migrasi ulang.
2. Settings, API. Salin tiga nilai:
   - Project URL
   - `anon` `public` key
   - `service_role` `secret` key
3. Simpan `service_role` seperti menyimpan kunci rumah. Kunci itu **melewati
   seluruh RLS**. Siapa pun yang memilikinya bisa membaca dan menghapus seluruh
   database, termasuk riwayat harga yang tidak bisa dibangun ulang.

## A2. SMTP untuk email login — wajib sebelum ada user asli

Supabase menyediakan SMTP bawaan, tapi dibatasi sangat ketat dan ditujukan untuk
percobaan. Di produksi ia akan gagal diam-diam: user menekan tombol masuk, tidak
ada email datang, tidak ada error yang terlihat.

1. Daftar Resend (gratis 3.000 email per bulan) atau penyedia SMTP lain.
2. Verifikasi domain. Pasang record DKIM dan SPF di DNS domain kamu. Tanpa ini
   email login akan mendarat di spam, dan sekali domain kena reputasi buruk,
   memulihkannya makan waktu berminggu-minggu.
3. Supabase, Authentication, Emails, SMTP Settings: isi host, port, user,
   password dari penyedia.
4. Authentication, URL Configuration: isi Site URL dan Redirect URLs dengan
   domain produksi. Kalau tidak, tautan magic link akan mengarah ke localhost.

## A3. Domain

Beli di Niagahoster, Domainesia, atau Cloudflare. Sekitar 150-200 ribu per tahun
untuk .com. Arahkan ke hosting sesuai A5.

## A4. Cloudflare Turnstile — gratis, wajib

Penahan bot di halaman masuk. Tanpa ini, satu skrip iseng bisa memicu ribuan
email login dari alamat kamu dan menghanguskan reputasi domain dalam satu malam.

1. Cloudflare, Turnstile, Add site.
2. Salin Site Key (publik) dan Secret Key (rahasia).

## A5. Hosting

Vercel Hobby melarang penggunaan komersial, dan definisinya luas — situs yang
mengumpulkan kontak untuk pemasaran usaha kamu sudah masuk ke sana. Hobby juga
tidak punya penagihan kelebihan pemakaian: begitu lewat batas, situs berhenti
sampai 30 hari berlalu.

Pilih salah satu:
- **Vercel Pro**, sekitar 20 dolar per bulan. Paling mulus untuk Next.js, cron
  bawaan.
- **Netlify** atau **Cloudflare Pages**, gratis dan mengizinkan penggunaan
  komersial. Perlu sedikit penyesuaian untuk cron: pakai Netlify Scheduled
  Functions atau Cloudflare Cron Triggers, dan sesuaikan pemeriksaan header di
  route cron.

## A6. Backup database — jangan dilewati

Supabase Free tidak punya backup. Tabel `price_observations` dan
`service_observations` bersifat append-only, jadi kehilangan database berarti
kehilangan seluruh riwayat, dan riwayat itu satu-satunya hal di proyek ini yang
tidak bisa dibangun ulang dari sumber mana pun.

Pilih salah satu:
- Supabase Pro, sekitar 25 dolar per bulan, backup harian otomatis.
- Atau gratis: GitHub Action harian yang menjalankan `pg_dump` dan mengunggah
  hasilnya ke Cloudflare R2 atau Backblaze B2. Simpan connection string sebagai
  GitHub Secret, bukan di dalam workflow file.

Uji pemulihannya sekali. Backup yang belum pernah dipulihkan bukan backup.

## A7. Saluran WhatsApp — manual, tanpa API

1. WhatsApp, Updates, buat Saluran baru.
2. Ambil tautan undangannya.
3. Masukkan ke `NEXT_PUBLIC_WA_CHANNEL_URL`.

Itu saja. **Jangan** mendaftar provider WhatsApp berbasis sesi atau QR seperti
Whapi, Wablas, atau Fonnte untuk memposting ke saluran secara otomatis. Cara
kerjanya adalah menyambungkan sesi hidup akun WhatsApp kamu ke server pihak
ketiga, yang berarti pihak itu bisa membaca dan mengirim apa pun dari nomor
tersebut. Otomasi tak resmi juga alasan umum nomor diblokir Meta. Untuk rekap
mingguan, `/admin/siaran` menyiapkan teksnya dan kamu yang menekan kirim.

## A8. Meta Cloud API — jangan sekarang

Hanya kalau nanti alert WhatsApp otomatis benar-benar dibutuhkan. Butuh WhatsApp
Business Account, verifikasi bisnis, nomor khusus, dan template yang disetujui
Meta. Kosongkan seluruh variabel WA di bawah sampai saat itu tiba.

---

# B. Berkas .env

Buat `.env.local` di root. **Jangan pernah** di-commit.

```bash
# ---------- Supabase ----------
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
# SERVER ONLY. Melewati seluruh RLS. Jangan pernah diberi awalan NEXT_PUBLIC_.
SUPABASE_SERVICE_ROLE_KEY=

# ---------- Aplikasi ----------
NEXT_PUBLIC_SITE_URL=https://hargaapel.com

# ---------- Token internal ----------
# Buat dengan: openssl rand -base64 32
SCRAPE_TOKEN=
CRON_SECRET=

# ---------- Email ----------
RESEND_API_KEY=
EMAIL_FROM=alert@hargaapel.com

# ---------- Anti-bot ----------
NEXT_PUBLIC_TURNSTILE_SITE_KEY=
TURNSTILE_SECRET_KEY=

# ---------- WhatsApp ----------
# Tautan publik saluran. Bukan rahasia, boleh NEXT_PUBLIC_.
# Kalau kosong, tombol saluran tidak dirender sama sekali.
NEXT_PUBLIC_WA_CHANNEL_URL=

# Kosongkan sampai BAGIAN 11. Hanya Meta Cloud API resmi.
WA_PROVIDER=none
WA_PHONE_NUMBER_ID=
WA_ACCESS_TOKEN=
WA_TEMPLATE_ALERT=
```

`.env.example` berisi seluruh nama variabel di atas dengan **nilai kosong**, dan
ikut di-commit. `.gitignore` wajib memuat:

```
.env
.env.local
.env*.local
```

---

# C. Aturan keamanan yang ditegakkan di kode

## C1. Awalan NEXT_PUBLIC_ berarti terlihat semua orang

Next.js menanamkan setiap variabel berawalan `NEXT_PUBLIC_` ke dalam bundle
JavaScript yang dikirim ke browser. Siapa pun bisa membacanya dengan membuka
devtools. Awalan itu hanya untuk nilai yang memang publik: URL Supabase, anon
key, site key Turnstile, tautan saluran WhatsApp.

Kesalahan yang paling sering dan paling mahal adalah memberi awalan itu pada
`SUPABASE_SERVICE_ROLE_KEY` karena "biar bisa dipakai di komponen". Itu sama
dengan menerbitkan kunci admin database di halaman depan.

## C2. service_role hanya di server, dan tidak di semua server

- Hanya di Route Handler, Server Action, dan skrip cron.
- Tidak pernah diimpor, langsung maupun tidak langsung, oleh file yang memuat
  `"use client"`.
- Tidak pernah dikembalikan dalam response API mana pun.
- Tidak pernah masuk log, termasuk log error.

Letakkan pembuatan klien service role di satu file, `src/lib/supabase/admin.ts`,
dengan baris `import "server-only"` di paling atas. Baris itu membuat build
gagal kalau file tersebut sampai tertarik ke bundle klien. Itu penjaga yang
bekerja otomatis, bukan sekadar niat baik.

## C3. RLS aktif di setiap tabel, tanpa kecuali

Tabel tanpa RLS yang diakses dengan anon key bisa dibaca dan ditulis siapa saja
di internet. Setelah semua migrasi jalan, jalankan pemeriksaan ini dan pastikan
hasilnya kosong:

```sql
select tablename from pg_tables
where schemaname = 'public'
  and tablename not in (
    select tablename from pg_tables t
    join pg_class c on c.relname = t.tablename
    where c.relrowsecurity = true
  );
```

Ringkasan kebijakan yang harus ada:

| Tabel | anon | member | kontributor |
|---|---|---|---|
| products, sellers, workshops, service_types, part_grades | select | select | select |
| price_observations, service_observations | select | select | select + insert |
| market_events, fx_rates | select | select | select |
| sources, source_product_map, scrape_runs | tidak ada | tidak ada | admin saja |
| profiles | tidak ada | baris sendiri | baris sendiri |
| watchlists, alert_deliveries | tidak ada | baris sendiri | baris sendiri |

`update` dan `delete` pada kedua tabel observasi ditolak untuk semua role kecuali
service role, ditulis sebagai policy eksplisit. Tabel itu append-only.

## C4. Endpoint internal wajib berpenjaga

- `POST /api/scrape/run` memeriksa header `Authorization: Bearer <SCRAPE_TOKEN>`.
  Bandingkan dengan perbandingan waktu-tetap, bukan `===` biasa.
- Route cron memeriksa `Authorization: Bearer <CRON_SECRET>`. Vercel mengirim
  header ini otomatis kalau `CRON_SECRET` diset di environment.
- Keduanya membalas 401 tanpa keterangan apa pun kalau token salah. Jangan
  membocorkan apakah token ada, panjangnya berapa, atau sebagian isinya.
- Rate limit per IP pada `/api/auth`, `/api/alert`, dan `/api/scrape/run`.

## C5. Nomor telepon adalah data pribadi

`profiles.wa_e164` tidak boleh terbaca `anon`, tidak boleh muncul di response API
selain milik pemiliknya sendiri, dan tidak boleh masuk log. Simpan dalam format
E.164 (`+628...`). Jangan pernah menampilkan nomor satu user ke user lain.

Nomor yang belum terverifikasi tidak dipakai untuk apa pun selain ditampilkan ke
pemiliknya. Jangan pernah mengirim apa pun ke nomor yang orangnya belum
mengonfirmasi kepemilikan.

## C6. Kalau kunci bocor

Kunci yang pernah masuk git dianggap bocor selamanya, meski commit-nya sudah
dihapus — riwayat git tetap menyimpannya, dan fork atau clone yang sudah tersebar
tidak bisa ditarik kembali.

Langkahnya:
1. Supabase, Settings, API, rotate key yang bocor.
2. Perbarui environment di hosting dan di `.env.local`.
3. Untuk `SCRAPE_TOKEN` dan `CRON_SECRET`, cukup buat baru dengan
   `openssl rand -base64 32`.
4. Periksa log Supabase untuk aktivitas mencurigakan di jendela waktu kebocoran.

Jangan mencoba membersihkan riwayat git dan menganggap masalah selesai. Rotasi
kuncinya. Itu murah dan tuntas.

## C7. Environment di hosting

Set variabel terpisah untuk Production, Preview, dan Development. Jangan memakai
kunci produksi di deployment Preview — Preview URL bisa diakses siapa pun yang
punya tautannya, dan sering terindeks tanpa disengaja.

---

# D. Daftar periksa sebelum deploy pertama

- [ ] `.env.local` ada di `.gitignore`, `.env.example` ter-commit dengan nilai kosong
- [ ] `git log -p | grep -i "service_role\|eyJ"` tidak mengembalikan apa pun
- [ ] Query RLS di C3 mengembalikan nol baris
- [ ] `src/lib/supabase/admin.ts` memuat `import "server-only"` dan build lolos
- [ ] SMTP kustom terpasang, magic link diuji ke satu alamat asli dan masuk inbox
- [ ] Site URL dan Redirect URLs di Supabase menunjuk domain produksi
- [ ] Turnstile aktif di halaman masuk dan diuji
- [ ] Route cron menolak permintaan tanpa `CRON_SECRET` (uji dengan curl polos)
- [ ] `POST /api/scrape/run` menolak permintaan tanpa token
- [ ] Backup terjadwal jalan, dan sudah pernah dipulihkan sekali ke database uji
- [ ] Halaman publik terbuka penuh di jendela penyamaran tanpa login
- [ ] `NEXT_PUBLIC_WA_CHANNEL_URL` kosong berarti tombol saluran tidak muncul,
      bukan tautan mati
