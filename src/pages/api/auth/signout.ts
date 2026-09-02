import type { APIRoute } from 'astro';
import { createClient } from '../../../lib/supabase';

export const GET: APIRoute = (context) => context.redirect('/');

export const POST: APIRoute = async (context) => {
  const sb = createClient(context);
  await sb.auth.signOut();
  return context.redirect('/');
};
