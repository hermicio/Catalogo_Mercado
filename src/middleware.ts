import { defineMiddleware } from 'astro:middleware';
import { createClient } from './lib/supabase';

export const onRequest = defineMiddleware(async (context, next) => {
  const { pathname } = context.url;
  const sb = createClient(context);
  context.locals.supabase = sb;

  const { data } = await sb.auth.getUser();
  const user = data?.user ?? null;
  context.locals.user = user;

  // Determine role from app_metadata (set only via service role key, tamper-proof)
  const role = (user?.app_metadata?.role as string) ?? (user?.user_metadata?.role as string) ?? 'puestero';

  const isPublic =
    pathname === '/' ||
    pathname.startsWith('/negocio/') ||
    pathname === '/login' ||
    pathname === '/registro' ||
    pathname === '/api/auth/login' ||
    pathname === '/api/auth/register' ||
    pathname.startsWith('/_astro') ||
    pathname.startsWith('/favicon');

  if (isPublic) {
    if ((pathname === '/login' || pathname === '/registro') && user) {
      return context.redirect(role === 'admin' ? '/admin/dashboard' : '/misnegocios');
    }
    return next();
  }

  if (!user) {
    return context.redirect(`/login?redirect=${encodeURIComponent(pathname)}`);
  }

  if (pathname.startsWith('/admin') && role !== 'admin') {
    return context.redirect('/misnegocios');
  }

  return next();
});
