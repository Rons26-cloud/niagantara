export type PaymentStatus = 'active' | 'planned' | 'unsupported';

export interface PaymentMethod {
  id: string;
  label: string;
  status: PaymentStatus;
}

type L = { id: string; en: string };

export interface PlanPresentation {
  id: 'free' | 'business' | 'enterprise';
  name: string;
  title: L;
  priceIdr: number | null;
  priceLabel: string;
  cadence: L;
  highlight: boolean;
  cta: L;
  ctaHref: string;
  ctaKind: 'primary' | 'outline';
  summary: L;
  features: L[];
  note?: L;
}

const plans: {
  id: PlanPresentation['id'];
  name: string;
  title: L;
  priceIdr: number | null;
  priceLabel: string;
  highlight: boolean;
  cta: L;
  ctaHref: string;
  ctaKind: PlanPresentation['ctaKind'];
  summary: L;
  features: L[];
}[] = [
  {
    id: 'free',
    name: 'FREE',
    title: { id: 'Mulai mengenal NIAGANTARA', en: 'Get to know NIAGANTARA' },
    priceIdr: 0,
    priceLabel: 'Rp 0',
    highlight: false,
    cta: { id: 'Mulai Gratis', en: 'Start Free' },
    ctaHref: 'https://niagantara-app.pages.dev',
    ctaKind: 'outline',
    summary: {
      id: 'Fondasi untuk mencoba pengelolaan operasional bisnis Anda sendiri.',
      en: 'The foundation to try managing your own business operations.',
    },
    features: [
      { id: '2 Toko', en: '2 Stores' },
      { id: '5 Cabang', en: '5 Branches' },
      { id: '3 Pengguna', en: '3 Users' },
      { id: '10 Karyawan', en: '10 Employees' },
      { id: '100 Produk', en: '100 Products' },
      { id: 'POS & Dashboard', en: 'POS & Dashboard' },
      { id: 'Laporan Dasar', en: 'Basic Reports' },
    ],
  },
  {
    id: 'business',
    name: 'BUSINESS',
    title: {
      id: 'Operasional yang lebih terhubung',
      en: 'More connected operations',
    },
    priceIdr: 249000,
    priceLabel: 'Rp 249.000',
    highlight: true,
    cta: { id: 'Pilih Paket Business', en: 'Choose Business Plan' },
    ctaHref: 'mailto:support@niagantara.com?subject=Pilih Paket Business',
    ctaKind: 'primary',
    summary: {
      id: 'Untuk tim yang ingin bekerja dan bertumbuh dari satu sumber data.',
      en: 'For teams that want to work and grow from one source of data.',
    },
    features: [
      { id: '10 Toko', en: '10 Stores' },
      { id: '50 Cabang', en: '50 Branches' },
      { id: '25 Pengguna', en: '25 Users' },
      { id: '100 Karyawan', en: '100 Employees' },
      { id: '5000 Produk', en: '5,000 Products' },
      { id: 'POS & Dashboard Lengkap', en: 'Full POS & Dashboard' },
      { id: 'Laporan Lengkap & Export', en: 'Full Reports & Export' },
      { id: 'Integrasi Google Sheets', en: 'Google Sheets Integration' },
    ],
  },
  {
    id: 'enterprise',
    name: 'ENTERPRISE',
    title: {
      id: 'Kontrol untuk skala yang lebih besar',
      en: 'Control at larger scale',
    },
    priceIdr: 499000,
    priceLabel: 'Rp 499.000',
    highlight: false,
    cta: { id: 'Hubungi Kami', en: 'Contact Us' },
    ctaHref: 'mailto:support@niagantara.com?subject=Paket Enterprise',
    ctaKind: 'outline',
    summary: {
      id: 'Untuk organisasi dengan kebutuhan operasional khusus.',
      en: 'For organizations with special operational needs.',
    },
    features: [
      { id: 'Skala toko lebih besar', en: 'Larger store scale' },
      { id: 'Skala cabang lebih besar', en: 'Larger branch scale' },
      { id: 'Tim lebih besar', en: 'Bigger teams' },
      { id: 'POS & Dashboard Lengkap', en: 'Full POS & Dashboard' },
      { id: 'Laporan Lengkap & Export', en: 'Full Reports & Export' },
      { id: 'Dukungan Prioritas', en: 'Priority Support' },
    ],
  },
];

export const PLANS: PlanPresentation[] = plans.map((p) => ({
  ...p,
  cadence: { id: '/ bulan', en: '/ month' } as L,
}));

export const PRICING_TRUST: L[] = [
  { id: 'Tanpa biaya tersembunyi', en: 'No hidden fees' },
  { id: 'Bisa upgrade kapan saja', en: 'Upgrade anytime' },
  { id: 'Paket fleksibel', en: 'Flexible plans' },
];

export const PRICING_DESCRIPTION: L = {
  id: 'Paket berlangganan yang fleksibel untuk mendukung kebutuhan bisnis Anda hari ini dan masa depan.',
  en: 'Flexible subscription plans to support your business needs today and in the future.',
};

export const PAYMENT_METHODS: PaymentMethod[] = [
  { id: 'visa', label: 'Visa', status: 'planned' },
  { id: 'mastercard', label: 'Mastercard', status: 'planned' },
  { id: 'jcb', label: 'JCB', status: 'planned' },
  { id: 'qris', label: 'QRIS', status: 'planned' },
  { id: 'ovo', label: 'OVO', status: 'planned' },
  { id: 'dana', label: 'DANA', status: 'planned' },
  { id: 'gopay', label: 'GoPay', status: 'planned' },
  { id: 'shopeepay', label: 'ShopeePay', status: 'planned' },
  { id: 'bank-transfer', label: 'Transfer Bank', status: 'planned' },
];

export const PAYMENT_TITLE: L = {
  id: 'Metode Pembayaran',
  en: 'Payment Methods',
};

export const PAYMENT_SOON: L = {
  id: 'Segera tersedia',
  en: 'Coming soon',
};

export const PAYMENT_DISCLAIMER: L = {
  id: 'Metode pembayaran akan tersedia sesuai paket dan kanal pembayaran yang diaktifkan.',
  en: 'Payment methods will be available according to plan and activated payment channels.',
};
