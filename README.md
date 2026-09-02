# Catálogos del Local

Plataforma web para mostrar los catálogos PDF de diferentes negocios ubicados en un mismo espacio físico.

## Stack

| Capa       | Tecnología                | Costo       |
|------------|--------------------------|-------------|
| Framework  | Astro 7 (server mode)    | Gratis / OSS|
| CSS        | Tailwind CSS v4          | Gratis       |
| Backend    | Supabase (auth + DB + storage) | Plan free  |
| Hosting    | Cloudflare Pages / Node  | Gratis       |

---

## Estructura del proyecto

```
catalogos-mercado/
├── src/
│   ├── components/          # Header, BusinessCard
│   ├── layouts/             # Layout, DashboardLayout
│   ├── lib/                 # supabase client, types, middleware helpers
│   ├── middleware.ts         # Auth + role guard
│   ├── styles/              # Tailwind entry (global.css)
│   └── pages/
│       ├── index.astro      # Home pública (galería de negocios)
│       ├── login.astro      # Login
│       ├── registro.astro   # Registro de puestero
│       ├── negocio/
│       │   ├── [slug]/index.astro           # Página de negocio (info + catálogos)
│       │   └── [slug]/catalogo/[id].astro   # Visor PDF online
│       ├── api/
│       │   ├── auth/        # login, register, signout
│       │   ├── businesses/  # update
│       │   ├── catalogs/    # create, delete
│       │   └── admin/       # businesses/create, businesses/toggle, users/assign, catalogs/setvisible
│       ├── misnegocios/     # Dashboard del puestero
│       └── admin/           # Dashboard del administrador
├── supabase/
│   └── migrations/          # SQL para Supabase
├── scripts/
│   └── seed-admin.mjs       # Crear usuario admin
└── .env.example
```

---

## Configuración paso a paso

Hay dos formas de correr Supabase: **100% local (Docker)** o **en la nube (gratis)**. Para desarrollo local se recomienda Docker.

---

### Opción A: Supabase local con Docker (recomendada)

**Requisito de una sola vez:** instalar [Docker Desktop](https://www.docker.com/products/docker-desktop/) y abrirlo.

```bash
# 1. Instalar dependencias del proyecto
npm install

# 2. Levantar Supabase local (aplica las migraciones automáticamente)
npx supabase start
```

> El primer arranque descarga las imágenes (tarda unos minutos). En `supabase/migrations/` está el schema; `supabase start` lo aplica solo.

Verifica las claves que imprime el comando (URL, anon key, service_role). Las del local ya están en `.env`; si tu versión imprime otras, actualiza `.env`:

```env
SUPABASE_URL=http://127.0.0.1:54321
SUPABASE_ANON_KEY=<la que imprime supabase start>
SUPABASE_SERVICE_ROLE_KEY=<la que imprime supabase start>
```

```bash
# 3. Crear el usuario administrador
node scripts/seed-admin.mjs admin@local.com Admin12345

# 4. Levantar la app web
npm run dev
```

Abre http://localhost:4321

| Servicio                                                    | URL                                      |
|-------------------------------------------------------------|------------------------------------------|
| App web (Astro)                                             | http://localhost:4321                    |
| Supabase Studio (panel de la BD)                            | http://localhost:54323                   |
| Inbox de correos locales (confirmaciones/emails)             | http://localhost:54324                   |

Para reiniciar de cero la BD local (apply migrations + seed):

```bash
npx supabase reset
```

---

## Desarrollo

```bash
npm run dev      # Inicia el servidor de desarrollo (port 4321)
npm run build    # Build de producción
npm run preview  # Preview del build
```

---

### Opción B: Supabase en la nube (gratis, sin Docker)

1. Crea un proyecto en [supabase.com](https://supabase.com) (Free tier)
2. Pega el contenido de `supabase/migrations/20260901000000_init.sql` en el **SQL Editor** y ejecuta
3. Copia `.env.example` → `.env` y pon la URL, anon key y service role key del proyecto
4. `npm install` → `node scripts/seed-admin.mjs tu@email.com TuPassword`

---

## Cómo funciona

### Roles

| Rol        | Permisos                                             |
|------------|-----------------------------------------------------|
| **admin**  | Ver todo, crear negocios, aprobar/rechazar catálogos, asignar usuarios |
| **puestero** | Editar su negocio y subir catálogos (pendientes de aprobación)    |

### Flujo del puestero

1. Se registra en `/registro` → se crea una cuenta con rol `puestero`
2. El admin le asigna un negocio desde `/admin/usuarios`
3. Sube catálogos desde `/misnegocios/catalogos` → quedan **pendientes de aprobación**
4. El admin aprueba los catálogos → se publican en la web pública

### Flujo del admin

1. Inicia sesión → accede al panel `/admin/dashboard`
2. Puede crear negocios desde `/admin/negocios`
3. Asigna puesteros a negocios desde `/admin/usuarios`
4. Aprueba o rechaza catálogos desde `/admin/catalogos`
5. Oculta/muestra negocios con un clic

---

## Despliegue en Cloudflare Pages (gratis)

```bash
# Opción 1: Command line
npx wrangler pages deploy dist/
```

O configura un repo GitHub y conéctalo a Cloudflare Pages:

1. Push a GitHub
2. Ve a Cloudflare Pages → Create project
3. Configura: **Build command** = `npm run build`, **Output directory** = `dist`
4. Agrega las variables de entorno (SUPABASE_URL, etc.) en Settings → Environment variables

### Nota: Cambiar al adaptador Cloudflare

Para desplegar en Cloudflare, instala el adaptador:

```bash
npx astro add cloudflare
```

Y actualiza `astro.config.mjs`:

```js
import cloudflare from '@astrojs/cloudflare';

export default defineConfig({
  output: 'server',
  adapter: cloudflare(),
  // ...
});
```

---

## Licencia

Proyecto privado — Uso interno del local.
