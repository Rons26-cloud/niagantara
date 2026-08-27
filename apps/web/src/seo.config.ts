export const SITE_URL = 'https://niagantara-web.pages.dev';
export const OG_IMAGE = `${SITE_URL}/og-image.png`;

export interface SeoMeta {
  title: string;
  description: string;
  ogTitle: string;
  ogDescription: string;
  robots: string;
  schema?: object[];
}

const home: SeoMeta = {
  title: 'NIAGANTARA — Platform Dashboard Bisnis Nusantara',
  description:
    'NIAGANTARA adalah platform dashboard bisnis Nusantara untuk UMKM hingga perusahaan, mengelola POS, penjualan, stok, keuangan, cabang, pelanggan, dan laporan dalam satu sistem terintegrasi.',
  ogTitle: 'NIAGANTARA — Platform Dashboard Bisnis Nusantara',
  ogDescription:
    'Kelola POS, penjualan, stok, keuangan, cabang, pelanggan, dan laporan bisnis dari satu dashboard terintegrasi.',
  robots: 'index, follow',
  schema: [
    { '@context': 'https://schema.org', '@type': 'Organization', name: 'NIAGANTARA', alternateName: 'Platform Dashboard Bisnis Nusantara', url: SITE_URL, logo: `${SITE_URL}/logo.png`, description: 'Platform dashboard bisnis Nusantara untuk UMKM hingga perusahaan di Indonesia.', email: 'hello@niagantara.com', contactPoint: { '@type': 'ContactPoint', email: 'support@niagantara.com', contactType: 'customer support', availableLanguage: ['id', 'en'] } },
    { '@context': 'https://schema.org', '@type': 'WebSite', name: 'NIAGANTARA', alternateName: 'Platform Dashboard Bisnis Nusantara', url: SITE_URL, inLanguage: 'id-ID', description: 'Platform dashboard bisnis Nusantara untuk membantu UMKM hingga perusahaan mengelola operasional di Indonesia.' },
    { '@context': 'https://schema.org', '@type': 'SoftwareApplication', name: 'NIAGANTARA', applicationCategory: 'BusinessApplication', operatingSystem: 'Web', url: `${SITE_URL}/demo`, description: 'Dashboard bisnis untuk POS, stok, penjualan, keuangan, laporan, dan manajemen cabang.', featureList: ['POS dan kasir', 'Manajemen stok', 'Laporan keuangan', 'Manajemen multi-cabang', 'Integrasi Google Sheets'] },
  ],
};

const features: SeoMeta = {
  title: 'Fitur NIAGANTARA — POS, Stok, Keuangan & Laporan Bisnis',
  description:
    'Jelajahi fitur NIAGANTARA: POS & kasir, pengelolaan stok barang, pencatatan keuangan, laporan penjualan, integrasi Google Sheets, dan manajemen multi-cabang.',
  ogTitle: 'Fitur NIAGANTARA — POS, Stok, Keuangan & Laporan Bisnis',
  ogDescription:
    'Fitur lengkap NIAGANTARA untuk mengelola operasional bisnis: POS, stok, keuangan, laporan, dan integrasi Google Sheets.',
  robots: 'index, follow',
  schema: [
    {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: 'Fitur NIAGANTARA',
      description:
        'Fitur lengkap NIAGANTARA: POS, stok, keuangan, laporan, dan integrasi Google Sheets.',
      url: `${SITE_URL}/fitur`,
      isPartOf: { '@type': 'WebSite', name: 'NIAGANTARA', url: SITE_URL },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Beranda', item: SITE_URL },
        {
          '@type': 'ListItem',
          position: 2,
          name: 'Fitur',
          item: `${SITE_URL}/fitur`,
        },
      ],
    },
  ],
};

const solutions: SeoMeta = {
  title: 'Solusi Bisnis NIAGANTARA untuk UMKM & Multi-Cabang',
  description:
    'NIAGANTARA menyediakan solusi manajemen bisnis untuk UMKM: pengelolaan toko, stok antar cabang, integrasi Google Sheets, dan monitoring penjualan real-time.',
  ogTitle: 'Solusi Bisnis NIAGANTARA untuk UMKM & Multi-Cabang',
  ogDescription:
    'Solusi manajemen bisnis NIAGANTARA untuk UMKM dan bisnis multi-cabang: toko, stok, laporan, dan Google Sheets.',
  robots: 'index, follow',
  schema: [
    {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: 'Solusi NIAGANTARA',
      description:
        'Solusi manajemen bisnis NIAGANTARA untuk UMKM dan bisnis multi-cabang.',
      url: `${SITE_URL}/solusi`,
      isPartOf: { '@type': 'WebSite', name: 'NIAGANTARA', url: SITE_URL },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Beranda', item: SITE_URL },
        {
          '@type': 'ListItem',
          position: 2,
          name: 'Solusi',
          item: `${SITE_URL}/solusi`,
        },
      ],
    },
  ],
};

