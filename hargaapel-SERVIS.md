# hargaapel — SERVIS

Tambahan untuk SPEC.md. Lapisan harga jasa servis Apple di Jabodetabek.
Semua aturan di SPEC.md tetap berlaku kecuali yang dinyatakan berbeda di sini.

---

# Kenapa lapisan ini ada

Harga device masih bisa dicari sendiri. Harga servis tidak ada di mana pun.
Orang masuk ITC Roxy untuk ganti layar, diberi satu angka, dan tidak punya
pembanding apa pun. Jurang informasinya jauh lebih dalam daripada harga unit.

---

# Aturan pembentuk yang menentukan segalanya

## 1. Harga servis TIDAK diturunkan dari harga device

Jangan pernah menghitung harga servis sebagai fungsi dari harga jual unit.
Harga servis digerakkan tiga hal: biaya part, tingkat kesulitan, dan risiko
kerja. Layar iPhone 11 dan iPhone 13 selisih biaya part-nya jauh lebih tipis
daripada selisih harga unitnya. Face ID iPhone 14 Pro mahal karena part-nya
langka, bukan karena unitnya 12 juta.

Harga servis punya observasinya sendiri, dikumpulkan dari bengkel, sama seperti
harga device dikumpulkan dari toko.

## 2. Hubungan yang benar antara dua dataset: rasio kelayakan

```
rasio = harga_servis_median / harga_pasaran_unit_second_grade_standar
```

- rasio < 0.25  -> "Jelas layak diperbaiki"
- 0.25 - 0.50   -> "Masih masuk akal, tapi hitung dulu"
- > 0.50        -> "Biasanya lebih masuk dijual apa adanya lalu ganti unit"

Ini satu-satunya tempat harga device boleh masuk ke perhitungan servis, dan
bentuknya adalah bantuan keputusan untuk pemilik HP, bukan penentuan berapa
seharusnya bengkel memasang harga.

Rasio hanya ditampilkan kalau kedua sisinya punya data cukup. Kalau harga unit
belum ada, rasio disembunyikan, bukan ditebak.

## 3. Grade part adalah kunci grup, sama seperti garansi pada device

Ini pelajaran yang sama persis dengan inter vs resmi. Pasar layar Indonesia
punya tingkatan yang selisihnya bisa tiga sampai empat kali lipat pada model
yang sama:

**Layar**
- `ori_copotan` — panel original bekas unit lain
- `service_pack` — LCD original, kaca diganti (sering disebut refurbish original)
- `hard_oled` — aftermarket kelas atas
- `soft_oled` — aftermarket, umum disebut OLED China
- `incell` — aftermarket LCD, paling murah

**Baterai**
- `ori_copotan`, `service_pack`, `aftermarket`

**Part lain** (kamera, konektor cas, speaker, housing, taptic)
- `ori_copotan`, `aftermarket`

**Kerja board / microsolder** — tidak punya grade part. Dihargai per jenis
kerusakan, bukan per komponen, karena yang dijual adalah kemampuan dan risiko.

Menggabungkan incell dengan service pack dalam satu perhitungan median membuat
seluruh angka bohong. Kunci grup servis:
**produk + jenis_servis + grade_part**.

## 4. Yang ditampilkan adalah harga yang TERPANTAU, bukan harga yang DIANJURKAN

Ini bukan soal gaya bahasa. Ini menentukan apakah situs ini sumber informasi
atau alat penyeragaman harga.

Situs ini mencatat berapa yang dipasang bengkel-bengkel, lalu menampilkan
sebarannya. Situs ini tidak menetapkan berapa yang seharusnya dipasang, tidak
menganjurkan bengkel mengikuti angka tertentu, dan tidak menilai perilaku
bengkel.

Aturan bahasa yang mengikat di seluruh UI dan seluruh salinan teks:

DILARANG:
- "harga yang seharusnya", "harga resmi komunitas", "standar harga", "patokan",
  "acuan wajib", "kiblat harga"
- kalimat apa pun yang ditujukan ke penjual tentang bagaimana ia harus memasang
  harga
- menandai bengkel sebagai nakal, curang, semena-mena, atau merusak harga
- membandingkan bengkel satu dengan bengkel lain dengan penilaian moral

DIPAKAI:
- "dipasang oleh N bengkel yang terpantau"
- "rentang yang umum", "di atas kebanyakan", "di bawah kebanyakan"
- kalimat yang ditujukan ke pembeli tentang apa yang perlu ditanyakan

