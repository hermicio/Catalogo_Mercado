import type { APIRoute } from 'astro';
import { createClient } from '../../../lib/supabase';

export const POST: APIRoute = async (context) => {
  const sb = createClient(context);
  const user = context.locals.user;
  if (!user) return context.redirect('/login');

  const role = (user.app_metadata?.role as string) ?? 'puestero';
  const formData = await context.request.formData();
  const id = String(formData.get('id') ?? '');

  if (!id) return context.redirect('/misnegocios/catalogos');

  // Fetch catalog with business ownership
  const { data: cat } = await sb.from('catalogs').select('*, businesses!inner(owner_id)').eq('id', id).maybeSingle();
  const catAny = cat as any;

  if (!catAny) return context.redirect('/misnegocios/catalogos');

  if (role !== 'admin' && catAny.businesses?.owner_id !== user.id) {
    return context.redirect('/misnegocios/catalogos');
  }

  // Try to delete file from storage
  if (catAny.pdf_url) {
    const bucket = 'catalogos';
    const url = catAny.pdf_url as string;
    const marker = `/storage/v1/object/public/${bucket}/`;
    const idx = url.indexOf(marker);
    if (idx !== -1) {
      const path = decodeURIComponent(url.slice(idx + marker.length));
      await sb.storage.from(bucket).remove([path]);
    }
  }

  await sb.from('catalogs').delete().eq('id', id);

  const back = role === 'admin' ? '/admin/catalogos' : '/misnegocios/catalogos';
  return context.redirect(back);
};
