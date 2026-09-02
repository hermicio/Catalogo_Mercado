import type { APIRoute } from 'astro';
import { createClient, adminClient } from '../../../../lib/supabase';

export const POST: APIRoute = async (context) => {
  const sb = createClient(context);
  const user = context.locals.user;
  if (!user || (user.app_metadata?.role as string) !== 'admin') {
    return context.redirect('/login');
  }

  const formData = await context.request.formData();
  const userId = String(formData.get('user_id') ?? '');

  if (!userId) return context.redirect('/admin/usuarios?error=' + encodeURIComponent('Falta el usuario'));

  const admin = adminClient();
  const { error } = await admin.auth.admin.updateUserById(userId, {
    app_metadata: { approved: true },
  });

  const target =
    error
      ? '/admin/usuarios?error=' + encodeURIComponent(error.message)
      : '/admin/usuarios?ok=Aprobado';

  return context.redirect(target);
};
