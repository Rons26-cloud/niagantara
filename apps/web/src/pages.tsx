import { useEffect, useState } from 'react';
import { useTranslation, FEATURE_ICONS, SidebarIcon } from '@niagantara/ui';
import {
  Shell,
  Button,
  Kicker,
  Heading,
  renderSafeTitle,
  ThemeImage,
  LazySection,
} from './chrome';
import { Link } from './router';
import { Dashboard, PosPreview, InventoryPreview, Metric } from './previews';
import {
  PLANS,
  PAYMENT_METHODS,
  PAYMENT_TITLE,
  PAYMENT_SOON,
  PAYMENT_DISCLAIMER,
  type PlanPresentation,
} from './pricing.config';
import {
  LayoutDashboard,
  Package,
  TrendingUp,
  WalletCards,
  Building2,
  BarChart3,
  Table2,
  ShieldCheck,
  Lock,
  Eye,
  Fingerprint,
  Server,
  PlayCircle,
  ArrowRightLeft,
  Smartphone,
  CheckCircle2,
  Plus,
  Store,
  GitBranch,
  Minus,
  ChevronDown,
  Activity,
  Blocks,
  Home,
  UserCircle,
} from 'lucide-react';

type W = ReturnType<typeof useTranslation>['translations']['website'];

function useW(): W {
  return useTranslation().translations.website;
}

function useLang(w: W): 'id' | 'en' {
  return String((w as any).mobileSection?.kicker ?? '').startsWith('FLEX')
    ? 'en'
    : 'id';
}

function MoreLink({ to }: { to: string }) {
  const w = useW();
  return (
    <Link className="section-more" to={to}>
      {w.seeMore} <span aria-hidden="true">→</span>
    </Link>
  );
}

