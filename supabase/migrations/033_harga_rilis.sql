-- 033_harga_rilis.sql
-- Jangkar sejarah untuk tangga harga di halaman produk -- bukan harga yang
-- bisa dibeli hari ini, murni referensi "harga rilis resmi Indonesia".
-- Beda dengan price_observations dkk: ini bukan data pasar yang diobservasi,
-- jadi tidak tunduk pada aturan append-only/tanpa-karangan -- tapi tetap
-- ditulis sebagai perkiraan terbaik, bukan angka pasti.
alter table products add column harga_rilis bigint;

update products set harga_rilis = v.harga from (values
  ('a0000000-0000-0000-0000-000000000001'::uuid, 21999000),
  ('a0000000-0000-0000-0000-000000000002'::uuid, 19999000),
  ('a0000000-0000-0000-0000-000000000003'::uuid, 14999000),
  ('a0000000-0000-0000-0000-000000000004'::uuid, 14999000),
  ('a0000000-0000-0000-0000-000000000005'::uuid, 13999000),
  ('a0000000-0000-0000-0000-000000000006'::uuid, 10999000),
  ('a0000000-0000-0000-0000-000000000007'::uuid, 7499000),
  ('a0000000-0000-0000-0000-000000000008'::uuid, 17999000),
  ('a0000000-0000-0000-0000-000000000009'::uuid, 7199000),
  ('a0000000-0000-0000-0000-000000000010'::uuid, 3899000)
) as v(id, harga) where products.id = v.id;
