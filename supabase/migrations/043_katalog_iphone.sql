-- 043_katalog_iphone.sql
-- Pendataan iPhone diselesaikan: seluruh generasi yang masih diperdagangkan
-- di pasar bekas Jabodetabek, lengkap dengan varian kapasitasnya.
--
-- Yang diisi di sini HANYA spesifikasi -- fakta tetap yang bisa dicek publik:
-- tanggal rilis, bentuk muka, jumlah kamera, bahan rangka, ukuran layar,
-- kapasitas yang pernah dijual, dan warna resmi.
--
-- Yang TIDAK diisi di sini: harga rilis Indonesia dan harga rilis global
-- untuk model-model baru ini. Saya tidak punya sumber yang bisa
-- dipertanggungjawabkan untuk dua puluh angka sekaligus, dan menebaknya
-- berarti menanam jangkar sejarah palsu yang tidak akan pernah ketahuan
-- salahnya. Anak tangga "harga rilis" memang tidak dirender kalau kosong --
-- itu perilaku yang dirancang, bukan kerusakan. Lihat docs/DATA-PRODUK.md
-- bagian 4 butir 4.
--
-- Harga rilis yang SUDAH ada dari 033/035 tidak disentuh.

insert into products (kategori, model, varian, slug, rilis_at, bentuk) values
  ('iphone', 'iPhone 11', '64GB', 'iphone-11-64gb', '2019-09-20', jsonb_build_object('keluarga','iphone','siluet',jsonb_build_object('muka','notch-lebar','kamera',2,'bahan','aluminium','layar_inci',6.1))),
  ('iphone', 'iPhone 11', '128GB', 'iphone-11-128gb', '2019-09-20', jsonb_build_object('keluarga','iphone','siluet',jsonb_build_object('muka','notch-lebar','kamera',2,'bahan','aluminium','layar_inci',6.1))),
  ('iphone', 'iPhone 11', '256GB', 'iphone-11-256gb', '2019-09-20', jsonb_build_object('keluarga','iphone','siluet',jsonb_build_object('muka','notch-lebar','kamera',2,'bahan','aluminium','layar_inci',6.1))),
  ('iphone', 'iPhone 11 Pro', '64GB', 'iphone-11-pro-64gb', '2019-09-20', jsonb_build_object('keluarga','iphone','siluet',jsonb_build_object('muka','notch-lebar','kamera',3,'bahan','baja','layar_inci',5.8))),
  ('iphone', 'iPhone 11 Pro', '256GB', 'iphone-11-pro-256gb', '2019-09-20', jsonb_build_object('keluarga','iphone','siluet',jsonb_build_object('muka','notch-lebar','kamera',3,'bahan','baja','layar_inci',5.8))),
  ('iphone', 'iPhone 11 Pro', '512GB', 'iphone-11-pro-512gb', '2019-09-20', jsonb_build_object('keluarga','iphone','siluet',jsonb_build_object('muka','notch-lebar','kamera',3,'bahan','baja','layar_inci',5.8))),
  ('iphone', 'iPhone 11 Pro Max', '64GB', 'iphone-11-pro-max-64gb', '2019-09-20', jsonb_build_object('keluarga','iphone','siluet',jsonb_build_object('muka','notch-lebar','kamera',3,'bahan','baja','layar_inci',6.5))),
  ('iphone', 'iPhone 11 Pro Max', '256GB', 'iphone-11-pro-max-256gb', '2019-09-20', jsonb_build_object('keluarga','iphone','siluet',jsonb_build_object('muka','notch-lebar','kamera',3,'bahan','baja','layar_inci',6.5))),
  ('iphone', 'iPhone 11 Pro Max', '512GB', 'iphone-11-pro-max-512gb', '2019-09-20', jsonb_build_object('keluarga','iphone','siluet',jsonb_build_object('muka','notch-lebar','kamera',3,'bahan','baja','layar_inci',6.5))),
  ('iphone', 'iPhone 12 mini', '64GB', 'iphone-12-mini-64gb', '2020-11-13', jsonb_build_object('keluarga','iphone','siluet',jsonb_build_object('muka','notch','kamera',2,'bahan','aluminium','layar_inci',5.4))),
  ('iphone', 'iPhone 12 mini', '128GB', 'iphone-12-mini-128gb', '2020-11-13', jsonb_build_object('keluarga','iphone','siluet',jsonb_build_object('muka','notch','kamera',2,'bahan','aluminium','layar_inci',5.4))),
  ('iphone', 'iPhone 12 mini', '256GB', 'iphone-12-mini-256gb', '2020-11-13', jsonb_build_object('keluarga','iphone','siluet',jsonb_build_object('muka','notch','kamera',2,'bahan','aluminium','layar_inci',5.4))),
  ('iphone', 'iPhone 12', '64GB', 'iphone-12-64gb', '2020-10-23', jsonb_build_object('keluarga','iphone','siluet',jsonb_build_object('muka','notch','kamera',2,'bahan','aluminium','layar_inci',6.1))),
  ('iphone', 'iPhone 12', '128GB', 'iphone-12-128gb', '2020-10-23', jsonb_build_object('keluarga','iphone','siluet',jsonb_build_object('muka','notch','kamera',2,'bahan','aluminium','layar_inci',6.1))),
  ('iphone', 'iPhone 12', '256GB', 'iphone-12-256gb', '2020-10-23', jsonb_build_object('keluarga','iphone','siluet',jsonb_build_object('muka','notch','kamera',2,'bahan','aluminium','layar_inci',6.1))),
  ('iphone', 'iPhone 12 Pro', '128GB', 'iphone-12-pro-128gb', '2020-10-23', jsonb_build_object('keluarga','iphone','siluet',jsonb_build_object('muka','notch','kamera',3,'bahan','baja','layar_inci',6.1))),
  ('iphone', 'iPhone 12 Pro', '256GB', 'iphone-12-pro-256gb', '2020-10-23', jsonb_build_object('keluarga','iphone','siluet',jsonb_build_object('muka','notch','kamera',3,'bahan','baja','layar_inci',6.1))),
  ('iphone', 'iPhone 12 Pro', '512GB', 'iphone-12-pro-512gb', '2020-10-23', jsonb_build_object('keluarga','iphone','siluet',jsonb_build_object('muka','notch','kamera',3,'bahan','baja','layar_inci',6.1))),
  ('iphone', 'iPhone 12 Pro Max', '128GB', 'iphone-12-pro-max-128gb', '2020-11-13', jsonb_build_object('keluarga','iphone','siluet',jsonb_build_object('muka','notch','kamera',3,'bahan','baja','layar_inci',6.7))),
  ('iphone', 'iPhone 12 Pro Max', '256GB', 'iphone-12-pro-max-256gb', '2020-11-13', jsonb_build_object('keluarga','iphone','siluet',jsonb_build_object('muka','notch','kamera',3,'bahan','baja','layar_inci',6.7))),
  ('iphone', 'iPhone 12 Pro Max', '512GB', 'iphone-12-pro-max-512gb', '2020-11-13', jsonb_build_object('keluarga','iphone','siluet',jsonb_build_object('muka','notch','kamera',3,'bahan','baja','layar_inci',6.7))),
  ('iphone', 'iPhone 13 mini', '128GB', 'iphone-13-mini-128gb', '2021-09-24', jsonb_build_object('keluarga','iphone','siluet',jsonb_build_object('muka','notch','kamera',2,'bahan','aluminium','layar_inci',5.4))),
  ('iphone', 'iPhone 13 mini', '256GB', 'iphone-13-mini-256gb', '2021-09-24', jsonb_build_object('keluarga','iphone','siluet',jsonb_build_object('muka','notch','kamera',2,'bahan','aluminium','layar_inci',5.4))),
  ('iphone', 'iPhone 13 mini', '512GB', 'iphone-13-mini-512gb', '2021-09-24', jsonb_build_object('keluarga','iphone','siluet',jsonb_build_object('muka','notch','kamera',2,'bahan','aluminium','layar_inci',5.4))),
  ('iphone', 'iPhone 13', '128GB', 'iphone-13-128gb', '2021-09-24', jsonb_build_object('keluarga','iphone','siluet',jsonb_build_object('muka','notch','kamera',2,'bahan','aluminium','layar_inci',6.1))),
  ('iphone', 'iPhone 13', '256GB', 'iphone-13-256gb', '2021-09-24', jsonb_build_object('keluarga','iphone','siluet',jsonb_build_object('muka','notch','kamera',2,'bahan','aluminium','layar_inci',6.1))),
  ('iphone', 'iPhone 13', '512GB', 'iphone-13-512gb', '2021-09-24', jsonb_build_object('keluarga','iphone','siluet',jsonb_build_object('muka','notch','kamera',2,'bahan','aluminium','layar_inci',6.1))),
  ('iphone', 'iPhone 13 Pro', '128GB', 'iphone-13-pro-128gb', '2021-09-24', jsonb_build_object('keluarga','iphone','siluet',jsonb_build_object('muka','notch','kamera',3,'bahan','baja','layar_inci',6.1))),
  ('iphone', 'iPhone 13 Pro', '256GB', 'iphone-13-pro-256gb', '2021-09-24', jsonb_build_object('keluarga','iphone','siluet',jsonb_build_object('muka','notch','kamera',3,'bahan','baja','layar_inci',6.1))),
  ('iphone', 'iPhone 13 Pro', '512GB', 'iphone-13-pro-512gb', '2021-09-24', jsonb_build_object('keluarga','iphone','siluet',jsonb_build_object('muka','notch','kamera',3,'bahan','baja','layar_inci',6.1))),
  ('iphone', 'iPhone 13 Pro', '1TB', 'iphone-13-pro-1tb', '2021-09-24', jsonb_build_object('keluarga','iphone','siluet',jsonb_build_object('muka','notch','kamera',3,'bahan','baja','layar_inci',6.1))),
  ('iphone', 'iPhone 13 Pro Max', '128GB', 'iphone-13-pro-max-128gb', '2021-09-24', jsonb_build_object('keluarga','iphone','siluet',jsonb_build_object('muka','notch','kamera',3,'bahan','baja','layar_inci',6.7))),
  ('iphone', 'iPhone 13 Pro Max', '256GB', 'iphone-13-pro-max-256gb', '2021-09-24', jsonb_build_object('keluarga','iphone','siluet',jsonb_build_object('muka','notch','kamera',3,'bahan','baja','layar_inci',6.7))),
  ('iphone', 'iPhone 13 Pro Max', '512GB', 'iphone-13-pro-max-512gb', '2021-09-24', jsonb_build_object('keluarga','iphone','siluet',jsonb_build_object('muka','notch','kamera',3,'bahan','baja','layar_inci',6.7))),
  ('iphone', 'iPhone 13 Pro Max', '1TB', 'iphone-13-pro-max-1tb', '2021-09-24', jsonb_build_object('keluarga','iphone','siluet',jsonb_build_object('muka','notch','kamera',3,'bahan','baja','layar_inci',6.7))),
  ('iphone', 'iPhone 14', '128GB', 'iphone-14-128gb', '2022-09-16', jsonb_build_object('keluarga','iphone','siluet',jsonb_build_object('muka','notch','kamera',2,'bahan','aluminium','layar_inci',6.1))),
  ('iphone', 'iPhone 14', '256GB', 'iphone-14-256gb', '2022-09-16', jsonb_build_object('keluarga','iphone','siluet',jsonb_build_object('muka','notch','kamera',2,'bahan','aluminium','layar_inci',6.1))),
  ('iphone', 'iPhone 14', '512GB', 'iphone-14-512gb', '2022-09-16', jsonb_build_object('keluarga','iphone','siluet',jsonb_build_object('muka','notch','kamera',2,'bahan','aluminium','layar_inci',6.1))),
  ('iphone', 'iPhone 14 Plus', '128GB', 'iphone-14-plus-128gb', '2022-10-07', jsonb_build_object('keluarga','iphone','siluet',jsonb_build_object('muka','notch','kamera',2,'bahan','aluminium','layar_inci',6.7))),
  ('iphone', 'iPhone 14 Plus', '256GB', 'iphone-14-plus-256gb', '2022-10-07', jsonb_build_object('keluarga','iphone','siluet',jsonb_build_object('muka','notch','kamera',2,'bahan','aluminium','layar_inci',6.7))),
  ('iphone', 'iPhone 14 Plus', '512GB', 'iphone-14-plus-512gb', '2022-10-07', jsonb_build_object('keluarga','iphone','siluet',jsonb_build_object('muka','notch','kamera',2,'bahan','aluminium','layar_inci',6.7))),
  ('iphone', 'iPhone 14 Pro', '128GB', 'iphone-14-pro-128gb', '2022-09-16', jsonb_build_object('keluarga','iphone','siluet',jsonb_build_object('muka','island','kamera',3,'bahan','baja','layar_inci',6.1))),
  ('iphone', 'iPhone 14 Pro', '256GB', 'iphone-14-pro-256gb', '2022-09-16', jsonb_build_object('keluarga','iphone','siluet',jsonb_build_object('muka','island','kamera',3,'bahan','baja','layar_inci',6.1))),
  ('iphone', 'iPhone 14 Pro', '512GB', 'iphone-14-pro-512gb', '2022-09-16', jsonb_build_object('keluarga','iphone','siluet',jsonb_build_object('muka','island','kamera',3,'bahan','baja','layar_inci',6.1))),
  ('iphone', 'iPhone 14 Pro', '1TB', 'iphone-14-pro-1tb', '2022-09-16', jsonb_build_object('keluarga','iphone','siluet',jsonb_build_object('muka','island','kamera',3,'bahan','baja','layar_inci',6.1))),
  ('iphone', 'iPhone 14 Pro Max', '128GB', 'iphone-14-pro-max-128gb', '2022-09-16', jsonb_build_object('keluarga','iphone','siluet',jsonb_build_object('muka','island','kamera',3,'bahan','baja','layar_inci',6.7))),
  ('iphone', 'iPhone 14 Pro Max', '256GB', 'iphone-14-pro-max-256gb', '2022-09-16', jsonb_build_object('keluarga','iphone','siluet',jsonb_build_object('muka','island','kamera',3,'bahan','baja','layar_inci',6.7))),
  ('iphone', 'iPhone 14 Pro Max', '512GB', 'iphone-14-pro-max-512gb', '2022-09-16', jsonb_build_object('keluarga','iphone','siluet',jsonb_build_object('muka','island','kamera',3,'bahan','baja','layar_inci',6.7))),
  ('iphone', 'iPhone 14 Pro Max', '1TB', 'iphone-14-pro-max-1tb', '2022-09-16', jsonb_build_object('keluarga','iphone','siluet',jsonb_build_object('muka','island','kamera',3,'bahan','baja','layar_inci',6.7))),
  ('iphone', 'iPhone 15', '128GB', 'iphone-15-128gb', '2023-09-22', jsonb_build_object('keluarga','iphone','siluet',jsonb_build_object('muka','island','kamera',2,'bahan','aluminium','layar_inci',6.1))),
  ('iphone', 'iPhone 15', '256GB', 'iphone-15-256gb', '2023-09-22', jsonb_build_object('keluarga','iphone','siluet',jsonb_build_object('muka','island','kamera',2,'bahan','aluminium','layar_inci',6.1))),
  ('iphone', 'iPhone 15', '512GB', 'iphone-15-512gb', '2023-09-22', jsonb_build_object('keluarga','iphone','siluet',jsonb_build_object('muka','island','kamera',2,'bahan','aluminium','layar_inci',6.1))),
  ('iphone', 'iPhone 15 Plus', '128GB', 'iphone-15-plus-128gb', '2023-09-22', jsonb_build_object('keluarga','iphone','siluet',jsonb_build_object('muka','island','kamera',2,'bahan','aluminium','layar_inci',6.7))),
  ('iphone', 'iPhone 15 Plus', '256GB', 'iphone-15-plus-256gb', '2023-09-22', jsonb_build_object('keluarga','iphone','siluet',jsonb_build_object('muka','island','kamera',2,'bahan','aluminium','layar_inci',6.7))),
  ('iphone', 'iPhone 15 Plus', '512GB', 'iphone-15-plus-512gb', '2023-09-22', jsonb_build_object('keluarga','iphone','siluet',jsonb_build_object('muka','island','kamera',2,'bahan','aluminium','layar_inci',6.7))),
  ('iphone', 'iPhone 15 Pro', '128GB', 'iphone-15-pro-128gb', '2023-09-22', jsonb_build_object('keluarga','iphone','siluet',jsonb_build_object('muka','island','kamera',3,'bahan','titanium','layar_inci',6.1))),
  ('iphone', 'iPhone 15 Pro', '256GB', 'iphone-15-pro-256gb', '2023-09-22', jsonb_build_object('keluarga','iphone','siluet',jsonb_build_object('muka','island','kamera',3,'bahan','titanium','layar_inci',6.1))),
  ('iphone', 'iPhone 15 Pro', '512GB', 'iphone-15-pro-512gb', '2023-09-22', jsonb_build_object('keluarga','iphone','siluet',jsonb_build_object('muka','island','kamera',3,'bahan','titanium','layar_inci',6.1))),
  ('iphone', 'iPhone 15 Pro', '1TB', 'iphone-15-pro-1tb', '2023-09-22', jsonb_build_object('keluarga','iphone','siluet',jsonb_build_object('muka','island','kamera',3,'bahan','titanium','layar_inci',6.1))),
  ('iphone', 'iPhone 15 Pro Max', '256GB', 'iphone-15-pro-max-256gb', '2023-09-22', jsonb_build_object('keluarga','iphone','siluet',jsonb_build_object('muka','island','kamera',3,'bahan','titanium','layar_inci',6.7))),
  ('iphone', 'iPhone 15 Pro Max', '512GB', 'iphone-15-pro-max-512gb', '2023-09-22', jsonb_build_object('keluarga','iphone','siluet',jsonb_build_object('muka','island','kamera',3,'bahan','titanium','layar_inci',6.7))),
  ('iphone', 'iPhone 15 Pro Max', '1TB', 'iphone-15-pro-max-1tb', '2023-09-22', jsonb_build_object('keluarga','iphone','siluet',jsonb_build_object('muka','island','kamera',3,'bahan','titanium','layar_inci',6.7))),
  ('iphone', 'iPhone 16e', '128GB', 'iphone-16e-128gb', '2025-02-28', jsonb_build_object('keluarga','iphone','siluet',jsonb_build_object('muka','notch','kamera',1,'bahan','aluminium','layar_inci',6.1))),
  ('iphone', 'iPhone 16e', '256GB', 'iphone-16e-256gb', '2025-02-28', jsonb_build_object('keluarga','iphone','siluet',jsonb_build_object('muka','notch','kamera',1,'bahan','aluminium','layar_inci',6.1))),
  ('iphone', 'iPhone 16e', '512GB', 'iphone-16e-512gb', '2025-02-28', jsonb_build_object('keluarga','iphone','siluet',jsonb_build_object('muka','notch','kamera',1,'bahan','aluminium','layar_inci',6.1))),
  ('iphone', 'iPhone 16', '128GB', 'iphone-16-128gb', '2024-09-20', jsonb_build_object('keluarga','iphone','siluet',jsonb_build_object('muka','island','kamera',2,'bahan','aluminium','layar_inci',6.1))),
  ('iphone', 'iPhone 16', '256GB', 'iphone-16-256gb', '2024-09-20', jsonb_build_object('keluarga','iphone','siluet',jsonb_build_object('muka','island','kamera',2,'bahan','aluminium','layar_inci',6.1))),
  ('iphone', 'iPhone 16', '512GB', 'iphone-16-512gb', '2024-09-20', jsonb_build_object('keluarga','iphone','siluet',jsonb_build_object('muka','island','kamera',2,'bahan','aluminium','layar_inci',6.1))),
  ('iphone', 'iPhone 16 Plus', '128GB', 'iphone-16-plus-128gb', '2024-09-20', jsonb_build_object('keluarga','iphone','siluet',jsonb_build_object('muka','island','kamera',2,'bahan','aluminium','layar_inci',6.7))),
  ('iphone', 'iPhone 16 Plus', '256GB', 'iphone-16-plus-256gb', '2024-09-20', jsonb_build_object('keluarga','iphone','siluet',jsonb_build_object('muka','island','kamera',2,'bahan','aluminium','layar_inci',6.7))),
  ('iphone', 'iPhone 16 Plus', '512GB', 'iphone-16-plus-512gb', '2024-09-20', jsonb_build_object('keluarga','iphone','siluet',jsonb_build_object('muka','island','kamera',2,'bahan','aluminium','layar_inci',6.7))),
  ('iphone', 'iPhone 16 Pro', '128GB', 'iphone-16-pro-128gb', '2024-09-20', jsonb_build_object('keluarga','iphone','siluet',jsonb_build_object('muka','island','kamera',3,'bahan','titanium','layar_inci',6.3))),
  ('iphone', 'iPhone 16 Pro', '256GB', 'iphone-16-pro-256gb', '2024-09-20', jsonb_build_object('keluarga','iphone','siluet',jsonb_build_object('muka','island','kamera',3,'bahan','titanium','layar_inci',6.3))),
  ('iphone', 'iPhone 16 Pro', '512GB', 'iphone-16-pro-512gb', '2024-09-20', jsonb_build_object('keluarga','iphone','siluet',jsonb_build_object('muka','island','kamera',3,'bahan','titanium','layar_inci',6.3))),
  ('iphone', 'iPhone 16 Pro', '1TB', 'iphone-16-pro-1tb', '2024-09-20', jsonb_build_object('keluarga','iphone','siluet',jsonb_build_object('muka','island','kamera',3,'bahan','titanium','layar_inci',6.3))),
  ('iphone', 'iPhone 16 Pro Max', '256GB', 'iphone-16-pro-max-256gb', '2024-09-20', jsonb_build_object('keluarga','iphone','siluet',jsonb_build_object('muka','island','kamera',3,'bahan','titanium','layar_inci',6.9))),
  ('iphone', 'iPhone 16 Pro Max', '512GB', 'iphone-16-pro-max-512gb', '2024-09-20', jsonb_build_object('keluarga','iphone','siluet',jsonb_build_object('muka','island','kamera',3,'bahan','titanium','layar_inci',6.9))),
  ('iphone', 'iPhone 16 Pro Max', '1TB', 'iphone-16-pro-max-1tb', '2024-09-20', jsonb_build_object('keluarga','iphone','siluet',jsonb_build_object('muka','island','kamera',3,'bahan','titanium','layar_inci',6.9)))
