-- 004_seed.sql
-- Seed katalog: 10 produk Apple dan penjual awal (termasuk satu bertipe
-- buyback). TIDAK ada price_observations di sini — itu data nyata yang
-- masuk lewat scraper (BAGIAN 3) dan /catat (BAGIAN 6), bukan dikarang.

insert into products (id, kategori, model, varian, slug, rilis_at, penerus_id) values
  ('a0000000-0000-0000-0000-000000000001', 'iphone', 'iPhone 16 Pro Max', '256GB', 'iphone-16-pro-max-256gb', '2024-09-20', null),
  ('a0000000-0000-0000-0000-000000000002', 'iphone', 'iPhone 16 Pro',     '128GB', 'iphone-16-pro-128gb',     '2024-09-20', null),
  ('a0000000-0000-0000-0000-000000000003', 'iphone', 'iPhone 16',         '128GB', 'iphone-16-128gb',         '2024-09-20', null),
  ('a0000000-0000-0000-0000-000000000004', 'iphone', 'iPhone 15',         '128GB', 'iphone-15-128gb',         '2023-09-22', 'a0000000-0000-0000-0000-000000000003'),
  ('a0000000-0000-0000-0000-000000000005', 'iphone', 'iPhone 14',         '128GB', 'iphone-14-128gb',         '2022-09-16', 'a0000000-0000-0000-0000-000000000004'),
  ('a0000000-0000-0000-0000-000000000006', 'ipad',   'iPad Air 11" M3',   '128GB WiFi', 'ipad-air-11-m3-128gb-wifi', '2025-03-12', null),
  ('a0000000-0000-0000-0000-000000000007', 'ipad',   'iPad (11th gen)',   '128GB WiFi', 'ipad-11-128gb-wifi',       '2025-03-12', null),
  ('a0000000-0000-0000-0000-000000000008', 'mac',    'MacBook Air 13" M4','16GB/256GB', 'macbook-air-13-m4-16-256gb', '2025-03-12', null),
  ('a0000000-0000-0000-0000-000000000009', 'watch',  'Apple Watch Series 10', '42mm GPS', 'apple-watch-series-10-42mm-gps', '2024-09-20', null),
  ('a0000000-0000-0000-0000-000000000010', 'audio',  'AirPods Pro 3',     'USB-C', 'airpods-pro-3-usb-c', '2025-09-19', null);

insert into sellers (id, nama, tipe, area, lokasi, url) values
  ('b0000000-0000-0000-0000-000000000001', 'iBox Grand Indonesia',              'resmi',       'Jakarta Pusat',    'Grand Indonesia, lt. 3A',        'https://www.ibox.co.id'),
  ('b0000000-0000-0000-0000-000000000002', 'Digimap Pondok Indah Mall',         'resmi',       'Jakarta Selatan',  'Pondok Indah Mall 2, lt. 2',      'https://www.digimap.co.id'),
  ('b0000000-0000-0000-0000-000000000003', 'Eraspace Central Park',            'resmi',       'Jakarta Barat',    'Central Park Mall, lt. GF',       'https://www.eraspace.com'),
  ('b0000000-0000-0000-0000-000000000004', 'Kios ITC Roxy Mas lt.2',           'toko',        'Jakarta Pusat',    'ITC Roxy Mas, lantai 2',          null),
  ('b0000000-0000-0000-0000-000000000005', 'Tokopedia · Gadget Mangga Dua',     'marketplace', 'Jakarta Utara',    null,                              null),
  ('b0000000-0000-0000-0000-000000000006', 'maujual',                          'buyback',     'Jabodetabek',      null,                              'https://maujual.com'),
  ('b0000000-0000-0000-0000-000000000007', 'Perorangan · Tangerang Selatan',    'perorangan',  'Tangerang',        null,                              null);
