import { useState } from 'react';
import { BrandLogo, useTranslation } from '@niagantara/ui';
import { Shell, Button, Kicker, Heading, ThemeImage } from './chrome';
import { Link } from './router';
import { Dashboard, PosPreview, InventoryPreview, Metric } from './previews';

type W = ReturnType<typeof useTranslation>['translations']['website'];

function useW(): W {
  return useTranslation().translations.website;
}

/** Mobile-only "see the dedicated page" affordance (hidden on desktop via CSS). */
function MoreLink({ to }: { to: string }) {
  const w = useW();
  return (
    <Link className="section-more" to={to}>
      {w.seeMore} <span aria-hidden="true">→</span>
    </Link>
  );
}

export function HeroSection() {
  const w = useW();
  return (
    <section className="hero">
      <div className="container hero-grid">
        <div className="hero-copy">
          <div className="eyebrow"><i /> {w.eyebrow}</div>
          <h1 dangerouslySetInnerHTML={{ __html: w.hero.title }} />
          <p>{w.hero.subtitle}</p>
          <div className="actions">
            <Button to="/kontak">{w.hero.cta}</Button>
            <Button secondary to="/demo">{w.hero.demo} <small>▶</small></Button>
          </div>
          <div className="trust">
            {w.hero.trust.map((x) => <span key={x}>✓ {x}</span>)}
          </div>
        </div>
        <div className="hero-visual">
          <div className="float sales"><i>↗</i><span><small>{w.hero.todaySales}</small><b>Rp 8.420.000</b></span><em>+12,8%</em></div>
          <div className="float stock"><i>◫</i><span><small>{w.hero.lowStock}</small><b>12 {w.hero.productsUnit}</b></span><em>{w.hero.needsAttention}</em></div>
          <div className="hero-scale">
            <Dashboard w={w} />
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
      <div className="container"><span>{w.stripLabel}</span><div><b>POS</b><b>INVENTORY</b><b>FINANCE</b><b>REPORTING</b><b>GOOGLE SHEETS</b></div></div>
    </section>
  );
}

