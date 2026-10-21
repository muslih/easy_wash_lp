// Bot Telegram untuk mengatur konten website Easywash.
// Hanya admin grup Easywash yang bisa mengubah konten (di grup atau chat pribadi dengan bot).
import { Bot, InlineKeyboard, type Context } from 'grammy';
import type { Message } from 'grammy/types';
import { env } from './env';
import { readContent, updateContent, assetPath, type Mutation } from './github';
import {
  ICONS,
  INFO_FIELDS,
  PACKAGE_FIELDS,
  TEXT_SECTIONS,
  formatRupiah,
  getPath,
  parseFieldValue,
  setPath,
  slugify,
  type FieldDef,
  type Package,
  type SiteContent,
} from '../src/data/schema';

const ANONYMOUS_ADMIN_BOT = 1087968824; // akun "GroupAnonymousBot" milik Telegram
const MARKER = /⟨([^⟩]+)⟩/;
const SAVED_NOTE = '⏳ Website diperbarui otomatis dalam ±1–2 menit.';
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

const ICON_LABELS: Record<string, string> = {
  'washing-machine': '🧺 Mesin cuci',
  shirt: '👕 Baju',
  zap: '⚡ Kilat',
  sparkles: '✨ Kilau',
  'message-circle': '💬 Chat',
  leaf: '🍃 Daun',
  'package-check': '📦 Paket',
  clock: '🕒 Jam',
  droplets: '💧 Air',
  'shield-check': '🛡 Perisai',
};

// ---------------------------------------------------------------------------
// Utilitas
// ---------------------------------------------------------------------------

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const cut = (s: string, n = 60) => (s.length > n ? s.slice(0, n - 1) + '…' : s);
const who = (ctx: Context) =>
  ctx.from?.id === ANONYMOUS_ADMIN_BOT ? 'Admin' : [ctx.from?.first_name, ctx.from?.last_name].filter(Boolean).join(' ') || 'Admin';

function showValue(def: FieldDef, value: unknown): string {
  if (def.type === 'price') return formatRupiah(Number(value));
  if (def.type === 'list') return (value as string[]).length ? (value as string[]).map((v) => '• ' + v).join('\n') : '(kosong)';
  return (value as string) || '(kosong)';
}

function findTextField(path: string): FieldDef | undefined {
  if (INFO_FIELDS[path]) return INFO_FIELDS[path];
  for (const section of Object.values(TEXT_SECTIONS)) if (section.fields[path]) return section.fields[path];
}

function sectionOf(path: string): string {
  if (INFO_FIELDS[path]) return 'in';
  for (const [key, section] of Object.entries(TEXT_SECTIONS)) if (section.fields[path]) return `ts:${key}`;
  return 'm';
}

function findPackage(content: SiteContent, id: string): Package {
  const pkg = content.packages.find((p) => p.id === id);
  if (!pkg) throw new Error('Paket tidak ditemukan (mungkin sudah dihapus).');
  return pkg;
}

function uniqueId(content: SiteContent, name: string) {
  const base = slugify(name);
  let id = base;
  for (let i = 2; content.packages.some((p) => p.id === id); i++) id = `${base}-${i}`;
  return id;
}

// ---------------------------------------------------------------------------
// Tampilan menu
// ---------------------------------------------------------------------------

type Screen = { text: string; keyboard: InlineKeyboard };

function mainMenu(content: SiteContent): Screen {
  const kb = new InlineKeyboard()
    .text('📦 Paket & harga', 'pk')
    .text('✏️ Teks halaman', 'tx')
    .row()
    .text('📞 WhatsApp & info', 'in')
    .text('🖼 Foto & logo', 'ft')
    .row()
    .text('👀 Ringkasan', 'sum');
  if (env.siteUrl) kb.url('🌐 Buka website', env.siteUrl);
  return {
    text: `<b>⚙️ Pengaturan website ${esc(content.business.name)}</b>\n\nPilih bagian yang ingin diubah. Setiap perubahan langsung disimpan dan website diperbarui otomatis.`,
    keyboard: kb,
  };
}

