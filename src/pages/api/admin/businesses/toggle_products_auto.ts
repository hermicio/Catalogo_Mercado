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

  const { data: biz } = await sb.from('businesses').select('products_auto_visible').eq('id', id).maybeSingle();
  if (!biz) return context.redirect('/admin/negocios');

  await sb
    .from('businesses')
    .update({ products_auto_visible: !biz.products_auto_visible })
    .eq('id', id);

  return context.redirect('/admin/negocios');
};