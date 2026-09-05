import { useTranslation } from '@niagantara/ui';
import { ThemeImage } from './chrome';
import {
  LayoutDashboard,
  ShoppingBag,
  WalletCards,
  Package,
  Boxes,
  TrendingUp,
  Search,
  ScanLine,
  ShoppingCart,
  Minus,
  Plus,
  Wifi,
} from 'lucide-react';

type W = ReturnType<typeof useTranslation>['translations']['website'];

export function Dashboard({ w, small = false }: { w: W; small?: boolean }) {
  const d = w.demoLabels;
  const en = String((w as any).mobileSection?.kicker ?? '').startsWith('FLEX');
  const account = en
    ? 'Central Store · Free Access'
    : 'Toko Pusat · Akses Gratis';
  const lowStockTitle = en ? 'Low Stock' : 'Stok Menipis';
  const almostOut = en ? 'Almost out' : 'Hampir habis';
  return (
    <div
      className={`dashboard${small ? ' dashboard-small' : ''}`}
      aria-label={d.preview}
    >
      <div className="dash-top">
        <span aria-hidden="true">● ● ●</span>
        <b>{d.overview}⌄</b>
        <small>NIAGANTARA</small>
        <span className="dash-account" aria-hidden="true">
          {account}
        </span>
        <i aria-hidden="true">A</i>
      </div>
      <div className="dash-body">
        <aside aria-hidden="true">
          <ThemeImage
            lightSrc="/brand-mark-144.webp"
            alt=""
            className="mini-logo"
            width={144}
            height={157}
            loading="lazy"
          />
          <a className="active" tabIndex={-1}>
            <LayoutDashboard size={14} aria-hidden="true" />{' '}
            <span>{d.overview}</span>
          </a>
          <a tabIndex={-1}>
            <ShoppingBag size={14} aria-hidden="true" />{' '}
            <span>{w.features.items[2].title}</span>
          </a>
          <a tabIndex={-1}>
            <WalletCards size={14} aria-hidden="true" />{' '}
            <span>{w.features.items[3].title}</span>
          </a>
          <a tabIndex={-1}>
            <Package size={14} aria-hidden="true" />{' '}
            <span>{w.features.items[1].title}</span>
          </a>
          <a tabIndex={-1}>
            <Boxes size={14} aria-hidden="true" />{' '}
            <span>{w.solutions.inventory.pills[0]}</span>
          </a>
        </aside>
        <div className="dash-content">
          <div className="dash-heading">
            <div>
              <small>{d.welcomeBack}</small>
              <h3>{d.summary}</h3>
            </div>
            <button tabIndex={-1}>{d.last7Days}⌄</button>
          </div>
          <div className="stat-row">
            <div>
              <small>{d.totalSales}</small>
              <b>Rp 48.620.000</b>
              <em>↗ 12,8%</em>
            </div>
            <div>
              <small>{d.totalTransactions}</small>
              <b>1.248</b>
              <em>↗ 8,4%</em>
            </div>
            <div>
              <small>{d.totalProducts}</small>
              <b>684</b>
              <em>{d.active}</em>
            </div>
            <div>
              <small>{d.totalCustomers}</small>
              <b>2.431</b>
              <em>↗ 6,2%</em>
            </div>
          </div>
          <div className="dash-grid">
            <div className="chart-card">
              <div className="card-title">
                <b>{d.salesChart}</b>
                <small>
                  {d.sales} <i aria-hidden="true">●</i> {d.profit}
                </small>
              </div>
              <div className="chart">
                <svg
                  viewBox="0 0 500 150"
                  preserveAspectRatio="none"
                  role="img"
                  aria-label={d.salesChart}
                >
                  <defs>
                    <linearGradient id="fill" x1="0" x2="0" y1="0" y2="1">
                      <stop stopColor="#2563eb" stopOpacity=".25" />
                      <stop offset="1" stopColor="#2563eb" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <path
                    d="M0 120C45 112 55 84 90 104S137 74 174 90S222 48 259 70S302 38 342 55S385 20 420 35S465 13 500 18V150H0Z"
                    fill="url(#fill)"
                  />
                  <path
                    d="M0 120C45 112 55 84 90 104S137 74 174 90S222 48 259 70S302 38 342 55S385 20 420 35S465 13 500 18"
                    fill="none"
                    stroke="#2563eb"
                    strokeWidth="3"
                  />
                </svg>
              </div>
              <div className="axis">
                <span>15</span>
                <span>17</span>
                <span>19</span>
                <span>21</span>
                <span>22</span>
              </div>
            </div>
            <div className="distribution">
              <div className="card-title">
                <b>{d.distribution}</b>
                <small>•••</small>
              </div>
              <div className="donut">
                <b>Rp 48,6M</b>
                <small>{d.total}</small>
              </div>
              <p>
                <i className="blue-dot" />
                {d.sales}
                <b>52%</b>
              </p>
              <p>
                <i className="cyan-dot" />
                {d.profit}
                <b>28%</b>
              </p>
              <p>
                <i className="purple-dot" />
                {w.finance.expenses}
                <b>20%</b>
              </p>
            </div>
          </div>
          <div className="dash-lower">
            <div>
              <div className="card-title">
                <b>{d.recentActivity}</b>
                <small>•••</small>
              </div>
              {[
                ['K', 'Kopi Arabika 1kg', '12', '+8%'],
                ['O', 'Oat Latte', '31', '+14%'],
                ['T', 'Teh Melati Premium', '24', '+5%'],
              ].map(([l, n, s, g]) => (
                <p key={n}>
                  <i className="product blue-bg">{l}</i>
                  <span>
                    <b>{n}</b>
                    <small>
                      {s} {w.solutions.inventory.unit}
                    </small>
                  </span>
                  <strong>{g}</strong>
                </p>
              ))}
            </div>
            <div>
              <div className="card-title">
                <b>{lowStockTitle}</b>
                <small>•••</small>
              </div>
              <p>
                <i className="product purple-bg">S</i>
                <span>
                  <b>Susu Oat Barista</b>
                  <small>{almostOut}, min 30</small>
                </span>
                <strong className="stock-warn">12 unit</strong>
              </p>
              <p>
                <i className="product orange-bg">R</i>
                <span>
                  <b>Roti Sourdough</b>
                  <small>{almostOut}, min 20</small>
                </span>
                <strong className="stock-warn">8 unit</strong>
              </p>
              <p>
                <i className="product cyan-bg">M</i>
                <span>
                  <b>Sirup Gula Aren</b>
                  <small>{almostOut}, min 25</small>
                </span>
                <strong className="stock-warn">15 unit</strong>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function PosPreview({ w }: { w: W }) {
  const en = String((w as any).mobileSection?.kicker ?? '').startsWith('FLEX');
  const products = en
    ? [['D', 'Chicken Dimsum', 'Rp 28,000', '84'], ['T', 'Iced Tea', 'Rp 12,000', '120'], ['K', 'Arabica Coffee', 'Rp 24,000', '42'], ['R', 'Sourdough Bread', 'Rp 32,000', '18'], ['L', 'Citrus Latte', 'Rp 26,000', '36'], ['N', 'Nasi Goreng', 'Rp 30,000', '9']]
    : [['D', 'Dimsum Ayam', 'Rp 28.000', '84'], ['T', 'Es Teh', 'Rp 12.000', '120'], ['K', 'Kopi Arabika', 'Rp 24.000', '42'], ['R', 'Roti Sourdough', 'Rp 32.000', '18'], ['L', 'Latte Citrus', 'Rp 26.000', '36'], ['N', 'Nasi Goreng', 'Rp 30.000', '9']];
  return (
    <div className="pos-preview" aria-hidden="true">
      <div className="pos-head">
        <ThemeImage
          lightSrc="/brand-mark-144.webp"
          alt=""
          className="brand-logo-img pos-mark"
          width={144}
          height={157}
          loading="lazy"
        />
        <span className="pos-branch">{en ? 'Central Store⌄' : 'Toko Pusat⌄'}</span>
        <span className="pos-head-status"><Wifi size={11} /> Online</span>
        <span className="pos-shift-status">{en ? 'Shift active' : 'Shift aktif'}</span>
        <i className="pos-avatar">A</i>
      </div>
      <div className="pos-body">
        <div className="pos-products">
          <div className="pos-tabs">
            <b>{en ? 'All products' : 'Semua produk'}</b>
            <span>{en ? 'Drinks' : 'Minuman'}</span>
            <span>{en ? 'Food' : 'Makanan'}</span>
          </div>
          <div className="pos-search-row">
            <div className="search"><Search size={14} aria-hidden="true" /><span>{en ? 'Barcode, SKU, or product name...' : 'Barcode, SKU, atau nama produk...'}</span></div>
            <span className="pos-scan"><ScanLine size={13} /> Scan</span>
          </div>
          <p className="pos-barcode-ready"><i /> {en ? 'Ready to search or scan a barcode' : 'Siap mencari produk atau memindai barcode'}</p>
          <div className="pos-preview-grid">
            {products.map(([letter, name, price, stock], index) => (
              <div className={`pos-preview-product${index === 0 ? ' selected' : ''}`} key={name}>
                <i className={`product-image ${['blue-bg', 'cyan-bg', 'purple-bg', 'orange-bg'][index % 4]}`}>{letter}</i>
                <b>{name}</b>
                <small>{price}</small>
                <em className={Number(stock) < 12 ? 'low' : ''}>{en ? `Stock: ${stock}` : `Stok: ${stock}`}</em>
              </div>
            ))}
          </div>
        </div>
        <div className="cart">
          <div className="pos-cart-title">
            <b><ShoppingCart size={14} /> {en ? 'Cart' : 'Keranjang'} (3)</b>
            <small>#2481</small>
          </div>
          <p className="pos-cart-line">
            <i className="product blue-bg">K</i>
            <span>
              <b>{en ? 'Arabica Coffee' : 'Kopi Arabika'}</b>
              <small>1 × Rp {en ? '24,000' : '24.000'}</small>
            </span>
            <strong>Rp {en ? '24,000' : '24.000'}</strong>
            <span className="pos-qty"><Minus size={10} /> 1 <Plus size={10} /></span>
          </p>
          <p className="pos-cart-line">
            <i className="product cyan-bg">T</i>
            <span>
              <b>{en ? 'Iced Tea' : 'Es Teh'}</b>
              <small>2 × Rp {en ? '12,000' : '12.000'}</small>
            </span>
            <strong>Rp {en ? '24,000' : '24.000'}</strong>
            <span className="pos-qty"><Minus size={10} /> 2 <Plus size={10} /></span>
          </p>
          <div className="pos-cart-customer">+ {en ? 'Add customer (optional)' : 'Pilih pelanggan (opsional)'}</div>
          <div className="cart-total">
            <span>Subtotal</span>
            <b>Rp {en ? '48,000' : '48.000'}</b>
          </div>
          <div className="pos-total-row"><span>Total</span><b>Rp {en ? '48,000' : '48.000'}</b></div>
          <div className="pos-pay-btn">{en ? 'Pay now' : 'Bayar sekarang'} <span>→</span></div>
        </div>
      </div>
    </div>
  );
}

export function InventoryPreview({ w }: { w: W }) {
  const inv = w.solutions.inventory;
  const d = w.demoLabels;
  return (
    <div className="inventory">
      <div className="inventory-heading">
        <div>
          <small>{w.features.items[1].title}</small>
          <h3>{inv.heading}</h3>
        </div>
        <button>{inv.addProduct}</button>
      </div>
      <div className="inventory-tools">
        <span>
          <Search size={14} aria-hidden="true" /> {inv.searchPlaceholder}
        </span>
        <button>{inv.allCategories}⌄</button>
        <button>{inv.filter} ▾</button>
      </div>
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              {inv.tableHeaders.map((h) => (
                <th key={h}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[
              [
                'K',
                'Kopi Arabika 1kg',
                'Biji Kopi',
                '120',
                '50',
                d.stockSafe,
                'good',
              ],
              [
                'S',
                'Susu Oat Barista',
                'Susu & Creamer',
                '24',
                '30',
                d.almostOut,
                'warn',
              ],
              [
                'T',
                'Teh Melati Premium',
                'Teh',
                '86',
                '25',
                d.stockSafe,
                'good',
              ],
            ].map(([letter, name, category, stock, min, status, kind]) => (
              <tr key={name}>
                <td>
                  <i
                    className={`product table-product ${letter === 'S' ? 'cyan-bg' : letter === 'T' ? 'purple-bg' : 'blue-bg'}`}
                  >
                    {letter}
                  </i>
                  <b>{name}</b>
                </td>
                <td>{category}</td>
                <td>
                  <strong>{stock}</strong> {inv.unit}
                </td>
                <td>
                  {min} {inv.unit}
                </td>
                <td>
                  <span className={`status ${kind}`}>{status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function Metric({
  icon,
  name,
  value,
  change,
}: {
  icon: React.ReactNode;
  name: string;
  value: string;
  change: string;
}) {
  return (
    <div className="metric">
      <span className="feature-icon" aria-hidden="true">
        {icon}
      </span>
      <small>{name}</small>
      <b>{value}</b>
      <em>{change}</em>
    </div>
  );
}
