-- ============================================================
-- Aprobación de productos parametrizable por negocio
-- products_auto_visible = true  -> los productos del puestero se publican al instante
-- products_auto_visible = false -> requieren aprobación del admin (default)
-- ============================================================

alter table public.businesses
  add column if not exists products_auto_visible boolean not null default false;

-- El puestero solo puede insertar con is_visible = política del negocio.
-- Así el parámetro se cumple aunque se llame a la API/DB directo (no spoofeable).
drop policy if exists "Puestero crea productos" on public.products;

create policy "Puestero crea productos según política del negocio"
  on public.products for insert
  with check (
    public.is_admin()
    or (
      public.is_owner(business_id)
      and is_visible = (
        select b.products_auto_visible
        from public.businesses b
        where b.id = business_id
      )
    )
  );