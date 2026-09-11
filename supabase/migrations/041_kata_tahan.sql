-- 041_kata_tahan.sql
-- Aturan tunggal diskusi: bantah datanya, jangan orangnya, dan jangan
-- tokonya.
--
-- Kata tuduhan MENAHAN kiriman untuk ditinjau, bukan memblokirnya. Penulis
-- diberi tahu alasannya dan diberi kesempatan menyusun ulang. Daftar katanya
-- di tabel, bukan di kode, supaya bisa disetel tanpa deploy.
--
-- Ini bukan kehalusan berlebihan. Pencemaran nama baik lewat media
-- elektronik diatur pidana di Indonesia, laporannya mudah dibuat, dan
-- sasarannya termasuk pengelola tempat tulisan itu terbit.

create table kata_tahan (
  kata       text primary key,
  catatan    text,
  aktif      boolean not null default true,
  ditambah_at timestamptz not null default now()
);

alter table kata_tahan enable row level security;

create policy kata_tahan_select_publik on kata_tahan
  for select to anon, authenticated using (aktif);
-- Tidak ada policy tulis: daftarnya hanya disetel lewat service role.

-- Riwayat penyuntingan disimpan. Kiriman yang diubah setelah dibalas
-- menampilkan penanda, dan isi lamanya tidak hilang.
create table diskusi_revisi (
  id         bigserial primary key,
  diskusi_id bigint not null references diskusi(id) on delete cascade,
  isi_lama   text not null,
  disunting_at timestamptz not null default now()
);

create index on diskusi_revisi (diskusi_id, disunting_at desc);

alter table diskusi_revisi enable row level security;

create policy revisi_select_publik on diskusi_revisi
  for select to anon, authenticated using (true);
-- Tulis hanya lewat service role, bersamaan dengan penyuntingannya.

insert into kata_tahan (kata, catatan) values
  ('penipu',   'tuduhan langsung ke orang atau toko'),
  ('penipuan', 'tuduhan langsung ke orang atau toko'),
  ('nipu',     'bentuk percakapan dari menipu'),
  ('menipu',   'tuduhan langsung ke orang atau toko'),
  ('tipu',     'akar kata tuduhan'),
  ('bodong',   'tuduhan barang atau usaha tidak sah'),
  ('scam',     'tuduhan langsung, serapan'),
  ('scammer',  'tuduhan langsung, serapan'),
  ('maling',   'tuduhan pidana'),
  ('rampok',   'tuduhan pidana'),
  ('abal',     'tuduhan barang palsu, biasanya "abal-abal"'),
  ('oplosan',  'tuduhan barang dipalsukan');
