-- ============================================================
-- Productos en liquidación y orden de aparición
-- ============================================================

alter table public.products
  add column if not exists on_sale boolean not null default false,
  add column if not exists sort_order int not null default 0;

create index if not exists products_sale_visible_idx on public.products (on_sale, is_visible);
create index if not exists products_business_order_idx on public.products (business_id, sort_order);