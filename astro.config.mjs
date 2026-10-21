// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import vercel from '@astrojs/vercel';

export default defineConfig({
  site: 'https://easy-wash-bjm.vercel.app',
  // Semua halaman tetap statis; hanya /api/telegram (webhook bot) yang berjalan sebagai Vercel Function.
  adapter: vercel({ maxDuration: 30 }),
  vite: {
    plugins: [tailwindcss()],
  },
});