export function FeaturesSection({ heading = true }: { heading?: boolean }) {
  const w = useW();
  return (
    <section id="fitur" className="section features">
      <div className="container">
        {heading && <Heading kicker={w.features.kicker} title={w.features.title} text={w.features.subtitle} />}
        <div className="feature-grid">
          {w.features.items.map((f) => (
            <article className="feature-card" key={f.title}>
              <Icon>{f.icon}</Icon>
              <h3>{f.title}</h3>
              <p>{f.text}</p>
              <Link to="/fitur">{w.features.learnMore} <span aria-hidden="true">↗</span></Link>
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
        <Heading kicker={w.showcase.kicker} title={w.showcase.title} text={w.showcase.subtitle} />
        <Dashboard w={w} />
      </div>
    </section>
  );
}

export function PosSolutionSection() {
  const w = useW();
  const s = w.solutions.pos;
  return (
    <section id="solusi" className="section solution">
      <div className="container split">
        <div>
          <Kicker>{s.kicker}</Kicker>
          <h2 dangerouslySetInnerHTML={{ __html: s.title }} />
          <p>{s.text}</p>
          <ul>{s.bullets.map((b) => <li key={b}>✓ {b}</li>)}</ul>
          <Button to="/kontak">{s.cta}</Button>
          <MoreLink to="/solusi" />
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
          <h2 dangerouslySetInnerHTML={{ __html: s.title }} />
          <p>{s.text}</p>
          <div className="pills">{s.pills.map((p) => <span key={p}>{p}</span>)}</div>
          <Link className="text-link" to="/fitur">{s.link} <span aria-hidden="true">→</span></Link>
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
          <h2 dangerouslySetInnerHTML={{ __html: w.branches.title }} />
          <p>{w.branches.text}</p>
          <div className="hierarchy">
            <div className="hierarchy-card company">◆ <span><b>Company</b><small>PT Niagantara Indonesia</small></span></div>
            <i aria-hidden="true" />
            <div className="hierarchy-row">
              <div className="hierarchy-card">◈ <span><b>Store</b><small>Toko Pusat</small></span></div>
              <div className="hierarchy-card">◈ <span><b>Store</b><small>Toko Selatan</small></span></div>
            </div>
            <p>⌁ {w.branches.mainBranch}　　⌁ Cabang Barat　　⌁ Cabang Selatan</p>
          </div>
          <MoreLink to="/tentang" />
        </div>
        <div className="orbit" aria-hidden="true">
          <div className="orbit-ring" /><div className="orbit-ring inner" />
          <div className="orbit-center"><ThemeImage lightSrc="/brand-mark.png" darkSrc="/niagantara-mark-dark.png" alt="" className="orbit-logo" width={576} height={628} loading="lazy" /><strong>NIAGANTARA</strong><small>ONE SOURCE OF TRUTH</small></div>
          <div className="orbit-card one"><b>POS</b><small>Kasir</small></div>
          <div className="orbit-card two"><b>Stok</b><small>Inventory</small></div>
          <div className="orbit-card three"><b>Laporan</b><small>Finance</small></div>
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
        {heading && <Heading kicker={w.finance.kicker} title={w.finance.title} text={w.finance.subtitle} />}
        <div className="finance-grid">
          <div className="finance-main">
            <small>{w.finance.monthlyRevenue}</small>
            <b>Rp 128.420.000</b>
            <em>↗ 18,4% {w.finance.vsLastMonth}</em>
            <div className="bars" aria-hidden="true">{[35, 54, 48, 74, 63, 88, 78, 100].map((height, i) => <i key={i} style={{ height: `${height}%` }} />)}</div>
          </div>
          <Metric icon="◌" name={w.finance.netProfit} value="Rp 42.860.000" change="↗ 14,2%" />
          <Metric icon="↗" name={w.finance.expenses} value="Rp 85.560.000" change={w.finance.thisMonth} />
          <div className="reports">
            <div className="card-title"><b>{w.finance.availableReports}</b><small>•••</small></div>
            <p>▰ {w.finance.salesReport} <b>↗</b></p>
            <p>▰ {w.finance.productPerformance} <b>↗</b></p>
            <p>▰ {w.finance.branchPerformance} <b>↗</b></p>
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
          <h2 dangerouslySetInnerHTML={{ __html: w.sheets.title }} />
          <p>{w.sheets.text}</p>
          <Link className="text-link" to="/faq">{w.sheets.link} <span aria-hidden="true">→</span></Link>
        </div>
        <div className="sheets-card">
          <div className="sheets-head"><i aria-hidden="true">▤</i><span><b>Google Sheets</b><small>NIAGANTARA Reporting</small></span><em>● {w.sheets.connected}</em></div>
          <div className="sheet">
            <small>Q3_Business_Report　　•••</small>
            <div>{['Tanggal', 'Penjualan', 'Laba', 'Cabang', '22 Agu', 'Rp 8.420.000', 'Rp 2.840.000', 'Toko Pusat', '21 Agu', 'Rp 7.980.000', 'Rp 2.510.000', 'Selatan'].map((x, i) => <span key={`${x}-${i}`}>{x}</span>)}</div>
          </div>
          <p className="sync">{w.sheets.lastSync} <b>{w.sheets.todayAt}</b><br />{w.sheets.activeSheet} <b>Q3_Business_Report</b></p>
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
          <h2 dangerouslySetInnerHTML={{ __html: w.security.title }} />
          <p>{w.security.text}</p>
          <MoreLink to="/tentang" />
        </div>
        <div className="security-grid">
          {w.security.items.map((item, i) => (
            <div key={item.title}>
              <Icon>{['◆', '⌁', '♧', '▥', '◈', 'ϟ'][i]}</Icon>
              <span><b>{item.title}</b><small>{item.text}</small></span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function MobileSection() {
  const w = useW();
  return (
    <section className="section mobile">
      <div className="container mobile-grid">
        <div>
          <Kicker>{w.mobileSection.kicker}</Kicker>
          <h2 dangerouslySetInnerHTML={{ __html: w.mobileSection.title }} />
          <p>{w.mobileSection.text}</p>
          <ul>{w.mobileSection.bullets.map((b) => <li key={b}>✓ {b}</li>)}</ul>
        </div>
        <div className="devices">
          <div className="device-desktop"><Dashboard small w={w} /></div>
          <div className="phone" aria-hidden="true">
            <div className="phone-notch" />
            <small>{w.mobileSection.welcome}</small>
            <h4>{w.mobileSection.summary}</h4>
            <div><small>{w.hero.todaySales}</small><b>Rp 4.860.000</b><em>↗ 12,8%</em></div>
            <div className="phone-bars">{[28, 45, 38, 67, 58, 82, 72].map((height, i) => <i key={i} style={{ height: `${height}%` }} />)}</div>
            <footer>⌂　 <b>▦</b>　◫　♙</footer>
          </div>
        </div>
      </div>
    </section>
  );
}

export function PricingSection({ heading = true }: { heading?: boolean }) {
  const w = useW();
  return (
    <section id="harga" className="section pricing">
      <div className="container">
        {heading && <Heading kicker={w.pricing.kicker} title={w.pricing.title} text={w.pricing.subtitle} />}
        <div className="price-grid">
          {w.pricing.plans.map((p, i) => (
            <Price key={p.name} name={p.name} title={p.title} text={p.text} featured={i === 1} comingSoon={w.pricing.comingSoon} notifyMe={w.pricing.notifyMe} recommended={w.pricing.recommended} />
          ))}
        </div>
        {heading && <MoreLink to="/harga" />}
      </div>
    </section>
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
              <Icon>{['♙', '⌁', '◫', 'ϟ'][i]}</Icon>
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
  const [faq, setFaq] = useState(0);
  return (
    <section id="faq" className="section faq">
      <div className="container faq-grid">
        <div>
          <Kicker>{w.faq.kicker}</Kicker>
          <h2 dangerouslySetInnerHTML={{ __html: w.faq.title }} />
          <p>{w.faq.text}</p>
          <a className="text-link" href="mailto:support@niagantara.com">{w.faq.contactLink} <span aria-hidden="true">→</span></a>
        </div>
        <div>
          {w.faq.items.map((item, i) => (
            <div className={`faq-item${faq === i ? ' open' : ''}`} key={item.q}>
              <button onClick={() => setFaq(faq === i ? -1 : i)} aria-expanded={faq === i}>
                {item.q}
                <i aria-hidden="true">{faq === i ? '−' : '+'}</i>
              </button>
              {faq === i && <p>{item.a}</p>}
            </div>
          ))}
          <MoreLink to="/faq" />
        </div>
      </div>
    </section>
  );
}

export function CtaSection() {
  const w = useW();
  const { t } = useTranslation();
  return (
    <section id="kontak" className="cta">
      <div className="container">
        <Kicker>{w.contact.kicker}</Kicker>
        <h2>{t('website.cta.title')}</h2>
        <p>{t('website.cta.subtitle')}</p>
        <div className="actions">
          <a className="button" href="mailto:support@niagantara.com">{t('website.cta.tryFree')}<span aria-hidden="true">→</span></a>
          <Button secondary to="/kontak">{t('website.cta.signIn')}</Button>
        </div>
      </div>
    </section>
  );
}

function Icon({ children }: { children: string }) {
  return <span className="feature-icon" aria-hidden="true">{children}</span>;
}

function Price({
  name,
  title,
  text,
  featured = false,
  comingSoon,
  notifyMe,
  recommended,
}: {
  name: string;
  title: string;
  text: string;
  featured?: boolean;
  comingSoon: string;
  notifyMe: string;
  recommended?: string;
}) {
  return (
    <div className={`price${featured ? ' featured' : ''}`}>
      {featured && <strong>{recommended ?? ''}</strong>}
      <small>{name}</small>
      <h3>{title}</h3>
      <b>{comingSoon}</b>
      <p>{text}</p>
      <a href="mailto:support@niagantara.com">{notifyMe} <span aria-hidden="true">→</span></a>
    </div>
  );
}

export function HomePage() {
  return (
    <Shell>
      <div className="home-page">
        <HeroSection />
        <LogoStrip />
        <FeaturesSection />
        <ShowcaseSection />
        <PosSolutionSection />
        <InventorySolutionSection />
        <BranchesSection />
        <FinanceSection />
        <SheetsSection />
        <SecuritySection />
        <MobileSection />
        <PricingSection />
        <StepsSection />
        <FaqSection />
        <CtaSection />
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

export function PricingPage() {
  return (
    <Shell>
      <PricingSection />
      <StepsSection />
      <FaqSection />
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
