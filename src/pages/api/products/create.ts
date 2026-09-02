import type { APIRoute } from 'astro';
import { createClient } from '../../../lib/supabase';

export const POST: APIRoute = async (context) => {
  const sb = createClient(context);
  const user = context.locals.user;
  if (!user) return context.redirect('/login');

  const role = (user.app_metadata?.role as string) ?? 'puestero';
  const formData = await context.request.formData();

  const businessId = String(formData.get('business_id') ?? '');
  const name = String(formData.get('name') ?? '').trim();
  const priceRaw = String(formData.get('price') ?? '').trim();
  const description = String(formData.get('description') ?? '').trim();
  const imageFile = formData.get('image');

  if (!businessId || !name) {
    return context.redirect('/misnegocios/productos?error=Datos%20incompletos');
  }
  const price = Number(priceRaw);
  if (!Number.isFinite(price) || price < 0) {
    return context.redirect('/misnegocios/productos?error=Precio%20inv%C3%A1lido');
  }

  // Permission: admin can add to any, puestero only own
  let autoVisible = false;
  if (role !== 'admin') {
    const { data: check } = await sb
      .from('businesses')
      .select('owner_id, products_auto_visible')
      .eq('id', businessId)
      .single();
    if (!check || check.owner_id !== user.id) {
      return context.redirect('/misnegocios/productos');
    }
    if (check.products_auto_visible) autoVisible = true;
  }

  const storageBase = import.meta.env.SUPABASE_URL!.replace(/\/$/, '') + '/storage/v1/object/public';

  let imageUrl: string | null = null;
  if (imageFile instanceof File && imageFile.size > 0) {
    const ext = imageFile.name.split('.').pop() ?? 'jpg';
    const imagePath = `productos/${businessId}/${Date.now()}_${name.replace(/[^a-zA-Z0-9]+/g, '-').slice(0, 40)}.${ext}`;
    const { error: imgErr } = await sb.storage.from('productos').upload(imagePath, imageFile);
    if (imgErr) {
      return context.redirect('/misnegocios/productos?error=Error%20al%20subir%20la%20imagen');
    }
    imageUrl = `${storageBase}/productos/${imagePath}`;
  }

  const { data: orderRows } = await sb.from('products').select('sort_order').eq('business_id', businessId);
  const nextOrder = (orderRows ?? []).reduce((max: number, r: { sort_order?: number }) => Math.max(max, Number(r.sort_order ?? 0)), 0) + 1;

  await sb.from('products').insert({
    id: crypto.randomUUID(),
    business_id: businessId,
    name,
    description,
    price,
    image_url: imageUrl,
    is_visible: role === 'admin' || autoVisible,
    on_sale: false,
    sort_order: nextOrder,
  });

  const back = role === 'admin' ? '/admin/productos' : '/misnegocios/productos';
  return context.redirect(back);
};