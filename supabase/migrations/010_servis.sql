-- 010_servis.sql
-- Lapisan harga servis. Adendum atas skema device, sesuai
-- hargaapel-SERVIS.md. Harga servis TIDAK diturunkan dari harga device
-- (lihat SERVIS.md aturan 1) -- tabel ini punya observasinya sendiri.

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
where id not in (select koreksi_atas from service_observations where koreksi_atas is not null)
  and termasuk_jasa = true
  and observed_at > now() - interval '120 days'
group by 1,2,3;

-- RLS: select publik untuk keempat tabel. service_observations append-only,
-- update/delete ditolak eksplisit sama seperti price_observations.

alter table service_types        enable row level security;
alter table part_grades          enable row level security;
alter table workshops            enable row level security;
alter table service_observations enable row level security;

create policy service_types_select_publik on service_types
  for select to anon, authenticated using (true);

create policy part_grades_select_publik on part_grades
  for select to anon, authenticated using (true);

create policy workshops_select_publik on workshops
  for select to anon, authenticated using (true);

create policy service_observations_select_publik on service_observations
  for select to anon, authenticated using (true);

create policy service_observations_no_update on service_observations
  for update to anon, authenticated using (false);

create policy service_observations_no_delete on service_observations
  for delete to anon, authenticated using (false);

-- Seed taksonomi servis. TIDAK ADA seed angka harga (service_observations
-- kosong) -- lihat SERVIS.md bagian "Seed awal" untuk alasannya: tidak ada
-- sumber online untuk memverifikasi angka karangan servis.

insert into service_types (kategori, nama, slug, butuh_grade, tingkat, deskripsi) values
  ('layar',    'Ganti layar',            'ganti-layar',            true,  2, 'Mengganti panel layar yang pecah, bergaris, atau tidak responsif.'),
  ('baterai',  'Ganti baterai',          'ganti-baterai',          true,  1, 'Mengganti baterai yang kesehatannya sudah menurun atau cepat habis.'),
  ('konektor', 'Ganti konektor cas',     'ganti-konektor-cas',     true,  2, 'Mengganti port charging yang longgar, kotor parah, atau tidak mengisi daya.'),
  ('kamera',   'Ganti kamera belakang',  'ganti-kamera-belakang',  true,  3, 'Mengganti modul kamera belakang yang buram, error, atau tidak fokus.'),
  ('kamera',   'Ganti kamera depan',     'ganti-kamera-depan',     true,  2, 'Mengganti kamera depan yang buram atau tidak berfungsi.'),
  ('audio',    'Ganti speaker',         'ganti-speaker',          true,  2, 'Mengganti speaker yang pecah suara, redup, atau mati.'),
  ('audio',    'Ganti mic',             'ganti-mic',              true,  2, 'Mengganti mikrofon yang membuat suara saat telepon tidak terdengar jelas.'),
  ('housing',  'Ganti casing belakang', 'ganti-casing-belakang',  true,  3, 'Mengganti bodi/casing belakang yang penyok atau retak parah.'),
  ('housing',  'Ganti kaca belakang',   'ganti-kaca-belakang',    true,  2, 'Mengganti kaca belakang yang pecah tanpa mengganti seluruh casing.'),
  ('board',    'Mati total',            'mati-total',             false, 4, 'Diagnosa dan perbaikan board saat unit tidak menyala sama sekali.'),
  ('board',    'Tidak mengisi daya',    'tidak-mengisi-daya',     false, 3, 'Diagnosa dan perbaikan board saat unit tidak mau mengisi daya walau konektor normal.'),
  ('board',    'Tidak ada sinyal',      'tidak-ada-sinyal',       false, 4, 'Diagnosa dan perbaikan board saat unit tidak mendapat sinyal operator.'),
  ('board',    'Tidak ada lampu layar', 'tidak-ada-lampu-layar',  false, 4, 'Diagnosa dan perbaikan board saat layar gelap total padahal unit menyala.'),
  ('board',    'Layar tidak sentuh',    'layar-tidak-sentuh',     false, 3, 'Diagnosa dan perbaikan board saat layar menyala tapi tidak merespons sentuhan.'),
  ('board',    'Face ID mati',          'face-id-mati',           false, 5, 'Diagnosa dan perbaikan board untuk Face ID yang berhenti berfungsi.'),
  ('board',    'Kena air',              'kena-air',               false, 4, 'Diagnosa dan pembersihan board setelah unit terkena air atau cairan.'),
  ('board',    'Ganti IC audio',        'ganti-ic-audio',         false, 4, 'Diagnosa dan perbaikan board saat suara hilang total dan bukan karena speaker.');

insert into part_grades (kategori, kode, nama, urutan, penjelasan) values
  ('layar', 'incell',       'Incell',                        1, 'Panel pengganti termurah. Warna dan kecerahan biasanya kurang presisi dibanding layar asli, cocok untuk pemakaian sehari-hari dengan anggaran terbatas.'),
  ('layar', 'soft_oled',    'Soft OLED (OLED China)',        2, 'Panel OLED aftermarket yang umum disebut "OLED China". Kualitas warna sudah cukup dekat dengan aslinya, harganya jauh di bawah part original.'),
  ('layar', 'hard_oled',    'Hard OLED',                     3, 'Panel OLED aftermarket kelas atas. Warna dan ketahanan lebih baik dari soft OLED, tapi tetap buatan pihak ketiga, bukan part Apple.'),
  ('layar', 'service_pack', 'Service pack (refurbish original)', 4, 'Panel asli Apple yang kacanya sudah diganti ulang oleh penyedia part. Kualitas tampilan mendekati baru karena panel di dalamnya memang asli.'),
  ('layar', 'ori_copotan',  'Original copotan',              5, 'Panel asli Apple yang dicopot utuh dari unit lain, tanpa dibongkar ulang. Kualitas setara bawaan pabrik, tapi riwayat pemakaian unit asalnya tidak selalu diketahui.'),
  ('baterai', 'aftermarket',   'Aftermarket',        1, 'Baterai buatan pihak ketiga, bukan Apple. Kapasitas biasanya sesuai klaim di kemasan, tapi daya tahan jangka panjangnya belum tentu sama dengan baterai asli.'),
  ('baterai', 'service_pack',  'Service pack',       2, 'Baterai asli Apple yang disediakan khusus untuk servis dalam kondisi baru. Kualitas dan keamanannya setara baterai bawaan pabrik.'),
  ('baterai', 'ori_copotan',   'Original copotan',   3, 'Baterai asli Apple yang dicopot dari unit lain. Sehat atau tidaknya tergantung riwayat pemakaian unit asalnya -- tanyakan persentase kesehatan baterainya sebelum setuju.'),
  ('umum', 'aftermarket', 'Aftermarket',      1, 'Part buatan pihak ketiga, bukan Apple. Biasanya berfungsi normal, tapi kualitas dan daya tahan bisa bervariasi antar merek.'),
  ('umum', 'ori_copotan',  'Original copotan', 2, 'Part asli Apple yang dicopot dari unit lain. Fungsi dan kualitas setara bawaan pabrik, karena memang part yang sama.');
