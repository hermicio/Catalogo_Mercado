import type { APIRoute } from 'astro';
import { createClient } from '../../../lib/supabase';

export const POST: APIRoute = async (context) => {
  const sb = createClient(context);
  const user = context.locals.user;

  if (!user) {
    return context.redirect('/login');
  }

  const role = (user.app_metadata?.role as string) ?? 'puestero';
  const formData = await context.request.formData();

  const id = String(formData.get('id') ?? '');
  const name = String(formData.get('name') ?? '').trim();
  const address = String(formData.get('address') ?? '');
  const schedule = String(formData.get('schedule') ?? '');
  const phone = String(formData.get('phone') ?? '');
  const description = String(formData.get('description') ?? '');
  const description_short = String(formData.get('description_short') ?? '');

  if (!id || !name) {
    return context.redirect('/misnegocios?error=Datos%20incompletos');
  }

  // Permission check: admin can edit any, puestero only their own
  if (role !== 'admin') {
    const { data: check } = await sb
      .from('businesses')
      .select('owner_id')
      .eq('id', id)
      .single();
    if (!check || check.owner_id !== user.id) {
      return context.redirect('/misnegocios');
    }
  }

  let slug = name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

  const updates: Record<string, unknown> = { name, slug, address, schedule, phone, description, description_short };

  const storageBase = import.meta.env.SUPABASE_URL!.replace(/\/$/, '') + '/storage/v1/object/public';

  // Image / cover upload
  const imageFile = formData.get('image');
  const coverFile = formData.get('cover');

  if (imageFile instanceof File && imageFile.size > 0) {
    const path = `businesses/${id}/image_${Date.now()}.${imageFile.name.split('.').pop()}`;
    const { error } = await sb.storage.from('catalogos').upload(path, imageFile, { upsert: true });
    if (!error) updates.image_url = `${storageBase}/catalogos/${path}`;
  }

  if (coverFile instanceof File && coverFile.size > 0) {
    const path = `businesses/${id}/cover_${Date.now()}.${coverFile.name.split('.').pop()}`;
    const { error } = await sb.storage.from('catalogos').upload(path, coverFile, { upsert: true });
    if (!error) updates.cover_url = `${storageBase}/catalogos/${path}`;
  }

  await sb.from('businesses').update(updates).eq('id', id);

  const back = role === 'admin' ? '/admin/negocios' : '/misnegocios';
  return context.redirect(back);
};
