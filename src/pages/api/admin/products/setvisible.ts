import type { APIRoute } from 'astro';
import { createClient } from '../../../../lib/supabase';

export const POST: APIRoute = async (context) => {
  const sb = createClient(context);
  const user = context.locals.user;
  if (!user || (user.app_metadata?.role as string) !== 'admin') {
    return context.redirect('/login');
  }

  const formData = await context.request.formData();
  const id = String(formData.get('id') ?? '');
  const visible = formData.get('visible') === 'true';

  if (!id) return context.redirect('/admin/productos');

  await sb.from('products').update({ is_visible: visible }).eq('id', id);

  return context.redirect('/admin/productos');
};