-- =====================================================================
-- pg_cron zakazivanje push notifikacija (Faza 7)
-- =====================================================================
-- Preduslovi (jednom, u Supabase SQL editoru):
--   create extension if not exists pg_cron;
--   create extension if not exists pg_net;
-- Deploy funkcije BEZ JWT provere (poziva je cron, ne korisnik):
--   supabase functions deploy notify --no-verify-jwt
--
-- Zameni <PROJECT_REF> svojim ref-om (npr. vfvnyustyhtvnrfvgwgb).
-- Vremena su u UTC (Beograd = UTC+1/+2), podesi po želji.
-- =====================================================================

-- Jutro: ponavljanja koja stižu danas (~08–09h po Beogradu)
select cron.schedule('notify-due', '0 7 * * *', $$
  select net.http_post(
    url := 'https://<PROJECT_REF>.functions.supabase.co/notify',
    headers := '{"Content-Type":"application/json"}'::jsonb,
    body := '{"kind":"due"}'::jsonb
  );
$$);

-- Popodne: upozorenje ako ugrožavaš cilj štednje
select cron.schedule('notify-goal', '0 16 * * *', $$
  select net.http_post(
    url := 'https://<PROJECT_REF>.functions.supabase.co/notify',
    headers := '{"Content-Type":"application/json"}'::jsonb,
    body := '{"kind":"goal"}'::jsonb
  );
$$);

-- Veče: blag podsetnik ako danas nije bilo unosa (~20–21h)
select cron.schedule('notify-daily', '0 19 * * *', $$
  select net.http_post(
    url := 'https://<PROJECT_REF>.functions.supabase.co/notify',
    headers := '{"Content-Type":"application/json"}'::jsonb,
    body := '{"kind":"daily"}'::jsonb
  );
$$);

-- 1. u mesecu: rezime prošlog meseca
select cron.schedule('notify-monthly', '0 7 1 * *', $$
  select net.http_post(
    url := 'https://<PROJECT_REF>.functions.supabase.co/notify',
    headers := '{"Content-Type":"application/json"}'::jsonb,
    body := '{"kind":"monthly"}'::jsonb
  );
$$);

-- Za brisanje rasporeda: select cron.unschedule('notify-due'); itd.
