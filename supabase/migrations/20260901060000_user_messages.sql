-- ============================================================
-- Mensajes de usuarios restringidos hacia el administrador
-- ============================================================

create table if not exists public.user_messages (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users (id) on delete set null,
  email text not null,
  subject text not null,
  message text not null,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists user_messages_created_idx on public.user_messages (created_at);

alter table public.user_messages enable row level security;

-- Permisos: cualquiera (anon/authenticated) puede dejar un mensaje,
-- y el admin (via service_role por API) gestiona la bandeja.
grant insert on public.user_messages to anon, authenticated;

-- Cualquier visitante puede dejar un mensaje (para usuarios con acceso restringido).
-- No se exponen datos sensibles: solo se crea el mensaje.
create policy "Cualquiera inserta user_messages"
  on public.user_messages for insert
  with check (true);

-- Solo el administrador lee, marca como leído y elimina los mensajes.
create policy "Admin lee user_messages"
  on public.user_messages for select
  using (public.is_admin());

create policy "Admin actualiza user_messages"
  on public.user_messages for update
  using (public.is_admin())
  with check (public.is_admin());

create policy "Admin borra user_messages"
  on public.user_messages for delete
  using (public.is_admin());
