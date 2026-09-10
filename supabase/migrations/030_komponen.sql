-- 030_komponen.sql
-- Nilai komponen bekas, sesuai hargaapel-KOMPONEN.md. Disimpan dan
-- ditampilkan sebagai RASIO terhadap harga unit second grade standar --
-- rupiahnya dihitung saat render (lihat src/lib/komponen.ts), bukan
-- disimpan sebagai angka mati.

create table component_types (
  id             uuid primary key default gen_random_uuid(),
  kode           text not null unique,   -- 'mesin','layar','baterai','housing','kamera_belakang'
  nama           text not null,
  kategori_grade text not null,          -- 'mesin' | 'layar' | 'baterai' | 'umum'
  urutan         int not null
);

create table board_grades (
  id         uuid primary key default gen_random_uuid(),
  kode       text not null unique
             check (kode in ('normal','minus_faceid','minus_sinyal',
                             'minus_touch','minus_multi','matot')),
  nama       text not null,
  urutan     int not null,   -- 1 = paling rendah nilainya
  penjelasan text not null
);

-- append-only, aturan sama dengan tabel observasi lain
create table component_observations (
  id                bigserial primary key,
  seller_id         uuid not null references sellers(id),
  product_id        uuid not null references products(id),
  component_type_id uuid not null references component_types(id),
  board_grade_id    uuid references board_grades(id),  -- hanya untuk mesin
  part_grade_id     uuid references part_grades(id),   -- untuk komponen non-mesin
  harga             bigint not null check (harga > 0),
  catatan           text,
  sumber            text not null check (sumber in ('manual','scraper')),
  perlu_verifikasi  boolean not null default false,
  dicatat_by        uuid references auth.users(id),
  koreksi_atas      bigint references component_observations(id),
  observed_at       timestamptz not null default now(),
  check (
    (board_grade_id is not null and part_grade_id is null) or
    (board_grade_id is null and part_grade_id is not null)
  )
);

create index on component_observations
  (product_id, component_type_id, board_grade_id, part_grade_id, observed_at desc);

-- Data recovery dan sejenisnya (pembukaan iCloud, pemulihan sandi): harganya
-- digerakkan nilai DATA bagi pemilik, bukan nilai perangkat. Tidak pernah
-- masuk rasio, kelayakan, margin, atau median jenis servis lain.
alter table service_types add column abaikan_rasio boolean not null default false;

-- KOMPONEN.md menulis "where koreksi_atas is null" di sini juga -- salah arah
-- yang sama seperti di 002_views.sql/010_servis.sql: koreksi_atas diisi di
-- baris koreksi (baru), bukan di baris lama yang dikoreksi. Diperbaiki jadi
-- "buang baris yang sudah dirujuk sebagai koreksi_atas oleh baris lain".
create materialized view rasio_komponen as
with unit as (
  select product_id,
         percentile_cont(0.5) within group (order by harga)::bigint as harga_unit
  from price_observations
  where id not in (select koreksi_atas from price_observations where koreksi_atas is not null)
    and sisi = 'jual' and kondisi = 'second' and grade = 'standar'
    and observed_at > now() - interval '60 days'
  group by product_id
)
select
  k.product_id, k.component_type_id, k.board_grade_id, k.part_grade_id,
  count(distinct k.seller_id) as jumlah_penjual,
  percentile_cont(0.5) within group (order by k.harga)::bigint as harga_komponen,
  u.harga_unit,
  round(
    percentile_cont(0.5) within group (order by k.harga)::numeric
    / nullif(u.harga_unit,0), 4
  ) as rasio,
  max(k.observed_at) as terakhir
from component_observations k
join unit u on u.product_id = k.product_id
where k.id not in (select koreksi_atas from component_observations where koreksi_atas is not null)
  and k.observed_at > now() - interval '120 days'
group by k.product_id, k.component_type_id, k.board_grade_id,
         k.part_grade_id, u.harga_unit;

create unique index on rasio_komponen (product_id, component_type_id, board_grade_id, part_grade_id);

alter table component_types        enable row level security;
alter table board_grades           enable row level security;
alter table component_observations enable row level security;

create policy component_types_select_publik on component_types
  for select to anon, authenticated using (true);

create policy board_grades_select_publik on board_grades
  for select to anon, authenticated using (true);

create policy component_observations_select_publik on component_observations
  for select to anon, authenticated using (true);

create policy component_observations_no_update on component_observations
  for update to anon, authenticated using (false);

create policy component_observations_no_delete on component_observations
  for delete to anon, authenticated using (false);

-- Seed taksonomi. TIDAK ADA seed angka harga komponen -- lihat KOMPONEN.md
-- bagian 8: tidak ada sumber online untuk memverifikasi harga part bekas,
-- jadi angka karangan tidak akan pernah ketahuan salahnya.

insert into component_types (kode, nama, kategori_grade, urutan) values
  ('mesin',           'Mesin',              'mesin',  1),
  ('layar',           'Layar',              'layar',  2),
  ('baterai',         'Baterai',            'baterai',3),
  ('kamera_belakang', 'Kamera belakang',    'umum',   4),
  ('kamera_depan',    'Kamera depan',       'umum',   5),
  ('backglass',       'Kaca belakang',      'umum',   6),
  ('tombol',          'Set tombol',         'umum',   7);

insert into board_grades (kode, nama, urutan, penjelasan) values
  ('matot',         'Mati total',            1, 'Mati total dan tidak menyala sama sekali. Nilainya tinggal sebagai sumber part untuk unit lain.'),
  ('minus_multi',   'Minus lebih dari satu', 2, 'Ada lebih dari satu kerusakan sekaligus di luar yang disebutkan pada grade lain.'),
  ('minus_sinyal',  'Minus sinyal',          3, 'Tidak bisa menangkap sinyal operator sama sekali. Biasanya masalah di jalur baseband.'),
  ('minus_touch',   'Minus touch',           4, 'Layar menyala tapi tidak merespons sentuhan. Perlu layar dan digitizer diganti untuk dipakai normal lagi.'),
  ('minus_faceid',  'Minus Face ID',         5, 'Semua fungsi jalan kecuali Face ID. Masih bisa dipakai harian dengan kode sandi.'),
  ('normal',        'Normal',                6, 'Seluruh fungsi jalan, termasuk sinyal, layar sentuh, dan Face ID. Kondisi mesin paling bernilai.');
