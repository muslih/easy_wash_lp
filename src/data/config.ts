// Pengaturan utama Easywash.
// Paket, harga, dan durasi masih contoh — cukup ubah di file ini,
// tampilan kartu paket dan form pemesanan ikut berubah otomatis.

export const site = {
  name: 'Easywash',
  tagline: 'Laundry bersih, hidup lebih mudah',
  description:
    'Pilih paket laundry Easywash dan pesan langsung melalui WhatsApp. Cuci, setrika, dan tanyakan status cucian dengan mudah.',
  phone: '0815-9114-401',
};

export type IconName = 'washing-machine' | 'shirt' | 'zap';

export interface Package {
  name: string;
  price: number;
  duration: string;
  description: string;
  features: string[];
  icon: IconName;
  featured?: boolean;
  badge?: string;
}

export const packages: Package[] = [
  {
    name: 'Cuci & Lipat',
    price: 7000,
    duration: '2–3 hari',
    description: 'Bersih, wangi, dan terlipat rapi. Siap menemani aktivitasmu.',
    features: ['Cuci & pengeringan', 'Lipat rapi', 'Pewangi pakaian'],
    icon: 'washing-machine',
  },
  {
    name: 'Cuci & Setrika',
    price: 10000,
    duration: '2–3 hari',
    description: 'Perawatan lengkap untuk pakaian yang rapi setiap hari.',
    features: ['Semua layanan Cuci & Lipat', 'Setrika hingga rapi', 'Dikemas dengan baik'],
    icon: 'shirt',
    featured: true,
    badge: 'Pilihan lengkap',
  },
  {
    name: 'Express',
    price: 18000,
    duration: '24 jam',
    description: 'Saat waktumu berharga. Cucian beres lebih cepat.',
    features: ['Cuci & setrika lengkap', 'Prioritas pengerjaan', 'Siap dalam 24 jam'],
    icon: 'zap',
  },
];

export const statuses = [
  'Diterima',
  'Sedang dicuci',
  'Sedang dikeringkan',
  'Sedang disetrika',
  'Siap diambil',
  'Selesai',
];

export const formatRupiah = (amount: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(amount);
