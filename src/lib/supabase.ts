import { createServerClient } from '@supabase/ssr';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import type { APIContext } from 'astro';

export const createClient = (context: APIContext) => {
  return createServerClient(
    import.meta.env.SUPABASE_URL!,
    import.meta.env.SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(key) {
          return context.cookies.get(key)?.value;
        },
        set(key, value, options) {
          context.cookies.set(key, value, {
            ...options,
            secure: import.meta.env.PROD,
            sameSite: 'lax',
          });
        },
        remove(key, options) {
          context.cookies.delete(key, options);
        },
      },
    }
  );
};

export const getUser = (sb: ReturnType<typeof createClient>) =>
  sb.auth.getUser();

// Service-role client for admin-only operations (list users, manage roles).
// Requires SUPABASE_SERVICE_ROLE_KEY env var. Never use on the client.
export const adminClient = () => {
  const url = import.meta.env.SUPABASE_URL!;
  const key = import.meta.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error('SUPABASE_SERVICE_ROLE_KEY no configurada');
  return createSupabaseClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
};
