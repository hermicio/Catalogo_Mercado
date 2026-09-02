import type { APIRoute } from 'astro';
import { createClient } from '../../../../lib/supabase';

export const POST: APIRoute = async (context) => {
  const sb = createClient(context);
  const user = context.locals.user;
  if (!user || (user.app_metadata?.role as string) !== 'admin') {
    return context.redirect('/login');
  }

  const formData = await context.request.formData();
  const name = String(formData.get('name') ?? '').trim();
  const address = String(formData.get('address') ?? '');
  const description_short = String(formData.get('description_short') ?? '');

  if (!name) {
    return context.redirect('/admin/negocios?error=Nombre%20requerido');
  }

  const slug = name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

  await sb.from('businesses').upsert({
    id: crypto.randomUUID(),
    name,
    slug,
    address,
    description_short,
    description: description_short,
    image_url: '',
    is_visible: false,
  });

  return context.redirect('/admin/negocios');
};
