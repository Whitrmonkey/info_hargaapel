-- 037_siluet.sql
-- Indeks seri (/[keluarga]) menggambar siluet tiap generasi DARI ATRIBUT
-- PRODUK, bukan dari foto dan bukan dari kode yang di-hardcode per model.
-- Yang disimpan cuma dua sifat yang membedakan bentuknya di mata orang:
-- bentuk muka (poni atau Dynamic Island) dan jumlah kamera belakang.
-- Keduanya spesifikasi perangkat yang bisa dicek publik, bukan data pasar.

update products set bentuk = bentuk || jsonb_build_object('siluet', v.siluet) from (values
  ('a0000000-0000-0000-0000-000000000001'::uuid, '{"muka":"island","kamera":3}'::jsonb),  -- iPhone 16 Pro Max
  ('a0000000-0000-0000-0000-000000000002'::uuid, '{"muka":"island","kamera":3}'::jsonb),  -- iPhone 16 Pro
  ('a0000000-0000-0000-0000-000000000003'::uuid, '{"muka":"island","kamera":2}'::jsonb),  -- iPhone 16
  ('a0000000-0000-0000-0000-000000000004'::uuid, '{"muka":"island","kamera":2}'::jsonb),  -- iPhone 15
  ('a0000000-0000-0000-0000-000000000005'::uuid, '{"muka":"notch","kamera":2}'::jsonb),   -- iPhone 14
  ('a0000000-0000-0000-0000-000000000006'::uuid, '{"muka":"polos","kamera":1}'::jsonb),   -- iPad Air 11" M3
  ('a0000000-0000-0000-0000-000000000007'::uuid, '{"muka":"polos","kamera":1}'::jsonb),   -- iPad (11th gen)
  ('a0000000-0000-0000-0000-000000000008'::uuid, '{"muka":"polos","kamera":1}'::jsonb),   -- MacBook Air 13" M4
  ('a0000000-0000-0000-0000-000000000009'::uuid, '{"muka":"polos","kamera":0}'::jsonb)    -- Apple Watch Series 10
) as v(id, siluet) where products.id = v.id;
