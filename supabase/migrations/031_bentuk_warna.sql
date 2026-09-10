-- 031_bentuk_warna.sql
-- Atribut yang menggerakkan ilustrasi (SPEC.md "Bentuk antarmuka") dan bola
-- warna. Warna TIDAK memengaruhi harga -- product_colors sengaja tidak
-- punya kolom delta harga sama sekali.

alter table products add column bentuk jsonb not null default '{}'::jsonb;

create table product_colors (
  id         uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  nama       text not null,
  hex        text not null,
  rilis_at   date,
  catatan    text
);

create index on product_colors (product_id);

alter table product_colors enable row level security;

create policy product_colors_select_publik on product_colors
  for select to anon, authenticated using (true);

-- Bentuk iPhone: geometri diadaptasi dari harga-apel-produk.jsx (mockup
-- acuan visual). Dipakai bersama untuk seluruh lini iPhone di katalog ini --
-- notch iPhone 14/15/16 cukup mirip untuk satu set zona yang sama; Dynamic
-- Island yang lebih presisi bisa menyusul sebagai keluarga terpisah nanti.
-- Kategori lain (ipad/mac/watch/audio) sengaja dikosongkan dulu: ilustrasi
-- tampil sebagai siluet polos tanpa zona tekan, tapi blok "Nilai per
-- komponen" tetap jalan karena tidak bergantung pada ilustrasi.
update products set bentuk = '{
  "keluarga": "iphone",
  "zona_depan": [
    {"id":"screen","component_kode":"layar","nama":"Layar","x":12,"y":28,"w":96,"h":200},
    {"id":"notch","component_kode":"kamera_depan","nama":"Kamera depan dan Face ID","x":36,"y":8,"w":48,"h":19},
    {"id":"buttons","component_kode":"tombol","nama":"Set tombol","x":-1,"y":44,"w":8,"h":78}
  ],
  "zona_belakang": [
    {"id":"camera","component_kode":"kamera_belakang","nama":"Kamera belakang","x":12,"y":12,"w":50,"h":50},
    {"id":"battery","component_kode":"baterai","nama":"Baterai","x":22,"y":78,"w":76,"h":92},
    {"id":"glass","component_kode":"backglass","nama":"Kaca belakang","x":8,"y":176,"w":104,"h":56}
  ],
  "zona_mesin_depan": [
    {"id":"konektor_layar","nama":"Konektor layar","x":24,"y":30,"w":78,"h":22,"board_grade":"minus_touch","gejala":"layar tidak sentuh, bergaris, atau mati","ket":"Paling sering rusak karena bongkar pasang layar yang kasar, bukan karena pemakaian."},
    {"id":"soc","nama":"SoC","x":24,"y":62,"w":62,"h":46,"board_grade":"matot","gejala":"mati total","ket":"Kalau ini yang kena, mesinnya praktis tinggal jadi sumber part. Hampir tidak ada yang memperbaikinya."},
    {"id":"nand","nama":"NAND","x":24,"y":116,"w":40,"h":28,"board_grade":"minus_multi","gejala":"bootloop, data tidak terbaca","ket":"Bisa diganti dan dinaikkan kapasitasnya, tapi datanya hilang. Kalau datanya yang penting, itu pekerjaan lain dengan harga lain lagi."},
    {"id":"faceid","nama":"Jalur Face ID","x":72,"y":116,"w":30,"h":28,"board_grade":"minus_faceid","gejala":"Face ID mati","ket":"Kerusakan paling umum sekaligus paling sering tidak disebutkan penjual. Selalu uji Face ID sebelum bayar."}
  ],
  "zona_mesin_belakang": [
    {"id":"baseband","nama":"Baseband","x":24,"y":58,"w":58,"h":40,"board_grade":"minus_sinyal","gejala":"tidak dapat sinyal","ket":"Bisa diselamatkan dengan reball, tapi tidak semua teknisi sanggup. Ini pekerjaan microsolder kelas menengah."},
    {"id":"pmic","nama":"PMIC","x":24,"y":106,"w":40,"h":32,"board_grade":"minus_multi","gejala":"panas berlebih, mati sendiri","ket":"Gejalanya mirip baterai rusak, jadi sering salah didiagnosa dan pemilik membayar baterai baru dua kali."},
    {"id":"tristar","nama":"IC pengisian daya","x":72,"y":106,"w":30,"h":32,"board_grade":"normal","gejala":"tidak mengisi daya","ket":"Paling sering rusak, paling murah diperbaiki. Setelah diganti mesinnya kembali normal penuh, jadi nilainya pulih."},
    {"id":"audio","nama":"IC audio","x":24,"y":148,"w":78,"h":24,"board_grade":"minus_multi","gejala":"mic mati saat menelepon","ket":"Gejala khasnya suara hilang hanya di panggilan, sementara rekaman suara tetap normal."}
  ]
}'::jsonb
where kategori = 'iphone';

