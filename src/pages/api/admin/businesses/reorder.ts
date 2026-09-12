import type { APIRoute } from 'astro';
import { createClient } from '../../../../lib/supabase';

export const POST: APIRoute = async (context) => {
  const sb = createClient(context);
  const user = context.locals.user;
  if (!user) return context.redirect('/login');

  const role = (user.app_metadata?.role as string) ?? 'puestero';
  if (role !== 'admin') return context.redirect('/admin/negocios');

  const formData = await context.request.formData();
  const id = String(formData.get('id') ?? '');
  const dir = String(formData.get('dir') ?? '');

  if (!id || !['up', 'down', 'top'].includes(dir)) {
    return context.redirect('/admin/negocios');
  }

  const { data: siblings } = await sb
    .from('businesses')
    .select('id, sort_order')
    .order('sort_order', { ascending: true })
    .order('name', { ascending: true });

  if (!siblings || siblings.length < 2) return context.redirect('/admin/negocios');

  const seq = [...siblings];
  const idx = seq.findIndex((r) => r.id === id);
  if (idx < 0) return context.redirect('/admin/negocios');

  if (dir === 'top') {
    const [item] = seq.splice(idx, 1);
    seq.unshift(item);
  } else {
    const other = dir === 'up' ? idx - 1 : idx + 1;
    if (other < 0 || other >= seq.length) return context.redirect('/admin/negocios');
    [seq[idx], seq[other]] = [seq[other], seq[idx]];
  }

  for (let i = 0; i < seq.length; i++) {
    await sb.from('businesses').update({ sort_order: i }).eq('id', seq[i].id);
  }

  return context.redirect('/admin/negocios?ok=1');
};