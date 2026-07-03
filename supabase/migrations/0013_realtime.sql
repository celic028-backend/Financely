-- Faza 8: uključi Realtime za sve sinhronizovane tabele (idempotentno).
do $$
declare
  t text;
  tables text[] := array[
    'profiles', 'categories', 'transactions',
    'recurring_items', 'savings_goals', 'savings_entries'
  ];
begin
  foreach t in array tables loop
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = t
    ) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end $$;
