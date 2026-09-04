import type { APIRoute } from 'astro';
import { createClient } from '../../../lib/supabase';

export const POST: APIRoute = async (context) => {
  const sb = createClient(context);

  const formData = await context.request.formData();
  const email = String(formData.get('email') ?? '').trim();
  const subject = String(formData.get('subject') ?? '').trim();
  const message = String(formData.get('message') ?? '').trim();
  const userId = String(formData.get('user_id') ?? '') || null;

  if (!email || !subject || !message) {
    return context.redirect('/restringido?error=' + encodeURIComponent('Completá todos los campos.'));
  }

  const { error } = await sb.from('user_messages').insert({
    email,
    subject,
    message,
    user_id: userId,
  });

  const target =
    error
      ? '/restringido?error=' + encodeURIComponent('No se pudo enviar el mensaje: ' + error.message)
      : '/restringido?enviado=1';

  return context.redirect(target);
};
