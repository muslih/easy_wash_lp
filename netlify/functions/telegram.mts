// Webhook bot Telegram (berjalan di Netlify Functions, tanpa server sendiri).
import { webhookCallback } from 'grammy';
import { createBot } from '../../bot/bot';

const bot = createBot();
const handle = webhookCallback(bot, 'std/http', {
  secretToken: process.env.TELEGRAM_WEBHOOK_SECRET,
  timeoutMilliseconds: 9_500,
  onTimeout: 'return',
});

export default async (req: Request) => {
  if (req.method !== 'POST') return new Response('Easywash bot OK');
  return handle(req);
};

export const config = { path: '/api/telegram' };
