# hargaapel — SPEC

Pembanding harga produk Apple untuk pembeli di Jabodetabek.

## Masalah yang diselesaikan

Orang mau beli iPhone 20 juta dan tidak punya cara tahu apakah harga yang
ditawarkan wajar. Situs ini mengumpulkan harga dari banyak toko dan menjawab
satu pertanyaan: **harga ini wajar atau kemahalan, dan sebaiknya beli sekarang
atau tunggu.**

## Non-goals

Jangan bangun ini. Kalau ragu, tanya dulu.

- Bukan marketplace. Tidak ada checkout, keranjang, atau transaksi.
- Tidak ada akun untuk pengunjung. Situs publik dibaca tanpa login.
- Tidak ada model machine learning untuk prediksi harga. Lihat bagian Sinyal.
- Tidak ada scraping Tokopedia atau Shopee di fase mana pun. Anti-botnya berat
  dan butuh residential proxy. Data marketplace masuk lewat input manual.
- Tidak ada harga modal, margin, atau data internal bisnis di database ini.
  Situs ini publik.

## Stack

Next.js App Router + TypeScript, Supabase (Postgres, Realtime, Auth),
shadcn/ui, Vercel. RLS di semua tabel, migrasi bernomor, tidak ada `any`,
`npm run build` harus lolos sebelum fase dianggap selesai.

---

# Sumber data

Ini bagian yang menentukan bentuk seluruh sistem. Sumber dibagi empat tingkat
menurut cara ambilnya, bukan menurut siapa penjualnya.

## Tier A — feed terstruktur

Toko yang berjalan di Shopify mengekspos katalog sebagai JSON di
`/products.json?limit=250&page=N`. Setiap produk berisi array `variants`, dan
tiap varian punya `price`, `sku`, `title`, dan `available`. Tidak ada HTML yang
di-parse, tidak ada CSS selector yang bisa patah saat mereka ganti tema.

Sumber Tier A yang sudah dikonfirmasi:

| Sumber | Basis | Sisi pasar | Catatan |
|---|---|---|---|
| shop.maujual.com | Shopify | jual | Gadget bekas bergaransi. Punya ~30 produk Apple. |

**Cek dulu sebelum menulis adapter HTML apa pun:** buka
`https://<domain>/products.json?limit=5`. Kalau balasannya JSON, sumber itu Tier A
dan adapternya selesai dalam 30 menit. Banyak toko Indonesia berjalan di Shopify
tanpa terlihat dari luar. Adapter Shopify ditulis **sekali** dan dipakai ulang
untuk semua domain Shopify — bedanya cuma nama domain di tabel `sources`.

Ambil harian. Ongkosnya beberapa request, dan setiap hari yang dilewatkan adalah
titik data yang hilang selamanya.

## Tier B — HTML

Situs yang harus di-parse. Rapuh, butuh perawatan, dan harus gagal berisik.

Kandidat: ibox.co.id, eraspace.com, digimap.co.id, story-i.
Ambil mingguan. Untuk tiap sumber, cek dulu apakah ada Tier A tersembunyi:
endpoint `products.json` Shopify, endpoint REST Magento, atau payload
`__NEXT_DATA__` di dalam HTML Next.js. Urutan usaha: JSON dulu, HTML terakhir.

## Tier C — sisi beli (buyback)

Platform yang mempublikasikan harga mereka **membeli** dari konsumen. Ini bukan
harga jual dan tidak boleh dicampur dengan Tier A dan B.

Kandidat: maujual.com, kitajual.id, kitar.

Nilainya besar dan belum dipakai siapa pun di Indonesia. Lihat bagian berikut.

## Tier D — manual

Kios ITC Roxy Mas, ITC Kuningan, Mangga Dua, penjual marketplace, perorangan.
Tidak ada web, tidak akan pernah ada. Masuk lewat halaman `/catat`.

