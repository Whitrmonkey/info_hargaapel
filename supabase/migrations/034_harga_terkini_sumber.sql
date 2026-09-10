-- 034_harga_terkini_sumber.sql
-- harga_terkini butuh kolom "sumber" supaya lapisan tampilan tahu mana yang
-- boleh disebut namanya (scraper, menerbitkan sendiri) dan mana yang wajib
-- anonim (manual, aturan keras 5). Ditambah di ujung daftar select --
-- lihat catatan di 006_price_observations_url.sql soal urutan kolom view.
create or replace view harga_terkini as
select distinct on (product_id, seller_id, sisi, kondisi, grade, garansi)
  id, product_id, seller_id, sisi, kondisi, grade, garansi,
  fullset, harga, catatan, perlu_verifikasi, observed_at, url, sumber
from price_observations
where id not in (select koreksi_atas from price_observations where koreksi_atas is not null)
order by product_id, seller_id, sisi, kondisi, grade, garansi, observed_at desc;
