-- ============================================================
-- Orden de negocios en la página principal
-- sort_order: posición definida por el admin en /admin/negocios
-- Efecto: la home muestra los negocios en este orden
-- Ejecutar en el SQL Editor de Supabase
-- ============================================================

alter table public.businesses
  add column if not exists sort_order int not null default 0;