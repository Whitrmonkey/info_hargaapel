-- 040_komunitas.sql
-- Skema komunitas sesuai hargaapel-KOMUNITAS.md bagian 8.
--
-- Premisnya: sumbangan paling berharga dari pembaca adalah LAPORAN HARGA,
-- bukan pendapat. Seluruh tabel di bawah tunduk pada satu aturan yang tidak
-- boleh dilanggar mekanisme apa pun: laporan tidak pernah masuk hitungan
-- karena ada yang menyetujuinya. Verifikasi datang dari observasi independen
-- yang masuk SESUDAHNYA, bukan dari suara.

create table blokir_domain (
  domain      text primary key,
  sumber      text,
  ditambah_at timestamptz not null default now()
);

alter table profiles
  add column bergabung_at timestamptz not null default now(),
  add column ditangguhkan_at timestamptz;

create table perangkat_dimiliki (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  product_id  uuid not null references products(id),
  kesehatan_baterai int check (kesehatan_baterai between 1 and 100),
  dinyatakan_at timestamptz not null default now(),
  unique (user_id, product_id)
);

create table reputasi (
  user_id    uuid not null references auth.users(id) on delete cascade,
  kategori   text not null,
  bobot      int not null default 0 check (bobot between 0 and 3),
  terverifikasi int not null default 0,
  meleset    int not null default 0,
  diperbarui_at timestamptz not null default now(),
  primary key (user_id, kategori)
);

create table laporan_harga (
  id             bigserial primary key,
  user_id        uuid not null references auth.users(id),
  product_id     uuid not null references products(id),
  kondisi        text not null,
  grade          text,
  garansi        text not null,
  area           text not null,
  harga_jadi     bigint not null check (harga_jadi > 0),
  harga_buka     bigint check (harga_buka >= harga_jadi),
  tanggal_beli   date,
  kelengkapan    text[],
  catatan        text,
  status         text not null default 'baru'
                 check (status in ('baru','menunggu','terverifikasi','meleset','kedaluwarsa','ditahan')),
  observasi_id   bigint references price_observations(id),
  bobot_saat_lapor int not null default 0,
  dibuat_at      timestamptz not null default now(),
  ditinjau_at    timestamptz
);

create index on laporan_harga (product_id, status, dibuat_at desc);
create index on laporan_harga (user_id, dibuat_at desc);

create table penilaian_laporan (
  laporan_id bigint not null references laporan_harga(id) on delete cascade,
  user_id    uuid not null references auth.users(id) on delete cascade,
  nilai      text not null check (nilai in ('masuk_akal','meragukan')),
  alasan     text check (alasan in ('harga_tidak_masuk_akal','grade_tidak_cocok',
                                    'bukan_pembeli','duplikat','kelengkapan_tidak_jelas')),
  dibuat_at  timestamptz not null default now(),
  primary key (laporan_id, user_id),
  -- Suara meragukan WAJIB punya alasan. Ditegakkan di basis data, bukan
  -- hanya di UI, supaya tidak ada jalur tulis mana pun yang bisa melewatinya.
  check (nilai = 'masuk_akal' or alasan is not null)
);

create table sentimen_harga (
  product_id uuid not null references products(id),
  user_id    uuid not null references auth.users(id) on delete cascade,
  suara      text not null check (suara in ('worth','mahal','tunggu')),
  harga_saat bigint not null,
  dibuat_at  timestamptz not null default now(),
  primary key (product_id, user_id)
);

create table diskusi (
  id         bigserial primary key,
  product_id uuid references products(id),
  induk_id   bigint references diskusi(id) on delete cascade,
  user_id    uuid not null references auth.users(id),
  isi        text not null,
  skor       int not null default 0,
  status     text not null default 'tampil'
             check (status in ('tampil','dilipat','ditahan')),
  disunting_at timestamptz,
  dibuat_at  timestamptz not null default now()
);

create table suara_diskusi (
  diskusi_id bigint not null references diskusi(id) on delete cascade,
  user_id    uuid not null references auth.users(id) on delete cascade,
  arah       smallint not null check (arah in (-1, 1)),
  primary key (diskusi_id, user_id)
);

