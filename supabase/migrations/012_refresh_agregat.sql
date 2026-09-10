-- 008_refresh_agregat.sql
-- Fungsi dipanggil cron (BAGIAN 7) lewat rpc(), karena PostgREST tidak
-- mengekspos REFRESH MATERIALIZED VIEW langsung. CONCURRENTLY supaya
-- halaman publik yang sedang membaca pasaran_harian/sebaran_servis tidak
-- ikut terkunci selama refresh jalan.
create function refresh_agregat()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  refresh materialized view concurrently pasaran_harian;
  refresh materialized view concurrently sebaran_servis;
end;
$$;

revoke all on function refresh_agregat() from public;
grant execute on function refresh_agregat() to service_role;
