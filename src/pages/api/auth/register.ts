import type { APIRoute } from 'astro';
import { createClient, adminClient } from '../../../lib/supabase';

export const GET: APIRoute = (context) => context.redirect('/registro');

export const POST: APIRoute = async (context) => {
  const sb = createClient(context);

  const formData = await context.request.formData();
  const name = String(formData.get('name') ?? '').trim();
  const email = String(formData.get('email') ?? '').trim();
  const password = String(formData.get('password') ?? '');

  if (!name || !email || password.length < 6) {
    return context.redirect('/registro?error=Revisa%20los%20datos%20ingresados');
  }

  let slug = name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
  if (!slug) slug = 'negocio';

  const admin = adminClient();
  const { data: taken } = await admin.from('businesses').select('slug').eq('slug', slug).limit(1);
  if (taken && taken.length > 0) {
    slug = slug + '-' + Math.random().toString(36).slice(2, 7);
  }

  const { data, error } = await sb.auth.signUp({
    email,
    password,
    options: {
      data: {
        role: 'puestero',
        name,
        slug,
      },
      emailRedirectTo:
        context.site
          ? new URL('/auth/confirm', context.site).toString()
          : import.meta.env.SITE_URL
            ? `${import.meta.env.SITE_URL}/auth/confirm`
            : 'http://localhost:4321/auth/confirm',
    },
  });

  if (error) {
    return context.redirect('/registro?error=' + encodeURIComponent(error.message));
  }

  const userId = data.user?.id;

  if (userId) {
    const { error: upsertError } = await admin
      .from('businesses')
      .upsert({
        id: crypto.randomUUID(),
        name,
        slug,
        description_short: '',
        description: '',
        image_url: '',
        owner_id: userId,
        is_visible: false,
      });
    if (upsertError) {
      console.error('Fallo creando negocio en registro:', upsertError.message);
    }
  }

  // Marcar la cuenta como pendiente de aprobación del administrador.
  // Se guarda en app_metadata (solo editable con service role -> a prueba de manipulación).
  if (userId) {
    const { error: approveError } = await admin.auth.admin.updateUserById(userId, {
      app_metadata: { role: 'puestero', approved: false },
    });
    if (approveError) {
      console.error('Fallo marcando cuenta como pendiente de aprobación:', approveError.message);
    }
  }

  // In local dev (sin confirmación de email) la sesión se crea al instante.
  if (data.session) {
    return context.redirect('/pendiente');
  }

  return context.redirect('/login?mensaje=Registro%20completado.%20Revisa%20tu%20correo%20para%20confirmar.');
};
