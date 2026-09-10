-- 036_spesimen_gambar.sql
-- Framewall: komponen disajikan sebagai spesimen bergambar dalam bingkai.
-- Nama gambar disimpan di tabel supaya bisa dipetakan ulang tanpa deploy,
-- dan supaya dua jenis komponen boleh berbagi satu gambar.
-- Kode gambarnya sendiri ada di src/components/spesimen/, satu berkas per
-- komponen.

alter table component_types add column gambar text;

comment on column component_types.gambar is
  'Nama gambar spesimen di src/components/spesimen/. Diagram fungsi, bukan tampilan fisik part.';

-- Pola sama dengan part_grades.penjelasan dan board_grades.penjelasan:
-- kalimat yang ditampilkan ke pembaca saat spesimen dibuka. Isinya sifat
-- TEKNIS komponen yang tidak berubah -- bukan klaim harga, bukan
-- perbandingan angka. Yang berupa angka selalu datang dari data terpantau.
alter table component_types add column penjelasan text;

update component_types set gambar = case kode
  when 'mesin'           then 'mesin'
  when 'layar'           then 'layar'
  when 'baterai'         then 'baterai'
  when 'kamera_belakang' then 'kamera'
  when 'kamera_depan'    then 'kamera_depan'
  when 'backglass'       then 'kaca'
  when 'tombol'          then 'tombol'
end;

update component_types set penjelasan = case kode
  when 'mesin' then
    'Nilainya bergantung pada fungsi apa yang masih hidup, bukan pada hidup atau matinya. Tekan untuk melihat rinciannya per tingkat.'
  when 'layar' then
    'Dijual per jenis panel, dan jenis panel inilah yang paling sering tidak disebutkan saat menawar. Tanyakan panelnya apa sebelum setuju.'
  when 'baterai' then
    'Dijual per jenis part. Yang bukan asli Apple biasanya tidak menampilkan persentase kesehatan baterai di iOS.'
  when 'kamera_belakang' then
    'Dijual sepasang dalam satu modul. Terpisah ada, tapi jarang dan tidak selalu lebih murah.'
  when 'kamera_depan' then
    'Satu flex dengan sensor jarak. Pada unit ber-Face ID, penggantiannya bersinggungan dengan modul Face ID.'
  when 'backglass' then
    'Umumnya dijual sudah menyatu dengan frame. Kalau hanya kacanya, pengerjaannya bersinggungan dengan jalur antena.'
  when 'tombol' then
    'Volume, power, dan saklar bisu ada dalam satu flexible, jadi biasanya diganti sebagai satu set.'
  when 'faceid' then
    'Berpasangan dengan mesin sejak pabrik. Diambil dari unit lain berarti Face ID mati permanen, dan itu tidak bisa dipulihkan dengan penggantian part.'
  when 'konektor' then
    'Satu flex dengan mikrofon bawah, jadi sering diganti bersamaan meski yang rusak hanya salah satunya.'
end;

-- Dua jenis komponen yang belum ada di 030 tapi memang diperdagangkan
-- terpisah di Jakarta, dan dua-duanya punya sifat yang perlu dijelaskan
-- sendiri (Face ID berpasangan dengan mesin sejak pabrik; konektor cas satu
-- flex dengan mikrofon bawah). Tanpa angka harga -- itu tetap harus datang
-- dari pencatatan nyata, sama seperti seluruh seed komponen di 030.
insert into component_types (kode, nama, kategori_grade, urutan, gambar, penjelasan) values
  ('faceid',   'Modul Face ID', 'umum', 8, 'faceid',
    'Berpasangan dengan mesin sejak pabrik. Diambil dari unit lain berarti Face ID mati permanen, dan itu tidak bisa dipulihkan dengan penggantian part.'),
  ('konektor', 'Konektor cas',  'umum', 9, 'konektor',
    'Satu flex dengan mikrofon bawah, jadi sering diganti bersamaan meski yang rusak hanya salah satunya.');