const pricing: SeoMeta = {
  title: 'Harga NIAGANTARA — Paket Bisnis untuk UMKM',
  description:
    'Pelajari paket NIAGANTARA untuk kebutuhan bisnis Anda. Tersedia paket Free, Business, dan Enterprise dengan fitur yang dapat disesuaikan.',
  ogTitle: 'Harga NIAGANTARA — Paket Bisnis untuk UMKM',
  ogDescription:
    'Paket harga NIAGANTARA: Free, Business, dan Enterprise untuk kebutuhan bisnis UMKM dan multi-cabang.',
  robots: 'index, follow',
  schema: [
    {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: 'Harga NIAGANTARA',
      description: 'Paket harga NIAGANTARA: Free, Business, dan Enterprise.',
      url: `${SITE_URL}/harga`,
      isPartOf: { '@type': 'WebSite', name: 'NIAGANTARA', url: SITE_URL },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Beranda', item: SITE_URL },
        {
          '@type': 'ListItem',
          position: 2,
          name: 'Harga',
          item: `${SITE_URL}/harga`,
        },
      ],
    },
  ],
};

const about: SeoMeta = {
  title: 'Tentang NIAGANTARA — Platform Manajemen Bisnis Indonesia',
  description:
    'Kenali NIAGANTARA, platform manajemen bisnis yang dirancang untuk membantu UMKM Indonesia mengelola operasional toko, cabang, dan keuangan.',
  ogTitle: 'Tentang NIAGANTARA — Platform Manajemen Bisnis Indonesia',
  ogDescription:
    'Tentang NIAGANTARA: platform manajemen bisnis untuk UMKM Indonesia.',
  robots: 'index, follow',
  schema: [
    {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: 'Tentang NIAGANTARA',
      description: 'Platform manajemen bisnis untuk UMKM Indonesia.',
      url: `${SITE_URL}/tentang`,
      isPartOf: { '@type': 'WebSite', name: 'NIAGANTARA', url: SITE_URL },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Beranda', item: SITE_URL },
        {
          '@type': 'ListItem',
          position: 2,
          name: 'Tentang',
          item: `${SITE_URL}/tentang`,
        },
      ],
    },
  ],
};

const faq: SeoMeta = {
  title: 'Pertanyaan Umum — NIAGANTARA',
  description:
    'Temukan jawaban atas pertanyaan umum tentang NIAGANTARA: fitur, cara kerja, integrasi Google Sheets, keamanan data, dan dukungan untuk bisnis.',
  ogTitle: 'Pertanyaan Umum — NIAGANTARA',
  ogDescription:
    'Jawaban atas pertanyaan umum tentang NIAGANTARA: fitur, integrasi, keamanan, dan dukungan bisnis.',
  robots: 'index, follow',
  schema: [
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'Apa itu NIAGANTARA?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'NIAGANTARA adalah platform dashboard bisnis Nusantara untuk UMKM hingga perusahaan, dengan POS, penjualan, stok, keuangan, cabang, dan laporan dalam satu sistem terintegrasi.',
          },
        },
        {
          '@type': 'Question',
          name: 'Apakah NIAGANTARA dapat digunakan untuk mengelola banyak cabang?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Ya. Struktur perusahaan, toko, dan cabang membantu pemilik mengelola banyak lokasi dengan akses serta data yang terpisah.',
          },
        },
        {
          '@type': 'Question',
          name: 'Apakah tersedia POS?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Ya. POS terintegrasi dengan produk, stok, riwayat transaksi, dan konteks cabang.',
          },
        },
        {
          '@type': 'Question',
          name: 'Apakah mendukung Google Sheets?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Ya. Admin perusahaan dapat menghubungkan Google Sheets untuk sinkronisasi data bisnis yang didukung.',
          },
        },
        {
          '@type': 'Question',
          name: 'Apakah tersedia aplikasi mobile?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Pengalaman mobile sedang disiapkan. Dashboard web tetap responsif untuk perangkat mobile.',
          },
        },
        {
          '@type': 'Question',
          name: 'Bagaimana keamanan data?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'NIAGANTARA menggunakan autentikasi, role-based access, tenant dan branch isolation, audit logging, security events, serta Row Level Security.',
          },
        },
        {
          '@type': 'Question',
          name: 'Bagaimana cara memulai?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Daftarkan akun, buat toko, tambahkan cabang dan produk, kemudian kelola transaksi serta operasional bisnis Anda.',
          },
        },
      ],
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Beranda', item: SITE_URL },
        {
          '@type': 'ListItem',
          position: 2,
          name: 'FAQ',
          item: `${SITE_URL}/faq`,
        },
      ],
    },
  ],
};

