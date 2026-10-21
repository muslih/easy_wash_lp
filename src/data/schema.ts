// Struktur konten website. Dipakai bersama oleh website (Astro) dan bot Telegram.

export const ICONS = [
  'washing-machine',
  'shirt',
  'zap',
  'sparkles',
  'message-circle',
  'leaf',
  'package-check',
  'clock',
  'droplets',
  'shield-check',
] as const;
export type IconName = (typeof ICONS)[number];

export interface Package {
  id: string;
  name: string;
  price: number;
  unit: string;
  duration: string;
  description: string;
  features: string[];
  icon: IconName;
  featured: boolean;
  badge: string;
}

export interface Item {
  icon: IconName;
  title: string;
  text: string;
}

export interface SiteContent {
  business: { name: string; phone: string; address: string; hours: string; mapsUrl: string };
  seo: { title: string; description: string };
  images: { hero: string; logo: string };
  hero: {
    badge: string;
    wordmark1: string;
    wordmark2: string;
    titleLine1: string;
    titleLine2: string;
    description: string;
    primaryCta: string;
    secondaryCta: string;
    note: string;
  };
  features: Item[];
  packagesSection: { eyebrow: string; title: string; subtitle: string; note: string; footnote: string };
  packages: Package[];
  stepsSection: { eyebrow: string; title: string };
  steps: Item[];
  statusCta: { title: string; text: string; button: string };
  footer: { tagline: string };
  statuses: string[];
}

// ---------------------------------------------------------------------------
// Daftar kolom yang bisa diubah lewat bot
// ---------------------------------------------------------------------------

export type FieldType = 'text' | 'long' | 'price' | 'phone' | 'url' | 'list';

export interface FieldDef {
  label: string;
  type: FieldType;
  optional?: boolean; // boleh dikosongkan dengan mengirim "-"
  max?: number;
}

export interface SectionDef {
  label: string;
  fields: Record<string, FieldDef>; // key = path di dalam SiteContent, mis. "hero.badge"
}

const itemFields = (base: string, n: number, name: string) => {
  const out: Record<string, FieldDef> = {};
  for (let i = 0; i < n; i++) {
    out[`${base}.${i}.title`] = { label: `${name} ${i + 1} — judul`, type: 'text', max: 60 };
    out[`${base}.${i}.text`] = { label: `${name} ${i + 1} — teks`, type: 'long', max: 160 };
  }
  return out;
};

export const TEXT_SECTIONS: Record<string, SectionDef> = {
  hero: {
    label: 'Bagian atas (hero)',
    fields: {
      'hero.badge': { label: 'Badge kecil', type: 'text', max: 70, optional: true },
      'hero.wordmark1': { label: 'Wordmark kiri (hijau)', type: 'text', max: 15 },
      'hero.wordmark2': { label: 'Wordmark kanan (kuning)', type: 'text', max: 15, optional: true },
      'hero.titleLine1': { label: 'Judul baris 1', type: 'text', max: 40 },
      'hero.titleLine2': { label: 'Judul baris 2 (hijau)', type: 'text', max: 40, optional: true },
      'hero.description': { label: 'Deskripsi', type: 'long', max: 220 },
      'hero.primaryCta': { label: 'Tombol utama', type: 'text', max: 30 },
      'hero.secondaryCta': { label: 'Tombol kedua', type: 'text', max: 30 },
      'hero.note': { label: 'Catatan kecil', type: 'text', max: 80, optional: true },
    },
  },
  features: { label: 'Keunggulan (3 poin)', fields: itemFields('features', 3, 'Poin') },
  packagesSection: {
    label: 'Judul bagian paket',
    fields: {
      'packagesSection.eyebrow': { label: 'Label kecil', type: 'text', max: 30 },
      'packagesSection.title': { label: 'Judul', type: 'text', max: 60 },
      'packagesSection.subtitle': { label: 'Subjudul', type: 'long', max: 160, optional: true },
      'packagesSection.note': { label: 'Catatan harga', type: 'text', max: 100, optional: true },
      'packagesSection.footnote': { label: 'Catatan bawah', type: 'text', max: 120, optional: true },
    },
  },
  steps: {
    label: 'Cara pesan (3 langkah)',
    fields: {
      'stepsSection.eyebrow': { label: 'Label kecil', type: 'text', max: 30 },
      'stepsSection.title': { label: 'Judul', type: 'text', max: 60 },
      ...itemFields('steps', 3, 'Langkah'),
    },
  },
  statusCta: {
    label: 'Ajakan cek status',
    fields: {
      'statusCta.title': { label: 'Judul', type: 'text', max: 50 },
      'statusCta.text': { label: 'Teks', type: 'long', max: 140 },
      'statusCta.button': { label: 'Tombol', type: 'text', max: 30 },
    },
  },
  seo: {
    label: 'Judul tab & Google',
    fields: {
      'seo.title': { label: 'Judul halaman', type: 'text', max: 70 },
      'seo.description': { label: 'Deskripsi Google/WhatsApp', type: 'long', max: 160 },
      'footer.tagline': { label: 'Tagline footer', type: 'text', max: 50 },
    },
  },
};

