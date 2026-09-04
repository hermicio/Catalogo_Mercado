import type { APIRoute } from 'astro';
import { createClient } from '../../../lib/supabase';

export const GET: APIRoute = (context) => context.redirect('/login');

export const POST: APIRoute = async (context) => {
  const sb = createClient(context);

  const formData = await context.request.formData();
  const email = String(formData.get('email') ?? '');
  const password = String(formData.get('password') ?? '');
  const redirect = String(formData.get('redirect') ?? '/misnegocios');

  if (!email || !password) {
    return context.redirect('/login?error=Datos%20incompletos');
  }

  const { data, error } = await sb.auth.signInWithPassword({ email, password });

  if (error) {
    return context.redirect('/login?error=' + encodeURIComponent('Correo o contraseña incorrectos'));
  }

  const role = (data.user?.app_metadata?.role as string) ?? (data.user?.user_metadata?.role as string) ?? 'puestero';
  const approved = data.user?.app_metadata?.approved !== false;
  const status = data.user?.app_metadata?.status as string | undefined;

  // Los puesteros deben ser aprobados por el administrador antes de entrar.
  if (role !== 'admin' && !approved) {
    await sb.auth.signOut();
    return context.redirect('/pendiente');
  }

  // Usuario con acceso restringido por el administrador.
  if (role !== 'admin' && status === 'restricted') {
    await sb.auth.signOut();
    return context.redirect('/restringido?email=' + encodeURIComponent(email));
  }

  const target = role === 'admin' && redirect === '/misnegocios' ? '/admin/dashboard' : redirect;

  return context.redirect(target);
};
