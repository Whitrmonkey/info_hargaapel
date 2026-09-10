-- 007_realtime_dan_index.sql

-- REFRESH MATERIALIZED VIEW CONCURRENTLY butuh minimal satu unique index.
-- pasaran_harian sudah punya (002_views.sql); sebaran_servis belum.
create unique index on sebaran_servis (product_id, service_type_id, part_grade_id);

-- Realtime satu channel untuk kedua tabel observasi (SPEC.md BAGIAN 7).
-- RLS select publik yang sudah ada (003_rls.sql, 010_servis.sql) yang
-- menyaring siapa menerima event apa -- publication ini cuma mengaktifkan
-- jalurnya.
alter publication supabase_realtime add table price_observations;
alter publication supabase_realtime add table service_observations;
