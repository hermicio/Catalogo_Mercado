import type { APIRoute } from 'astro';
import { createClient } from '../../../lib/supabase';

export const POST: APIRoute = async (context) => {
  const sb = createClient(context);
  const user = context.locals.user;
  if (!user) return context.redirect('/login');

  const role = (user.app_metadata?.role as string) ?? 'puestero';
  const formData = await context.request.formData();

  const id = String(formData.get('id') ?? '');
  const name = String(formData.get('name') ?? '').trim();
  const priceRaw = String(formData.get('price') ?? '').trim();
  const description = String(formData.get('description') ?? '').trim();
  const imageFile = formData.get('image');
  const onSale = String(formData.getAll('on_sale')).includes('on');

  if (!id || !name) {
    return context.redirect('/misnegocios/productos?error=Datos%20incompletos');
  }
  const price = Number(priceRaw);
  if (!Number.isFinite(price) || price < 0) {
    return context.redirect('/misnegocios/productos?error=Precio%20inv%C3%A1lido');
  }

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

  const storageBase = import.meta.env.SUPABASE_URL!.replace(/\/$/, '') + '/storage/v1/object/public';

  let imageUrl: string | null = p.image_url ?? null;
  if (imageFile instanceof File && imageFile.size > 0) {
    const ext = imageFile.name.split('.').pop() ?? 'jpg';
    const imagePath = `productos/${p.business_id}/${Date.now()}_${name.replace(/[^a-zA-Z0-9]+/g, '-').slice(0, 40)}.${ext}`;
    const { error: imgErr } = await sb.storage.from('productos').upload(imagePath, imageFile);
    if (imgErr) {
      return context.redirect('/misnegocios/productos?error=Error%20al%20subir%20la%20imagen');
    }
    imageUrl = `${storageBase}/productos/${imagePath}`;
  }

  await sb.from('products')
    .update({ name, description, price, image_url: imageUrl, on_sale: onSale })
    .eq('id', id);

  const back = role === 'admin' ? '/admin/productos' : '/misnegocios/productos';
  return context.redirect(back);
};