function packagesMenu(content: SiteContent): Screen {
  const kb = new InlineKeyboard();
  const lines = content.packages.map((p, i) => {
    kb.text(`${p.featured ? '⭐ ' : ''}${p.name}`, `pk:${p.id}`).row();
    return `${i + 1}. <b>${esc(p.name)}</b> — ${formatRupiah(p.price)}/${esc(p.unit)} · ${esc(p.duration)}${p.featured ? ' ⭐' : ''}`;
  });
  kb.text('➕ Tambah paket', 'pkadd').row().text('⬅️ Menu', 'm');
  return { text: `<b>📦 Paket & harga</b>\n\n${lines.join('\n') || '(belum ada paket)'}\n\nPilih paket untuk diubah:`, keyboard: kb };
}

function packageMenu(content: SiteContent, id: string): Screen {
  const p = findPackage(content, id);
  const index = content.packages.indexOf(p);
  const kb = new InlineKeyboard()
    .text('✏️ Nama', `e:p:${id}:name`)
    .text('💰 Harga', `e:p:${id}:price`)
    .text('📏 Satuan', `e:p:${id}:unit`)
    .row()
    .text('⏱ Durasi', `e:p:${id}:duration`)
    .text('📝 Deskripsi', `e:p:${id}:description`)
    .row()
    .text('✅ Fitur', `e:p:${id}:features`)
    .text('🏷 Label', `e:p:${id}:badge`)
    .text('🎨 Ikon', `pki:${id}`)
    .row()
    .text(p.featured ? '⭐ Unggulan: Ya' : '☆ Unggulan: Tidak', `pkft:${id}`)
    .row();
  if (index > 0) kb.text('⬆️ Naikkan', `pkmv:${id}:-1`);
  if (index < content.packages.length - 1) kb.text('⬇️ Turunkan', `pkmv:${id}:1`);
  kb.row().text('🗑 Hapus paket', `pkdel:${id}`).row().text('⬅️ Daftar paket', 'pk');

  const text = [
    `<b>📦 ${esc(p.name)}</b>${p.featured ? ' ⭐' : ''}`,
    '',
    `💰 ${formatRupiah(p.price)} / ${esc(p.unit)}`,
    `⏱ ${esc(p.duration)}`,
    `📝 ${esc(p.description || '(tanpa deskripsi)')}`,
    `🏷 Label: ${esc(p.badge || '-')}`,
    `🎨 Ikon: ${ICON_LABELS[p.icon] ?? p.icon}`,
    '',
    '<b>Fitur:</b>',
    esc(p.features.map((f) => '• ' + f).join('\n') || '(kosong)'),
  ].join('\n');
  return { text, keyboard: kb };
}

function textSectionsMenu(): Screen {
  const kb = new InlineKeyboard();
  for (const [key, s] of Object.entries(TEXT_SECTIONS)) kb.text(s.label, `ts:${key}`).row();
  kb.text('⬅️ Menu', 'm');
  return { text: '<b>✏️ Teks halaman</b>\n\nPilih bagian halaman:', keyboard: kb };
}

function fieldsMenu(content: SiteContent, title: string, fields: Record<string, FieldDef>, back: string): Screen {
  const kb = new InlineKeyboard();
  const lines: string[] = [];
  for (const [path, def] of Object.entries(fields)) {
    const value = showValue(def, getPath(content, path));
    lines.push(`<b>${esc(def.label)}</b>\n${esc(cut(value, 90))}`);
    kb.text(`✏️ ${def.label}`, `e:t:${path}`).row();
  }
  kb.text('⬅️ Kembali', back);
  return { text: `<b>${esc(title)}</b>\n\n${lines.join('\n\n')}`, keyboard: kb };
}

