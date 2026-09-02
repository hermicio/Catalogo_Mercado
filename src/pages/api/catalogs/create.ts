import type { APIRoute } from 'astro';
import { createClient } from '../../../lib/supabase';

export const POST: APIRoute = async (context) => {
  const sb = createClient(context);
  const user = context.locals.user;
  if (!user) return context.redirect('/login');

  const role = (user.app_metadata?.role as string) ?? 'puestero';
  const formData = await context.request.formData();

  const businessId = String(formData.get('business_id') ?? '');
  const title = String(formData.get('title') ?? '').trim();
  const pdfFile = formData.get('pdf');
  const thumbnailFile = formData.get('thumbnail');

  if (!businessId || !title || !(pdfFile instanceof File) || pdfFile.size === 0) {
    return context.redirect('/misnegocios/catalogos?error=Datos%20incompletos');
  }

  // Permission: admin can add to any, puestero only own
  if (role !== 'admin') {
    const { data: check } = await sb.from('businesses').select('owner_id').eq('id', businessId).single();
    if (!check || check.owner_id !== user.id) {
      return context.redirect('/misnegocios/catalogos');
    }
  }

  const storageBase = import.meta.env.SUPABASE_URL!.replace(/\/$/, '') + '/storage/v1/object/public';

  const pdfPath = `catalogs/${businessId}/${title.replace(/\s+/g, '-')}_${Date.now()}.pdf`;
  const { error: pdfErr } = await sb.storage.from('catalogos').upload(pdfPath, pdfFile);
  if (pdfErr) {
    return context.redirect('/misnegocios/catalogos?error=Error%20al%20subir%20el%20PDF');
  }

  let thumbnailUrl: string | undefined;
  if (thumbnailFile instanceof File && thumbnailFile.size > 0) {
    const thumbPath = `catalogs/${businessId}/thumb_${Date.now()}.${thumbnailFile.name.split('.').pop()}`;
    const { error: tErr } = await sb.storage.from('catalogos').upload(thumbPath, thumbnailFile);
    if (!tErr) thumbnailUrl = `${storageBase}/catalogos/${thumbPath}`;
  }

  const { data: count } = await sb.from('catalogs').select('id').eq('business_id', businessId);

  await sb.from('catalogs').insert({
    id: crypto.randomUUID(),
    business_id: businessId,
    title,
    pdf_url: `${storageBase}/catalogos/${pdfPath}`,
    thumbnail_url: thumbnailUrl ?? null,
    is_visible: role === 'admin',
    sort_order: count?.length ?? 0,
  });

  const back = role === 'admin' ? '/admin/catalogos' : '/misnegocios/catalogos';
  return context.redirect(back);
};
