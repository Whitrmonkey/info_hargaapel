# Tutorial: dari 404 sampai situs hidup

Ditulis setelah deploy pertama gagal dengan `DEPLOYMENT_NOT_FOUND`. Isinya
apa yang sebenarnya terjadi, cara membetulkannya, dan dua jebakan yang
memakan waktu paling lama.

---

## Bagian 1 — Kenapa `404: DEPLOYMENT_NOT_FOUND`

Pertama, bedakan dua jenis 404:

| Yang Anda lihat | Artinya |
|---|---|
| Halaman 404 dengan gambar kucing | Aplikasinya **jalan**, cuma alamatnya tidak ada |
| `404: NOT_FOUND` + `Code: DEPLOYMENT_NOT_FOUND` | Vercel **tidak punya deployment** untuk hostname itu. Kode kita bahkan belum dijalankan |

Yang Anda dapat adalah yang kedua, dan dashboard Vercel mengonfirmasinya:
*"No Production Deployment — Your Production Domain is not serving traffic."*

Artinya proyeknya ada, tapi belum ada satu pun deployment yang dipromosikan
jadi **produksi**. Ini paling sering terjadi karena salah satu dari tiga hal:

1. Yang ter-deploy baru **preview**, bukan produksi. `vercel deploy` tanpa
   `--prod` selalu menghasilkan preview.
2. **Production Branch** di pengaturan Vercel tidak sama dengan branch yang
   Anda push. Repo ini pakai `main`.
3. Deployment produksinya **gagal build**, jadi tidak pernah dipromosikan.

Untuk kasus Anda bukan nomor 3 — saya sudah menguji build tanpa satu pun
variabel lingkungan dan hasilnya sukses.

### Membetulkannya

**Cara paling cepat, lewat dashboard:**

1. Buka proyeknya di https://vercel.com/dashboard
2. Tab **Deployments**
3. Cari deployment paling atas yang statusnya **Ready**
4. Klik titik tiga di kanannya → **Promote to Production**

**Kalau daftar Deployments kosong sama sekali**, berarti belum ada yang
pernah ter-deploy. Deploy dari terminal:

```bash
npm i -g vercel      # kalau belum ada
vercel login
vercel link          # sambungkan folder ini ke proyek yang sudah dibuat
vercel deploy --prod # --prod ini yang penting
```

**Kalau yang ter-deploy hanya preview terus-menerus**, periksa
Settings → Git → **Production Branch**, pastikan isinya `main`.

### Cara tahu URL yang benar

`infohargaapel.vercel.app` belum tentu alamat proyek Anda. Vercel memberi
`<nama-proyek>.vercel.app`, dan nama proyek diambil dari nama repo saat
import. Alamat aslinya ada di halaman depan proyek, di bawah judul
**Domains**. Pakai yang itu, jangan ditebak.

---

## Bagian 2 — Jebakan env: `.env.local` bukan tempat kredensial produksi

Ini yang memakan waktu paling lama hari ini, dan saya ikut menambah
kekacauannya — akan saya jelaskan di bawah.

Aturannya satu kalimat:

> `.env.local` untuk **komputer Anda**. Kredensial Supabase ter-host untuk
> **pengaturan Vercel**. Jangan pernah tertukar.

| Berkas / tempat | Isinya | Kenapa |
|---|---|---|
| `.env.local` | Supabase **lokal** (`http://127.0.0.1:54321`) | supaya `npm run dev` bermain di basis data mainan, bukan basis data sungguhan |
| Vercel → Settings → Environment Variables | Supabase **ter-host** | dibaca saat build dan saat situs melayani permintaan |

Kalau kredensial ter-host ditaruh di `.env.local`, `npm run dev` di laptop
Anda akan menulis ke basis data produksi tanpa ada yang sadar. Itu bukan
ketidaknyamanan, itu kehilangan data yang menunggu giliran.

### Yang harus diisi di Vercel

Empat ini wajib, situs tidak jalan tanpanya:

```
NEXT_PUBLIC_SUPABASE_URL       = https://<ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY  = kunci publishable
SUPABASE_SERVICE_ROLE_KEY      = kunci secret
NEXT_PUBLIC_SITE_URL           = https://<alamat-produksi-anda>.vercel.app
```

Ditambah satu yang menentukan isi situsnya:

```
NEXT_PUBLIC_MODE_DATA          = maintenance
```

Mengambil ketiga nilai Supabase: dashboard Supabase → proyek Anda →
**Settings → API Keys**. Salin *Project URL*, *publishable*, dan *secret*.

