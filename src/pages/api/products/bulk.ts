import type { APIRoute } from 'astro';
import { createClient } from '../../../lib/supabase';

export const POST: APIRoute = async (context) => {
  const sb = createClient(context);
  const user = context.locals.user;
  if (!user) return context.redirect('/login');

  const role = (user.app_metadata?.role as string) ?? 'puestero';
  const formData = await context.request.formData();

  const businessId = String(formData.get('business_id') ?? '').trim();
  const bulk = String(formData.get('bulk') ?? '');

  if (!businessId || !bulk.trim()) {
    return context.redirect('/misnegocios/carga-masiva?error=Ingres%C3%A1%20la%20lista%20de%20productos');
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
      return context.redirect('/misnegocios/carga-masiva');
    }
    if (check.products_auto_visible) autoVisible = true;
  }

  interface Parsed {
    name: string;
    description: string;
    price: number;
  }
  const parsed: Parsed[] = [];
  const invalid: string[] = [];

  for (const rawLine of bulk.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line) continue;
    const parts = line.split(';').map((s) => s.trim());
    const name = parts[0] ?? '';
    let priceRaw: string;
    let description = '';
    if (parts.length >= 3) {
      description = parts[1] ?? '';
      priceRaw = parts[2] ?? '';
    } else if (parts.length >= 2) {
      priceRaw = parts[1] ?? '';
    } else {
      invalid.push(`"${line}" (faltan campos)`);
      continue;
    }
    const price = Number(priceRaw.replace(',', '.'));
    if (!name || !Number.isFinite(price) || price < 0) {
      invalid.push(`"${line}" (nombre o precio inválido)`);
      continue;
    }
    parsed.push({ name, description, price });
  }

  if (parsed.length === 0) {
    return context.redirect('/misnegocios/carga-masiva?error=Ninguna%20l%C3%ADnea%20v%C3%A1lida%20para%20cargar');
  }

  const { data: orderRows } = await sb.from('products').select('sort_order').eq('business_id', businessId);
  let order = (orderRows ?? []).reduce((max: number, r: { sort_order?: number }) => Math.max(max, Number(r.sort_order ?? 0)), 0);

  const visible = role === 'admin' || autoVisible;
  const insertRows = parsed.map((p) => ({
    id: crypto.randomUUID(),
    business_id: businessId,
    name: p.name,
    description: p.description || null,
    price: p.price,
    image_url: null,
    is_visible: visible,
    on_sale: false,
    sort_order: ++order,
  }));

  const { error } = await sb.from('products').insert(insertRows);

  if (error) {
    return context.redirect('/misnegocios/carga-masiva?error=' + encodeURIComponent(error.message));
  }

  const loadedCount = parsed.length;
  const badCount = invalid.length;
  const msg = `${loadedCount}${badCount ? ` (${badCount} línea(s) descartadas)` : ''}`;
  const back = role === 'admin' ? '/admin/productos?ok=' + encodeURIComponent(msg) : '/misnegocios/carga-masiva?ok=' + encodeURIComponent(msg);
  return context.redirect(back);
};