export type Role = 'admin' | 'puestero';

/**
 * Resuelve el rol de un usuario. Prioriza app_metadata.role
 * (que solo puede establecerse con la service role key), y usa
 * user_metadata.role como respaldo.
 */
export const getRole = (user: { app_metadata?: Record<string, unknown>; user_metadata?: Record<string, unknown> } | null | undefined): Role => {
  const role = (user?.app_metadata?.role as string) ?? (user?.user_metadata?.role as string) ?? 'puestero';
  return role === 'admin' ? 'admin' : 'puestero';
};

export interface Business {
  id: string;
  name: string;
  slug: string;
  description: string;
  description_short?: string;
  image_url: string;
  address?: string;
  schedule?: string;
  phone?: string;
  cover_url?: string;
  is_visible: boolean;
  products_auto_visible?: boolean;
  owner_id?: string;
  created_at: string;
}

export interface FairDate {
  id: string;
  fair_date: string;
  title?: string;
  description?: string;
  created_at: string;
}

export interface SiteSettings {
  id: number;
  home_title?: string;
  home_subtitle?: string;
  hero_image_url?: string;
  updated_at?: string;
}

export interface Catalog {
  id: string;
  business_id: string;
  title: string;
  pdf_url: string;
  thumbnail_url?: string;
  is_visible: boolean;
  sort_order: number;
  created_at: string;
}

export interface Product {
  id: string;
  business_id: string;
  name: string;
  description?: string;
  price: number;
  image_url?: string;
  is_visible: boolean;
  on_sale?: boolean;
  sort_order?: number;
  created_at: string;
}
