// Menghubungkan bot Telegram ke website Netlify (webhook) + mendaftarkan menu perintah.
//   npm run bot:setup
import { Api } from 'grammy';
import { COMMANDS } from '../bot/bot';

const token = process.env.TELEGRAM_BOT_TOKEN;
const siteUrl = (process.env.SITE_URL || '').replace(/\/+$/, '');
const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
if (!token || !siteUrl) throw new Error('Isi TELEGRAM_BOT_TOKEN dan SITE_URL di file .env');

const api = new Api(token);
const me = await api.getMe();
await api.setMyCommands(COMMANDS);
await api.setWebhook(`${siteUrl}/api/telegram`, {
  secret_token: secret,
  allowed_updates: ['message', 'callback_query'],
  drop_pending_updates: true,
});
const info = await api.getWebhookInfo();
console.log(`✅ @${me.username} terhubung ke ${info.url}`);
