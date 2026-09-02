/// <reference types="astro/client" />

declare global {
  namespace App {
    interface Locals {
      user: import('@supabase/supabase-js').User | null;
      supabase: import('@supabase/supabase-js').SupabaseClient;
    }
  }
}

interface ImportMetaEnv {
  readonly SUPABASE_URL: string;
  readonly SUPABASE_ANON_KEY: string;
  readonly SUPABASE_SERVICE_ROLE_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

export {};