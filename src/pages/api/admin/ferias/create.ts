import type { APIRoute } from 'astro';
import { createClient } from '../../../../lib/supabase';

export const POST: APIRoute = async (context) => {
  const sb = createClient(context);
  const user = context.locals.user;
  if (!user || (user.app_metadata?.role as string) !== 'admin') {
    return context.redirect('/login');
  }

  const formData = await context.request.formData();
  const fairDate = String(formData.get('fair_date') ?? '');
  const title = String(formData.get('title') ?? '').trim();
  const description = String(formData.get('description') ?? '').trim();

  if (!/^\d{4}-\d{2}-\d{2}$/.test(fairDate)) {
    return context.redirect('/admin/ferias?error=Fecha%20inv%C3%A1lida');
  }

  const { error } = await sb.from('fair_dates').insert({
    id: crypto.randomUUID(),
    fair_date: fairDate,
    title: title || null,
    description: description || null,
  });

  const ok = !error;
  return context.redirect(ok ? '/admin/ferias' : '/admin/ferias?error=Carga%20fallida');
};