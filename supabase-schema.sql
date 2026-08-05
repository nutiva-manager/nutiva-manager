-- Nutiva Manager: ejecutar una sola vez en Supabase > SQL Editor.
create table if not exists public.nutiva_state (
  id text primary key default 'shared',
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.nutiva_state enable row level security;

drop policy if exists "Usuarios autenticados pueden leer Nutiva" on public.nutiva_state;
create policy "Usuarios autenticados pueden leer Nutiva" on public.nutiva_state
  for select to authenticated using (true);
drop policy if exists "Usuarios autenticados pueden crear Nutiva" on public.nutiva_state;
create policy "Usuarios autenticados pueden crear Nutiva" on public.nutiva_state
  for insert to authenticated with check (id = 'shared');
drop policy if exists "Usuarios autenticados pueden actualizar Nutiva" on public.nutiva_state;
create policy "Usuarios autenticados pueden actualizar Nutiva" on public.nutiva_state
  for update to authenticated using (id = 'shared') with check (id = 'shared');

-- Realtime para que los cambios aparezcan en el otro dispositivo.
alter publication supabase_realtime add table public.nutiva_state;
