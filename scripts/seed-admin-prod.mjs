/**
 * Crea/actualiza el usuario administrador en el proyecto de PRODUCCIÓN (Supabase Cloud).
 *
 * Usa variables de entorno específicas de PRODUCCIÓN para no pisar las locales.
 *
 * Uso:
 *   $env:SUPABASE_PROD_URL = "https://XXXX.supabase.co"
 *   $env:SUPABASE_PROD_SERVICE_ROLE_KEY = "service_role de producción (nueva)"
 *   node scripts/seed-admin-prod.mjs "admin@tu-local.com" "TuClaveFuerte123!"
 *
 * No sube ninguna clave al repositorio: se leen de variables de entorno de la terminal.
 */
import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_PROD_URL;
const serviceKey = process.env.SUPABASE_PROD_SERVICE_ROLE_KEY;
const email = process.argv[2];
const password = process.argv[3];

if (!url || !serviceKey || !email || !password) {
  console.error(
    'Faltan datos.\n' +
    'Fijá SUPABASE_PROD_URL y SUPABASE_PROD_SERVICE_ROLE_KEY en el entorno antes de correr.\n' +
    'Uso: node scripts/seed-admin-prod.mjs <email> <password>'
  );
  process.exit(1);
}

if (!url.includes('.supabase.co')) {
  console.error('Parece que no es un proyecto de producción (cloud). Verificá SUPABASE_PROD_URL.');
  process.exit(1);
}

const admin = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

try {
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { role: 'admin' },
    app_metadata: { role: 'admin' },
  });

  if (error) {
    if (error.code === 'user_exists') {
      const { data: found } = await admin.auth.admin.listUsers();
      const existing = found.users.find((u) => u.email === email);
      if (existing) {
        await admin.auth.admin.updateUserById(existing.id, {
          user_metadata: { role: 'admin' },
          app_metadata: { role: 'admin' },
        });
        console.log(`Administrador actualizado: ${email}`);
      }
    } else {
      console.error('Error creando admin:', error.message);
      process.exit(1);
    }
  } else {
    console.log(`Administrador creado: ${data.user.email}`);
  }
} catch (e) {
  console.error('Error:', e instanceof Error ? e.message : String(e));
  process.exit(1);
}