Alasannya konkret: himpunan penjual yang menyepakati rentang harga bersama, dan
publikasi yang menekan penyimpangan dari rentang itu, masuk wilayah larangan
penetapan harga di UU No. 5 Tahun 1999 tentang larangan praktek monopoli dan
persaingan usaha tidak sehat. Menerbitkan harga yang diamati sepenuhnya berbeda
dan tidak bermasalah. Yang membedakan keduanya hanya framing, dan framing itu
ditentukan sekarang, di file ini, sebelum satu baris kode ditulis.

Konsekuensi paling penting: **peringatan harga murah TIDAK BOLEH berbicara
tentang bengkelnya.** Ia berbicara tentang apa yang mungkin pembeli dapatkan.
Menandai harga rendah sebagai tidak pantas adalah cara sebuah lantai harga
ditegakkan. Menjelaskan bahwa harga rendah biasanya berarti kelas part yang
berbeda adalah informasi yang berguna dan aman.

---

# Skema

```sql
-- 010_servis.sql

create table service_types (
  id          uuid primary key default gen_random_uuid(),
  kategori    text not null check (kategori in
                ('layar','baterai','board','kamera','konektor','housing','audio','software')),
  nama        text not null,              -- 'Ganti layar', 'Mati total'
  slug        text not null unique,
  butuh_grade boolean not null default true,  -- false untuk kerja board
  tingkat     int not null check (tingkat between 1 and 5), -- kesulitan
  deskripsi   text
);

create table part_grades (
  id        uuid primary key default gen_random_uuid(),
  kategori  text not null,   -- 'layar' | 'baterai' | 'umum'
  kode      text not null,   -- 'incell','soft_oled','hard_oled','service_pack','ori_copotan','aftermarket'
  nama      text not null,
  urutan    int not null,    -- 1 = paling rendah
  penjelasan text not null,  -- ditampilkan ke pembeli, wajib diisi
  unique (kategori, kode)
);

create table workshops (
  id         uuid primary key default gen_random_uuid(),
  nama       text not null,
  area       text not null,
  lokasi     text,
  wa         text,
  bisa_board boolean not null default false,
  aktif      boolean not null default true,
  created_at timestamptz not null default now()
);

-- append-only, aturan sama dengan price_observations
create table service_observations (
  id              bigserial primary key,
  workshop_id     uuid not null references workshops(id),
  product_id      uuid not null references products(id),
  service_type_id uuid not null references service_types(id),
  part_grade_id   uuid references part_grades(id),   -- null untuk kerja board
  harga           bigint not null check (harga > 0),
  termasuk_jasa   boolean not null default true,     -- all-in atau part saja
  garansi_hari    int,
  no_fix_no_pay   boolean not null default false,
  catatan         text,
  sumber          text not null check (sumber in ('manual','scraper')),
  perlu_verifikasi boolean not null default false,
  dicatat_by      uuid references auth.users(id),
  koreksi_atas    bigint references service_observations(id),
  observed_at     timestamptz not null default now()
);

create index on service_observations
  (product_id, service_type_id, part_grade_id, observed_at desc);
create index on service_observations (workshop_id, observed_at desc);
```

View sebaran:

```sql
create materialized view sebaran_servis as
select
  product_id, service_type_id, part_grade_id,
  count(distinct workshop_id) as jumlah_bengkel,
  percentile_cont(0.10) within group (order by harga)::bigint as p10,
  percentile_cont(0.25) within group (order by harga)::bigint as p25,
  percentile_cont(0.50) within group (order by harga)::bigint as p50,
  percentile_cont(0.75) within group (order by harga)::bigint as p75,
  percentile_cont(0.90) within group (order by harga)::bigint as p90,
  max(observed_at) as terakhir
from service_observations
where koreksi_atas is null
  and termasuk_jasa = true
  and observed_at > now() - interval '120 days'
group by 1,2,3;
```

Hanya `termasuk_jasa = true` yang masuk sebaran. Harga part saja dan harga
all-in bukan hal yang sama dan tidak pernah dicampur.

---

# Vonis harga servis

Berbeda dari device. Sebaran harga servis miring ke kanan — beberapa bengkel
premium jauh di atas — jadi pakai persentil, bukan rata-rata plus minus persen.

Gerbang: **minimal 5 bengkel** untuk satu kombinasi sebelum vonis apa pun
ditampilkan. Lebih ketat daripada device (yang butuh 2) karena ragam harga
servis jauh lebih besar. Di bawah 5, tampilkan daftar harga apa adanya tanpa
vonis dan tanpa label.

| Posisi | Kode | Judul |
|---|---|---|
| < p10 | `jauh_bawah` | Jauh di bawah kebanyakan |
| p10 – p25 | `bawah` | Di bawah kebanyakan |
| p25 – p75 | `umum` | Di rentang yang umum |
| p75 – p90 | `atas` | Di atas kebanyakan |
| > p90 | `jauh_atas` | Jauh di atas kebanyakan |

