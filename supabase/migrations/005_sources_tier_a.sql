-- 005_sources_tier_a.sql
-- Sumber Tier A pertama, dari SPEC.md tabel sumber. shop.maujual.com
-- terverifikasi JSON Shopify asli (bukan diblokir, bukan HTML), tapi setiap
-- item di halaman pertama (250 produk, termasuk 10 produk Apple) berharga
-- "0.00" dan tersedia=false -- katalog intake buyback, bukan katalog jual
-- dengan harga nyata seperti diklaim SPEC.md. Tetap disimpan sesuai
-- keputusan eksplisit: adapter akan menulis nol observasi sampai feed-nya
-- benar-benar menerbitkan harga jual.
insert into sources (id, seller_id, adapter, base_url, sisi, cadence, config)
values (
  'c0000000-0000-0000-0000-000000000001',
  'b0000000-0000-0000-0000-000000000006', -- seller "maujual", dari 004_seed.sql
  'shopify',
  'https://shop.maujual.com',
  'jual',
  'harian',
  '{"kondisi": "second", "garansi": "toko"}'
)
on conflict (id) do nothing;