on conflict (model, varian) do update
  set rilis_at = excluded.rilis_at,
      -- zona hotspot yang sudah ada dipertahankan, siluet diperbarui
      bentuk = products.bentuk || excluded.bentuk;

-- Rantai penerus: dipakai meminjam rasio komponen ke satu generasi sebelah.
update products p set penerus_id = q.id
  from products q where q.model = 'iPhone 12' and q.varian = p.varian and p.model = 'iPhone 11';
update products p set penerus_id = q.id
  from products q where q.model = 'iPhone 12 Pro' and q.varian = p.varian and p.model = 'iPhone 11 Pro';
update products p set penerus_id = q.id
  from products q where q.model = 'iPhone 12 Pro Max' and q.varian = p.varian and p.model = 'iPhone 11 Pro Max';
update products p set penerus_id = q.id
  from products q where q.model = 'iPhone 13' and q.varian = p.varian and p.model = 'iPhone 12';
update products p set penerus_id = q.id
  from products q where q.model = 'iPhone 13 mini' and q.varian = p.varian and p.model = 'iPhone 12 mini';
update products p set penerus_id = q.id
  from products q where q.model = 'iPhone 13 Pro' and q.varian = p.varian and p.model = 'iPhone 12 Pro';
update products p set penerus_id = q.id
  from products q where q.model = 'iPhone 13 Pro Max' and q.varian = p.varian and p.model = 'iPhone 12 Pro Max';