Data Tier D adalah satu-satunya data di situs ini yang tidak bisa didapat orang
lain. Tier A sampai C membuat situs ini lengkap; Tier D membuatnya tidak bisa
ditiru.

---

# Sisi pasar: bid dan ask

Setiap observasi harga punya `sisi`:

- `jual` — harga toko menjual ke konsumen (ask)
- `beli` — harga platform membeli dari konsumen (bid)

Keduanya disimpan di tabel yang sama, tidak pernah dicampur dalam satu
perhitungan median, dan ditampilkan berdampingan.

Kenapa ini penting:

1. **Harga beli adalah lantai pasar.** Tidak ada orang menjual unitnya di bawah
   harga yang bersedia dibayar platform buyback, karena dia tinggal menjual ke
   platform itu. Penawaran manual yang jatuh di bawah lantai ini bukan otomatis
   salah, tapi wajib ditandai untuk diverifikasi.
2. **Selisih bid dan ask adalah margin pedagang.** Untuk barang second, ini angka
   paling informatif yang bisa ditampilkan sebuah situs harga, dan tidak ada
   situs Indonesia yang menampilkannya.
3. **Untuk pembeli**, harga beli menjawab pertanyaan yang berbeda: kalau nanti
   dijual lagi, dapat berapa.

UI: pada grup barang second, tampilkan satu baris ringkas di atas daftar toko —
harga beli tertinggi dari platform buyback, harga jual terendah dari toko, dan
selisihnya dalam rupiah dan persen.

---

# Grading kondisi

Skala `bnib | second | refurb` terlalu kasar. Pasar Indonesia sudah punya skala
yang dipublikasikan oleh platform buyback dan dipakai luas:

**Mulus, Standar, Ekonomis**, masing-masing dengan varian **+ box**.

Skema memisahkan tiga hal yang selama ini tercampur:

- `kondisi` : `baru` | `second` | `refurb`
- `grade`   : `mulus` | `standar` | `ekonomis` | `null` untuk barang baru
- `fullset` : boolean, ada dus dan kelengkapan atau tidak

Kunci grup pembanding menjadi: **produk + kondisi + grade + garansi**.
`fullset` tidak masuk kunci grup — ditampilkan sebagai keterangan baris, karena
selisihnya kecil dan memecah grup terlalu halus akan menyisakan grup satu toko.

Saat mencatat manual, pemetaan dari bahasa kios ke grade:
"mulus 99%", "like new" → `mulus`; "normal", "wajar pakai" → `standar`;
"lecet", "minus", "baret" → `ekonomis`.

---

# Envelope: apa yang boleh dan tidak boleh diasumsikan

Data Tier A sampai C memberi rentang harga yang diketahui untuk tiap grup.
Rentang itu **referensi**, bukan batas.

Yang benar: penawaran manual yang jatuh di luar rentang ditandai
`perlu_verifikasi` dan tetap ditampilkan dengan penanda.

Yang salah, jangan dibangun: memaksa penawaran manual masuk ke dalam rentang,
menyembunyikan yang di luar rentang, atau menebak harga penjual yang belum
dicatat berdasarkan posisi di dalam rentang.

Alasannya konkret. Kios Roxy menjual unit inter tunai tanpa garansi resmi, tanpa
biaya marketplace, tanpa pengecekan 40 titik, tanpa garansi setahun — harganya
memang bisa di bawah semua sumber online, dan itu sah. Sebaliknya penjual
marketplace yang tidak paham pasar bisa memasang di atas harga iBox. Penawaran
yang jatuh di luar rentang adalah data paling menarik di seluruh situs. Jangan
dibuang, jangan dijepit, tandai saja.

---

# Keputusan arsitektur yang tidak boleh diubah

### 1. Harga tidak pernah di-update

`price_observations` append-only. Setiap pengecekan menulis baris baru. Tidak ada
`UPDATE` pada kolom harga. Koreksi salah ketik ditulis sebagai baris baru yang
mengisi `koreksi_atas`, bukan menghapus yang lama.