function photosMenu(content: SiteContent): Screen {
  return {
    text: [
      '<b>🖼 Foto & logo</b>',
      '',
      `Foto utama: <code>${esc(content.images.hero)}</code>`,
      `Logo: <code>${esc(content.images.logo)}</code>`,
      '',
      'Tips: foto utama sebaiknya horizontal (landscape). Untuk logo PNG transparan, kirim sebagai <b>File</b> (bukan Foto) agar latarnya tidak hilang.',
    ].join('\n'),
    keyboard: new InlineKeyboard().text('📷 Ganti foto utama', 'img:hero').text('🏷 Ganti logo', 'img:logo').row().text('⬅️ Menu', 'm'),
  };
}

function summary(content: SiteContent): Screen {
  const b = content.business;
  const text = [
    `<b>👀 Ringkasan website ${esc(b.name)}</b>`,
    '',
    `📞 WhatsApp: ${esc(b.phone)}`,
    b.address ? `📍 ${esc(b.address)}` : '',
    b.hours ? `🕘 ${esc(b.hours)}` : '',
    '',
    `<b>${esc(content.hero.titleLine1)} ${esc(content.hero.titleLine2)}</b>`,
    esc(content.hero.description),
    '',
    '<b>Paket:</b>',
    ...content.packages.map((p) => `• ${esc(p.name)} — ${formatRupiah(p.price)}/${esc(p.unit)} (${esc(p.duration)})`),
    env.siteUrl ? `\n🌐 ${env.siteUrl}` : '',
  ]
    .filter((l) => l !== '')
    .join('\n');
  return { text, keyboard: new InlineKeyboard().text('⬅️ Menu', 'm') };
}

async function screenFor(key: string, content: SiteContent): Promise<Screen> {
  if (key === 'm') return mainMenu(content);
  if (key === 'pk') return packagesMenu(content);
  if (key.startsWith('pk:')) return packageMenu(content, key.slice(3));
  if (key === 'tx') return textSectionsMenu();
  if (key.startsWith('ts:')) {
    const s = TEXT_SECTIONS[key.slice(3)];
    return fieldsMenu(content, `✏️ ${s.label}`, s.fields, 'tx');
  }
  if (key === 'in') return fieldsMenu(content, '📞 WhatsApp & info usaha', INFO_FIELDS, 'm');
  if (key === 'ft') return photosMenu(content);
  if (key === 'sum') return summary(content);
  return mainMenu(content);
}

// ---------------------------------------------------------------------------
// Bot
// ---------------------------------------------------------------------------

