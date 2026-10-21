// Menjalankan bot dari komputer/server sendiri (mode polling).
// Pakai ini untuk mencoba bot, atau jika tidak memakai webhook Netlify.
//   npm run bot
import { createBot, COMMANDS } from './bot';

const bot = createBot();
await bot.api.setMyCommands(COMMANDS);
console.log('Bot berjalan (polling). Tekan Ctrl+C untuk berhenti.');
await bot.start({
  allowed_updates: ['message', 'callback_query'],
  onStart: (me) => console.log(`Terhubung sebagai @${me.username}`),
});