export const INFO_FIELDS: Record<string, FieldDef> = {
  'business.name': { label: 'Nama usaha', type: 'text', max: 40 },
  'business.phone': { label: 'Nomor WhatsApp', type: 'phone' },
  'business.address': { label: 'Alamat', type: 'long', max: 200, optional: true },
  'business.hours': { label: 'Jam buka', type: 'text', max: 80, optional: true },
  'business.mapsUrl': { label: 'Link Google Maps', type: 'url', optional: true },
};

export const PACKAGE_FIELDS: Record<string, FieldDef> = {
  name: { label: 'Nama', type: 'text', max: 40 },
  price: { label: 'Harga', type: 'price' },
  unit: { label: 'Satuan (kg, pcs, pasang…)', type: 'text', max: 15 },
  duration: { label: 'Durasi', type: 'text', max: 30 },
  description: { label: 'Deskripsi', type: 'long', max: 160 },
  features: { label: 'Daftar fitur', type: 'list' },
  badge: { label: 'Label pojok (mis. "Terlaris")', type: 'text', max: 25, optional: true },
};

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

export const formatRupiah = (amount: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(amount);

/** Normalisasi nomor (08xx → 628xx). Mengembalikan null jika tidak valid. */
export function normalizePhone(phone: string): string | null {
  let number = phone.replace(/[^0-9]/g, '');
  if (number.startsWith('0')) number = '62' + number.slice(1);
  return /^\d{9,15}$/.test(number) ? number : null;
}

/** Ubah input teks dari admin menjadi nilai sesuai tipe. Melempar Error berisi pesan untuk admin. */
export function parseFieldValue(def: FieldDef, raw: string): string | number | string[] {
  const input = raw.trim();
  if (def.optional && (input === '-' || input === '')) return def.type === 'list' ? [] : '';
  if (!input) throw new Error('Isi tidak boleh kosong.');

  switch (def.type) {
    case 'price': {
      const digits = input.replace(/[^0-9]/g, '');
      const value = Number(digits);
      if (!digits || !Number.isFinite(value) || value <= 0) throw new Error('Harga harus berupa angka, contoh: 12000 atau 12.000');
      if (value > 100_000_000) throw new Error('Harga terlalu besar.');
      return value;
    }
    case 'phone':
      if (!normalizePhone(input)) throw new Error('Nomor WhatsApp tidak valid. Contoh: 0815-9114-401');
      return input;
    case 'url':
      if (!/^https?:\/\/\S+$/i.test(input)) throw new Error('Link harus diawali http:// atau https://');
      return input;
    case 'list': {
      const items = input
        .split('\n')
        .map((s) => s.replace(/^[-•*\d.)\s]+/, '').trim())
        .filter(Boolean);
      if (!items.length) throw new Error('Tulis minimal satu fitur, satu per baris.');
      if (items.length > 8) throw new Error('Maksimal 8 fitur.');
      if (items.some((s) => s.length > 60)) throw new Error('Setiap fitur maksimal 60 karakter.');
      return items;
    }
    default:
      if (def.type === 'text' && input.includes('\n')) throw new Error('Kolom ini hanya satu baris.');
      if (def.max && input.length > def.max) throw new Error(`Terlalu panjang (${input.length}/${def.max} karakter).`);
      return input;
  }
}

export function getPath(obj: unknown, path: string): unknown {
  return path.split('.').reduce<any>((o, k) => (o == null ? undefined : o[k]), obj);
}

export function setPath(obj: any, path: string, value: unknown) {
  const keys = path.split('.');
  const last = keys.pop()!;
  const target = keys.reduce((o, k) => o?.[k], obj);
  if (target == null || !(last in target)) throw new Error(`Kolom tidak ditemukan: ${path}`);
  target[last] = value;
}

export function slugify(text: string) {
  return (
    text
      .toLowerCase()
      .normalize('NFKD')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 24) || 'paket'
  );
}
