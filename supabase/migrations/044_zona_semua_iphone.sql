-- 044_zona_semua_iphone.sql
-- Setelah 043, ada 78 baris iPhone tapi hanya lima yang punya zona hotspot,
-- jadi tujuh puluh tiga halaman produk jatuh ke siluet generik tanpa bagian
-- yang bisa ditekan. Zona itu diwariskan ke seluruh iPhone di sini.
--
-- Zona depan menyesuaikan bentuk muka: model ber-Dynamic Island punya pil
-- kecil di tengah atas, model berponi punya takik lebar. Sisanya sama,
-- karena tata letak fisik iPhone memang tidak banyak berubah dan halaman
-- produk sudah menyatakan bahwa skema ini diagram fungsi, bukan tata letak
-- papan yang sebenarnya.

-- Zona depan untuk model berponi (iPhone 11 sampai 14 non-Pro, dan 16e).
update products set bentuk = bentuk || jsonb_build_object('zona_depan', jsonb_build_array(
  jsonb_build_object('id','screen','component_kode','layar','nama','Layar','x',12,'y',28,'w',96,'h',200),
  jsonb_build_object('id','notch','component_kode','kamera_depan','nama','Kamera depan dan Face ID','x',36,'y',8,'w',48,'h',19),
  jsonb_build_object('id','buttons','component_kode','tombol','nama','Set tombol','x',-1,'y',44,'w',8,'h',78)
))
where kategori = 'iphone' and bentuk->'siluet'->>'muka' in ('notch','notch-lebar');

-- Zona depan untuk model ber-Dynamic Island: pilnya lebih kecil dan tidak
-- menempel ke tepi atas.
update products set bentuk = bentuk || jsonb_build_object('zona_depan', jsonb_build_array(
  jsonb_build_object('id','screen','component_kode','layar','nama','Layar','x',12,'y',24,'w',96,'h',204),
  jsonb_build_object('id','notch','component_kode','kamera_depan','nama','Kamera depan dan Face ID','x',44,'y',13,'w',32,'h',12),
  jsonb_build_object('id','buttons','component_kode','tombol','nama','Set tombol','x',-1,'y',44,'w',8,'h',78)
))
where kategori = 'iphone' and bentuk->'siluet'->>'muka' = 'island';

-- Zona belakang: modul kamera mengikuti jumlah lensanya, sisanya kaca.
update products set bentuk = bentuk || jsonb_build_object('zona_belakang', jsonb_build_array(
  jsonb_build_object('id','camera','component_kode','kamera_belakang','nama','Kamera belakang','x',12,'y',12,'w',50,'h',50),
  jsonb_build_object('id','glass','component_kode','backglass','nama','Kaca belakang','x',12,'y',70,'w',96,'h',158)
))
where kategori = 'iphone' and bentuk->'zona_belakang' is null;

-- Zona mesin: sama untuk seluruh iPhone, karena yang digambarkan fungsi,
-- bukan tata letak papan yang sebenarnya.
update products p set bentuk = p.bentuk
  || jsonb_build_object('zona_mesin_depan',  s.bentuk->'zona_mesin_depan')
  || jsonb_build_object('zona_mesin_belakang', s.bentuk->'zona_mesin_belakang')
from products s
where s.slug = 'iphone-14-128gb'
  and p.kategori = 'iphone'
  and p.bentuk->'zona_mesin_depan' is null
  and s.bentuk->'zona_mesin_depan' is not null;