Kalau harga ditimpa, dalam tiga bulan tidak ada riwayat, tidak ada tren, dan
seluruh fitur sinyal mustahil dibangun. Biaya penyimpanannya nol.

### 2. Grup pembanding = produk + kondisi + grade + garansi

Unit inter dan unit garansi resmi tidak pernah masuk satu grup. Sisi jual dan
sisi beli tidak pernah masuk satu perhitungan.

### 3. Vonis dihitung ke median, bukan ke termurah

delta <= -6% murah, >= +6% mahal, di antaranya wajar.

### 4. Realtime ada di jalur input, bukan jalur pasar

Supabase Realtime pada `price_observations`, satu channel. Tujuannya: mencatat
harga dari HP di kios dan halaman publik berubah tanpa refresh.

### 5. Sinyal wajib menampilkan alasan

Tidak ada angka prediksi tanpa kalimat yang menjelaskan asalnya.

---

# Skema

```sql
-- 001_init.sql

create table products (
  id          uuid primary key default gen_random_uuid(),
  kategori    text not null check (kategori in ('iphone','ipad','mac','watch','audio','aksesoris')),
  model       text not null,
  varian      text not null,
  slug        text not null unique,
  rilis_at    date,
  penerus_id  uuid references products(id),
  aktif       boolean not null default true,
  created_at  timestamptz not null default now(),
  unique (model, varian)
);

create table sellers (
  id         uuid primary key default gen_random_uuid(),
  nama       text not null,
  tipe       text not null check (tipe in ('resmi','toko','marketplace','buyback','perorangan')),
  area       text not null,
  lokasi     text,
  url        text,
  wa         text,
  aktif      boolean not null default true,
  created_at timestamptz not null default now()
);

-- konfigurasi scraper, per sumber. tidak ada domain yang hardcoded di kode.
create table sources (
  id           uuid primary key default gen_random_uuid(),
  seller_id    uuid not null references sellers(id),
  adapter      text not null check (adapter in ('shopify','html','manual')),
  base_url     text not null,
  sisi         text not null check (sisi in ('jual','beli')),
  config       jsonb not null default '{}',   -- selector, path koleksi, header
  cadence      text not null check (cadence in ('harian','mingguan','bulanan','manual')),
  aktif        boolean not null default true,
  last_run_at  timestamptz
);

-- pemetaan nama produk sumber -> products.id. di tabel, bukan di kode,
-- supaya bisa diperbaiki tanpa deploy.
create table source_product_map (
  id            uuid primary key default gen_random_uuid(),
  source_id     uuid not null references sources(id),
  external_key  text not null,                -- handle/sku/judul dari sumber
  product_id    uuid references products(id), -- null = belum dipetakan
  grade         text,
  fullset       boolean,
  abaikan       boolean not null default false,
  unique (source_id, external_key)
);

-- append-only. tidak pernah di-update.
create table price_observations (
  id           bigserial primary key,
  product_id   uuid not null references products(id),
  seller_id    uuid not null references sellers(id),
  source_id    uuid references sources(id),
  sisi         text not null default 'jual' check (sisi in ('jual','beli')),
  kondisi      text not null check (kondisi in ('baru','second','refurb')),
  grade        text check (grade in ('mulus','standar','ekonomis')),
  fullset      boolean,
  garansi      text not null check (garansi in ('resmi','inter','toko')),
  harga        bigint not null check (harga > 0),
  catatan      text,
  sumber       text not null check (sumber in ('manual','scraper')),
  perlu_verifikasi boolean not null default false,
  dicatat_by   uuid references auth.users(id),
  koreksi_atas bigint references price_observations(id),
  observed_at  timestamptz not null default now(),
  check ((kondisi = 'baru' and grade is null) or (kondisi <> 'baru'))
);

create index on price_observations (product_id, sisi, kondisi, grade, garansi, observed_at desc);
create index on price_observations (seller_id, observed_at desc);
create index on price_observations (source_id, observed_at desc);

-- observabilitas scraper. tanpa ini tidak ada cara tahu kapan sumber mati.
create table scrape_runs (
  id           bigserial primary key,
  source_id    uuid not null references sources(id),
  dipicu_oleh  text not null check (dipicu_oleh in ('cron','manual')),
  mulai_at     timestamptz not null default now(),
  selesai_at   timestamptz,
  status       text not null check (status in ('jalan','sukses','gagal','ditolak')),
  jumlah_item  int,
  jumlah_baru  int,
  jumlah_tak_terpetakan int,
  pesan        text
);

create table fx_rates (
  tanggal date primary key,
  usd_idr numeric not null
);

create table market_events (
  id        uuid primary key default gen_random_uuid(),
  tanggal   date not null,
  label     text not null,
  jenis     text not null check (jenis in ('rilis','promo','musiman')),
  kategori  text[] not null,
  catatan   text
);
```

