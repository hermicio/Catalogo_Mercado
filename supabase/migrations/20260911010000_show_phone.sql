-- ============================================================
-- Mostrar u ocultar el teléfono en la página pública del negocio
-- show_phone = true  -> se muestra el teléfono (default)
-- show_phone = false -> el puestero lo oculta
-- Ejecutar en el SQL Editor de Supabase
-- ============================================================

alter table public.businesses
  add column if not exists show_phone boolean not null default true;