// Konten website dibaca dari src/content/site.json.
// File JSON itu diubah oleh bot Telegram (lihat folder bot/) atau bisa diedit manual.
import raw from '../content/site.json';
import type { SiteContent } from './schema';

export const content = raw as SiteContent;
export const site = content.business;
export const packages = content.packages;
export const statuses = content.statuses;
export { formatRupiah, normalizePhone } from './schema';
export type { Package, IconName } from './schema';
