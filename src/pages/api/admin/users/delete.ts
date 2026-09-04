import type { APIRoute } from 'astro';
import { createClient, adminClient } from '../../../../lib/supabase';

export const POST: APIRoute = async (context) => {
  const sb = createClient(context);
  const admin = adminClient();
  const user = context.locals.user;
  if (!user || (user.app_metadata?.role as string) !== 'admin') {
    return context.redirect('/login');
  }

  const formData = await context.request.formData();
  const userId = String(formData.get('user_id') ?? '');

  if (!userId) {
    return context.redirect('/admin/usuarios?error=' + encodeURIComponent('Falta el usuario'));
  }

  if (userId === user.id) {
    return context.redirect('/admin/usuarios?error=' + encodeURIComponent('No podés eliminar tu propia cuenta'));
  }

  // El borrado de auth.users pone owner_id en null (on delete set null).
  // Borramos sus negocios primero para mantener la coherencia.
  const { data: owned } = await sb.from('businesses').select('id').eq('owner_id', userId);
  if (owned && owned.length) {
    const ids = owned.map((b: { id: string }) => b.id);
    await sb.from('businesses').delete().in('id', ids);
  }

  const { error } = await admin.auth.admin.deleteUser(userId);

  const target =
    error
      ? '/admin/usuarios?error=' + encodeURIComponent('No se pudo eliminar: ' + error.message)
      : '/admin/usuarios?deleted=1';

  return context.redirect(target);
};
