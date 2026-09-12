import type { APIRoute } from 'astro';
import { createClient } from '../../../lib/supabase';

export const POST: APIRoute = async (context) => {
  const sb = createClient(context);
  const user = context.locals.user;
  if (!user) return context.redirect('/login');

  const role = (user.app_metadata?.role as string) ?? 'puestero';
  const formData = await context.request.formData();
  const id = String(formData.get('id') ?? '');
  const dir = String(formData.get('dir') ?? '');

  if (!id || !['up', 'down', 'top'].includes(dir)) {
    return context.redirect('/misnegocios/productos');
  }

  const { data: product } = await sb.from('products').select('*, businesses!inner(owner_id)').eq('id', id).maybeSingle();
  const p = product as any;
  if (!p) return context.redirect('/misnegocios/productos');
  if (role !== 'admin' && p.businesses?.owner_id !== user.id) {
    return context.redirect('/misnegocios/productos');
  }

  const { data: siblings } = await sb
    .from('products')
    .select('id, sort_order')
    .eq('business_id', p.business_id)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false });

  if (!siblings || siblings.length < 2) return context.redirect('/misnegocios/productos');

  const seq = [...siblings];
  const idx = seq.findIndex((r) => r.id === id);
  if (idx < 0) return context.redirect('/misnegocios/productos');

  if (dir === 'top') {
    const [item] = seq.splice(idx, 1);
    seq.unshift(item);
  } else {
    const other = dir === 'up' ? idx - 1 : idx + 1;
    if (other < 0 || other >= seq.length) return context.redirect('/misnegocios/productos');
    [seq[idx], seq[other]] = [seq[other], seq[idx]];
  }

  for (let i = 0; i < seq.length; i++) {
    await sb.from('products').update({ sort_order: i }).eq('id', seq[i].id);
  }

  const back = role === 'admin' ? '/admin/productos' : '/misnegocios/productos';
  return context.redirect(back);
};