insert into product_colors (product_id, nama, hex, rilis_at) values
  ('a0000000-0000-0000-0000-000000000001', 'Desert Titanium', '#9C8368', '2024-09-20'),
  ('a0000000-0000-0000-0000-000000000001', 'Natural Titanium', '#9A968D', '2024-09-20'),
  ('a0000000-0000-0000-0000-000000000001', 'White Titanium', '#F2EEE7', '2024-09-20'),
  ('a0000000-0000-0000-0000-000000000001', 'Black Titanium', '#3A3A3C', '2024-09-20'),

  ('a0000000-0000-0000-0000-000000000002', 'Desert Titanium', '#9C8368', '2024-09-20'),
  ('a0000000-0000-0000-0000-000000000002', 'Natural Titanium', '#9A968D', '2024-09-20'),
  ('a0000000-0000-0000-0000-000000000002', 'White Titanium', '#F2EEE7', '2024-09-20'),
  ('a0000000-0000-0000-0000-000000000002', 'Black Titanium', '#3A3A3C', '2024-09-20'),

  ('a0000000-0000-0000-0000-000000000003', 'Black', '#1F2124', '2024-09-20'),
  ('a0000000-0000-0000-0000-000000000003', 'White', '#F0EBE3', '2024-09-20'),
  ('a0000000-0000-0000-0000-000000000003', 'Pink', '#F4C6CF', '2024-09-20'),
  ('a0000000-0000-0000-0000-000000000003', 'Teal', '#A9C6C3', '2024-09-20'),
  ('a0000000-0000-0000-0000-000000000003', 'Ultramarine', '#7E8FCB', '2024-09-20'),

  ('a0000000-0000-0000-0000-000000000004', 'Black', '#1F2124', '2023-09-22'),
  ('a0000000-0000-0000-0000-000000000004', 'Blue', '#A6BACE', '2023-09-22'),
  ('a0000000-0000-0000-0000-000000000004', 'Green', '#BCC5A8', '2023-09-22'),
  ('a0000000-0000-0000-0000-000000000004', 'Yellow', '#F4E4A4', '2023-09-22'),
  ('a0000000-0000-0000-0000-000000000004', 'Pink', '#F4C6CF', '2023-09-22'),

  ('a0000000-0000-0000-0000-000000000005', 'Midnight', '#1F2124', '2022-09-16'),
  ('a0000000-0000-0000-0000-000000000005', 'Starlight', '#F0EBE3', '2022-09-16'),
  ('a0000000-0000-0000-0000-000000000005', 'Blue', '#A6BACE', '2022-09-16'),
  ('a0000000-0000-0000-0000-000000000005', 'Purple', '#DEDAE8', '2022-09-16'),
  ('a0000000-0000-0000-0000-000000000005', '(PRODUCT)RED', '#B3262F', '2022-09-16'),
  ('a0000000-0000-0000-0000-000000000005', 'Yellow', '#F4E4A4', '2023-03-01'),

  ('a0000000-0000-0000-0000-000000000006', 'Space Gray', '#5F6368', '2025-03-12'),
  ('a0000000-0000-0000-0000-000000000006', 'Starlight', '#F0EBE3', '2025-03-12'),
  ('a0000000-0000-0000-0000-000000000006', 'Blue', '#A6BACE', '2025-03-12'),
  ('a0000000-0000-0000-0000-000000000006', 'Purple', '#DEDAE8', '2025-03-12'),

  ('a0000000-0000-0000-0000-000000000007', 'Blue', '#A6BACE', '2025-03-12'),
  ('a0000000-0000-0000-0000-000000000007', 'Pink', '#F4C6CF', '2025-03-12'),
  ('a0000000-0000-0000-0000-000000000007', 'Yellow', '#F4E4A4', '2025-03-12'),
  ('a0000000-0000-0000-0000-000000000007', 'Silver', '#E4E4E2', '2025-03-12'),

  ('a0000000-0000-0000-0000-000000000008', 'Sky Blue', '#A6BACE', '2025-03-12'),
  ('a0000000-0000-0000-0000-000000000008', 'Silver', '#E4E4E2', '2025-03-12'),
  ('a0000000-0000-0000-0000-000000000008', 'Starlight', '#F0EBE3', '2025-03-12'),
  ('a0000000-0000-0000-0000-000000000008', 'Midnight', '#1F2124', '2025-03-12'),

  ('a0000000-0000-0000-0000-000000000009', 'Jet Black', '#1F2124', '2024-09-20'),
  ('a0000000-0000-0000-0000-000000000009', 'Rose Gold', '#E8C4B8', '2024-09-20'),
  ('a0000000-0000-0000-0000-000000000009', 'Silver', '#E4E4E2', '2024-09-20'),

  ('a0000000-0000-0000-0000-000000000010', 'White', '#F0EBE3', '2025-09-19');
