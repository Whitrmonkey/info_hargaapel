-- 002_views.sql
-- Harga terkini per kombinasi, dan agregat harian untuk grafik/riwayat.
-- Sesuai hargaapel-SPEC.md bagian "View di 002", dengan satu koreksi: SPEC.md
-- menulis "where koreksi_atas is null" untuk menyaring baris yang sudah basi.
-- Itu terbalik -- koreksi_atas diisi di baris BARU (koreksi), bukan di baris
-- lama yang dikoreksi, jadi filter itu justru membuang koreksinya dan
-- menyimpan angka yang salah. Yang benar: buang baris yang SUDAH DIRUJUK
-- sebagai koreksi_atas oleh baris lain (baris itu sudah digantikan).

create view harga_terkini as
select distinct on (product_id, seller_id, sisi, kondisi, grade, garansi)
  id, product_id, seller_id, sisi, kondisi, grade, garansi,
  fullset, harga, catatan, perlu_verifikasi, observed_at
from price_observations
where id not in (select koreksi_atas from price_observations where koreksi_atas is not null)
order by product_id, seller_id, sisi, kondisi, grade, garansi, observed_at desc;

create materialized view pasaran_harian as
select
  product_id, sisi, kondisi, grade, garansi,
  date_trunc('day', observed_at)::date as tanggal,
  percentile_cont(0.5) within group (order by harga)::bigint as median,
  min(harga) as terendah,
  max(harga) as tertinggi,
  count(distinct seller_id) as jumlah_toko
from price_observations
where id not in (select koreksi_atas from price_observations where koreksi_atas is not null)
group by 1,2,3,4,5,6;

create unique index on pasaran_harian (product_id, sisi, kondisi, grade, garansi, tanggal);