create table laporan_pelanggaran (
  id         bigserial primary key,
  diskusi_id bigint references diskusi(id) on delete cascade,
  laporan_id bigint references laporan_harga(id) on delete cascade,
  user_id    uuid not null references auth.users(id),
  alasan     text not null check (alasan in ('tuduhan','spam','iklan','tidak_relevan','pribadi')),
  dibuat_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- RLS sesuai bagian 8. Yang per-orang tidak pernah terbaca publik.
-- ---------------------------------------------------------------------------

alter table blokir_domain        enable row level security;
alter table perangkat_dimiliki   enable row level security;
alter table reputasi             enable row level security;
alter table laporan_harga        enable row level security;
alter table penilaian_laporan    enable row level security;
alter table sentimen_harga       enable row level security;
alter table diskusi              enable row level security;
alter table suara_diskusi        enable row level security;
alter table laporan_pelanggaran  enable row level security;

-- blokir_domain: tidak ada policy sama sekali. Hanya service role yang
-- membacanya, saat memeriksa pendaftaran dan saat cron menyegarkannya.

-- Akun yang ditangguhkan tidak boleh menulis apa pun.
create function akun_aktif() returns boolean language sql stable security definer
set search_path = public as $$
  select exists (
    select 1 from profiles
    where id = auth.uid() and ditangguhkan_at is null
  );
$$;

create policy laporan_select_publik on laporan_harga
  for select to anon, authenticated using (status <> 'ditahan');
create policy laporan_insert_sendiri on laporan_harga
  for insert to authenticated with check (auth.uid() = user_id and akun_aktif());
-- Tidak ada policy update/delete: status laporan hanya boleh digerakkan
-- service role lewat cron verifikasi. Pemilik pun tidak bisa mengubahnya.

create policy reputasi_select_publik on reputasi
  for select to anon, authenticated using (true);
-- Tidak ada policy tulis: bobot hanya dihitung ulang oleh service role.

create policy diskusi_select_publik on diskusi
  for select to anon, authenticated using (status <> 'ditahan');
create policy diskusi_insert_sendiri on diskusi
  for insert to authenticated with check (auth.uid() = user_id and akun_aktif());
create policy diskusi_update_sendiri on diskusi
  for update to authenticated using (auth.uid() = user_id and akun_aktif());

create policy penilaian_select_sendiri on penilaian_laporan
  for select to authenticated using (auth.uid() = user_id);
create policy penilaian_insert_sendiri on penilaian_laporan
  for insert to authenticated with check (auth.uid() = user_id and akun_aktif());

create policy suara_diskusi_select_sendiri on suara_diskusi
  for select to authenticated using (auth.uid() = user_id);
create policy suara_diskusi_insert_sendiri on suara_diskusi
  for insert to authenticated with check (auth.uid() = user_id and akun_aktif());
create policy suara_diskusi_update_sendiri on suara_diskusi
  for update to authenticated using (auth.uid() = user_id and akun_aktif());

create policy sentimen_select_sendiri on sentimen_harga
  for select to authenticated using (auth.uid() = user_id);
create policy sentimen_insert_sendiri on sentimen_harga
  for insert to authenticated with check (auth.uid() = user_id and akun_aktif());
create policy sentimen_update_sendiri on sentimen_harga
  for update to authenticated using (auth.uid() = user_id and akun_aktif());

create policy pelanggaran_insert_sendiri on laporan_pelanggaran
  for insert to authenticated with check (auth.uid() = user_id and akun_aktif());
-- Tidak ada policy select: isi laporan pelanggaran tidak pernah terbaca publik.

create policy perangkat_select_sendiri on perangkat_dimiliki
  for select to authenticated using (auth.uid() = user_id);
create policy perangkat_insert_sendiri on perangkat_dimiliki
  for insert to authenticated with check (auth.uid() = user_id and akun_aktif());
create policy perangkat_delete_sendiri on perangkat_dimiliki
  for delete to authenticated using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Tampilan publik: agregat saja, tidak pernah per orang.
-- ---------------------------------------------------------------------------

-- Sentimen dibaca publik sebagai hitungan per pilihan. Siapa memilih apa
-- tidak pernah ikut keluar.
create view sentimen_agregat as
select product_id, suara, count(*)::int as jumlah, max(dibuat_at) as terakhir
from sentimen_harga
group by product_id, suara;

-- Profil publik: hanya nama tampilan dan tanggal bergabung. Sisa isi
-- profiles (wa_e164, peran, dan lain-lain) tidak pernah ikut.
create view profil_publik as
select id, nama, bergabung_at
from profiles
where ditangguhkan_at is null;

grant select on sentimen_agregat to anon, authenticated;
grant select on profil_publik to anon, authenticated;

-- Penanda pemilik: benar/salah saja, tanpa kesehatan baterai dan tanpa
-- tanggal, karena yang perlu diketahui pembaca cuma "ia memang punya".
create view penanda_pemilik as
select user_id, product_id from perangkat_dimiliki;

grant select on penanda_pemilik to anon, authenticated;