update products p set penerus_id = q.id
  from products q where q.model = 'iPhone 14' and q.varian = p.varian and p.model = 'iPhone 13';
update products p set penerus_id = q.id
  from products q where q.model = 'iPhone 14 Pro' and q.varian = p.varian and p.model = 'iPhone 13 Pro';
update products p set penerus_id = q.id
  from products q where q.model = 'iPhone 14 Pro Max' and q.varian = p.varian and p.model = 'iPhone 13 Pro Max';
update products p set penerus_id = q.id
  from products q where q.model = 'iPhone 15' and q.varian = p.varian and p.model = 'iPhone 14';
update products p set penerus_id = q.id
  from products q where q.model = 'iPhone 15 Plus' and q.varian = p.varian and p.model = 'iPhone 14 Plus';
update products p set penerus_id = q.id
  from products q where q.model = 'iPhone 15 Pro' and q.varian = p.varian and p.model = 'iPhone 14 Pro';
update products p set penerus_id = q.id
  from products q where q.model = 'iPhone 15 Pro Max' and q.varian = p.varian and p.model = 'iPhone 14 Pro Max';
update products p set penerus_id = q.id
  from products q where q.model = 'iPhone 16' and q.varian = p.varian and p.model = 'iPhone 15';
update products p set penerus_id = q.id
  from products q where q.model = 'iPhone 16 Plus' and q.varian = p.varian and p.model = 'iPhone 15 Plus';
