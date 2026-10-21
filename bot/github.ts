// Membaca & menyimpan konten website langsung ke repo GitHub.
// Setiap perubahan = 1 commit → hosting (Netlify) otomatis build ulang.
import { env } from './env';
import type { SiteContent } from '../src/data/schema';

const API = 'https://api.github.com';
export const CONTENT_FILE = 'src/content/site.json';
export const ASSETS_DIR = 'src/assets';

async function gh<T = any>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API}/repos/${env.githubRepo}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${env.githubToken}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'easywash-bot',
      ...(init.body ? { 'Content-Type': 'application/json' } : {}),
      ...init.headers,
    },
  });
  if (!res.ok) {
    const text = await res.text();
    const err = new Error(`GitHub ${res.status}: ${text.slice(0, 300)}`) as Error & { status: number };
    err.status = res.status;
    throw err;
  }
  return res.json() as Promise<T>;
}

async function headSha(): Promise<string> {
  const ref = await gh(`/git/ref/heads/${encodeURIComponent(env.githubBranch)}`);
  return ref.object.sha;
}

async function readJsonAt(commitSha: string): Promise<SiteContent> {
  const file = await gh(`/contents/${env.projectDir}${CONTENT_FILE}?ref=${commitSha}`);
  return JSON.parse(Buffer.from(file.content, 'base64').toString('utf8'));
}

/** Baca konten terbaru dari repo. */
export async function readContent(): Promise<SiteContent> {
  return readJsonAt(await headSha());
}

export interface FileChange {
  path: string; // relatif terhadap folder proyek
  base64?: string; // isi file (base64); kosongkan + delete=true untuk menghapus
  delete?: boolean;
}

export interface Mutation {
  message: string;
  files?: FileChange[];
}

/**
 * Ubah konten secara aman: baca versi terbaru → jalankan `mutate` → commit.
 * Jika ada perubahan lain di saat bersamaan, proses diulang otomatis.
 */
export async function updateContent(
  mutate: (content: SiteContent) => Mutation | Promise<Mutation>,
): Promise<SiteContent> {
  for (let attempt = 0; attempt < 4; attempt++) {
    const parent = await headSha();
    const content = await readJsonAt(parent);
    const { message, files = [] } = await mutate(content);

    const json = JSON.stringify(content, null, 2) + '\n';
    const changes: FileChange[] = [{ path: CONTENT_FILE, base64: Buffer.from(json).toString('base64') }, ...files];

    const tree = await Promise.all(
      changes.map(async (f) => {
        const path = env.projectDir + f.path;
        if (f.delete) return { path, mode: '100644', type: 'blob', sha: null };
        const blob = await gh('/git/blobs', { method: 'POST', body: JSON.stringify({ content: f.base64, encoding: 'base64' }) });
        return { path, mode: '100644', type: 'blob', sha: blob.sha };
      }),
    );

    const parentCommit = await gh(`/git/commits/${parent}`);
    const newTree = await gh('/git/trees', {
      method: 'POST',
      body: JSON.stringify({ base_tree: parentCommit.tree.sha, tree }),
    });
    const commit = await gh('/git/commits', {
      method: 'POST',
      body: JSON.stringify({ message, tree: newTree.sha, parents: [parent] }),
    });

    try {
      await gh(`/git/refs/heads/${encodeURIComponent(env.githubBranch)}`, {
        method: 'PATCH',
        body: JSON.stringify({ sha: commit.sha, force: false }),
      });
      return content;
    } catch (err: any) {
      if (err.status === 422 && attempt < 3) continue; // ada commit lain duluan → ulangi
      throw err;
    }
  }
  throw new Error('Gagal menyimpan setelah beberapa percobaan.');
}

/** Cek apakah sebuah file gambar masih ada di repo (untuk menghapus gambar lama). */
export function assetPath(name: string) {
  return `${ASSETS_DIR}/${name}`;
}
