-- 020_akun.sql
-- Akun menambah kemampuan (watchlist, alert), tidak pernah mengunci isi
-- publik (aturan keras #9).

create table profiles (
  id              uuid primary key references auth.users(id) on delete cascade,
  nama            text,
  wa_e164         text,
  wa_terverifikasi boolean not null default false,
  peran           text not null check (peran in ('member','kontributor','admin')) default 'member',
  created_at      timestamptz not null default now()
);

create table watchlists (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  jenis           text not null check (jenis in ('device','servis')),
  product_id      uuid references products(id),
  kondisi         text check (kondisi in ('baru','second','refurb')),
  grade           text check (grade in ('mulus','standar','ekonomis')),
  garansi         text check (garansi in ('resmi','inter','toko')),
  service_type_id uuid references service_types(id),
  part_grade_id   uuid references part_grades(id),
  target_harga    bigint,
  kanal           text not null check (kanal in ('email','wa')) default 'email',
  aktif           boolean not null default true,
  created_at      timestamptz not null default now()
);

create table alert_deliveries (
  id          uuid primary key default gen_random_uuid(),
  watchlist_id uuid not null references watchlists(id) on delete cascade,
  harga_pemicu bigint not null,
  kanal       text not null check (kanal in ('email','wa')),
  status      text not null check (status in ('terkirim','gagal','menunggu')),
  dikirim_at  timestamptz not null default now()
);

create table wa_broadcast_drafts (
  id             uuid primary key default gen_random_uuid(),
  judul          text not null,
  isi            text not null,
  periode_mulai  date not null,
  periode_selesai date not null,
  status         text not null check (status in ('draft','disalin')) default 'draft',
  created_at     timestamptz not null default now()
);

-- Maksimal 20 baris aktif per user, ditegakkan di trigger -- bukan cuma UI.
create function tegakkan_batas_watchlist_aktif()
returns trigger
language plpgsql
as $$
declare
  jumlah int;
begin
  if new.aktif then
    select count(*) into jumlah
    from watchlists
    where user_id = new.user_id and aktif = true and id <> new.id;
    if jumlah >= 20 then
      raise exception 'Maksimal 20 watchlist aktif per akun.';
    end if;
  end if;
  return new;
end;
$$;

create trigger batas_watchlist_aktif
  before insert or update on watchlists
  for each row execute function tegakkan_batas_watchlist_aktif();

alter table profiles enable row level security;
alter table watchlists enable row level security;
alter table alert_deliveries enable row level security;
alter table wa_broadcast_drafts enable row level security;

-- profiles.wa_e164 adalah data pribadi: hanya pemiliknya sendiri yang boleh
-- baca barisnya. Tidak ada select publik sama sekali di tabel ini.
create policy profiles_select_sendiri on profiles
  for select to authenticated using (auth.uid() = id);
create policy profiles_update_sendiri on profiles
  for update to authenticated using (auth.uid() = id);
create policy profiles_insert_sendiri on profiles
  for insert to authenticated with check (auth.uid() = id);

create policy watchlists_select_sendiri on watchlists
  for select to authenticated using (auth.uid() = user_id);
create policy watchlists_insert_sendiri on watchlists
  for insert to authenticated with check (auth.uid() = user_id);
create policy watchlists_update_sendiri on watchlists
  for update to authenticated using (auth.uid() = user_id);

create policy alert_deliveries_select_sendiri on alert_deliveries
  for select to authenticated using (
    exists (select 1 from watchlists w where w.id = watchlist_id and w.user_id = auth.uid())
  );

-- wa_broadcast_drafts bukan data pribadi siapa pun, tapi juga bukan
-- konten publik -- hanya admin yang menyentuhnya, lewat service_role saja.
-- Tidak ada policy anon/authenticated di sini secara sengaja.

-- Profil dibuat otomatis saat user baru mendaftar (magic link), supaya
-- peran default 'member' selalu ada tanpa langkah manual tambahan.
create function buat_profil_baru()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into profiles (id) values (new.id);
  return new;
end;
$$;

create trigger buat_profil_setelah_daftar
  after insert on auth.users
  for each row execute function buat_profil_baru();
