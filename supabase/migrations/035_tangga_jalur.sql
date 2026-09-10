-- 035_tangga_jalur.sql
-- Tangga harga disusun ulang menurut JALUR MASUK unit ke Indonesia, bukan
-- menurut kondisi fisiknya. Empat anak tangga: rilis Indonesia, rilis global,
-- bekas jalur resmi, bekas jalur inter.
--
-- Kondisi fisik (mulus/standar/ekonomis) tidak hilang, ia turun jadi dimensi
-- di DALAM tiap anak tangga. Kunci grup pembanding di pasaran.ts tidak
-- berubah: produk + kondisi + grade + garansi. Tidak ada median yang dihitung
-- lintas grade di mana pun.

-- harga_rilis (033) memang selalu berarti "harga rilis kanal resmi Indonesia".
-- Dinamai ulang supaya berpasangan jelas dengan harga_rilis_global.
alter table products rename column harga_rilis to harga_rilis_id;

alter table products add column harga_rilis_global bigint;
alter table products add column kurs_rilis numeric(12,2);

comment on column products.harga_rilis_id is
  'Harga rilis kanal resmi Indonesia dalam RUPIAH, perkiraan terbaik. Bukan data observasi.';
comment on column products.harga_rilis_global is
  'Harga rilis Apple di luar negeri dalam DOLAR AS (bukan rupiah). Rupiahnya dihitung harga_rilis_global * kurs_rilis.';
comment on column products.kurs_rilis is
  'Kurs USD->IDR pada bulan rilis. Dibekukan di sini supaya konversi bisa ditelusuri dan tidak pernah dihitung ulang dengan kurs hari ini.';

-- Harga rilis luar negeri (harga daftar Apple AS, belum termasuk pajak
-- penjualan negara bagian) dan kurs perkiraan pada bulan rilis. Keduanya
-- catatan publik, sama sifatnya dengan harga_rilis_id di 033: perkiraan
-- terbaik yang bisa ditelusuri, bukan hasil observasi pasar.
--
-- Selisihnya terhadap harga rilis Indonesia TIDAK selalu positif. Pada
-- barang bertarif bea masuk rendah, harga daftar AS yang belum kena pajak
-- penjualan bisa lebih tinggi dari harga Indonesia yang sudah termasuk PPN.
-- Itu memang begitu adanya dan tidak disembunyikan.
update products set harga_rilis_global = v.usd, kurs_rilis = v.kurs from (values
  ('a0000000-0000-0000-0000-000000000001'::uuid, 1199, 15300.00),  -- iPhone 16 Pro Max 256GB, Sep 2024
  ('a0000000-0000-0000-0000-000000000002'::uuid,  999, 15300.00),  -- iPhone 16 Pro 128GB,     Sep 2024
  ('a0000000-0000-0000-0000-000000000003'::uuid,  799, 15300.00),  -- iPhone 16 128GB,         Sep 2024
  ('a0000000-0000-0000-0000-000000000004'::uuid,  799, 15400.00),  -- iPhone 15 128GB,         Sep 2023
  ('a0000000-0000-0000-0000-000000000005'::uuid,  799, 14900.00),  -- iPhone 14 128GB,         Sep 2022
  ('a0000000-0000-0000-0000-000000000006'::uuid,  599, 16500.00),  -- iPad Air 11" M3,         Mar 2025
  ('a0000000-0000-0000-0000-000000000007'::uuid,  349, 16500.00),  -- iPad (11th gen),         Mar 2025
  ('a0000000-0000-0000-0000-000000000008'::uuid,  999, 16500.00),  -- MacBook Air 13" M4,      Mar 2025
  ('a0000000-0000-0000-0000-000000000009'::uuid,  399, 15300.00),  -- Apple Watch S10 42mm,    Sep 2024
  ('a0000000-0000-0000-0000-000000000010'::uuid,  249, 16400.00)   -- AirPods Pro 3 USB-C,     Sep 2025
) as v(id, usd, kurs) where products.id = v.id;
