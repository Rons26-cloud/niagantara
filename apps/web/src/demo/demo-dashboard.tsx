import { useState } from 'react';
import { StatCard, Card, Badge, useTranslation } from '@niagantara/ui';
import { useDemoStore } from './demo-store';
import { navigate } from '../router';
import {
  TrendingUp,
  Plus,
  Package,
  BarChart3,
  ArrowUpRight,
  ArrowDownLeft,
  Users,
  UserRoundCheck,
} from 'lucide-react';

const BRANCH_FACTORS: Record<
  string,
  { sales: number; profit: number; trx: number }
> = {
  'branch-1': { sales: 1, profit: 1, trx: 1 },
  'branch-2': { sales: 0.42, profit: 0.38, trx: 0.45 },
  'branch-3': { sales: 0.27, profit: 0.24, trx: 0.3 },
};

export function DemoDashboard() {
  const { t, language } = useTranslation();
  const today = new Date().toISOString().slice(0, 10);
  const [from, setFrom] = useState(today);
  const [to, setTo] = useState(today);
  const [activeChartIndex, setActiveChartIndex] = useState<number | null>(null);
  const {
    dashboardMetrics,
    products,
    sales,
    stockMovements,
    branches,
    customers,
    employees,
    selectedBranch,
  } = useDemoStore();

  const factor = BRANCH_FACTORS[selectedBranch] ?? BRANCH_FACTORS['branch-1'];
  const branchName = branches.find((b) => b.id === selectedBranch)?.name ?? '';

  const lowStockProducts = products.filter((p) => p.stock <= p.minimumStock);
  const recentSales = sales.slice(0, 5);
  const recentMovements = stockMovements.slice(0, 5);

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(Math.round(amount));

  const baseWeek = [
    4200000, 5100000, 3800000, 6200000, 7500000, 8900000, 4850000,
  ];
  const week = language === 'en'
    ? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    : ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];
  const salesChartData = week.map((day, i) => ({
    day,
    value: Math.round(baseWeek[i] * factor.sales),
  }));
  const maxSales = Math.max(...salesChartData.map((d) => d.value));
  const chartWidth = 720;
  const chartHeight = 248;
  const chartPadding = { top: 18, right: 18, bottom: 34, left: 58 };
  const chartPlotWidth = chartWidth - chartPadding.left - chartPadding.right;
  const chartPlotHeight = chartHeight - chartPadding.top - chartPadding.bottom;
  const chartPoints = salesChartData.map((item, index) => ({
    ...item,
    x: chartPadding.left + (index / (salesChartData.length - 1)) * chartPlotWidth,
    y: chartPadding.top + chartPlotHeight - (item.value / maxSales) * chartPlotHeight,
  }));
  const chartLinePath = chartPoints.reduce((path, point, index) => {
    if (index === 0) return `M ${point.x} ${point.y}`;
    const previous = chartPoints[index - 1];
    const controlOffset = (point.x - previous.x) / 3;
    return `${path} C ${previous.x + controlOffset} ${previous.y}, ${point.x - controlOffset} ${point.y}, ${point.x} ${point.y}`;
  }, '');
  const chartAreaPath = `${chartLinePath} L ${chartPadding.left + chartPlotWidth} ${chartPadding.top + chartPlotHeight} L ${chartPadding.left} ${chartPadding.top + chartPlotHeight} Z`;
  const compactCurrency = (value: number) => {
    if (value >= 1_000_000) return `Rp${(value / 1_000_000).toLocaleString('id-ID', { maximumFractionDigits: 1 })} jt`;
    return `Rp${Math.round(value / 1_000).toLocaleString('id-ID')} rb`;
  };
  const fullCurrency = (value: number) => `Rp ${Math.round(value).toLocaleString('id-ID')}`;
  const activeChartPoint = activeChartIndex == null ? null : chartPoints[activeChartIndex];

  const categoryDistribution = [
    { category: language === 'en' ? 'Groceries' : 'Sembako', value: 45 },
    { category: language === 'en' ? 'Beverages' : 'Minuman', value: 25 },
    { category: 'Snack', value: 15 },
    { category: language === 'en' ? 'Personal Care' : 'Perawatan', value: 10 },
    { category: language === 'en' ? 'Electronics' : 'Elektronik', value: 5 },
  ];

  const topProducts = [...products]
    .sort(
      (a, b) =>
        b.sellingPrice * (b.minimumStock + 10) -
        a.sellingPrice * (a.minimumStock + 10),
    )
    .slice(0, 5)
    .map((product, i) => ({
      ...product,
      sold: (product.minimumStock + 7) * (5 - i) + 12,
    }));

  const quickActions: { icon: React.ReactNode; label: string; to: string }[] = [
    {
      icon: <TrendingUp size={18} />,
      label: t('demo.newSale'),
      to: '/demo/pos',
    },
    {
      icon: <Plus size={18} />,
      label: t('demo.addProduct'),
      to: '/demo/products',
    },
    {
      icon: <Package size={18} />,
      label: t('demo.checkStock'),
      to: '/demo/inventory',
    },
    {
      icon: <BarChart3 size={18} />,
      label: t('demo.viewReports'),
      to: '/demo/reports',
    },
  ];

  return (
    <div className="demo-dashboard">
      <div className="demo-owner-filterbar">
        <label>
          <span>{t('common.date')}</span>
          <input
            type="date"
            value={from}
            max={to}
            onChange={(event) => setFrom(event.target.value)}
          />
        </label>
        <span className="demo-owner-filter-arrow" aria-hidden="true">
          →
        </span>
        <label>
          <span>{t('common.date')}</span>
          <input
            type="date"
            value={to}
            min={from}
            onChange={(event) => setTo(event.target.value)}
          />
        </label>
        <span className="demo-owner-branch">
          {t('context.branch')}: <b>{branchName}</b>
        </span>
      </div>

      <div className="demo-metrics-grid">
        <StatCard
          label={t('dashboard.todaySales')}
          value={formatCurrency(dashboardMetrics.todaySales * factor.sales)}
          note={`↗ 12,8% · ${branchName}`}
          tone="success"
        />
        <StatCard
          label={t('dashboard.todayTransactions')}
          value={Math.round(dashboardMetrics.todayTransactions * factor.trx)}
          note={branchName}
        />
        <StatCard
          label={t('dashboard.lowStock')}
          value={lowStockProducts.length || dashboardMetrics.lowStockCount}
          note={t('dashboard.lowStockHint')}
          tone="warning"
        />
        <StatCard
          label={t('dashboard.averageTransaction')}
          value={formatCurrency(
            (dashboardMetrics.todaySales * factor.sales) /
              Math.max(
                1,
                Math.round(dashboardMetrics.todayTransactions * factor.trx),
              ),
          )}
          note="PAID"
        />
      </div>

      <div className="demo-owner-summary-grid">
        <Card title={t('website.demoLabels.totalProducts')}>
          <div className="demo-owner-summary-value">
            <Package size={20} aria-hidden="true" />
            <span><b>{products.length}</b><small>{language === 'en' ? 'registered products' : 'produk terdaftar'}</small></span>
          </div>
        </Card>
        <Card title={t('pages.customers')}>
          <div className="demo-owner-summary-value demo-owner-summary-value--green">
            <Users size={20} aria-hidden="true" />
            <span><b>{customers.length}</b><small>{language === 'en' ? 'registered customers' : 'pelanggan terdaftar'}</small></span>
          </div>
        </Card>
        <Card title={language === 'en' ? 'Active Staff' : 'Staff Aktif'}>
          <div className="demo-owner-summary-value demo-owner-summary-value--purple">
            <UserRoundCheck size={20} aria-hidden="true" />
            <span><b>{employees.filter((employee) => employee.status === 'ACTIVE').length}</b><small>{language === 'en' ? 'active employees' : 'karyawan aktif'}</small></span>
          </div>
        </Card>
      </div>

      <div className="demo-metrics-grid demo-finance-metrics">
        <StatCard
          label={language === 'en' ? 'Revenue' : 'Pendapatan'}
          value={formatCurrency(dashboardMetrics.todaySales * factor.sales)}
        />
        <StatCard
          label={t('pages.expenses')}
          value={formatCurrency(1825000 * factor.sales)}
        />
        <StatCard
          label={t('pages.payables')}
          value={formatCurrency(4750000 * factor.sales)}
          note="period purchases"
        />
        <StatCard
          label={language === 'en' ? 'Operating cash result' : 'Hasil kas operasional'}
          value={formatCurrency((dashboardMetrics.todaySales - 1825000) * factor.sales)}
          tone="success"
        />
      </div>

      <div className="demo-charts-grid">
        <Card title={t('demo.salesChart')}>
          <div className="demo-chart-container">
            <div className="demo-line-chart-wrap">
              <svg className="demo-line-chart" viewBox={`0 0 ${chartWidth} ${chartHeight}`} preserveAspectRatio="none" role="img" aria-label={t('demo.salesChart')}>
                <defs>
                  <linearGradient id="demo-revenue-area-fill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--accent-primary, #2563eb)" stopOpacity="0.16" />
                    <stop offset="100%" stopColor="var(--accent-primary, #2563eb)" stopOpacity="0.01" />
                  </linearGradient>
                </defs>
                {[0, 1, 2, 3].map((step) => {
                  const value = (maxSales * step) / 3;
                  const y = chartPadding.top + chartPlotHeight - (step / 3) * chartPlotHeight;
                  return <g key={step}><line className="demo-line-chart__grid" x1={chartPadding.left} x2={chartPadding.left + chartPlotWidth} y1={y} y2={y} /><text className="demo-line-chart__axis" x={chartPadding.left - 10} y={y + 4} textAnchor="end">{compactCurrency(value)}</text></g>;
                })}
                <path className="demo-line-chart__area" d={chartAreaPath} />
                <path className="demo-line-chart__line" d={chartLinePath} />
                {chartPoints.map((point, index) => <circle key={`${point.day}-${index}`} className={`demo-line-chart__point${activeChartIndex === index ? ' is-active' : ''}`} cx={point.x} cy={point.y} r={activeChartIndex === index ? 4.5 : 3} tabIndex={0} role="button" aria-label={`${point.day}: ${fullCurrency(point.value)}`} onMouseEnter={() => setActiveChartIndex(index)} onMouseLeave={() => setActiveChartIndex(null)} onFocus={() => setActiveChartIndex(index)} onBlur={() => setActiveChartIndex(null)} />)}
                {chartPoints.map((point) => <text key={`label-${point.day}`} className="demo-line-chart__label" x={point.x} y={chartHeight - 10} textAnchor="middle">{point.day}</text>)}
              </svg>
              {activeChartPoint && <div className="demo-line-chart__tooltip" style={{ left: `${(activeChartPoint.x / chartWidth) * 100}%` }} role="status"><b>{activeChartPoint.day}</b><span>{language === 'en' ? 'Revenue' : 'Pendapatan'}</span><strong>{fullCurrency(activeChartPoint.value)}</strong></div>}
            </div>
          </div>
        </Card>

        <Card title={t('demo.salesDistribution')}>
          <div className="demo-chart-container">
            <ul className="demo-dist-list">
              {categoryDistribution.map((item) => (
                <li key={item.category}>
                  <span>{item.category}</span>
                  <span className="demo-dist-track" aria-hidden="true">
                    <i
                      className="demo-dist-fill"
                      style={{ width: `${item.value}%` }}
                    />
                  </span>
                  <b>{item.value}%</b>
                </li>
              ))}
            </ul>
          </div>
        </Card>
      </div>

      <div className="demo-panels-grid">
        <Card title={t('dashboard.recentActivity')}>
          <ul className="demo-mini-list">
            {recentSales.map((sale) => (
              <li key={sale.id}>
                <span className="demo-rank" aria-hidden="true">
                  <ArrowUpRight size={14} />
                </span>
                <span className="demo-mini-main">
                  <b>{sale.invoice}</b>
                  <small>
                    {sale.customer} • {sale.cashier}
                  </small>
                </span>
                <Badge tone={sale.status === 'PAID' ? 'success' : 'warning'}>
                  {sale.status}
                </Badge>
                <span className="demo-mini-value">
                  {formatCurrency(sale.total)}
                </span>
              </li>
            ))}
            {recentMovements.slice(0, 2).map((mov) => (
              <li key={mov.id}>
                <span className="demo-rank" aria-hidden="true">
                  <ArrowDownLeft size={14} />
                </span>
                <span className="demo-mini-main">
                  <b>{mov.productName}</b>
                  <small>
                    {mov.type} • {mov.date}
                  </small>
                </span>
                <span
                  className={`demo-mini-value ${mov.quantity < 0 ? 'demo-negative' : 'demo-positive'}`}
                >
                  {mov.quantity > 0 ? '+' : ''}
                  {mov.quantity}
                </span>
              </li>
            ))}
          </ul>
        </Card>

        <Card title={t('dashboard.lowStock')}>
          <ul className="demo-mini-list demo-mini-list--stock">
            {(lowStockProducts.length ? lowStockProducts : products.slice(0, 4))
              .slice(0, 5)
              .map((product) => (
                <li key={product.id}>
                  <span className="demo-mini-main">
                    <b>{product.name}</b>
                    <small>
                      {product.stock} / min {product.minimumStock}{' '}
                      {product.unit}
                    </small>
                  </span>
                  <Badge
                    tone={
                      product.stock <= product.minimumStock
                        ? 'danger'
                        : 'success'
                    }
                  >
                    {product.stock <= product.minimumStock ? 'LOW' : 'OK'}
                  </Badge>
                </li>
              ))}
          </ul>
        </Card>

        <Card title={t('demo.topProducts')}>
          <ol className="demo-mini-list">
            {topProducts.map((product, index) => (
              <li key={product.id}>
                <span className="demo-product-rank demo-rank">
                  #{index + 1}
                </span>
                <span className="demo-mini-main">
                  <b>{product.name}</b>
                  <small>{product.category}</small>
                </span>
                <span className="demo-mini-value">{product.sold}×</span>
              </li>
            ))}
          </ol>
        </Card>

        <Card title={t('demo.quickActions')}>
          <div className="demo-quick-actions">
            {quickActions.map((action) => (
              <button
                key={action.to}
                className="demo-quick-action"
                onClick={() => navigate(action.to)}
              >
                <span aria-hidden="true">{action.icon}</span>
                <span>{action.label}</span>
              </button>
            ))}
          </div>
        </Card>

        <Card title={t('demo.googleSheetsStatus')}>
          <div className="demo-sheets-status">
            <span className="demo-sheets-indicator">
              ● {t('demo.sheetsConnected')}
            </span>
            <div className="demo-sheets-info">
              <span>
                {t('demo.lastSync')}:{' '}
                <b>{language === 'en' ? 'Today, 09:15' : 'Hari ini, 09:15'}</b>
              </span>
              <span>
                {t('demo.activeSheet')}: <b>Q3_Business_Report</b>
              </span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
