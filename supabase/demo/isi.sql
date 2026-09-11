-- DATA PERAGAAN -- BUKAN DATA PASAR.
-- Lihat supabase/demo/README.md. Jangan pernah dipindah ke migrations/.
--
-- Semua baris yang dibuat di sini ditandai supaya bisa dihapus bersih:
--   price_observations.catatan      = 'demo'
--   component_observations.catatan  = 'demo'
--   laporan_harga.catatan           = 'demo'
--   diskusi.isi diakhiri penanda    -- lihat kosongkan.sql
--   sellers/profiles                bernama awalan 'Demo '

begin;

-- ---------------------------------------------------------------------------
-- Penjual peragaan
-- ---------------------------------------------------------------------------
insert into sellers (id, nama, tipe, area, lokasi, url) values
  ('d0000000-0000-0000-0000-000000000001','Demo Kios Roxy',        'toko',       'Jakarta Pusat',   'ITC Roxy Mas', null),
  ('d0000000-0000-0000-0000-000000000002','Demo Kios Ambas',       'toko',       'Jakarta Selatan', 'ITC Ambassador', null),
  ('d0000000-0000-0000-0000-000000000003','Demo Gerai BSD',        'toko',       'Tangerang',       null, null),
  ('d0000000-0000-0000-0000-000000000004','Demo Konter Bekasi',    'toko',       'Bekasi',          null, null),
  ('d0000000-0000-0000-0000-000000000005','Demo Lapak Online',     'marketplace','Jakarta Utara',   null, 'https://contoh.test/lapak'),
  ('d0000000-0000-0000-0000-000000000006','Demo Buyback',          'buyback',    'Jabodetabek',     null, 'https://contoh.test/buyback'),
  ('d0000000-0000-0000-0000-000000000007','Demo Perorangan',       'perorangan', 'Depok',           null, null)
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- Harga device: 12 model iPhone teramai, enam toko, riwayat 10 bulan.
-- Penurunannya dibuat lebih tajam tiap September supaya bentuk kurva di
-- linimasa benar-benar bisa dilihat saat peragaan.
-- ---------------------------------------------------------------------------
do $$
declare
  r record;
  toko uuid[] := array[
    'd0000000-0000-0000-0000-000000000001'::uuid,'d0000000-0000-0000-0000-000000000002'::uuid,
    'd0000000-0000-0000-0000-000000000003'::uuid,'d0000000-0000-0000-0000-000000000004'::uuid,
    'd0000000-0000-0000-0000-000000000005'::uuid];
  bulan int; i int; d timestamptz; laju numeric;
  dasar numeric; harga numeric;