Sisanya (Resend, Turnstile, WhatsApp, CRON_SECRET) boleh menyusul. Tiap
fitur sudah dirancang mati dengan rapi kalau env-nya kosong, jadi prototipe
bisa naik dengan lima variabel di atas saja.

**Setelah menambah atau mengubah env di Vercel, wajib Redeploy.** Variabel
dibaca saat build; mengubahnya tanpa deploy ulang tidak berpengaruh apa-apa.

### Yang saya rusak, dan cara mengembalikannya

Saya menulis ulang dua baris di `.env.local` Anda dengan kunci Supabase
**lokal**, padahal berkas itu sudah Anda isi dengan kunci **ter-host**. Jadi
dua nilai itu sekarang hilang dari laptop Anda.

Kabar baiknya kunci Supabase selalu bisa diambil ulang dan tidak perlu
dibuat baru:

1. Buka dashboard Supabase → proyek Anda → **Settings → API Keys**
2. Salin *publishable key* dan *secret key*
3. Tempel ke **Vercel → Settings → Environment Variables** (bukan ke
   `.env.local`)

`.env.local` di laptop sudah saya kembalikan menunjuk ke Supabase lokal,
yang memang tempatnya.

---

## Bagian 3 — Isi basis datanya

Situs yang tersambung tapi kosong akan menampilkan keadaan kosong di setiap
blok. Itu benar, tapi bukan yang Anda mau untuk peragaan.

```bash
# 1. sambungkan repo ke proyek Supabase ter-host
npx supabase link --project-ref <ref-proyek>

# 2. jalankan seluruh migrasi (skema, katalog 78 iPhone, warna, dst)
npx supabase db push

# 3. isi data peragaan
psql "<connection string dari Supabase>" -f supabase/demo/isi.sql
```

Connection string ada di Supabase → **Settings → Database → Connection
string → URI**.

Dengan `NEXT_PUBLIC_MODE_DATA=maintenance`, situs akan memasang pita di atas
halaman yang menyatakan angkanya buatan. Jangan dilepas sebelum data
nyatanya masuk — itu satu-satunya yang memisahkan peragaan dari kebohongan.

Kalau nanti sudah ada data nyata:

```bash
psql "<connection string>" -f supabase/demo/kosongkan.sql   # bersihkan peragaan
```
lalu ubah `NEXT_PUBLIC_MODE_DATA` jadi `testing`, dan akhirnya `production`.

---

## Bagian 4 — Daftar periksa setelah situsnya hidup

1. Buka `/` — beranda tampil, ada pita "Mode peragaan"
2. Buka `/iphone` — 24 kartu generasi
3. Buka `/p/iphone-14-128gb` — tangga harga, framewall, linimasa
4. Buka `/apa-saja-yang-ngawur` — 404 berkucing, **bukan**
   `DEPLOYMENT_NOT_FOUND`
5. Supabase → **Authentication → URL Configuration** → tambahkan alamat
   produksi ke *Redirect URLs*. Tanpa ini, tautan masuk akan memantul ke
   `localhost` dan tidak ada yang bisa login.

---

## Lampiran — dua bug yang ketahuan saat menelusuri ini

Keduanya nyata dan sudah diperbaiki, dicatat di sini supaya tidak
membingungkan kalau terulang.

**1. Data peragaan mematikan seluruh layanan auth.**
`supabase/demo/isi.sql` menyisipkan pengguna ke `auth.users` tanpa mengisi
kolom token, jadi nilainya `NULL`. GoTrue membaca kolom itu ke string yang
tidak boleh kosong, dan satu baris `NULL` saja membuat **semua** panggilan
auth balas `500 Database error finding users` — termasuk untuk pengguna yang
tidak ada hubungannya dengan data demo. Sekarang kolomnya diisi string
kosong secara eksplisit.

**2. Situs mati total kalau env Supabase belum diisi.**
Rangka aplikasi memanggil Supabase di tiap permintaan untuk memutuskan
tombol "Masuk" atau "Akun". Begitu env-nya belum ada, yang mati bukan satu
tombol melainkan setiap halaman — termasuk halaman 404 dan halaman galat,
jadi tidak ada satu layar pun yang bisa menjelaskan apa yang salah.

Sekarang situs menampilkan satu halaman yang menyebutkan persis variabel apa
yang kurang. Satu titik gagal yang menjatuhkan semuanya adalah kesalahan
rancangan, bukan kesalahan konfigurasi.
