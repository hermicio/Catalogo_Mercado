-- ============================================================
-- Fechas de ferias (calendario en la home)
-- ============================================================

create table if not exists public.fair_dates (
  id uuid primary key default uuid_generate_v4(),
  fair_date date not null,
  title text,
  description text,
  created_at timestamptz not null default now()
);

create index if not exists fair_dates_date_idx on public.fair_dates (fair_date);

alter table public.fair_dates enable row level security;

-- La home es pública: cualquiera lee las fechas
create policy "Lectura pública de fair_dates"
  on public.fair_dates for select
  using (true);

-- Solo el admin carga y gestiona las fechas
create policy "Admin inserta fair_dates"
  on public.fair_dates for insert
  with check (public.is_admin());

create policy "Admin modifica fair_dates"
  on public.fair_dates for update
  using (public.is_admin())
  with check (public.is_admin());

create policy "Admin borra fair_dates"
  on public.fair_dates for delete
  using (public.is_admin());