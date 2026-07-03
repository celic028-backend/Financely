-- Faza 1: model štednje kao earmark (procenat/fiksno).
-- Dodaje kolone koje syncMap.ts već šalje; bezbedno ako već postoje.
alter table public.savings_goals
  add column if not exists mode text not null default 'percent',
  add column if not exists rate numeric not null default 0,
  add column if not exists fixed_amount integer not null default 0;
