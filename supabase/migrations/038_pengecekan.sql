-- 038_pengecekan.sql
-- Pintasan "sering dicek" di /cek-harga wajib dihitung dari frekuensi nyata
-- 30 hari terakhir, bukan ditulis tangan. Untuk itu perlu catatan ringan
-- tiap kali satu kombinasi selesai dipilih.
--
-- Sengaja TIDAK menyimpan siapa yang mengecek: tidak ada user_id, tidak ada
-- IP, tidak ada sesi. Yang dibutuhkan cuma "kombinasi ini dilihat", dan
-- menyimpan lebih dari itu menciptakan data pribadi yang tidak ada gunanya
-- bagi pembaca.

create table pengecekan (
  id          bigserial primary key,
  product_id  uuid not null references products(id),
  kondisi     text not null,
  grade       text,
  garansi     text not null,
  dibuat_at   timestamptz not null default now()
);

create index on pengecekan (dibuat_at desc);
create index on pengecekan (product_id, dibuat_at desc);

alter table pengecekan enable row level security;

-- Tidak ada policy select untuk anon/authenticated: isinya dibaca lewat
-- service role saat menyusun pintasan, dan tidak pernah perlu dibaca klien.
-- Insert juga lewat server action, bukan langsung dari klien.