View di 002:

```sql
create view harga_terkini as
select distinct on (product_id, seller_id, sisi, kondisi, grade, garansi)
  id, product_id, seller_id, sisi, kondisi, grade, garansi,
  fullset, harga, catatan, perlu_verifikasi, observed_at
from price_observations
where koreksi_atas is null
order by product_id, seller_id, sisi, kondisi, grade, garansi, observed_at desc;

create materialized view pasaran_harian as
select
  product_id, sisi, kondisi, grade, garansi,
  date_trunc('day', observed_at)::date as tanggal,
  percentile_cont(0.5) within group (order by harga)::bigint as median,
  min(harga) as terendah,
  max(harga) as tertinggi,
  count(distinct seller_id) as jumlah_toko
from price_observations
where koreksi_atas is null
group by 1,2,3,4,5,6;

create unique index on pasaran_harian (product_id, sisi, kondisi, grade, garansi, tanggal);
```

### RLS

Select publik untuk `anon` pada products, sellers, price_observations,
market_events, fx_rates. Tabel `sources`, `source_product_map`, dan
`scrape_runs` **tidak** publik. Insert price_observations hanya untuk
kontributor dan service role. Update dan delete pada price_observations ditolak
untuk semua role kecuali service role, ditulis sebagai policy eksplisit.

---

# Arsitektur scraper

## Adapter

Satu interface, banyak implementasi. Adapter tidak tahu apa-apa tentang database.

```ts
type HasilItem = {
  external_key: string;   // handle atau sku dari sumber
  judul: string;
  harga: number;          // rupiah, integer
  grade?: string;
  fullset?: boolean;
  tersedia: boolean;
  url?: string;
};

interface Adapter {
  ambil(source: Source): Promise<HasilItem[]>;
}
```

Dua implementasi di awal:

- `shopify` — GET `{base_url}/products.json?limit=250&page=N` sampai halaman
  kosong. Ratakan `variants[]` jadi satu item per varian. `external_key` =
  `{handle}:{variant.id}`. Harga Shopify berupa string desimal, ubah ke integer
  rupiah. Jeda 1 detik antar halaman. Satu adapter ini melayani semua domain
  Shopify.
- `html` — Playwright atau cheerio, selector dari `sources.config`.

## Alur satu run

1. Buat baris `scrape_runs` status `jalan`.
2. Adapter mengambil item.
3. **Gerbang kewarasan.** Kalau jumlah item turun lebih dari 30% dibanding run
   sukses terakhir untuk sumber yang sama, hentikan, status `ditolak`, jangan
   tulis satu pun observasi, kirim notifikasi. Diam lebih baik daripada salah.
4. Cocokkan tiap `external_key` ke `source_product_map`. Yang belum terpetakan
   dihitung di `jumlah_tak_terpetakan` dan disimpan sebagai baris map dengan
   `product_id` null. Tidak ditebak, tidak dicocokkan fuzzy ke produk mana pun.
