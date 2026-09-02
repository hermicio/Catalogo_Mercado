-- ============================================================
-- Productos de venta por negocio
-- ============================================================

create table if not exists public.products (
  id uuid primary key default uuid_generate_v4(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  name text not null,
  description text,
  price numeric(12, 2) not null default 0,
  image_url text,
  is_visible boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists products_business_idx on public.products (business_id);

alter table public.products enable row level security;

-- Cualquiera lee productos visibles
create policy "Lectura pública de productos visibles"
  on public.products for select
  using (is_visible = true);

-- Admin lee todo
create policy "Admin lee todos los productos"
  on public.products for select
  using (public.is_admin());

-- Puestero lee los productos de sus negocios
create policy "Puestero lee productos de su negocio"
  on public.products for select
  using (public.is_owner(business_id));

-- Puestero crea productos en sus negocios
create policy "Puestero crea productos"
  on public.products for insert
  with check (public.is_owner(business_id) or public.is_admin());

-- Puestero edita productos de sus negocios
create policy "Puestero edita productos de su negocio"
  on public.products for update
  using (public.is_owner(business_id))
  with check (public.is_owner(business_id));

-- Puestero borra productos de sus negocios
create policy "Puestero borra productos de su negocio"
  on public.products for delete
  using (public.is_owner(business_id));

-- Admin gestiona todo
create policy "Admin gestiona productos"
  on public.products for all
  using (public.is_admin())
  with check (public.is_admin());

-- ------------------------------------------------------------
-- Storage: bucket para imágenes de productos
-- ------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('productos', 'productos', true)
on conflict (id) do nothing;

create policy "Lectura pública de productos (storage)"
  on storage.objects for select
  using (bucket_id = 'productos');

create policy "Insert productos autenticado (storage)"
  on storage.objects for insert
  with check (
    bucket_id = 'productos'
    and (public.is_admin() or auth.role() = 'authenticated')
  );

create policy "Update productos admin (storage)"
  on storage.objects for update
  using (bucket_id = 'productos' and public.is_admin());

create policy "Delete productos admin (storage)"
  on storage.objects for delete
  using (bucket_id = 'productos' and public.is_admin());