begin
  for r in
    select p.id, p.model, p.varian,
           -- dasar harga bekas grade standar jalur resmi hari ini
           case p.model
             when 'iPhone 11'         then 2900000 when 'iPhone 11 Pro'     then 3900000
             when 'iPhone 12'         then 4300000 when 'iPhone 12 Pro'     then 5400000
             when 'iPhone 13'         then 5800000 when 'iPhone 13 Pro'     then 7200000
             when 'iPhone 14'         then 7800000 when 'iPhone 14 Pro'     then 9900000
             when 'iPhone 15'         then 9600000 when 'iPhone 15 Pro'     then 12400000
             when 'iPhone 16'         then 12800000 when 'iPhone 16 Pro'    then 16200000
           end as dasar
    from products p
    where p.kategori = 'iphone' and p.varian = '128GB'
      and p.model in ('iPhone 11','iPhone 11 Pro','iPhone 12','iPhone 12 Pro','iPhone 13','iPhone 13 Pro',
                      'iPhone 14','iPhone 14 Pro','iPhone 15','iPhone 15 Pro','iPhone 16','iPhone 16 Pro')
  loop
    if r.dasar is null then continue; end if;

    -- riwayat bulanan mundur 10 bulan
    for bulan in reverse 9..0 loop
      d := now() - (bulan || ' months')::interval - interval '3 days';
      laju := case when extract(month from d) = 9 then 0.065 else 0.012 end;
      dasar := r.dasar * power(1 + laju, bulan);
      for i in 1..5 loop
        insert into price_observations
          (product_id, seller_id, sisi, kondisi, grade, garansi, harga, sumber, catatan, observed_at)
        values
          (r.id, toko[i], 'jual','second','standar','resmi',
           round((dasar * (1 + (i-3)*0.012)) / 50000) * 50000, 'manual','demo', d),
          (r.id, toko[i], 'jual','second','standar','inter',
           round((dasar * 0.91 * (1 + (i-3)*0.012)) / 50000) * 50000, 'manual','demo', d);
      end loop;
    end loop;

    -- grade lain, minggu ini saja
    for i in 1..5 loop
      insert into price_observations
        (product_id, seller_id, sisi, kondisi, grade, garansi, harga, sumber, catatan, observed_at)
      values
        (r.id, toko[i], 'jual','second','mulus',   'resmi', round((r.dasar*1.18*(1+(i-3)*0.01))/50000)*50000,'manual','demo', now() - interval '1 day'),
        (r.id, toko[i], 'jual','second','ekonomis','resmi', round((r.dasar*0.86*(1+(i-3)*0.01))/50000)*50000,'manual','demo', now() - interval '1 day'),
        (r.id, toko[i], 'jual','second','mulus',   'inter', round((r.dasar*1.07*(1+(i-3)*0.01))/50000)*50000,'manual','demo', now() - interval '1 day'),
        (r.id, toko[i], 'jual','second','ekonomis','inter', round((r.dasar*0.78*(1+(i-3)*0.01))/50000)*50000,'manual','demo', now() - interval '1 day');
    end loop;

    -- sisi beli platform buyback, jadi lantai pasar ada isinya
    insert into price_observations
      (product_id, seller_id, sisi, kondisi, grade, garansi, harga, sumber, catatan, observed_at)
    values (r.id,'d0000000-0000-0000-0000-000000000006','beli','second','standar','resmi',
            round((r.dasar*0.72)/50000)*50000,'manual','demo', now() - interval '6 hours');

    -- satu penawaran perorangan
    insert into price_observations
      (product_id, seller_id, sisi, kondisi, grade, garansi, harga, sumber, catatan, observed_at)
    values (r.id,'d0000000-0000-0000-0000-000000000007','jual','second','standar','resmi',
            round((r.dasar*0.94)/50000)*50000,'manual','demo', now() - interval '8 hours');
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- Nilai komponen: rasio yang masuk akal, tiga penjual tiap kombinasi.
-- ---------------------------------------------------------------------------
do $$
declare
  r record; s uuid; rasio numeric; unit numeric;
  toko uuid[] := array['d0000000-0000-0000-0000-000000000001'::uuid,
                       'd0000000-0000-0000-0000-000000000002'::uuid,
                       'd0000000-0000-0000-0000-000000000003'::uuid];
  i int;
begin
  for r in
    select p.id as pid, p.model, ct.id as ctid, ct.kode, ct.kategori_grade,
           (select id from part_grades g where g.kategori = ct.kategori_grade order by urutan desc limit 1) as pgid
    from products p cross join component_types ct
    where p.kategori='iphone' and p.varian='128GB'
      and p.model in ('iPhone 13','iPhone 14','iPhone 15','iPhone 16')
      and ct.kode <> 'mesin'
  loop
    select percentile_cont(0.5) within group (order by harga) into unit
    from price_observations where product_id = r.pid and kondisi='second' and grade='standar' and garansi='resmi' and sisi='jual';
    if unit is null then continue; end if;
    rasio := case r.kode
      when 'layar' then 0.16 when 'backglass' then 0.09 when 'kamera_belakang' then 0.07
      when 'baterai' then 0.06 when 'faceid' then 0.05 when 'kamera_depan' then 0.035
      when 'konektor' then 0.03 when 'tombol' then 0.02 else 0.03 end;
    for i in 1..3 loop
      insert into component_observations (seller_id, product_id, component_type_id, part_grade_id, harga, sumber, catatan)
      values (toko[i], r.pid, r.ctid, r.pgid,
              round((unit * rasio * (1 + (i-2)*0.06)) / 25000) * 25000, 'manual', 'demo');
    end loop;
  end loop;

  -- mesin, enam tingkat grade
  for r in
    select p.id as pid, ct.id as ctid, bg.id as bgid, bg.kode as bkode
    from products p cross join component_types ct cross join board_grades bg
    where p.kategori='iphone' and p.varian='128GB'
      and p.model in ('iPhone 13','iPhone 14','iPhone 15','iPhone 16') and ct.kode='mesin'
  loop
    select percentile_cont(0.5) within group (order by harga) into unit
    from price_observations where product_id = r.pid and kondisi='second' and grade='standar' and garansi='resmi' and sisi='jual';
    if unit is null then continue; end if;
    rasio := case r.bkode
      when 'normal' then 0.31 when 'minus_faceid' then 0.24 when 'minus_touch' then 0.21
      when 'minus_sinyal' then 0.19 when 'minus_multi' then 0.14 else 0.08 end;
    for i in 1..3 loop
      insert into component_observations (seller_id, product_id, component_type_id, board_grade_id, harga, sumber, catatan)
      values (toko[i], r.pid, r.ctid, r.bgid,
              round((unit * rasio * (1 + (i-2)*0.06)) / 25000) * 25000, 'manual', 'demo');
    end loop;
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- Komunitas: pembaca, laporan, sentimen, diskusi.
-- ---------------------------------------------------------------------------
do $$
declare
  u uuid; p14 uuid; p15 uuid; i int;
  nama_demo text[] := array['Andre P','Melisa T','Rizky Agung','Budi Jkt','Teknisi KW','Sari D'];
