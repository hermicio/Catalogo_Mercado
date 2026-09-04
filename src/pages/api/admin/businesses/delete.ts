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

  if (!id) return context.redirect('/admin/negocios');

  const { error } = await sb.from('businesses').delete().eq('id', id);

  const target =
    error
      ? '/admin/negocios?error=' + encodeURIComponent('No se pudo eliminar: ' + error.message)
      : '/admin/negocios?deleted=1';

  return context.redirect(target);
};
