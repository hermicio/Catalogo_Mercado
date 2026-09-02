// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import vercel from '@astrojs/vercel';

// https://astro.build/config
export default defineConfig({
  output: 'server',
  site: process.env.NODE_ENV === 'production'
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL ?? 'catalogo-mercado-eqbl.vercel.app'}`
    : 'http://localhost:4321',
  adapter: vercel(),
  security: {
    checkOrigin: process.env.NODE_ENV === 'production',
  },
  vite: {
    plugins: [tailwindcss()],
  },
});
