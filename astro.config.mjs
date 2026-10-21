// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

// Ganti `site` dengan domain asli saat website dipasang online.
export default defineConfig({
  site: 'https://easywash.example.com',
  vite: {
    plugins: [tailwindcss()],
  },
});