update products p set penerus_id = q.id
  from products q where q.model = 'iPhone 16 Pro' and q.varian = p.varian and p.model = 'iPhone 15 Pro';
update products p set penerus_id = q.id
  from products q where q.model = 'iPhone 16 Pro Max' and q.varian = p.varian and p.model = 'iPhone 15 Pro Max';

-- Warna resmi. Hex adalah perkiraan visual untuk ditampilkan di layar,
-- BUKAN kode warna resmi Apple -- halaman produk menyatakan itu. Tidak ada
-- kolom selisih harga di sini dan jangan pernah ditambahkan: warna tidak
-- menggerakkan harga, kapasitas yang menggerakkan.
insert into product_colors (product_id, nama, hex)
select p.id, w.nama, w.hex from products p
cross join (values
  ('Midnight', '#232a31'),
  ('Starlight', '#faf6f2'),
  ('Biru', '#a0b4c7'),
  ('Ungu', '#e5ddea'),
  ('Merah', '#a52a35'),
  ('Kuning', '#f8e08e')
) as w(nama, hex)
where p.model = 'iPhone 14'
  and not exists (select 1 from product_colors c where c.product_id = p.id and c.nama = w.nama);
insert into product_colors (product_id, nama, hex)
select p.id, w.nama, w.hex from products p
cross join (values
  ('Midnight', '#232a31'),
  ('Starlight', '#faf6f2'),
  ('Biru', '#a0b4c7'),
  ('Ungu', '#e5ddea'),
  ('Merah', '#a52a35'),
  ('Kuning', '#f8e08e')
) as w(nama, hex)
where p.model = 'iPhone 14 Plus'
  and not exists (select 1 from product_colors c where c.product_id = p.id and c.nama = w.nama);
