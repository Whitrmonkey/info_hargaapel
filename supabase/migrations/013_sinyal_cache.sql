-- 013_sinyal_cache.sql
-- Sinyal dihitung server-side (cron), disimpan di sini. Klien tidak pernah
-- menghitung sinyal sendiri (aturan keras #4/#8).

create table sinyal_cache (
  id          uuid primary key default gen_random_uuid(),
  product_id  uuid not null references products(id),
  kondisi     text not null check (kondisi in ('baru','second','refurb')),
  grade       text check (grade in ('mulus','standar','ekonomis')),
  garansi     text not null check (garansi in ('resmi','inter','toko')),
  kode        text not null check (kode in ('sepi','tahan','beli','netral')),
  judul       text not null,
  alasan      text not null,
  dihitung_at timestamptz not null default now(),
  unique (product_id, kondisi, grade, garansi)
);

alter table sinyal_cache enable row level security;

create policy sinyal_cache_select_publik on sinyal_cache
  for select to anon, authenticated using (true);

-- Contoh nyata: dua Harbolnas tahunan (dipakai aturan 4 sinyal.ts). Bukan
-- data spekulatif -- tanggalnya tetap tiap tahun.
insert into market_events (tanggal, label, jenis, kategori) values
  ('2026-11-11', 'Harbolnas 11.11', 'promo', array['iphone','ipad','mac','watch','audio','aksesoris']),
  ('2026-12-12', 'Harbolnas 12.12', 'promo', array['iphone','ipad','mac','watch','audio','aksesoris']);
