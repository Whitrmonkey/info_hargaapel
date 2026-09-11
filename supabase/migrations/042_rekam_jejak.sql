-- 042_rekam_jejak.sql
-- Rekam jejak publik butuh satu angka dari penilaian_laporan: berapa laporan
-- seseorang yang diragukan pembaca lain. Tapi penilaian per orang TIDAK
-- PERNAH boleh terbaca publik (bagian 8), jadi angkanya diambil lewat view
-- agregat, bukan dengan melonggarkan RLS tabelnya.
--
-- Yang keluar cuma hitungan per laporan. Siapa yang meragukan, dan dengan
-- alasan apa, tetap tidak terbaca siapa pun selain penilainya sendiri dan
-- service role.

create view penilaian_agregat as
select
  laporan_id,
  count(*) filter (where nilai = 'masuk_akal')::int as masuk_akal,
  count(*) filter (where nilai = 'meragukan')::int  as meragukan
from penilaian_laporan
group by laporan_id;

grant select on penilaian_agregat to anon, authenticated;