5. Tulis observasi hanya untuk yang terpetakan.
6. **Peredam duplikat.** Kalau harga sama persis dengan observasi terakhir untuk
   kombinasi yang sama dan usianya kurang dari 20 jam, lewati. Ini mencegah run
   manual berulang membanjiri tabel tanpa menambah informasi. Selain itu, tulis.
7. Tandai `perlu_verifikasi` jika harga di luar rentang wajar grupnya.
8. Tutup `scrape_runs` dengan hitungan dan status.

## Pemicu

- Cron Vercel per `sources.cadence`: harian untuk Tier A, mingguan untuk Tier B
  dan C.
- On-command: `POST /api/scrape/run` dengan body `{ source_id }` atau
  `{ semua: true }`, dilindungi header bearer token dari env. Sinkron kalau satu
  sumber, background kalau semua.
- Halaman `/admin/sumber`: daftar sumber, tombol jalankan sekarang, riwayat 20
  run terakhir, dan antrean `source_product_map` yang belum dipetakan.

## Soal cadence bulanan

Bulanan hanya cocok untuk sumber Tier B yang mahal diambil. Untuk Tier A jangan.
Alasannya bukan selera: mesin sinyal butuh minimal 4 observasi sebelum
menampilkan apa pun. Pada cadence bulanan, sinyal pertama muncul empat bulan
setelah situs hidup, dan tren 30 hari tidak pernah bisa dihitung karena hanya
ada satu titik dalam 30 hari. Harian pada Tier A tidak menambah ongkos berarti.

## Etika dan batas

Hormati robots.txt. User-Agent jujur yang menyebut nama situs dan alamat kontak.
Maksimal satu request per detik per domain. Yang diambil hanya harga yang memang
dipublikasikan untuk umum. Tidak ada login, tidak ada bypass, tidak ada endpoint
tersembunyi. Cantumkan sumber dan tautan di setiap baris harga hasil scrape.

---

# Mesin sinyal

Rule-based. Tidak ada ML. Empat penggerak: kalender rilis Apple, kurs USD/IDR
(unit inter mengikuti, unit resmi lengket), kalender promo Indonesia, depresiasi
second.

Urutan evaluasi, ambil yang pertama cocok. Semua dihitung pada `sisi = 'jual'`.

```
0. observasi < 4 titik ATAU toko < 2
   -> "Data belum cukup". Gerbang, tidak boleh dilewati.

1. kondisi != 'baru' DAN produk penerus rilis dalam rentang -14..+45 hari
   -> TAHAN. "Generasi baru baru masuk pasar. Unit second biasanya turun
      8-12% dalam 30 hari sesudahnya."

2. tren median 30 hari <= -3%
   -> TAHAN. "Harga pasaran turun X% dalam 30 hari dan belum berhenti."

3. tren median 30 hari >= +2.5%
   -> BELI. "Harga pasaran naik X% dalam 30 hari."
      Jika garansi = 'inter' dan usd_idr naik > 2% dalam 30 hari, tambahkan
      kalimat kurs.

4. ada market_event 'promo' dalam 75 hari ke depan untuk kategori ini
   -> TAHAN. "Harga datar dan {label} tinggal N hari lagi."

5. selain itu -> NETRAL.
```

Angka 8-12% pada aturan 1 adalah asumsi awal. Setelah dua siklus rilis, ganti
dengan angka yang dihitung dari data sendiri dan catat di kode bahwa sudah
berbasis data.

Sinyal dihitung di server, disimpan di `sinyal_cache`, klien tidak punya logika
harga.

---

# Halaman

