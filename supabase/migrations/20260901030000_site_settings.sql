-- ============================================================
-- Contenido editable de la página principal (index)
-- Fila única: id = 1
-- ============================================================

create table if not exists public.site_settings (
  id int primary key default 1 check (id = 1),
  home_title text,
  home_subtitle text,
  hero_image_url text,
  updated_at timestamptz not null default now()
);

alter table public.site_settings enable row level security;

-- Cualquiera lee (la home es pública)
create policy "Lectura pública de site_settings"
  on public.site_settings for select
  using (true);

-- Solo el admin puede crear o modificar
create policy "Admin escribe site_settings"
  on public.site_settings for insert
  with check (public.is_admin());

create policy "Admin modifica site_settings"
  on public.site_settings for update
  using (public.is_admin())
  with check (public.is_admin());

create policy "Admin borra site_settings"
  on public.site_settings for delete
  using (public.is_admin());

-- Fila inicial con el contenido actual de la home
insert into public.site_settings (id, home_title, home_subtitle, hero_image_url)
values (
  1,
  'Los catálogos de tu local, todos juntos',
  'Explora los negocios del local, selecciona uno y mira su catálogo en línea o descárgalo en PDF.',
  null
)
on conflict (id) do nothing;