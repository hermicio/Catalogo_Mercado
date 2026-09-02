-- ============================================================
-- Catálogos del Local - Esquema inicial
-- Ejecutar en el SQL Editor de Supabase
-- ============================================================

-- Extensión para generar UUIDs
create extension if not exists "uuid-ossp";

-- ------------------------------------------------------------
-- Tabla: businesses
-- ------------------------------------------------------------
create table if not exists public.businesses (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  slug text not null unique,
  description text,
  description_short text,
  image_url text,
  cover_url text,
  address text,
  schedule text,
  phone text,
  is_visible boolean not null default false,
  owner_id uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- Tabla: catalogs
-- ------------------------------------------------------------
create table if not exists public.catalogs (
  id uuid primary key default uuid_generate_v4(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  title text not null,
  pdf_url text not null,
  thumbnail_url text,
  is_visible boolean not null default false,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists catalogs_business_idx on public.catalogs (business_id);

-- ------------------------------------------------------------
-- Función auxiliar: ¿el usuario actual es admin?
-- (asume que el claim JWT 'role' = 'admin' en app_metadata/user_metadata)
-- ------------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql
stable security definer
set search_path = public
as $$
  select coalesce(
    current_setting('request.jwt.claims', true)::jsonb
      -> 'app_metadata'
      ->> 'role',
    ''
  ) = 'admin';
$$;

-- ------------------------------------------------------------
-- RLS: businesses
-- ------------------------------------------------------------
alter table public.businesses enable row level security;

-- Cualquiera lee negocios visibles
create policy "Lectura pública de negocios visibles"
  on public.businesses for select
  using (is_visible = true);

-- Admin lee todo
create policy "Admin lee todos los negocios"
  on public.businesses for select
  using (public.is_admin());

-- Puestero lee sus propios negocios
create policy "Puestero lee sus negocios"
  on public.businesses for select
  using (auth.uid() = owner_id);

-- Puesteros pueden editar sus propios negocios
create policy "Puestero edita su negocio"
  on public.businesses for update
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

-- Admin puede insertar/editar/borrar todo
create policy "Admin gestiona negocios"
  on public.businesses for all
  using (public.is_admin())
  with check (public.is_admin());

-- El uso del servicio para el upsert en registro: insert con owner
create policy "Puestero crea su negocio"
  on public.businesses for insert
  with check (auth.uid() = owner_id or public.is_admin());

-- ------------------------------------------------------------
-- RLS: catalogs
-- ------------------------------------------------------------
alter table public.catalogs enable row level security;

-- Cualquiera lee catálogos visibles
create policy "Lectura pública de catálogos visibles"
  on public.catalogs for select
  using (is_visible = true);

create or replace function public.is_owner(business_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.businesses b
    where b.id = business_id and b.owner_id = auth.uid()
  );
$$;

-- Puestero ve los catálogos de sus negocios (incluso pendientes)
create policy "Puestero ve catálogos de sus negocios"
  on public.catalogs for select
  using (public.is_owner(business_id) or public.is_admin());

-- Puestero puede subir (insertar) catálogos en sus negocios
create policy "Puestero sube catálogos"
  on public.catalogs for insert
  with check (public.is_owner(business_id) or public.is_admin());

-- Puestero puede actualizar/borrar catálogos de sus negocios
create policy "Puestero gestiona catálogos de su negocio"
  on public.catalogs for update
  using (public.is_owner(business_id))
  with check (public.is_owner(business_id));

create policy "Puestero borra catálogos de su negocio"
  on public.catalogs for delete
  using (public.is_owner(business_id));

-- Admin gestiona todo
create policy "Admin gestiona catálogos"
  on public.catalogs for all
  using (public.is_admin())
  with check (public.is_admin());

-- ------------------------------------------------------------
-- Función RPC: toggle negocios (admin)
-- ------------------------------------------------------------
create or replace function public.toggle_business(bid uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare _uid uuid := auth.uid();
begin
  if not public.is_admin() then
    raise exception 'Solo administradores';
  end if;
  update public.businesses
  set is_visible = not is_visible, updated_at = now()
  where id = bid;
end;
$$;

-- ------------------------------------------------------------
-- Storage: bucket para catálogos e imágenes
-- ------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('catalogos', 'catalogos', true)
on conflict (id) do nothing;

-- Lectura pública de archivos en el bucket (para visibilidad pública de PDFs/imágenes)
create policy "Lectura pública de catalogos"
  on storage.objects for select
  using (bucket_id = 'catalogos');

-- Puesteros pueden subir en carpetas de su negocio (o admin en todo)
create policy "Insert catalogos autenticado"
  on storage.objects for insert
  with check (
    bucket_id = 'catalogos'
    and (public.is_admin() or auth.role() = 'authenticated')
  );

-- Dueño/admin pueden actualizar/borrar
create policy "Update catalogos"
  on storage.objects for update
  using (bucket_id = 'catalogos' and public.is_admin());

create policy "Delete catalogos"
  on storage.objects for delete
  using (bucket_id = 'catalogos' and public.is_admin());
