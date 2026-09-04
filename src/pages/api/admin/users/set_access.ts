import type { APIRoute } from 'astro';
import { adminClient } from '../../../../lib/supabase';

export const POST: APIRoute = async (context) => {
  const user = context.locals.user;
  if (!user || (user.app_metadata?.role as string) !== 'admin') {
    return context.redirect('/login');
  }

  const formData = await context.request.formData();
  const userId = String(formData.get('user_id') ?? '');
  const status = String(formData.get('status') ?? '');
  const redirect = String(formData.get('redirect') ?? '/admin/usuarios');

  if (!userId || !['restricted', 'active'].includes(status)) {
    return context.redirect(redirect + '?error=' + encodeURIComponent('Datos inválidos'));
  }

  const admin = adminClient();
  const { error } = await admin.auth.admin.updateUserById(userId, {
    app_metadata: { status },
  });

  const target =
    error
      ? redirect + '?error=' + encodeURIComponent('No se pudo cambiar el acceso: ' + error.message)
      : redirect + (status === 'restricted' ? '?ok=restringido' : '?ok=activo');

  return context.redirect(target);
};
