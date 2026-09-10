-- 006_price_observations_url.sql
-- Aturan kepercayaan #2 (SPEC.md): "Setiap harga hasil scrape mencantumkan
-- sumber dan tautan ke halaman aslinya." Skema awal tidak punya kolom untuk
-- tautan itu walau adapter (shopify.ts) sudah menghitungnya per item.
-- Tambahan kolom, nullable -- baris manual (Tier D) memang tidak punya
-- tautan, dan itu sah.

alter table price_observations add column url text;

-- Postgres hanya mengizinkan CREATE OR REPLACE VIEW menambah kolom di UJUNG
-- daftar select -- menyisipkannya di tengah dibaca sebagai rename kolom yang
-- sudah ada dan ditolak. "url" karena itu ditaruh paling belakang.
create or replace view harga_terkini as
select distinct on (product_id, seller_id, sisi, kondisi, grade, garansi)
  id, product_id, seller_id, sisi, kondisi, grade, garansi,
  fullset, harga, catatan, perlu_verifikasi, observed_at, url
from price_observations
where id not in (select koreksi_atas from price_observations where koreksi_atas is not null)
order by product_id, seller_id, sisi, kondisi, grade, garansi, observed_at desc;