Salinan teks, dipakai persis:

**jauh_atas**
> Di atas hampir semua bengkel yang terpantau untuk kelas part yang sama.
> Sebelum setuju, tanyakan apa yang membuatnya berbeda — jenis part-nya apa,
> garansinya berapa lama dan tertulis atau tidak, siapa yang mengerjakan, dan
> apa yang terjadi kalau gagal. Bisa jadi jawabannya masuk akal. Bisa juga
> tidak. Yang penting jawabannya ada.

**atas**
> Di atas kebanyakan. Tanyakan jenis part dan lama garansinya sebelum setuju.

**umum**
> Di rentang yang umum dipasang bengkel untuk kelas part ini.

**bawah**
> Di bawah kebanyakan. Pastikan kelas part-nya sama dengan yang kamu kira.

**jauh_bawah**
> Jauh di bawah hampir semua bengkel. Harga sejauh ini di bawah rentang umum
> biasanya berarti kelas part-nya berbeda dari yang kamu bayangkan, atau ada
> bagian pekerjaan yang tidak dikerjakan. Minta lihat part-nya sebelum
> dipasang, minta garansi tertulis, dan tanyakan apa yang terjadi kalau dalam
> seminggu bermasalah. Murah belum tentu buruk — tapi murah tanpa penjelasan
> layak dipertanyakan.

Perhatikan bahwa kelima teks berbicara kepada pembeli tentang apa yang perlu
ditanyakan. Tidak satu pun menilai bengkelnya. Jangan diubah menjadi penilaian.

---

# Halaman

| Rute | Akses | Isi |
|---|---|---|
| `/servis` | publik | Pilih perangkat lalu jenis kerusakan |
| `/servis/[produk]/[jenis]` | publik | Sebaran per grade part, rasio kelayakan, daftar bengkel |
| `/cek-harga` | publik | Alat: masukkan harga yang ditawarkan, dapat vonis |
| `/catat/servis` | kontributor | Input harga servis dari HP |

## `/cek-harga` — halaman yang akan paling banyak dipakai

Tiga input dan satu jawaban. Ini yang orang buka sambil berdiri di depan konter.

1. Perangkat apa
2. Kerusakan apa
3. Ditawarkan berapa

Keluaran:
- vonis dari tabel di atas, beserta salinan teksnya
- sebaran p10 sampai p90 sebagai bar horizontal, dengan posisi harga yang
  dimasukkan ditandai
- jumlah bengkel yang jadi dasar, dan kapan terakhir diperbarui
- **daftar pertanyaan yang bisa langsung dibacakan ke tukang servis**, disesuaikan
  jenis servisnya. Untuk layar: jenis panel apa, ori copotan atau service pack
  atau aftermarket, garansi berapa lama, kalau ada dead pixel bisa tukar tidak,
  true tone jalan tidak. Untuk baterai: siklus dan kesehatan awalnya berapa,
  ada peringatan baterai tidak di iOS. Untuk board: didiagnosa dulu atau
  langsung ganti, no fix no pay atau tidak, kalau board tambah rusak bagaimana.
- rasio kelayakan kalau harga unitnya ada

Halaman ini harus enak dipakai satu tangan, di dalam mal, sinyal jelek, sambil
ada orang menunggu jawaban.

## `/catat/servis`

Pola sama dengan `/catat` device: bengkel diingat, daftar tombol besar untuk
jenis servis, grade part sebagai chip, harga numerik, toggle all-in dan
no-fix-no-pay, isian garansi hari. Offline queue.

---

# Seed awal

Isi `service_types` dengan minimal ini:

Layar: ganti layar.
Baterai: ganti baterai.
Konektor: ganti konektor cas.
Kamera: ganti kamera belakang, ganti kamera depan.
Audio: ganti speaker, ganti mic.
Housing: ganti casing belakang, ganti kaca belakang.
Board (butuh_grade = false): mati total, tidak mengisi daya, tidak ada sinyal,
tidak ada lampu layar, layar tidak sentuh, Face ID mati, kena air, ganti IC audio.

`part_grades` sesuai daftar di bagian aturan 3, dengan kolom `penjelasan` diisi
kalimat yang bisa dibaca orang awam — kolom itu yang membuat halaman ini
mendidik dan bukan sekadar tabel angka.

**Angka harga awal dikosongkan.** Jangan seed harga servis dengan angka karangan.
Berbeda dengan device, tidak ada sumber online yang bisa dipakai memverifikasi,
jadi angka karangan tidak akan pernah ketahuan salahnya dan akan diam-diam jadi
dasar vonis. Situs menampilkan "belum ada data" sampai ada 5 bengkel nyata
tercatat. Itu keadaan yang benar, bukan kekurangan.