insert into product_colors (product_id, nama, hex)
select p.id, w.nama, w.hex from products p
cross join (values
  ('Space Black', '#2f2f31'),
  ('Silver', '#f0f2f2'),
  ('Gold', '#f5e2c8'),
  ('Deep Purple', '#635a6b')
) as w(nama, hex)
where p.model = 'iPhone 14 Pro'
  and not exists (select 1 from product_colors c where c.product_id = p.id and c.nama = w.nama);
insert into product_colors (product_id, nama, hex)
select p.id, w.nama, w.hex from products p
cross join (values
  ('Space Black', '#2f2f31'),
  ('Silver', '#f0f2f2'),
  ('Gold', '#f5e2c8'),
  ('Deep Purple', '#635a6b')
) as w(nama, hex)
where p.model = 'iPhone 14 Pro Max'
  and not exists (select 1 from product_colors c where c.product_id = p.id and c.nama = w.nama);
insert into product_colors (product_id, nama, hex)
select p.id, w.nama, w.hex from products p
cross join (values
  ('Hitam', '#3c3c3d'),
  ('Biru', '#d5dee0'),
  ('Hijau', '#d0dcd3'),
  ('Kuning', '#eee7cd'),
  ('Pink', '#f0d5d7')
) as w(nama, hex)
where p.model = 'iPhone 15'
  and not exists (select 1 from product_colors c where c.product_id = p.id and c.nama = w.nama);