export function HeroSection() {
  const { translations, language } = useTranslation();
  const w = translations.website;
  const en = language === 'en';
  return (
    <section className="hero">
      <div className="container hero-grid">
        <div className="hero-copy">
          <div className="eyebrow">
            <i />{' '}
            {en
              ? 'BUSINESS CONTROL PLATFORM'
              : 'PLATFORM KENDALI BISNIS'}
          </div>
          <h1>
            {en
              ? 'Manage Your Business More Easily '
              : 'Kelola Bisnis Lebih Mudah '}
            <span>{en ? 'with NIAGANTARA' : 'bersama NIAGANTARA'}</span>
          </h1>
          <p>
            {en
              ? 'NIAGANTARA connects POS, inventory, purchasing, suppliers, branches, teams, and operational monitoring in one platform.'
              : 'NIAGANTARA adalah platform bisnis terintegrasi untuk mengelola kasir, stok, pembelian, supplier, cabang, tim, dan operasional.'}
          </p>
          <div className="actions">
            <Button to="/kontak">
              {en ? 'Get Started' : 'Mulai Sekarang'}
            </Button>
            <Button secondary to="/demo">
              {en ? 'Explore Platform' : 'Lihat Platform'} <small>▶</small>
            </Button>
          </div>
          <div className="trust">
            {[
              'POS',
              'Inventory',
              'Dashboard',
              en ? 'Multi-branch' : 'Multi Cabang',
              'Purchasing',
              'Realtime',
            ].map((x) => (
              <span key={x}>✓ {x}</span>
            ))}
          </div>
        </div>
        <div className="hero-visual">
          <div className="float stock">
            <i>
              <Package size={16} aria-hidden="true" />
            </i>
            <span>
              <small>{en ? 'Operational status' : 'Status operasional'}</small>
              <b>{en ? 'Needs attention' : 'Perlu perhatian'}</b>
            </span>
            <em>{w.hero.needsAttention}</em>
          </div>
          <div className="hero-scale">
            <Link
              to="/demo"
              className="hero-hero-shot owner-dashboard-shot"
              ariaLabel={
                en
                  ? 'Open the NIAGANTARA Owner Dashboard demo'
                  : 'Buka demo Dashboard Owner NIAGANTARA'
              }
            >
              <img
                src="/phone/screen.png"
                alt={
                  en
                    ? 'NIAGANTARA dashboard preview — open demo'
                    : 'Pratinjau dashboard NIAGANTARA — klik untuk membuka demo'
                }
                loading="eager"
                decoding="async"
              />
              <span className="hero-shot-badge">
                <PlayCircle size={14} aria-hidden="true" />{' '}
                {en ? 'View Owner Dashboard' : 'Lihat Dashboard Owner'}
              </span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

export function LogoStrip() {
  const w = useW();
  return (
    <section className="logo-strip" aria-hidden="true">
      <div className="container">
        <span>{w.stripLabel}</span>
        <div>
          <b>POS</b>
          <b>INVENTORY</b>
          <b>FINANCE</b>
          <b>REPORTING</b>
          <b>GOOGLE SHEETS</b>
        </div>
      </div>
    </section>
  );
}

export function FeaturesSection({ heading = true }: { heading?: boolean }) {
  const { language } = useTranslation();
  const en = language === 'en';
  const features = en
    ? [
        [
          'POS / Checkout',
          'Fast transactions with product search, barcodes, payments, shifts, and receipts.',
        ],
        [
          'Owner Dashboard',
          'Monitor metrics, branches, stock, shifts, integrations, and operational activity.',
        ],
        [
          'Inventory',
          'Manage stock, minimum levels, adjustments, transfers, and movement ledgers.',
        ],
        [
          'Purchasing',
          'Manage purchases, goods receiving, statuses, and stock updates.',
        ],
        [
          'Suppliers',
          'Store supplier data and connect it with purchasing workflows.',
        ],
        [
          'Multi-branch',
          'Use company, store, and branch contexts based on access rights.',
        ],
        [
          'Team & Access',
          'Manage users, roles, permissions, and branch assignments.',
        ],
        [
          'Integrations',
          'Connect operational data with Google Sheets securely.',
        ],
      ]
    : [
        [
          'POS / Kasir',
          'Transaksi cepat dengan pencarian produk, barcode, pembayaran, shift, dan struk.',
        ],
        [
          'Dashboard Owner',
          'Pantau metrik, cabang, stok, shift, integrasi, dan aktivitas operasional.',
        ],
        [
          'Inventory',
          'Kelola stok, minimum stok, penyesuaian, transfer, dan ledger pergerakan.',
        ],
        [
          'Purchasing',
          'Kelola pembelian, penerimaan barang, status, dan pembaruan stok.',
        ],
        [
          'Supplier',
          'Simpan data supplier dan hubungkan dengan proses pembelian.',
        ],
        [
          'Multi Cabang',
          'Gunakan konteks perusahaan, toko, dan cabang sesuai hak akses.',
        ],
        [
          'Tim & Hak Akses',
          'Atur pengguna, peran, permission, dan penempatan cabang.',
        ],
        [
          'Integrasi',
          'Hubungkan data operasional dengan Google Sheets secara terkontrol.',
        ],
      ];
  return (
    <section id="fitur" className="section features">
      <div className="container">
        {heading && (
          <Heading
            kicker={en ? 'PLATFORM CAPABILITIES' : 'KAPABILITAS PLATFORM'}
            title={
              en
                ? 'One Platform for <span>Business Operations</span>'
                : 'Satu Platform untuk <span>Operasional Bisnis</span>'
            }
            text={
              en
                ? 'Connected modules for the daily work of owners, supervisors, warehouse teams, purchasing teams, and cashiers.'
                : 'Modul yang saling terhubung untuk pekerjaan harian owner, supervisor, tim gudang, purchasing, dan kasir.'
            }
          />
        )}
        <div className="feature-grid">
          {features.map(([title, text], i) => (
            <article className="feature-card" key={title}>
              <Icon>
                <SidebarIcon icon={FEATURE_ICONS[i]} size={24} />
              </Icon>
              <h3>{title}</h3>
              <p>{text}</p>
              <Link to="/fitur">
                {en ? 'Explore feature' : 'Pelajari fitur'}{' '}
                <span aria-hidden="true">↗</span>
              </Link>
            </article>
          ))}
        </div>
        <MoreLink to="/fitur" />
      </div>
    </section>
  );
}

export function ShowcaseSection() {
  const w = useW();
  return (
    <section id="showcase" className="section showcase">
      <div className="container">
        <Heading
          kicker={w.showcase.kicker}
          title={w.showcase.title}
          text={w.showcase.subtitle}
        />
        <div className="product-showcase">
          <div className="showcase-shot">
            <img
              src="/assets/brend/niagantara-dasbord01.jpg"
              alt={w.showcase.kicker}
              loading="lazy"
              decoding="async"
            />
          </div>
          <div className="product-showcase-pos">
            <PosPreview w={w} />
          </div>
        </div>
      </div>
    </section>
  );
}

export function PosSolutionSection() {
  const w = useW();
  const s = w.solutions.pos;
  return (
    <section id="solusi" className="section solution pos-showcase-section">
      <div className="container split">
        <div>
          <Kicker>{s.kicker}</Kicker>
          <h2>{renderSafeTitle(s.title)}</h2>
          <p>{s.text}</p>
          <ul>
            {s.bullets.map((b) => (
              <li key={b}>✓ {b}</li>
            ))}
          </ul>
          <div className="solution-actions">
            <Button to="/kontak">{s.cta}</Button>
            <MoreLink to="/solusi" />
          </div>
        </div>
        <PosPreview w={w} />
      </div>
    </section>
  );
}

export function InventorySolutionSection() {
  const w = useW();
  const s = w.solutions.inventory;
  return (
    <section className="section inventory-section">
      <div className="container split reverse">
        <InventoryPreview w={w} />
        <div>
          <Kicker>{s.kicker}</Kicker>
          <h2>{renderSafeTitle(s.title)}</h2>
          <p>{s.text}</p>
          <div className="pills">
            {s.pills.map((p) => (
              <span key={p}>{p}</span>
            ))}
          </div>
          <Link className="text-link" to="/fitur">
            {s.link} <span aria-hidden="true">→</span>
          </Link>
        </div>
      </div>
    </section>
  );
}

export function BranchesSection() {
  const w = useW();
  return (
    <section id="tentang" className="section branches">
      <div className="container branch-grid">
        <div>
          <Kicker>{w.branches.kicker}</Kicker>
          <h2>{renderSafeTitle(w.branches.title)}</h2>
          <p>{w.branches.text}</p>
          <div className="hierarchy">
            <div className="hierarchy-card company">
              <Building2 size={14} aria-hidden="true" />{' '}
              <span>
                <b>Company</b>
                <small>PT Niagantara Indonesia</small>
              </span>
            </div>
            <i aria-hidden="true" />
            <div className="hierarchy-row">
              <div className="hierarchy-card">
                <Store size={14} aria-hidden="true" />{' '}
                <span>
                  <b>Store</b>
                  <small>Toko Pusat</small>
                </span>
              </div>
              <div className="hierarchy-card">
                <Store size={14} aria-hidden="true" />{' '}
                <span>
                  <b>Store</b>
                  <small>Toko Selatan</small>
                </span>
              </div>
            </div>
            <p>
              <GitBranch size={14} aria-hidden="true" /> {w.branches.mainBranch}
              　　
              <GitBranch size={14} aria-hidden="true" /> Cabang Barat　　
              <GitBranch size={14} aria-hidden="true" /> Cabang Selatan
            </p>
          </div>
          <MoreLink to="/tentang" />
        </div>
        <div className="orbit" aria-hidden="true">
          <div className="orbit-ring" />
          <div className="orbit-ring inner" />
          <div className="orbit-center">
            <ThemeImage
              lightSrc="/brand-mark-144.webp"
              alt=""
              className="orbit-logo"
              width={144}
              height={157}
              loading="lazy"
            />
            <strong>NIAGANTARA</strong>
            <small>ONE SOURCE OF TRUTH</small>
          </div>
          <div className="orbit-card one">
            <b>POS</b>
            <small>Kasir</small>
          </div>
          <div className="orbit-card two">
            <b>Stok</b>
            <small>Inventory</small>
          </div>
          <div className="orbit-card three">
            <b>Laporan</b>
            <small>Finance</small>
          </div>
        </div>
      </div>
    </section>
  );
}

export function FinanceSection({ heading = true }: { heading?: boolean }) {
  const w = useW();
  return (
    <section className="section finance">
      <div className="container">
        {heading && (
          <Heading
            kicker={w.finance.kicker}
            title={w.finance.title}
            text={w.finance.subtitle}
          />
        )}
        <div className="finance-grid">
          <div className="finance-main">
            <small>{w.finance.monthlyRevenue}</small>
            <b>Rp 128.420.000</b>
            <em>↗ 18,4% {w.finance.vsLastMonth}</em>
            <div className="bars" aria-hidden="true">
              {[35, 54, 48, 74, 63, 88, 78, 100].map((height, i) => (
                <i key={i} style={{ height: `${height}%` }} />
              ))}
            </div>
          </div>
          <Metric
            icon={<WalletCards size={18} />}
            name={w.finance.netProfit}
            value="Rp 42.860.000"
            change="↗ 14,2%"
          />
          <Metric
            icon={<TrendingUp size={18} />}
            name={w.finance.expenses}
            value="Rp 85.560.000"
            change={w.finance.thisMonth}
          />
          <div className="reports">
            <div className="card-title">
              <b>{w.finance.availableReports}</b>
              <small>•••</small>
            </div>
            <p>
              <BarChart3 size={14} aria-hidden="true" /> {w.finance.salesReport}{' '}
              <b>↗</b>
            </p>
            <p>
              <BarChart3 size={14} aria-hidden="true" />{' '}
              {w.finance.productPerformance} <b>↗</b>
            </p>
            <p>
              <BarChart3 size={14} aria-hidden="true" />{' '}
              {w.finance.branchPerformance} <b>↗</b>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

export function SheetsSection() {
  const w = useW();
  return (
    <section className="section sheets">
      <div className="container sheets-grid">
        <div>
          <Kicker>{w.sheets.kicker}</Kicker>
          <h2>{renderSafeTitle(w.sheets.title)}</h2>
          <p>{w.sheets.text}</p>
          <Link className="text-link" to="/faq">
            {w.sheets.link} <span aria-hidden="true">→</span>
          </Link>
        </div>
        <div className="sheets-card">
          <div className="sheets-head">
            <i aria-hidden="true">
              <Table2 size={16} />
            </i>
            <span>
              <b>Google Sheets</b>
              <small>NIAGANTARA Reporting</small>
            </span>
            <em>● {w.sheets.connected}</em>
          </div>
          <div className="sheet">
            <small>Q3_Business_Report　　•••</small>
            <div>
              {[
                'Tanggal',
                'Penjualan',
                'Laba',
                'Cabang',
                '22 Agu',
                'Rp 8.420.000',
                'Rp 2.840.000',
                'Toko Pusat',
                '21 Agu',
                'Rp 7.980.000',
                'Rp 2.510.000',
                'Selatan',
              ].map((x, i) => (
                <span key={`${x}-${i}`}>{x}</span>
              ))}
            </div>
          </div>
          <p className="sync">
            {w.sheets.lastSync} <b>{w.sheets.todayAt}</b>
            <br />
            {w.sheets.activeSheet} <b>Q3_Business_Report</b>
          </p>
        </div>
      </div>
    </section>
  );
}

export function SecuritySection() {
  const w = useW();
  return (
    <section className="section security">
      <div className="container security-panel">
        <div>
          <Kicker>{w.security.kicker}</Kicker>
          <h2>{renderSafeTitle(w.security.title)}</h2>
          <p>{w.security.text}</p>
          <MoreLink to="/tentang" />
        </div>
        <div className="security-grid">
          {w.security.items.map((item, i) => (
            <div key={item.title}>
              <Icon>
                <SidebarIcon
                  icon={
                    [ShieldCheck, Lock, Eye, Fingerprint, Building2, Server][i]
                  }
                  size={20}
                />
              </Icon>
              <span>
                <b>{item.title}</b>
                <small>{item.text}</small>
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function MobileSection() {
  const w = useW();
  const en = useLang(w);
  const featureIcons = [LayoutDashboard, Smartphone, ShieldCheck];
  const featureDetails = en
    ? [
        'A complete view for business analysis',
        'Fast access from your Android device',
        'Your data stays synced and secure',
      ]
    : [
        'Pantau operasional bisnis dari satu dashboard.',
        'Akses informasi operasional melalui perangkat yang didukung.',
        'POS, stok, pembelian, cabang, dan aktivitas bisnis terhubung.',
      ];
  const capability = en
    ? [
        { icon: Activity, b: 'Real-time', s: 'Data & Reports' },
        { icon: ShieldCheck, b: 'Secure', s: 'Protected' },
        { icon: Blocks, b: 'Integrated', s: 'All Modules' },
        { icon: GitBranch, b: 'Multi-branch', s: 'Business Scale' },
      ]
    : [
        { icon: Activity, b: 'Real-time', s: 'Data & Laporan' },
        { icon: ShieldCheck, b: 'Aman', s: 'Terlindungi' },
        { icon: Blocks, b: 'Terintegrasi', s: 'Semua Modul' },
        { icon: GitBranch, b: 'Multi Cabang', s: 'Skala Bisnis' },
      ];
  const nav = en
    ? ['Home', 'Products', 'Transactions', 'Reports', 'Account']
    : ['Beranda', 'Produk', 'Transaksi', 'Laporan', 'Akun'];
  const navIcons = [Home, Package, TrendingUp, BarChart3, UserCircle];
  const bulletLinks = ['/demo', '/demo', '/fitur'];
  return (
    <section
      id="mobile"
      className="section mobile"
      aria-labelledby="mobile-showcase-title"
    >
      <div className="container mobile-grid">
        <div>
          <Kicker>{w.mobileSection.kicker}</Kicker>
          <h2 id="mobile-showcase-title">
            {renderSafeTitle(w.mobileSection.title)}
          </h2>
          <p>{w.mobileSection.text}</p>
          <ul className="mobile-features">
            {w.mobileSection.bullets.map((b, i) => {
              const Icon = featureIcons[i] ?? CheckCircle2;
              return (
                <li key={b}>
                  <Link
                    className="mobile-feature-item"
                    to={bulletLinks[i] ?? '/demo'}
                  >
                    <span className="mobile-feature-icon">
                      <Icon size={18} aria-hidden="true" />
                    </span>
                    <span>
                      <b>{b}</b>
                      <small>{featureDetails[i]}</small>
                    </span>
                    <span className="mobile-feature-go" aria-hidden="true">
                      →
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
          <ul className="capability-strip">
            {capability.map((c, i) => {
              const Icon = c.icon;
              return (
                <li key={i}>
                  <Link className="capability-item" to="/demo">
                    <span className="capability-icon">
                      <Icon size={16} aria-hidden="true" />
                    </span>
                    <span>
                      <b>{c.b}</b>
                      <small>{c.s}</small>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
        <div
          className="devices"
          aria-label="NIAGANTARA mobile dashboard preview"
        >
          <div className="device-glow" aria-hidden="true" />
          <Link
            className="mobile-app-preview"
            to="/demo"
            ariaLabel="Buka demo aplikasi mobile NIAGANTARA"
          >
            <img
              src="/phone/mobile-app-showcase-v2.png"
              alt="Tampilan aplikasi mobile NIAGANTARA pada perangkat Android"
              loading="lazy"
              decoding="async"
            />
            <span>
              <Smartphone size={15} aria-hidden="true" /> Tampilan aplikasi
              mobile
            </span>
          </Link>
          <div className="flexible-device">
            <Link className="flexible-device-top" to="/demo">
              <strong>NIAGANTARA</strong>
              <span aria-label="Toko Pusat" title="Toko Pusat">
                A
              </span>
            </Link>
            <small className="flexible-greeting">
              {w.mobileSection.welcome}
            </small>
            <div className="flexible-context" aria-hidden="true">
              <span>Toko Pusat</span>
              <em>Paket FREE</em>
            </div>
            <Link className="flexible-h4" to="/demo">
              {w.mobileSection.summary}
            </Link>
            <div className="flexible-kpis">
              <div>
                <small>{w.hero.todaySales}</small>
                <b>Rp 4,86 jt</b>
                <em>↗ 12,8%</em>
              </div>
              <div>
                <small>{w.demoLabels.totalSales}</small>
                <b>Rp 48,6 jt</b>
              </div>
              <div>
                <small>{w.demoLabels.totalTransactions}</small>
                <b>1.248</b>
              </div>
              <div>
                <small>{w.demoLabels.totalProducts}</small>
                <b>684</b>
              </div>
            </div>
            <div className="flexible-chart">
              <div className="flexible-chart-title">
                <b>{w.demoLabels.salesChart}</b>
                <small>7 hari</small>
              </div>
              <div className="flexible-bars">
                {[28, 45, 38, 67, 58, 82, 72].map((height, i) => (
                  <i key={i} style={{ height: `${height}%` }} />
                ))}
              </div>
            </div>
            <nav
              className="flexible-nav"
              aria-label="Mobile dashboard navigation"
            >
              {nav.map((n, i) => {
                const Icon = navIcons[i];
                return (
                  <Link key={n} to="/demo" className={i === 0 ? 'active' : ''}>
                    <Icon size={14} aria-hidden="true" />
                    {n}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      </div>
    </section>
  );
}

export function FreeAccessSection() {
  const w = useW();
  const lang = useLang(w);
  return (
    <section id="akses-gratis" className="section pricing free-access">
      <div className="container pricing-wrap">
        <div className="pricing-meta">
          <div className="pricing-heading">
            <Kicker>{lang === 'id' ? 'AKSES GRATIS' : 'FREE ACCESS'}</Kicker>
            <h2>
              {lang === 'id'
                ? 'Gunakan seluruh dashboard tanpa biaya.'
                : 'Use the complete dashboard at no cost.'}
            </h2>
            <p>
              {lang === 'id'
                ? 'Selama masa peluncuran, fitur operasional inti NIAGANTARA dapat digunakan gratis. Tidak ada pilihan paket atau pembayaran yang perlu diselesaikan.'
                : 'During launch, NIAGANTARA core operations features are free to use. There is no plan or payment to complete.'}
            </p>
          </div>
          <ul className="pricing-trust">
            {[
              lang === 'id'
                ? 'Dashboard bisnis lengkap'
                : 'Complete business dashboard',
              lang === 'id'
                ? 'POS, stok, laporan, dan operasional'
                : 'POS, inventory, reports, and operations',
              lang === 'id' ? 'Tanpa kartu kredit' : 'No credit card required',
            ].map((item) => (
              <li key={item}>
                <CheckCircle2 size={14} aria-hidden="true" />
                {item}
              </li>
            ))}
          </ul>
        </div>
        <div className="free-access-card">
          <span className="plan-badge">
            {lang === 'id' ? 'AKSES PENUH' : 'FULL ACCESS'}
          </span>
          <small className="plan-name">NIAGANTARA FREE</small>
          <h3>
            {lang === 'id'
              ? 'Mulai kelola bisnis hari ini'
              : 'Start managing your business today'}
          </h3>
          <p className="plan-summary">
            {lang === 'id'
              ? 'Daftar, siapkan toko dan cabang, lalu gunakan dashboard sesuai hak akses tim Anda.'
              : 'Register, set up stores and branches, then use the dashboard based on your team permissions.'}
          </p>
          <a
            className="plan-cta primary"
            href="https://niagantara-app.pages.dev"
          >
            {lang === 'id' ? 'Buat Akun Gratis' : 'Create Free Account'}
          </a>
          <small className="free-access-note">
            {lang === 'id'
              ? 'Jika paket berbayar diperkenalkan nanti, informasinya akan diumumkan terlebih dahulu.'
              : 'If paid plans are introduced later, they will be announced in advance.'}
          </small>
        </div>
      </div>
    </section>
  );
}

function PaymentBrandIcon({ id }: { id: string }) {
  const brandFont = 'Inter, Arial, Helvetica, sans-serif';
  switch (id) {
    case 'visa':
      return (
        <svg
          viewBox="0 0 36 12"
          height="15"
          aria-hidden="true"
          focusable="false"
        >
          <text
            x="0"
            y="10.5"
            fontFamily={brandFont}
            fontSize="11"
            fontWeight="800"
            fontStyle="italic"
            letterSpacing="0.5"
            fill="#1A1F71"
          >
            VISA
          </text>
        </svg>
      );
    case 'mastercard':
      return (
        <svg
          viewBox="0 0 24 16"
          height="16"
          aria-hidden="true"
          focusable="false"
        >
          <circle cx="9.2" cy="8" r="6.6" fill="#EB001B" opacity="0.92" />
          <circle cx="14.8" cy="8" r="6.6" fill="#F79E1B" opacity="0.92" />
        </svg>
      );
    case 'jcb':
      return (
        <svg
          viewBox="0 0 30 12"
          height="15"
          aria-hidden="true"
          focusable="false"
        >
          <g
            fontFamily={brandFont}
            fontSize="11"
            fontWeight="800"
            fontStyle="italic"
            letterSpacing="0.5"
          >
            <text x="0" y="10.5" fill="#0E4C96">
              J
            </text>
            <text x="10" y="10.5" fill="#E2001A">
              C
            </text>
            <text x="20" y="10.5" fill="#1E3383">
              B
            </text>
          </g>
        </svg>
      );
    case 'qris':
      return (
        <svg
          viewBox="0 0 24 24"
          height="18"
          aria-hidden="true"
          focusable="false"
        >
          <rect
            x="1.5"
            y="1.5"
            width="21"
            height="21"
            rx="4.5"
            fill="none"
            stroke="#0D6DF2"
            strokeWidth="2"
          />
          <g fill="#0D6DF2">
            <path d="M5.5 5.5h4.5v4.5H5.5z" />
            <path d="M14 5.5h4.5v4.5H14z" />
            <path d="M5.5 14h4v4h-4z" />
            <path d="M15.5 16.5h3v3h-3z" />
          </g>
        </svg>
      );
    case 'ovo':
      return (
        <img
          src="/assets/brend/ovo.png"
          alt=""
          height="20"
          aria-hidden="true"
          loading="lazy"
          decoding="async"
          draggable={false}
        />
      );
    case 'gopay':
      return (
        <img
          src="/assets/brend/gopay.png"
          alt=""
          height="16"
          aria-hidden="true"
          loading="lazy"
          decoding="async"
          draggable={false}
        />
      );
    case 'dana':
      return (
        <img
          src="/assets/brend/dana.png"
          alt=""
          height="18"
          aria-hidden="true"
          loading="lazy"
          decoding="async"
          draggable={false}
        />
      );
    case 'shopeepay':
      return (
        <img
          src="/assets/brend/shopeepay.png"
          alt=""
          height="18"
          aria-hidden="true"
          loading="lazy"
          decoding="async"
          draggable={false}
        />
      );
    case 'bank-transfer':
      return (
        <svg
          viewBox="0 0 24 20"
          height="16"
          aria-hidden="true"
          focusable="false"
        >
          <path d="M12 1.5 2 7h20L12 1.5Z" fill="#64748B" />
          <path
            d="M5 9.5h3v5H5zM10.5 9.5h3v5h-3zM16 9.5h3v5h-3z"
            fill="#94A3B8"
          />
          <rect x="2" y="16.5" width="20" height="2" rx="1" fill="#64748B" />
        </svg>
      );
    default:
      return null;
  }
}

function PaymentMethods() {
  const lang = useLang(useW());
  return (
    <div className="payment-methods">
      <h3>{PAYMENT_TITLE[lang]}</h3>
      <ul className="payment-grid">
        {PAYMENT_METHODS.map((pm) => (
          <li key={pm.id}>
            <span className="payment-icon">
              <PaymentBrandIcon id={pm.id} />
            </span>
            <span>
              <b>{pm.label}</b>
              <em>{PAYMENT_SOON[lang]}</em>
            </span>
          </li>
        ))}
      </ul>
      <p className="payment-note">{PAYMENT_DISCLAIMER[lang]}</p>
    </div>
  );
}

export function StepsSection({ heading = true }: { heading?: boolean }) {
  const w = useW();
  return (
    <section className="section steps">
      <div className="container">
        {heading && <Heading kicker={w.steps.kicker} title={w.steps.title} />}
        <div className="step-grid">
          {w.steps.items.map((step, i) => (
            <div key={step.title}>
              <b>{String(i + 1).padStart(2, '0')}</b>
              <Icon>
                <SidebarIcon
                  icon={[PlayCircle, ArrowRightLeft, Package, Server][i]}
                  size={22}
                />
              </Icon>
              <h3>{step.title}</h3>
              <p>{step.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function FaqSection() {
  const w = useW();
  const [open, setOpen] = useState<number | null>(null);
  return (
    <section id="faq" className="section faq">
      <div className="container faq-grid">
        <div>
          <Kicker>{w.faq.kicker}</Kicker>
          <h2>{renderSafeTitle(w.faq.title)}</h2>
          <p>{w.faq.text}</p>
          <a className="text-link" href="mailto:support@niagantara.com">
            {w.faq.contactLink} <span aria-hidden="true">→</span>
          </a>
        </div>
        <div>
          {w.faq.items.map((item, i) => {
            const expanded = open === i;
            return (
              <div
                className={`faq-item${expanded ? ' open' : ''}`}
                key={item.q}
              >
                <h3>
                  <button
                    aria-expanded={expanded}
                    aria-controls={`faq-panel-${i}`}
                    id={`faq-trigger-${i}`}
                    onClick={() => setOpen(expanded ? null : i)}
                  >
                    <span>{item.q}</span>
                    <span className={`faq-icon${expanded ? ' is-open' : ''}`} aria-hidden="true">
                      <ChevronDown size={19} strokeWidth={1.8} />
                    </span>
                  </button>
                </h3>
                <div
                  id={`faq-panel-${i}`}
                  role="region"
                  aria-labelledby={`faq-trigger-${i}`}
                  hidden={!expanded}
                >
                  <p>{item.a}</p>
                </div>
              </div>
            );
          })}
          <MoreLink to="/faq" />
        </div>
      </div>
    </section>
  );
}

export function CtaSection() {
  const { language } = useTranslation();
  const en = language === 'en';
  return (
    <section id="kontak" className="cta">
      <div className="container">
        <Kicker>
          {en ? 'NIAGANTARA FOR YOUR BUSINESS' : 'NIAGANTARA UNTUK BISNIS ANDA'}
        </Kicker>
        <h2>
          {en
            ? 'Ready to Unify Your Business Operations?'
            : 'Siap Menyatukan Operasional Bisnis Anda?'}
        </h2>
        <p>
          {en
            ? 'Manage transactions, inventory, purchasing, branches, and teams in one NIAGANTARA ecosystem.'
            : 'Kelola transaksi, stok, pembelian, cabang dan tim dalam satu ekosistem NIAGANTARA.'}
        </p>
        <div className="actions">
          <a className="button" href="mailto:support@niagantara.com">
            {en ? 'Get Started' : 'Mulai Sekarang'}
            <span aria-hidden="true">→</span>
          </a>
          <Button secondary to="/fitur">
            {en ? 'Explore Features' : 'Pelajari Fitur'}
          </Button>
        </div>
      </div>
    </section>
  );
}

function Icon({ children }: { children: React.ReactNode }) {
  return (
    <span className="feature-icon" aria-hidden="true">
      {children}
    </span>
  );
}

function PriceCard({
  plan,
  lang,
  recommended,
  onSelect,
}: {
  plan: PlanPresentation;
  lang: 'id' | 'en';
  recommended: string;
  onSelect: () => void;
}) {
  return (
    <article
      className={`plan-card plan-clickable${plan.highlight ? ' plan-highlight' : ''}`}
      aria-labelledby={`plan-title-${plan.id}`}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect();
        }
      }}
      role="button"
      tabIndex={0}
    >
      {plan.highlight && <span className="plan-badge">{recommended}</span>}
      <small className="plan-name">{plan.name}</small>
      <h3 id={`plan-title-${plan.id}`}>{plan.title[lang]}</h3>
      <p className="plan-summary">{plan.summary[lang]}</p>
      <div className="plan-price">
        <b>{plan.priceLabel}</b>
        <small>{plan.cadence[lang]}</small>
      </div>
      <ul className="plan-features">
        {plan.features.map((f) => (
          <li key={f.en}>
            <CheckCircle2 size={14} aria-hidden="true" />
            {f[lang]}
          </li>
        ))}
      </ul>
      <button
        type="button"
        className={`plan-cta ${plan.ctaKind}`}
        onClick={(e) => {
          e.stopPropagation();
          onSelect();
        }}
      >
        {plan.cta[lang]} <span aria-hidden="true">→</span>
      </button>
    </article>
  );
}

function PaymentModal({
  plan,
  lang,
  onClose,
}: {
  plan: PlanPresentation;
  lang: 'id' | 'en';
  onClose: () => void;
}) {
  const [method, setMethod] = useState<string | null>(null);
  const [paid, setPaid] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  const closePay = () => {
    setMethod(null);
    setPaid(false);
    onClose();
  };

  const doPay = () => {
    setPaid(true);
  };

  const copy = {
    title: lang === 'id' ? 'Selesaikan Pembayaran' : 'Complete Payment',
    package: lang === 'id' ? 'Paket' : 'Plan',
    choose:
      lang === 'id' ? 'Pilih metode pembayaran' : 'Choose a payment method',
    pay:
      plan.priceIdr === 0
        ? lang === 'id'
          ? 'Aktifkan Gratis'
          : 'Activate Free'
        : lang === 'id'
          ? 'Bayar Sekarang'
          : 'Pay Now',
    totalDue: lang === 'id' ? 'Total tagihan' : 'Total due',
    close: lang === 'id' ? 'Tutup' : 'Close',
    successTitle: lang === 'id' ? 'Permintaan diterima' : 'Request received',
    successText:
      lang === 'id'
        ? 'Pembayaran sedang diproses. Tim NIAGANTARA akan mengirimkan instruksi penyelesaian lanjutan.'
        : 'Payment is being processed. The NIAGANTARA team will send further instructions.',
    done: lang === 'id' ? 'Selesai' : 'Done',
  };

  return (
    <div
      className="pay-backdrop"
      role="dialog"
      aria-modal="true"
      aria-label={copy.title}
      onClick={closePay}
    >
      <div className="pay-modal" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          className="pay-close"
          onClick={closePay}
          aria-label={copy.close}
        >
          <Minus size={16} />
          <Plus size={16} />
        </button>

        {paid ? (
          <div className="pay-success">
            <span className="pay-success-icon" aria-hidden="true">
              <CheckCircle2 size={30} />
            </span>
            <h3>{copy.successTitle}</h3>
            <p>{copy.successText}</p>
            <p className="pay-success-plan">
              <b>{plan.name}</b> · {plan.priceLabel}
              {plan.priceIdr !== 0 ? ` / ${plan.cadence[lang]}` : ''}
            </p>
            <button
              type="button"
              className="plan-cta primary"
              onClick={closePay}
            >
              {copy.done}
            </button>
          </div>
        ) : (
          <>
            <small className="plan-name">{plan.name}</small>
            <h3>{copy.title}</h3>
            <div className="pay-summary">
              <span>{copy.package}</span>
              <b>{plan.title[lang]}</b>
              <div className="pay-price">
                <strong>{plan.priceLabel}</strong>
                {plan.priceIdr !== 0 && <em>{plan.cadence[lang]}</em>}
              </div>
            </div>
            <h4>{copy.choose}</h4>
            <ul className="pay-methods">
              {PAYMENT_METHODS.map((pm) => {
                const active = method === pm.id;
                return (
                  <li key={pm.id}>
                    <button
                      type="button"
                      className={active ? 'active' : ''}
                      onClick={() => setMethod(active ? null : pm.id)}
                    >
                      <span className="pay-method-icon">
                        <PaymentBrandIcon id={pm.id} />
                      </span>
                      <span>
                        <b>{pm.label}</b>
                        <em>
                          {pm.status === 'planned' ? PAYMENT_SOON[lang] : ''}
                        </em>
                      </span>
                      <i
                        className={`pay-radio${active ? ' on' : ''}`}
                        aria-hidden="true"
                      />
                    </button>
                  </li>
                );
              })}
            </ul>
            <div className="pay-total">
              <span>{copy.totalDue}</span>
              <b>
                {plan.priceLabel}
                {plan.priceIdr !== 0 ? ` / ${plan.cadence[lang]}` : ''}
              </b>
            </div>
            <button
              type="button"
              className={`plan-cta primary ${method ? '' : 'disabled'}`}
              disabled={!method}
              onClick={doPay}
            >
              {copy.pay} <span aria-hidden="true">→</span>
            </button>
            <p className="pay-note">{PAYMENT_DISCLAIMER[lang]}</p>
          </>
        )}
      </div>
    </div>
  );
}

export function HomePage() {
  return (
    <Shell>
      <div className="home-page">
        <HeroSection />
        <LogoStrip />
        <LazySection>
          <FeaturesSection />
        </LazySection>
        <LazySection>
          <ShowcaseSection />
        </LazySection>
        <LazySection>
          <PosSolutionSection />
        </LazySection>
        <LazySection>
          <InventorySolutionSection />
        </LazySection>
        <LazySection>
          <BranchesSection />
        </LazySection>
        <LazySection>
          <SheetsSection />
        </LazySection>
        <LazySection>
          <SecuritySection />
        </LazySection>
        <LazySection>
          <MobileSection />
        </LazySection>
        <LazySection>
          <FreeAccessSection />
        </LazySection>
        <LazySection>
          <StepsSection />
        </LazySection>
        <LazySection>
          <FaqSection />
        </LazySection>
        <LazySection>
          <CtaSection />
        </LazySection>
      </div>
    </Shell>
  );
}

export function FeaturesPage() {
  return (
    <Shell>
      <HeroSection />
      <FeaturesSection />
      <StepsSection />
      <CtaSection />
    </Shell>
  );
}

export function SolutionsPage() {
  return (
    <Shell>
      <PosSolutionSection />
      <InventorySolutionSection />
      <BranchesSection />
      <SheetsSection />
      <CtaSection />
    </Shell>
  );
}

export function AboutPage() {
  return (
    <Shell>
      <BranchesSection />
      <SecuritySection />
      <MobileSection />
      <CtaSection />
    </Shell>
  );
}

export function FaqPage() {
  return (
    <Shell>
      <FaqSection />
      <CtaSection />
    </Shell>
  );
}

export function ContactPage() {
  return (
    <Shell>
      <CtaSection />
    </Shell>
  );
}
