import type { APIRoute } from 'astro';
import { createClient } from '../../../lib/supabase';

export const POST: APIRoute = async (context) => {
  const sb = createClient(context);
  const user = context.locals.user;
  if (!user) return context.redirect('/login');

  const role = (user.app_metadata?.role as string) ?? 'puestero';
  const formData = await context.request.formData();
  const id = String(formData.get('id') ?? '');

  if (!id) return context.redirect('/misnegocios/productos');

  // Fetch product with business ownership
  const { data: product } = await sb
    .from('products')
    .select('*, businesses!inner(owner_id)')
    .eq('id', id)
    .maybeSingle();
  const p = product as any;

  if (!p) return context.redirect('/misnegocios/productos');

  if (role !== 'admin' && p.businesses?.owner_id !== user.id) {
    return context.redirect('/misnegocios/productos');
  }

  // Try to delete the image from storage (only admins on storage policies; attempts are best-effort)
  if (p.image_url) {
    const bucket = 'productos';
    const url = p.image_url as string;
    const marker = `/storage/v1/object/public/${bucket}/`;
    const idx = url.indexOf(marker);
    if (idx !== -1) {
      const path = decodeURIComponent(url.slice(idx + marker.length));
      await sb.storage.from(bucket).remove([path]);
    }
  }

  await sb.from('products').delete().eq('id', id);

  const back = role === 'admin' ? '/admin/productos' : '/misnegocios/productos';
  return context.redirect(back);
};