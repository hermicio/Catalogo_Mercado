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
  const redirect = String(formData.get('redirect') ?? '/admin/mensajes');

  if (!id) {
    return context.redirect(redirect + '?error=' + encodeURIComponent('Falta el mensaje'));
  }

  const { data: msg } = await sb.from('user_messages').select('is_read').eq('id', id).single();
  const { error } = await sb
    .from('user_messages')
    .update({ is_read: !msg?.is_read })
    .eq('id', id);

  return context.redirect(redirect + (error ? '?error=1' : ''));
};
