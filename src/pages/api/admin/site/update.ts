import type { APIRoute } from 'astro';
import { createClient } from '../../../../lib/supabase';

export const POST: APIRoute = async (context) => {
  const sb = createClient(context);
  const user = context.locals.user;
  if (!user || (user.app_metadata?.role as string) !== 'admin') {
    return context.redirect('/login');
  }

  const formData = await context.request.formData();
  const homeTitle = String(formData.get('home_title') ?? '').trim();
  const homeSubtitle = String(formData.get('home_subtitle') ?? '').trim();
  const removeImage = formData.get('remove_image') === 'on';
  const imageFile = formData.get('image');

  let heroImageUrl: string | null | undefined;

  if (removeImage) {
    heroImageUrl = null;
  } else {
    const storageBase = import.meta.env.SUPABASE_URL!.replace(/\/$/, '') + '/storage/v1/object/public';
    if (imageFile instanceof File && imageFile.size > 0) {
      const ext = imageFile.name.split('.').pop() ?? 'jpg';
      const imagePath = `home/${Date.now()}_${homeTitle.toLowerCase().replace(/[^a-zA-Z0-9]+/g, '-').slice(0, 40) || 'portada'}.${ext}`;
      const { error: imgErr } = await sb.storage.from('catalogos').upload(imagePath, imageFile);
      if (imgErr) {
        return context.redirect('/admin/portada?error=Error%20al%20subir%20la%20imagen');
      }
      heroImageUrl = `${storageBase}/catalogos/${imagePath}`;
    }
  }

  const { error } = await sb
    .from('site_settings')
    .upsert(
      {
        id: 1,
        home_title: homeTitle || null,
        home_subtitle: homeSubtitle || null,
        hero_image_url: heroImageUrl,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'id' }
    );

  const ok = !error;
  return context.redirect(ok ? '/admin/portada?ok=1' : '/admin/portada?error=' + encodeURIComponent(error?.message ?? 'Error'));
};