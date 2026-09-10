-- 032_refresh_rasio_komponen.sql
-- rasio_komponen baru (030_komponen.sql) ikut direfresh cron yang sama
-- dengan pasaran_harian/sebaran_servis.
create or replace function refresh_agregat()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  refresh materialized view concurrently pasaran_harian;
  refresh materialized view concurrently sebaran_servis;
  refresh materialized view concurrently rasio_komponen;
end;
$$;
