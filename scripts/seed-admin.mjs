/**
 * Crea el usuario administrador inicial.
 *
 * Uso:
 *   node scripts/seed-admin.mjs <email> <password>
 *
 * Requiere: SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en el entorno (o .env)
 */
import { createClient } from '@supabase/supabase-js';
import * as fs from 'node:fs';

// Cargar .env simple si existe
if (fs.existsSync('.env')) {
  for (const line of fs.readFileSync('.env', 'utf8').split('\n')) {
    const m = line.match(/^\s*(SUPABASE[A-Z_]*)=(.+)\s*$/);
    if (m) process.env[m[1]] = m[2].trim();
  }
}

const url = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const email = process.argv[2];
const password = process.argv[3];

if (!url || !serviceKey || !email || !password) {
  console.error(
    'Faltan datos.\nUso: node scripts/seed-admin.mjs <email> <password>\n' +
    'Asegúrate de tener SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en .env'
  );
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
    // Si ya existe, actualizarlo con rol admin
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