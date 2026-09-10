-- 003_rls.sql
-- RLS untuk tabel device. Sesuai hargaapel-SPEC.md "RLS" dan
-- hargaapel-SETUP.md C3. sources, source_product_map, scrape_runs TIDAK
-- publik. price_observations: update/delete ditolak eksplisit untuk semua
-- role selain service_role (service_role melewati RLS secara bawaan).

alter table products             enable row level security;
alter table sellers              enable row level security;
alter table sources              enable row level security;
alter table source_product_map   enable row level security;
alter table price_observations   enable row level security;
alter table scrape_runs          enable row level security;
alter table fx_rates             enable row level security;
alter table market_events        enable row level security;

create policy products_select_publik on products
  for select to anon, authenticated using (true);

create policy sellers_select_publik on sellers
  for select to anon, authenticated using (true);

create policy price_observations_select_publik on price_observations
  for select to anon, authenticated using (true);

create policy fx_rates_select_publik on fx_rates
  for select to anon, authenticated using (true);

create policy market_events_select_publik on market_events
  for select to anon, authenticated using (true);

-- sources, source_product_map, scrape_runs: RLS aktif, sengaja tanpa
-- policy untuk anon/authenticated. Hanya service_role yang bisa baca/tulis.

-- price_observations append-only: update dan delete ditulis sebagai policy
-- eksplisit yang menolak, bukan hanya dibiarkan tanpa policy.
create policy price_observations_no_update on price_observations
  for update to anon, authenticated using (false);

create policy price_observations_no_delete on price_observations
  for delete to anon, authenticated using (false);
