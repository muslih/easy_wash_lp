// Kirim kabar ke grup Telegram setelah Netlify selesai build.
const token = process.env.TELEGRAM_BOT_TOKEN;
const groupId = process.env.TELEGRAM_GROUP_ID;

export async function notifyDeploy(body: string | null, ok: boolean) {
  if (!token || !groupId || !body) return;
  const { payload } = JSON.parse(body);
  if (payload?.context && payload.context !== 'production') return;

  const title: string = payload?.title ?? '';
  const url: string = payload?.ssl_url || payload?.url || process.env.URL || '';
  const text = ok
    ? `✅ <b>Website sudah diperbarui</b>\n${title ? `<i>${escapeHtml(title)}</i>\n` : ''}${url}`
    : `❌ <b>Pembaruan website gagal</b>\n${title ? `<i>${escapeHtml(title)}</i>\n` : ''}Cek log build di Netlify: https://app.netlify.com/sites/${payload?.name}/deploys/${payload?.id}`;

  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: groupId, text, parse_mode: 'HTML', link_preview_options: { is_disabled: true } }),
  });
}

const escapeHtml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
