// Konfigurasi bot dibaca dari environment variable (lihat .env.example)

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Environment variable ${name} belum diisi`);
  return value;
}

export const env = {
  get botToken() {
    return required('TELEGRAM_BOT_TOKEN');
  },
  get groupId() {
    return Number(required('TELEGRAM_GROUP_ID'));
  },
  get webhookSecret() {
    return process.env.TELEGRAM_WEBHOOK_SECRET || undefined;
  },
  get githubToken() {
    return required('GITHUB_TOKEN');
  },
  get githubRepo() {
    return required('GITHUB_REPO'); // format: pemilik/nama-repo
  },
  get githubBranch() {
    return process.env.GITHUB_BRANCH || 'master';
  },
  /** Folder proyek Astro di dalam repo. Kosongkan jika proyek ada di root repo. */
  get projectDir() {
    const dir = (process.env.GITHUB_PROJECT_DIR || '').replace(/^\/+|\/+$/g, '');
    return dir ? dir + '/' : '';
  },
  get siteUrl() {
    const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL;
    return process.env.SITE_URL || (vercel ? `https://${vercel}` : '');
  },
};
