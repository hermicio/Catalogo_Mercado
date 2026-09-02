# Guía de puesta en producción (gratis)

Este proyecto tiene **dos piezas** que se alojan por separado:

| Pieza | Dónde vive | Hosting gratis |
|---|---|---|
| Código de la web (Astro) | GitHub | Vercel (o Netlify) |
| Base de datos + login + archivos (Supabase) | Supabase Cloud | Supabase free tier |

> Hoy la base corre **local con Docker**. Para producción se crea un proyecto en
> **Supabase Cloud** y se reaplican las migraciones (ya están en `supabase/migrations/`).

---

## Parte 1 — Subir el código a GitHub

1. Instalá [Git](https://git-scm.com/downloads) si no lo tenés, y [GitHub Desktop](https://desktop.github.com/) (más fácil) o usá la consola.

2. En GitHub (github.com) creá un **nuevo repositorio** (privado o público, gratis). No le pongas archivos iniciales (README/LICENSE) para evitar conflictos.

3. Inicializá el repo y subí el proyecto. Desde PowerShell en la carpeta del proyecto:

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
git init
git add .
git commit -m "Primer commit: Catálogos del Local"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/catalogos-mercado.git
git push -u origin main
```

> ⚠️ El archivo `.env` **no se sube** (está en `.gitignore`). Es correcto: las claves van en el hosting.

---

## Parte 2 — Crear Supabase Cloud y migrar los datos

1. Creá una cuenta gratis en **https://supabase.com** (podés entrar con tu cuenta de GitHub/Google).

2. En el dashboard, **New project**: poné un nombre y una contraseña de base de datos (guardala). Elegí la región más cercana (ej. `South America (São Paulo)`).

3. Cuando termine, en **Project Settings → API keys**, copiá:
   - `Project URL` → es tu `SUPABASE_URL` (ej. `https://xxxx.supabase.co`)
   - `anon public` → `SUPABASE_ANON_KEY`
   - `service_role` → `SUPABASE_SERVICE_ROLE_KEY` (¡secreta!)

4. **Migrar las tablas** a la nube. Abrí **SQL Editor** en el proyecto cloud y pegá y ejecutá, **en orden**, el contenido de cada archivo de `supabase/migrations/`:
   - `20260901000000_init.sql`
   - `20260901010000_products.sql`
   - `20260901020000_products_auto_visible.sql`
   - `20260901030000_site_settings.sql`
   - `20260901040000_products_sale_order.sql`
   - `20260901050000_fair_dates.sql`

   (También se puede con `npx supabase link --project-ref <ref> && npx supabase db push`, pero los archivos ya están/coinciden, así que pegar en el SQL Editor es lo más simple y seguro.)

5. **Configurar confirmación de email / login**: en **Authentication → Providers → Email**, en producción conviene dejar activo. La primera vez que un puestero se registre, recibirá un mail de confirmación de Supabase.

6. **Asegurarse de poder iniciar sesión**: el login con email y contraseña funciona igual que local. Confirma que en **Authentication → Providers → Email** el proveedor esté habilitado.

7. **Crear el admin inicial** en producción. Usá el script `scripts/seed-admin-prod.mjs` (usa variables de producción, no toca tu `.env` local). En PowerShell en la carpeta del proyecto:

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
$env:SUPABASE_PROD_URL = "https://TU-PROYECTO.supabase.co"
$env:SUPABASE_PROD_SERVICE_ROLE_KEY = "TU_NUEVA_SERVICE_ROLE"
node scripts/seed-admin-prod.mjs "admin@tu-local.com" "TuClaveFuerte123!"
```

   Esto crea el usuario con `role = admin` (email confirmado). Si el email ya existe, le asigna el rol admin. A partir de ahí ese usuario entra a `/admin`.

   > **Seguridad:** el script `seed-admin-prod.mjs` lee las claves de variables de entorno y **no las sube al repo**. Preferí una service_role nueva (regenerala en Supabase Dashboard → Project Settings → API keys si la anterior quedó expuesta).

---

## Parte 3 — Conectar la web al Supabase Cloud

Cualquier cosa que hoy esté en tu `.env` local hay que configurarla en el hosting. Los valores serán los de **Supabase Cloud** (paso 2 de la Parte 2).

---

## Parte 4 — Desplegar en Vercel (recomendado)

1. Creá cuenta en **https://vercel.com** (entrá con tu GitHub).
2. **Add New → Project** → elegí el repo `catalogos-mercado`.
3. Vercel detecta Astro. En la sección **Environment Variables**, agregá:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   (con los valores de Supabase Cloud)
4. **Framework Preset**: `Astro`. Build command: `npm run build`. Output: lo maneja el adapter.
5. **Deploy**. Vas a obtener una URL tipo `https://catalogos-mercado.vercel.app`.
6. Cada vez que hagas `git push` a `main`, Vercel redespliega solo.

### Ajuste ya aplicado

El proyecto **ya usa el adapter de Vercel** (`@astrojs/vercel`). No hay que cambiar nada; el build genera el output listo para Vercel.

> Nota: si en algún momento quisieras usar Netlify, cambiá el adapter a `@astrojs/netlify` y ajustá `astro.config.mjs` de forma análoga.

---

## Alternativas de hosting (mismo flujo, solo cambia la Parte 4)

- **Netlify**: igual que Vercel. `npm run build`, botón "New site from Git". Necesitás `@astrojs/netlify` para SSR.
- **Cloudflare Pages**: requiere `@astrojs/cloudflare` y configuración de sesiones distinta (más trabajo).
- **Railway / Render (free tier)**: corren el contenedor Node standalone; la primera carga tras inactividad es lenta.

---

## Variables de entorno (resumen)

| Variable | Local .env | Producción (Vercel/Netlify) |
|---|---|---|
| `SUPABASE_URL` | `http://127.0.0.1:54321` | `https://xxxx.supabase.co` |
| `SUPABASE_ANON_KEY` | clave local | clave cloud |
| `SUPABASE_SERVICE_ROLE_KEY` | clave local | clave cloud |

---

## Antes de publicar (checklist)

- [ ] `npm run check` sin errores.
- [ ] `npm run build` sin errores (ya verificado).
- [ ] `.env` NO está subido al repo (sí está en `.gitignore`).
- [ ] `security.checkOrigin` está activo en producción (ya lo está: `NODE_ENV === 'production'`).
- [ ] Cookie segura en producción (ya lo está: `secure: import.meta.env.PROD`).
