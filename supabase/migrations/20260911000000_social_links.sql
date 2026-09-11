-- ============================================================
-- Redes sociales y WhatsApp por negocio
-- social_links: jsonb array de { label, url } (Instagram, Facebook, TikTok...)
-- whatsapp: número con código de país (ej. 5491100000000)
-- whatsapp_message: mensaje predefinido para el chat de WhatsApp (opcional)
-- Ejecutar en el SQL Editor de Supabase
-- ============================================================

alter table public.businesses
  add column if not exists social_links jsonb not null default '[]'::jsonb,
  add column if not exists whatsapp text,
  add column if not exists whatsapp_message text;