insert into product_colors (product_id, nama, hex)
select p.id, w.nama, w.hex from products p
cross join (values
  ('Hitam', '#3c3c3d'),
  ('Biru', '#d5dee0'),
  ('Hijau', '#d0dcd3'),
  ('Kuning', '#eee7cd'),
  ('Pink', '#f0d5d7')
) as w(nama, hex)
where p.model = 'iPhone 15 Plus'
  and not exists (select 1 from product_colors c where c.product_id = p.id and c.nama = w.nama);
insert into product_colors (product_id, nama, hex)
select p.id, w.nama, w.hex from products p
cross join (values
  ('Natural Titanium', '#bcb6ae'),
  ('Blue Titanium', '#5f6d7c'),
  ('White Titanium', '#f2f1ed'),
  ('Black Titanium', '#40403f')
) as w(nama, hex)
where p.model = 'iPhone 15 Pro'
  and not exists (select 1 from product_colors c where c.product_id = p.id and c.nama = w.nama);
insert into product_colors (product_id, nama, hex)
select p.id, w.nama, w.hex from products p
cross join (values
  ('Natural Titanium', '#bcb6ae'),
  ('Blue Titanium', '#5f6d7c'),
  ('White Titanium', '#f2f1ed'),
  ('Black Titanium', '#40403f')
) as w(nama, hex)
where p.model = 'iPhone 15 Pro Max'
  and not exists (select 1 from product_colors c where c.product_id = p.id and c.nama = w.nama);
