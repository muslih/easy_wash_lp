// Webhook bot Telegram — berjalan sebagai Vercel Function (halaman lain tetap statis).
import type { APIRoute } from 'astro';
import { webhookCallback } from 'grammy';
import { createBot } from '../../../bot/bot';

export const prerender = false;

let handler: ((req: Request) => Promise<Response>) | undefined;

function getHandler() {
  handler ??= webhookCallback(createBot(), 'std/http', {
    secretToken: process.env.TELEGRAM_WEBHOOK_SECRET,
    timeoutMilliseconds: 25_000,
    onTimeout: 'return',
  });
  return handler;
}

export const POST: APIRoute = ({ request }) => getHandler()(request);
export const GET: APIRoute = () => new Response('Easywash bot OK');
