-- 045_pasaran_harian_demo.sql
-- pasaran_harian adalah agregat, jadi barisnya tidak membawa sumber atau
-- catatan -- padahal mode data perlu memisahkan angka peragaan dari angka
-- nyata. Tanpa ini, satu-satunya pengaman adalah "jangan muat data demo ke
-- basis data produksi", dan pengaman yang bentuknya kedisiplinan orang
-- cepat atau lambat akan gagal.
--
-- Jalan keluarnya menambah satu dimensi pengelompokan: demo. Dengan begitu
-- angka peragaan dan angka nyata hidup berdampingan di tabel yang sama tapi
-- tidak pernah tercampur dalam satu median, dan lapisan aplikasi tinggal
-- memilih barisnya sesuai mode.

drop materialized view if exists pasaran_harian cascade;

create materialized view pasaran_harian as
select
  product_id, sisi, kondisi, grade, garansi,
  (catatan is not distinct from 'demo') as demo,
  date_trunc('day', observed_at)::date as tanggal,
  percentile_cont(0.5) within group (order by harga)::bigint as median,
  min(harga) as terendah,
  max(harga) as tertinggi,
  count(distinct seller_id) as jumlah_toko
from price_observations
where id not in (select koreksi_atas from price_observations where koreksi_atas is not null)
group by 1,2,3,4,5,6,7;

create unique index on pasaran_harian (product_id, sisi, kondisi, grade, garansi, demo, tanggal);

-- refresh_agregat() ikut terhapus oleh cascade di atas kalau ia bergantung
-- pada view ini, jadi disusun ulang utuh.
create or replace function refresh_agregat() returns void
language plpgsql security definer as $$
begin
  refresh materialized view concurrently pasaran_harian;
  refresh materialized view concurrently sebaran_servis;
  refresh materialized view concurrently rasio_komponen;
end $$;
