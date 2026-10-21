import { site, packages, formatRupiah, normalizePhone } from '../data/config';

export function openWhatsApp(phone: string, message: string, invalidText?: string) {
  const number = normalizePhone(phone);
  if (!number) {
    const notice = document.getElementById('notice') as HTMLDialogElement | null;
    if (notice) {
      const desc = notice.querySelector('[data-description]');
      if (desc && invalidText) desc.textContent = invalidText;
      notice.showModal();
    } else {
      alert(invalidText ?? 'Nomor WhatsApp tidak valid.');
    }
    return;
  }
  window.open(`https://wa.me/${number}?text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer');
}

/** Tutup dialog lewat tombol [data-close] atau klik di area gelap. */
export function initDialogs() {
  document.querySelectorAll<HTMLButtonElement>('[data-close]').forEach((btn) =>
    btn.addEventListener('click', () => btn.closest('dialog')?.close()),
  );
  document.querySelectorAll('dialog').forEach((dialog) =>
    dialog.addEventListener('click', (event) => {
      if (event.target === dialog) dialog.close();
    }),
  );
}

export function initHomePage() {
  const check = document.getElementById('check') as HTMLDialogElement | null;
  const orderDialog = document.getElementById('order') as HTMLDialogElement | null;
  const order = document.getElementById('order-form') as HTMLFormElement | null;
  const checkForm = document.getElementById('check-form') as HTMLFormElement | null;
  const totalEl = document.getElementById('total');
  const titleEl = document.getElementById('order-title');
  let selected = 0;

  document.querySelectorAll<HTMLElement>('[data-action]').forEach((btn) =>
    btn.addEventListener('click', () => {
      if (btn.dataset.action === 'check') check?.showModal();
      else openWhatsApp(site.phone, `Halo ${site.name}, saya ingin bertanya tentang layanan laundry.`);
    }),
  );

  if (!order) return;
  const field = (name: string) => order.elements.namedItem(name) as HTMLInputElement;
  const weight = () => Math.max(0, Number(field('weight').value) || 0);

  const updateTotal = () => {
    if (totalEl) totalEl.textContent = formatRupiah(packages[selected].price * weight());
  };

  document.querySelectorAll<HTMLElement>('[data-package]').forEach((btn) =>
    btn.addEventListener('click', () => {
      selected = Number(btn.dataset.package);
      const pkg = packages[selected];
      if (titleEl) titleEl.textContent = 'Pesan ' + pkg.name;
      const qtyLabel = document.getElementById('qty-label');
      if (qtyLabel) qtyLabel.textContent = pkg.unit === 'kg' ? 'Perkiraan berat (kg)' : `Perkiraan jumlah (${pkg.unit})`;
      updateTotal();
      orderDialog?.showModal();
    }),
  );

  field('weight').addEventListener('input', updateTotal);
  updateTotal();

  order.addEventListener('submit', (event) => {
    event.preventDefault();
    const pkg = packages[selected];
    openWhatsApp(
      site.phone,
      `Halo ${site.name}, saya ingin pesan laundry.\n\nNama: ${field('name').value}\nWhatsApp: ${field('phone').value}\nPaket: ${pkg.name}\nPerkiraan ${pkg.unit === 'kg' ? 'berat' : 'jumlah'}: ${weight()} ${pkg.unit}\nEstimasi total: ${formatRupiah(pkg.price * weight())}\nPenyerahan: ${field('delivery').value}\nAlamat/catatan: ${field('notes').value || '-'}\n\nMohon konfirmasi harga dan waktu selesai.`,
    );
  });

  checkForm?.addEventListener('submit', (event) => {
    event.preventDefault();
    const f = (name: string) => (checkForm.elements.namedItem(name) as HTMLInputElement).value;
    openWhatsApp(
      site.phone,
      `Halo ${site.name}, saya ingin menanyakan status cucian.\nNama: ${f('name')}\nNomor pesanan: ${f('id') || 'Belum ada'}\nTerima kasih.`,
    );
  });
}

export function initStatusPage() {
  const form = document.getElementById('status-form') as HTMLFormElement | null;
  const preview = document.getElementById('status-preview');
  if (!form || !preview) return;
  const f = (name: string) => (form.elements.namedItem(name) as HTMLInputElement).value;

  const message = () =>
    `Halo ${f('name') || 'pelanggan'} 👋\nKabar cucian dari ${site.name}!\n\nNomor pesanan: ${f('id') || '-'}\nStatus: ${f('status')}\n${
      f('status') === 'Siap diambil' ? 'Cucianmu sudah bersih dan rapi, siap diambil. ✨\n' : ''
    }${f('notes') ? 'Catatan: ' + f('notes') + '\n' : ''}\nTerima kasih sudah memilih ${site.name}.`;

  const render = () => (preview.textContent = message());
  form.addEventListener('input', render);
  form.addEventListener('change', render);
  render();

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    openWhatsApp(f('phone'), message(), 'Masukkan nomor WhatsApp pelanggan yang valid.');
  });
}