const contact: SeoMeta = {
  title: 'Kontak NIAGANTARA — Informasi dan Dukungan',
  description:
    'Hubungi tim NIAGANTARA untuk informasi produk, dukungan teknis, atau kerja sama bisnis melalui hello@niagantara.com.',
  ogTitle: 'Kontak NIAGANTARA — Informasi dan Dukungan',
  ogDescription:
    'Hubungi NIAGANTARA untuk memperoleh informasi produk dan dukungan bisnis.',
  robots: 'index, follow',
};

const privacy: SeoMeta = {
  title: 'Kebijakan Privasi — NIAGANTARA',
  description:
    'Kebijakan privasi NIAGANTARA: bagaimana kami mengumpulkan, menggunakan, dan melindungi data pribadi Anda.',
  ogTitle: 'Kebijakan Privasi — NIAGANTARA',
  ogDescription: 'Kebijakan privasi NIAGANTARA.',
  robots: 'index, follow',
};

const terms: SeoMeta = {
  title: 'Syarat & Ketentuan — NIAGANTARA',
  description: 'Syarat dan ketentuan penggunaan platform NIAGANTARA.',
  ogTitle: 'Syarat & Ketentuan — NIAGANTARA',
  ogDescription: 'Syarat dan ketentuan penggunaan NIAGANTARA.',
  robots: 'index, follow',
};

const demo: SeoMeta = {
  title: 'Demonstrasi Interaktif NIAGANTARA',
  description:
    'Jelajahi demonstrasi interaktif NIAGANTARA untuk mempelajari POS, pengelolaan stok, laporan, dan fitur lainnya secara langsung.',
  ogTitle: 'Demonstrasi Interaktif NIAGANTARA',
  ogDescription:
    'Jelajahi demonstrasi interaktif NIAGANTARA yang mencakup POS, stok, laporan, dan fitur lainnya.',
  robots: 'noindex, nofollow',
};

const demoPage: SeoMeta = {
  title: 'Demo — NIAGANTARA',
  description: '',
  ogTitle: 'Demo — NIAGANTARA',
  ogDescription: '',
  robots: 'noindex, nofollow',
};

const notFound: SeoMeta = {
  title: 'Halaman Tidak Ditemukan — NIAGANTARA',
  description: '',
  ogTitle: 'Halaman Tidak Ditemukan',
  ogDescription: '',
  robots: 'noindex, nofollow',
};

export const SEO_DATA: Record<string, SeoMeta> = {
  '/': home,
  '/fitur': features,
  '/solusi': solutions,
  '/harga': pricing,
  '/tentang': about,
  '/faq': faq,
  '/kontak': contact,
  '/privacy': privacy,
  '/terms': terms,
  '/demo': demo,
  '/demo/dashboard': demoPage,
  '/demo/pos': demoPage,
  '/demo/products': demoPage,
  '/demo/categories': demoPage,
  '/demo/barcode': demoPage,
  '/demo/inventory': demoPage,
  '/demo/stock-transfer': demoPage,
  '/demo/sales': demoPage,
  '/demo/shifts': demoPage,
  '/demo/customers': demoPage,
  '/demo/suppliers': demoPage,
  '/demo/purchases': demoPage,
  '/demo/employees': demoPage,
  '/demo/users': demoPage,
  '/demo/attendance': demoPage,
  '/demo/expenses': demoPage,
  '/demo/finance': demoPage,
  '/demo/payables': demoPage,
  '/demo/receivables': demoPage,
  '/demo/reports': demoPage,
  '/demo/google-sheets': demoPage,
  '/demo/warehouses': demoPage,
  '/demo/branches': demoPage,
  '/demo/stores': demoPage,
  '/demo/settings': demoPage,
  '/demo/help': demoPage,
};

export function getSeo(path: string): SeoMeta {
  return SEO_DATA[path] ?? notFound;
}
