// Semua gambar di src/assets/ bisa dipilih lewat nama file di site.json
// (bot Telegram mengunggah foto baru ke folder ini).
import type { ImageMetadata } from 'astro';
import { content } from './config';

const files = import.meta.glob<{ default: ImageMetadata }>('../assets/*.{jpg,jpeg,png,webp}', { eager: true });

function pick(name: string, fallback: string): ImageMetadata {
  const found = files[`../assets/${name}`] ?? files[`../assets/${fallback}`];
  if (!found) throw new Error(`Gambar tidak ditemukan: src/assets/${name}`);
  return found.default;
}

export const heroImage = pick(content.images.hero, 'easywash-laundry.jpg');
export const logoImage = pick(content.images.logo, 'easywash-logo.png');
