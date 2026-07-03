-- Faza 7: podešavanja notifikacija po vrsti (server ih poštuje pri slanju).
alter table public.profiles
  add column if not exists notify_due boolean not null default true,
  add column if not exists notify_goal boolean not null default true,
  add column if not exists notify_daily boolean not null default false,
  add column if not exists notify_monthly boolean not null default true;