export function createBot() {
  const bot = new Bot(env.botToken);
  const groupId = env.groupId;

  async function isAdmin(ctx: Context): Promise<boolean> {
    if (!ctx.from) return false;
    // Admin anonim di grup
    if (ctx.from.id === ANONYMOUS_ADMIN_BOT) return ctx.chat?.id === groupId && ctx.senderChat?.id === groupId;
    try {
      const member = await ctx.api.getChatMember(groupId, ctx.from.id);
      return member.status === 'creator' || member.status === 'administrator';
    } catch {
      return false;
    }
  }

  const send = (ctx: Context, s: Screen) =>
    ctx.reply(s.text, { parse_mode: 'HTML', reply_markup: s.keyboard, link_preview_options: { is_disabled: true } });

  const show = async (ctx: Context, s: Screen) => {
    try {
      await ctx.editMessageText(s.text, { parse_mode: 'HTML', reply_markup: s.keyboard, link_preview_options: { is_disabled: true } });
    } catch (err: any) {
      if (!String(err?.description ?? err).includes('message is not modified')) await send(ctx, s);
    }
  };

  // Tangkap semua error agar bot tetap membalas dengan sopan (dan webhook tidak diulang Telegram)
  bot.use(async (ctx, next) => {
    try {
      await next();
    } catch (err: any) {
      console.error('Bot error:', err);
      const text = err?.message && !String(err.message).startsWith('GitHub') ? err.message : 'Terjadi kesalahan. Coba lagi sebentar lagi.';
      try {
        if (ctx.callbackQuery) await ctx.answerCallbackQuery({ text: `⚠️ ${text}`.slice(0, 190), show_alert: true });
        else throw 0;
      } catch {
        try {
          await ctx.reply(`⚠️ ${esc(text)}`, { parse_mode: 'HTML' });
        } catch {}
      }
    }
  });

  // /id — membantu mencari ID grup saat setup (boleh dipakai siapa saja)
  bot.command('id', (ctx) =>
    ctx.reply(`Chat ID: <code>${ctx.chat.id}</code>\nUser ID kamu: <code>${ctx.from?.id}</code>`, { parse_mode: 'HTML' }),
  );

  // Hanya grup Easywash & chat pribadi yang dilayani
  bot.use(async (ctx, next) => {
    const chat = ctx.chat;
    if (!chat || (chat.id !== groupId && chat.type !== 'private')) return;
    if (!(await isAdmin(ctx))) {
      if (ctx.callbackQuery) await ctx.answerCallbackQuery({ text: 'Khusus admin grup Easywash.', show_alert: true });
      else if (ctx.message?.text?.startsWith('/'))
        await ctx.reply('🔒 Pengaturan website hanya untuk admin grup Easywash.');
      return;
    }
    await next();
  });

  // ----- Perintah -----
  const help = [
    '<b>🤖 Bot pengatur website Easywash</b>',
    '',
    '/menu — menu utama',
    '/paket — atur paket & harga',
    '/teks — ubah teks halaman',
    '/info — nomor WhatsApp, alamat, jam buka',
    '/foto — ganti foto utama & logo',
    '/lihat — ringkasan isi website',
    '',
    'Cara mengubah: tekan tombol ✏️, lalu <b>balas (reply)</b> pesan dari bot dengan isi baru.',
  ].join('\n');

  bot.command(['start', 'bantuan', 'help'], (ctx) => ctx.reply(help, { parse_mode: 'HTML' }));
  const open = (key: string) => async (ctx: Context) => send(ctx, await screenFor(key, await readContent()));
  bot.command('menu', open('m'));
  bot.command('paket', open('pk'));
  bot.command('teks', open('tx'));
  bot.command('info', open('in'));
  bot.command('foto', open('ft'));
  bot.command('lihat', open('sum'));

  // ----- Navigasi menu -----
  bot.callbackQuery(/^(m|pk|pk:[\w-]+|tx|ts:\w+|in|ft|sum)$/, async (ctx) => {
    await ctx.answerCallbackQuery();
    await show(ctx, await screenFor(ctx.match[1], await readContent()));
  });

  // ----- Minta input (admin membalas pesan bot) -----
  async function prompt(ctx: Context, title: string, current: string, hint: string, marker: string) {
    const user = ctx.from!;
    const mention =
      user.id === ANONYMOUS_ADMIN_BOT ? '' : `<a href="tg://user?id=${user.id}">${esc(user.first_name)}</a>, `;
    await ctx.reply(
      `✏️ ${mention}<b>${esc(title)}</b>\n\nSekarang:\n<blockquote>${esc(current)}</blockquote>\n${hint}\n\n<i>Balas (reply) pesan ini dengan isi baru.</i>\n⟨${marker}⟩`,
      { parse_mode: 'HTML', reply_markup: { force_reply: true, selective: true, input_field_placeholder: title } },
    );
  }

  const hintFor = (def: FieldDef) =>
    [
      def.type === 'price' ? 'Contoh: <code>12000</code> atau <code>12.000</code>' : '',
      def.type === 'phone' ? 'Contoh: <code>0815-9114-401</code>' : '',
      def.type === 'url' ? 'Contoh: <code>https://maps.app.goo.gl/…</code>' : '',
      def.type === 'list' ? 'Tulis <b>satu fitur per baris</b>.' : '',
      def.max ? `Maksimal ${def.max} karakter.` : '',
      def.optional ? 'Kirim <code>-</code> untuk mengosongkan.' : '',
    ]
      .filter(Boolean)
      .join('\n');

  bot.callbackQuery(/^e:t:([\w.]+)$/, async (ctx) => {
    await ctx.answerCallbackQuery();
    const path = ctx.match[1];
    const def = findTextField(path);
    if (!def) return;
    const content = await readContent();
    await prompt(ctx, def.label, showValue(def, getPath(content, path)), hintFor(def), `e:t:${path}`);
  });

  bot.callbackQuery(/^e:p:([\w-]+):(\w+)$/, async (ctx) => {
    await ctx.answerCallbackQuery();
    const [, id, field] = ctx.match;
    const def = PACKAGE_FIELDS[field];
    if (!def) return;
    const pkg = findPackage(await readContent(), id);
    const current = field === 'features' ? pkg.features.join('\n') || '(kosong)' : showValue(def, (pkg as any)[field]);
    await prompt(ctx, `${def.label} — ${pkg.name}`, current, hintFor(def), `e:p:${id}:${field}`);
  });

  bot.callbackQuery('pkadd', async (ctx) => {
    await ctx.answerCallbackQuery();
    await prompt(
      ctx,
      'Paket baru',
      '-',
      'Format: <code>Nama | Harga | Satuan | Durasi</code>\nContoh: <code>Cuci Sepatu | 25000 | pasang | 3 hari</code>\nSatuan boleh dilewati (otomatis kg): <code>Cuci Karpet | 15000 | 3 hari</code>',
      'new',
    );
  });

  bot.callbackQuery(/^img:(hero|logo)$/, async (ctx) => {
    await ctx.answerCallbackQuery();
    const label = ctx.match[1] === 'hero' ? 'Foto utama' : 'Logo';
    const user = ctx.from;
    const mention = user.id === ANONYMOUS_ADMIN_BOT ? '' : `<a href="tg://user?id=${user.id}">${esc(user.first_name)}</a>, `;
    await ctx.reply(
      `🖼 ${mention}<b>balas (reply) pesan ini dengan ${label.toLowerCase()} baru</b> (kirim sebagai Foto atau File gambar JPG/PNG/WebP).\n⟨img:${ctx.match[1]}⟩`,
      { parse_mode: 'HTML', reply_markup: { force_reply: true, selective: true, input_field_placeholder: label } },
    );
  });

  // ----- Aksi langsung dari tombol -----
  async function act(ctx: Context, back: string, mutate: (c: SiteContent) => Mutation) {
    await ctx.answerCallbackQuery({ text: '⏳ Menyimpan…' });
    try {
      const content = await updateContent(mutate);
      await show(ctx, await screenFor(back, content));
      await ctx.reply(`✅ Disimpan oleh ${esc(who(ctx))}. ${SAVED_NOTE}`, { parse_mode: 'HTML' });
    } catch (err: any) {
      await ctx.reply(`⚠️ ${esc(err.message ?? String(err))}`, { parse_mode: 'HTML' });
    }
  }

  bot.callbackQuery(/^pki:([\w-]+)$/, async (ctx) => {
    await ctx.answerCallbackQuery();
    const id = ctx.match[1];
    const pkg = findPackage(await readContent(), id);
    const kb = new InlineKeyboard();
    ICONS.forEach((icon, i) => {
      kb.text(ICON_LABELS[icon] ?? icon, `pkis:${id}:${i}`);
      if (i % 2 === 1) kb.row();
    });
    kb.row().text('⬅️ Batal', `pk:${id}`);
    await show(ctx, { text: `<b>🎨 Pilih ikon untuk ${esc(pkg.name)}</b>`, keyboard: kb });
  });

  bot.callbackQuery(/^pkis:([\w-]+):(\d+)$/, (ctx) => {
    const [, id, i] = ctx.match;
    return act(ctx, `pk:${id}`, (c) => {
      const pkg = findPackage(c, id);
      pkg.icon = ICONS[Number(i)] ?? pkg.icon;
      return { message: `bot: ubah ikon paket ${pkg.name} (oleh ${who(ctx)})` };
    });
  });

  bot.callbackQuery(/^pkft:([\w-]+)$/, (ctx) => {
    const id = ctx.match[1];
    return act(ctx, `pk:${id}`, (c) => {
      const pkg = findPackage(c, id);
      pkg.featured = !pkg.featured;
      return { message: `bot: ${pkg.featured ? 'jadikan' : 'hapus'} unggulan paket ${pkg.name} (oleh ${who(ctx)})` };
    });
  });

  bot.callbackQuery(/^pkmv:([\w-]+):(-?1)$/, (ctx) => {
    const [, id, dir] = ctx.match;
    return act(ctx, `pk:${id}`, (c) => {
      const pkg = findPackage(c, id);
      const from = c.packages.indexOf(pkg);
      const to = Math.min(c.packages.length - 1, Math.max(0, from + Number(dir)));
      c.packages.splice(from, 1);
      c.packages.splice(to, 0, pkg);
      return { message: `bot: pindahkan urutan paket ${pkg.name} (oleh ${who(ctx)})` };
    });
  });

  bot.callbackQuery(/^pkdel:([\w-]+)$/, async (ctx) => {
    await ctx.answerCallbackQuery();
    const id = ctx.match[1];
    const pkg = findPackage(await readContent(), id);
    await show(ctx, {
      text: `🗑 Hapus paket <b>${esc(pkg.name)}</b> dari website?`,
      keyboard: new InlineKeyboard().text('Ya, hapus', `pkdely:${id}`).text('Batal', `pk:${id}`),
    });
  });

  bot.callbackQuery(/^pkdely:([\w-]+)$/, (ctx) => {
    const id = ctx.match[1];
    return act(ctx, 'pk', (c) => {
      const pkg = findPackage(c, id);
      if (c.packages.length <= 1) throw new Error('Minimal harus ada satu paket.');
      c.packages = c.packages.filter((p) => p.id !== id);
      return { message: `bot: hapus paket ${pkg.name} (oleh ${who(ctx)})` };
    });
  });

  // ----- Balasan admin (isi baru) -----
  bot.on('message', async (ctx, next) => {
    const reply = ctx.message.reply_to_message;
    if (!reply || reply.from?.id !== ctx.me.id) return next();
    const marker = (reply.text ?? reply.caption ?? '').match(MARKER)?.[1];
    if (!marker) return next();

    try {
      if (marker.startsWith('img:')) return await handleImage(ctx, ctx.message, marker.slice(4) as 'hero' | 'logo');

      const text = ctx.message.text;
      if (!text) throw new Error('Balas dengan teks.');

      let back = 'm';
      let label = '';
      const content = await updateContent((c) => {
        if (marker === 'new') {
          const parts = text.split('|').map((s) => s.trim());
          if (parts.length < 3) throw new Error('Format: Nama | Harga | Satuan | Durasi');
          const [name, priceRaw] = parts;
          const unit = parts.length >= 4 ? parts[2] : 'kg';
          const duration = parts.length >= 4 ? parts[3] : parts[2];
          const pkg: Package = {
            id: uniqueId(c, name),
            name: parseFieldValue(PACKAGE_FIELDS.name, name) as string,
            price: parseFieldValue(PACKAGE_FIELDS.price, priceRaw) as number,
            unit: parseFieldValue(PACKAGE_FIELDS.unit, unit) as string,
            duration: parseFieldValue(PACKAGE_FIELDS.duration, duration) as string,
            description: '',
            features: [],
            icon: 'washing-machine',
            featured: false,
            badge: '',
          };
          c.packages.push(pkg);
          back = `pk:${pkg.id}`;
          label = `Paket ${pkg.name} ditambahkan`;
          return { message: `bot: tambah paket ${pkg.name} (oleh ${who(ctx)})` };
        }

        const pkgMatch = marker.match(/^e:p:([\w-]+):(\w+)$/);
        if (pkgMatch) {
          const [, id, field] = pkgMatch;
          const def = PACKAGE_FIELDS[field];
          const pkg = findPackage(c, id);
          (pkg as any)[field] = parseFieldValue(def, text);
          back = `pk:${id}`;
          label = `${def.label} — ${pkg.name}`;
          return { message: `bot: ubah ${def.label.toLowerCase()} paket ${pkg.name} (oleh ${who(ctx)})` };
        }

        const textMatch = marker.match(/^e:t:([\w.]+)$/);
        if (textMatch) {
          const path = textMatch[1];
          const def = findTextField(path);
          if (!def) throw new Error('Kolom tidak dikenal.');
          setPath(c, path, parseFieldValue(def, text));
          back = sectionOf(path);
          label = def.label;
          return { message: `bot: ubah ${def.label.toLowerCase()} (oleh ${who(ctx)})` };
        }

        throw new Error('Pesan ini sudah tidak berlaku. Buka /menu lagi.');
      });

      await ctx.reply(`✅ <b>${esc(label)}</b> disimpan.\n${SAVED_NOTE}`, {
        parse_mode: 'HTML',
        reply_parameters: { message_id: ctx.message.message_id },
      });
      await send(ctx, await screenFor(back, content));
    } catch (err: any) {
      await ctx.reply(`⚠️ ${esc(err.message ?? String(err))}\n\nSilakan balas lagi pesan bot di atas.`, {
        parse_mode: 'HTML',
        reply_parameters: { message_id: ctx.message.message_id },
      });
    }
  });

  async function handleImage(ctx: Context, msg: Message, slot: 'hero' | 'logo') {
    let fileId: string | undefined;
    let size = 0;
    if (msg.photo?.length) {
      const photo = msg.photo[msg.photo.length - 1]; // resolusi terbesar
      fileId = photo.file_id;
      size = photo.file_size ?? 0;
    } else if (msg.document && /^image\/(jpeg|png|webp)$/.test(msg.document.mime_type ?? '')) {
      fileId = msg.document.file_id;
      size = msg.document.file_size ?? 0;
    }
    if (!fileId) throw new Error('Kirim gambar JPG, PNG, atau WebP (sebagai Foto atau File).');
    if (size > MAX_IMAGE_BYTES) throw new Error('Ukuran gambar maksimal 10 MB.');

    const file = await ctx.api.getFile(fileId);
    const res = await fetch(`https://api.telegram.org/file/bot${env.botToken}/${file.file_path}`);
    if (!res.ok) throw new Error('Gagal mengunduh gambar dari Telegram.');
    const base64 = Buffer.from(await res.arrayBuffer()).toString('base64');
    const ext = (file.file_path?.split('.').pop() || 'jpg').toLowerCase().replace('jpeg', 'jpg');
    const name = `${slot}-${Date.now()}.${ext}`;

    const content = await updateContent((c) => {
      const old = c.images[slot];
      const other = slot === 'hero' ? c.images.logo : c.images.hero;
      c.images[slot] = name;
      const files = [{ path: assetPath(name), base64 }];
      if (old && old !== other) files.push({ path: assetPath(old), delete: true } as any);
      return { message: `bot: ganti ${slot === 'hero' ? 'foto utama' : 'logo'} (oleh ${who(ctx)})`, files };
    });

    await ctx.reply(`✅ <b>${slot === 'hero' ? 'Foto utama' : 'Logo'}</b> diganti.\n${SAVED_NOTE}`, {
      parse_mode: 'HTML',
      reply_parameters: { message_id: msg.message_id },
    });
    await send(ctx, photosMenu(content));
  }

  bot.catch(async (err) => {
    console.error('Bot error:', err.error);
    try {
      await err.ctx.reply('⚠️ Terjadi kesalahan. Coba lagi sebentar lagi.');
    } catch {}
  });

  return bot;
}

export const COMMANDS = [
  { command: 'menu', description: 'Menu pengaturan website' },
  { command: 'paket', description: 'Atur paket & harga' },
  { command: 'teks', description: 'Ubah teks halaman' },
  { command: 'info', description: 'WhatsApp, alamat, jam buka' },
  { command: 'foto', description: 'Ganti foto utama & logo' },
  { command: 'lihat', description: 'Ringkasan isi website' },
  { command: 'bantuan', description: 'Cara memakai bot' },
];
