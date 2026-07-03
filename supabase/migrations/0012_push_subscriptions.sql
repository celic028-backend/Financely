-- Faza 7: Web Push pretplate. Jedan red po uređaju (endpoint).
create table if not exists public.push_subscriptions (
  endpoint text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  p256dh text not null,
  auth text not null,
  platform text,
  created_at timestamptz not null default now()
);

create index if not exists push_subscriptions_user_idx
  on public.push_subscriptions(user_id);

alter table public.push_subscriptions enable row level security;

drop policy if exists "own push select" on public.push_subscriptions;
drop policy if exists "own push insert" on public.push_subscriptions;
drop policy if exists "own push update" on public.push_subscriptions;
drop policy if exists "own push delete" on public.push_subscriptions;

create policy "own push select" on public.push_subscriptions
  for select using (auth.uid() = user_id);
create policy "own push insert" on public.push_subscriptions
  for insert with check (auth.uid() = user_id);
create policy "own push update" on public.push_subscriptions
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own push delete" on public.push_subscriptions
  for delete using (auth.uid() = user_id);
