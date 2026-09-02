import { createClient as createSupabaseClient } from '@supabase/supabase-js';

export const createClient = () =>
  createSupabaseClient(
    import.meta.env.SUPABASE_URL!,
    import.meta.env.SUPABASE_ANON_KEY!
  );
