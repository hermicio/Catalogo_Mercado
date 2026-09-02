import type { APIRoute } from 'astro';
import { createClient } from '../../../../lib/supabase';

export const POST: APIRoute = async (context) => {
  const sb = createClient(context);
  const user = context.locals.user;
  if (!user || (user.app_metadata?.role as string) !== 'admin') {
    return context.redirect('/login');
  }
  const formData = await context.request.formData();
  const userId = String(formData.get('user_id') ?? '');
  const businessId = String(formData.get('business_id') ?? '');

  if (!userId) return context.redirect('/admin/usuarios');

  // Clear previous assignment for this user
  await sb.from('businesses').update({ owner_id: null }).eq('owner_id', userId);

  if (businessId) {
    await sb.from('businesses').update({ owner_id: userId }).eq('id', businessId);
  }

  return context.redirect('/admin/usuarios');
};