begin
  select id into p14 from products where slug='iphone-14-128gb';
  select id into p15 from products where slug='iphone-15-128gb';

  for i in 1..6 loop
    -- Kolom token WAJIB diisi string kosong, bukan dibiarkan NULL. GoTrue
    -- membacanya ke string non-nullable, dan satu baris NULL saja membuat
    -- SELURUH layanan auth balas 500 "Database error finding users" --
    -- termasuk untuk pengguna yang tidak ada hubungannya dengan data demo.
    insert into auth.users (id, instance_id, aud, role, email, encrypted_password,
                            email_confirmed_at, created_at, updated_at,
                            confirmation_token, recovery_token, email_change,
                            email_change_token_new, email_change_token_current,
                            phone_change_token, reauthentication_token)
    values (gen_random_uuid(),'00000000-0000-0000-0000-000000000000','authenticated','authenticated',
            'demo-' || i || '@contoh.test','', now(), now() - (i || ' months')::interval, now(),
            '', '', '', '', '', '', '')
    returning id into u;
    update profiles set nama = 'Demo ' || nama_demo[i], bergabung_at = now() - (i || ' months')::interval where id = u;

    -- sentimen, cukup untuk melewati ambang tiga suara
    insert into sentimen_harga (product_id, user_id, suara, harga_saat)
    values (p14, u, (array['worth','worth','mahal','tunggu','worth','mahal'])[i], 7800000);

    if i <= 3 then
      insert into laporan_harga (user_id, product_id, kondisi, grade, garansi, area, harga_jadi, harga_buka,
                                 kelengkapan, catatan, status, bobot_saat_lapor, dibuat_at)
      values (u, case when i = 2 then p15 else p14 end, 'second','standar',
              (array['resmi','inter','resmi'])[i],
              (array['Jakarta Selatan','Jakarta Barat','Bekasi'])[i],
              (array[7600000,9150000,7950000])[i],
              (array[8000000,null,8300000])[i],
              array['dus','carger'], 'demo',
              (array['terverifikasi','terverifikasi','menunggu'])[i],
              (array[1,1,0])[i],
              now() - (i || ' days')::interval);
    end if;

    if i >= 4 then
      insert into diskusi (product_id, user_id, isi, skor, dibuat_at)
      values (p14, u,
        (array[
          'Yang mau ambil 14 second, cek dulu apakah layarnya pernah diganti. Kalau true tone hilang, hampir pasti bukan panel ori, dan selisih harganya bisa satu setengah juta tapi sering tidak disebut. (demo)',
          'Angka di sini cocok dengan yang saya temui di lapangan minggu ini, cuma di area saya rata-rata dua ratus ribu lebih tinggi dari yang tercatat. (demo)',
          'Kalau jalur inter, minta tunjukkan pengecekan IMEI di depan mata sebelum bayar. Bukan soal curiga, cuma itu satu-satunya yang tidak bisa dibantah belakangan. (demo)'
        ])[i-3],
        (array[24,11,6])[i-3], now() - ((i-3) || ' days')::interval);
    end if;
  end loop;
end $$;

select refresh_agregat();
commit;

select 'harga: '     || count(*) from price_observations     where catatan = 'demo';
select 'komponen: '  || count(*) from component_observations where catatan = 'demo';
select 'laporan: '   || count(*) from laporan_harga          where catatan = 'demo';