| Rute | Akses | Isi |
|---|---|---|
| `/` | publik | Sorotan selisih terbesar, filter, daftar grup |
| `/p/[slug]` | publik | Satu produk, grafik 90 hari, bid dan ask, sinyal |
| `/toko/[id]` | publik | Semua harga satu penjual |
| `/catat` | kontributor | Input harga cepat dari HP |
| `/admin/sumber` | kontributor | Sumber, tombol jalankan, riwayat run, antrean pemetaan |
| `/admin` | kontributor | Produk, penjual, event, data basi |

## `/catat` — fitur yang menentukan

Dipakai sambil berdiri di kios, satu tangan, sinyal jelek.

- Satu layar tanpa scroll: toko, produk, kondisi, grade, harga, simpan.
- Toko terakhir diingat di localStorage dan terisi otomatis.
- Produk sebagai daftar tombol besar, diurutkan berdasarkan frekuensi pencatatan
  30 hari terakhir, bukan alfabetis.
- Grade sebagai tiga chip: mulus, standar, ekonomis. Plus toggle fullset.
- Harga: inputMode numeric, format ribuan otomatis.
- Setelah simpan, tampilkan pasaran hari ini dan posisi harga barusan terhadap
  pasaran. Kalau selisihnya di atas 25%, minta konfirmasi sekali sebelum simpan.
- Kalau harga jatuh di bawah harga beli tertinggi platform buyback, tampilkan
  peringatan sekali: harga ini di bawah lantai pasar, pastikan tidak salah ketik
  atau ada minus yang belum dicatat.
- Offline queue di localStorage, kirim ulang saat online, tampilkan jumlah
  antrean.

---

# Fase

Urutan berubah dari versi sebelumnya. Scraper naik ke depan karena Tier A
ternyata feed JSON, bukan parsing HTML — ongkos bangunnya turun drastis dan
hasilnya mengisi situs dengan data nyata sebelum satu pun kios didatangi.

Setiap fase harus lolos `npm run build` dan `tsc --noEmit`.

- **F1** Skema penuh, migrasi, RLS, seed 10 produk Apple dan penjual awal.
- **F2** Adapter Shopify + tabel sources + halaman `/admin/sumber` +
  `POST /api/scrape/run`. Isi satu sumber Tier A. Belum ada UI publik.
  Setelah fase ini database sudah berisi harga nyata.
- **F3** Halaman `/` dari database: grup, median, vonis, bar posisi, filter.
- **F4** `/catat`. Setelah ini data Tier D bisa masuk setiap hari.
- **F5** Riwayat: `pasaran_harian`, cron refresh, grafik 90 hari, perubahan 30
  hari, titik kesegaran.
- **F6** Sisi beli. Adapter untuk sumber buyback, baris bid-ask di UI, peringatan
  lantai pasar di `/catat`.
- **F7** Supabase Realtime.
- **F8** Mesin sinyal, `market_events`, `fx_rates`.
- **F9** Halaman produk dan toko, OG image, sitemap.
- **F10** Adapter HTML untuk sumber Tier B yang tidak punya jalur JSON.

---

# Aturan kepercayaan

1. Setiap harga menampilkan kapan terakhir dicek. Lebih dari 7 hari ditandai dan
   dikeluarkan dari perhitungan median.
2. Setiap harga hasil scrape mencantumkan sumber dan tautan ke halaman aslinya.
3. Tidak ada sinyal tanpa alasan yang bisa dibaca.
4. Tidak ada sinyal di bawah 4 observasi.
5. Grup dengan satu toko tidak ditampilkan sebagai perbandingan.
6. Kata "prediksi" tidak dipakai di UI. Yang dipakai: tren, kalender, pasaran,
   kecenderungan.
7. Harga beli dan harga jual selalu diberi label eksplisit dan tidak pernah
   dibandingkan langsung seolah setara.
8. Footer menyatakan ini bukan saran keuangan.
9. Nama penjual ditulis apa adanya, tidak ada yang diberi posisi khusus. Kalau
   nanti ada yang membayar, ditandai jelas sebagai iklan dan tidak ikut median.
