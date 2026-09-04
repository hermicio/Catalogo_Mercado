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
  const { data: current } = await sb
    .from('businesses')
    .select('owner_id, slug, name')
    .eq('id', id)
    .single();

  if (role !== 'admin') {
    if (!current || current.owner_id !== user.id) {
      return context.redirect('/misnegocios');
    }
  }

  // Solo se regenera el slug si el nombre cambió. Así no cambia la URL del negocio
  // al guardar otros datos (y se evitan colisiones de slug entre negocios).
  let slug: string;
  const sameName = current && current.name.trim().toLowerCase() === name.toLowerCase();
  if (current && sameName) {
    slug = current.slug;
  } else {
    slug = name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    if (!slug) slug = 'negocio';
    // Si el slug ya lo tiene OTRO negocio, desambigua para no chocar con la constraint única.
    const { data: slugConflict } = await sb
      .from('businesses')
      .select('id')
      .eq('slug', slug)
      .neq('id', id)
      .limit(1);
    if (slugConflict && slugConflict.length > 0) {
      slug = slug + '-' + Math.random().toString(36).slice(2, 7);
    }
  }

  const updates: Record<string, unknown> = { name, slug, address, schedule, phone, description, description_short };

  const storageBase = import.meta.env.SUPABASE_URL!.replace(/\/$/, '') + '/storage/v1/object/public';

  // Image / cover upload (robusto: si una imagen falla, igual se guarda el texto)
  let imgError: string | null = null;
  const imageFile = formData.get('image');
  const coverFile = formData.get('cover');

  if (imageFile instanceof File && imageFile.size > 0) {
    const path = `businesses/${id}/image_${Date.now()}.${(imageFile.name.split('.').pop() || 'jpg').toLowerCase()}`;
    try {
      const { error } = await sb.storage.from('catalogos').upload(path, imageFile, { upsert: true });
      if (error) {
        console.error('Error subiendo imagen:', error.message);
        imgError = 'No se pudo subir la imagen de negocio';
      } else {
        updates.image_url = `${storageBase}/catalogos/${path}`;
      }
    } catch (e) {
      console.error('Excepción subiendo imagen:', e);
      imgError = 'No se pudo subir la imagen de negocio';
    }
  }

  if (coverFile instanceof File && coverFile.size > 0) {
    const path = `businesses/${id}/cover_${Date.now()}.${(coverFile.name.split('.').pop() || 'jpg').toLowerCase()}`;
    try {
      const { error } = await sb.storage.from('catalogos').upload(path, coverFile, { upsert: true });
      if (error) {
        console.error('Error subiendo portada:', error.message);
        imgError = imgError ?? 'No se pudo subir la imagen de portada';
      } else {
        updates.cover_url = `${storageBase}/catalogos/${path}`;
      }
    } catch (e) {
      console.error('Excepción subiendo portada:', e);
      imgError = imgError ?? 'No se pudo subir la imagen de portada';
    }
  }

  const { data: updateResult, error: updateError } = await sb
    .from('businesses')
    .update(updates)
    .eq('id', id)
    .select('owner_id');

  const back = role === 'admin' ? '/admin/negocios' : '/misnegocios';

  if (updateError) {
    console.error('Error actualizando negocio:', updateError.message);
    return context.redirect(back + '?error=' + encodeURIComponent('No se pudo guardar: ' + updateError.message));
  }

  if (!updateResult || updateResult.length === 0) {
    console.error('Update afectó 0 filas (id=' + id + ', user=' + user.id + ', role=' + role + ')');
    return context.redirect(back + '?error=' + encodeURIComponent('No se pudo guardar: el negocio no está asignado a tu cuenta o no tienes permisos.'));
  }

  const msg = imgError ? '?warning=' + encodeURIComponent(imgError + ' (el resto se guardó)') : '?ok=1';
  return context.redirect(back + msg);
};