insert into product_colors (product_id, nama, hex)
select p.id, w.nama, w.hex from products p
cross join (values
  ('Hitam', '#35373a'),
  ('Putih', '#f3f3f1'),
  ('Pink', '#f3ccd6'),
  ('Teal', '#c5d8d6'),
  ('Ultramarine', '#b8c3e8')
) as w(nama, hex)
where p.model = 'iPhone 16'
  and not exists (select 1 from product_colors c where c.product_id = p.id and c.nama = w.nama);
insert into product_colors (product_id, nama, hex)
select p.id, w.nama, w.hex from products p
cross join (values
  ('Hitam', '#35373a'),
  ('Putih', '#f3f3f1'),
  ('Pink', '#f3ccd6'),
  ('Teal', '#c5d8d6'),
  ('Ultramarine', '#b8c3e8')
) as w(nama, hex)
where p.model = 'iPhone 16 Plus'
  and not exists (select 1 from product_colors c where c.product_id = p.id and c.nama = w.nama);
insert into product_colors (product_id, nama, hex)
select p.id, w.nama, w.hex from products p
cross join (values
  ('Black Titanium', '#3b3b3d'),
  ('Natural Titanium', '#c2bcb2'),
  ('White Titanium', '#f3f2ee'),
  ('Desert Titanium', '#c0a894')
) as w(nama, hex)
where p.model = 'iPhone 16 Pro'
  and not exists (select 1 from product_colors c where c.product_id = p.id and c.nama = w.nama);
insert into product_colors (product_id, nama, hex)
select p.id, w.nama, w.hex from products p
cross join (values
  ('Black Titanium', '#3b3b3d'),
  ('Natural Titanium', '#c2bcb2'),
  ('White Titanium', '#f3f2ee'),
  ('Desert Titanium', '#c0a894')
) as w(nama, hex)
where p.model = 'iPhone 16 Pro Max'
  and not exists (select 1 from product_colors c where c.product_id = p.id and c.nama = w.nama);
insert into product_colors (product_id, nama, hex)
select p.id, w.nama, w.hex from products p
cross join (values
  ('Hitam', '#35373a'),
  ('Putih', '#f3f3f1')
) as w(nama, hex)
where p.model = 'iPhone 16e'
  and not exists (select 1 from product_colors c where c.product_id = p.id and c.nama = w.nama);
