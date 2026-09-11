-- Membersihkan seluruh data peragaan. Data nyata tidak tersentuh karena
-- semua baris demo ditandai catatan = 'demo' atau memakai id/awalan 'Demo'.
begin;
delete from penilaian_laporan where laporan_id in (select id from laporan_harga where catatan = 'demo');
delete from laporan_harga  where catatan = 'demo';
delete from component_observations where catatan = 'demo';
delete from price_observations     where catatan = 'demo';
delete from suara_diskusi   where diskusi_id in (select id from diskusi where isi like '%(demo)');
delete from diskusi_revisi  where diskusi_id in (select id from diskusi where isi like '%(demo)');
delete from diskusi         where isi like '%(demo)';
delete from sentimen_harga  where user_id in (select id from profiles where nama like 'Demo %');
delete from auth.users      where email like 'demo-%@contoh.test';
delete from sellers         where nama like 'Demo %';
select refresh_agregat();
commit;
