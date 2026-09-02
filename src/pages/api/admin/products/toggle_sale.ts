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
  if (!id) return context.redirect('/admin/productos');

  const { data: product } = await sb.from('products').select('on_sale').eq('id', id).maybeSingle();
  if (!product) return context.redirect('/admin/productos');

  await sb.from('products').update({ on_sale: !product.on_sale }).eq('id', id);

  return context.redirect('/admin/productos');
};