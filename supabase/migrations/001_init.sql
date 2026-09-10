-- 001_init.sql
-- Skema inti device: produk, penjual, sumber, dan observasi harga append-only.
-- Sesuai hargaapel-SPEC.md bagian "Skema".

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
