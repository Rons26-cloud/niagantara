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
} from 'lucide-react';

const BRANCH_FACTORS: Record<
  string,
  { sales: number; profit: number; trx: number }
> = {
  'branch-1': { sales: 1, profit: 1, trx: 1 },
  'branch-2': { sales: 0.42, profit: 0.38, trx: 0.45 },
  'branch-3': { sales: 0.27, profit: 0.24, trx: 0.3 },
};

const WEEK = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'] as const;

export function DemoDashboard() {
  const { t } = useTranslation();
  const today = new Date().toISOString().slice(0, 10);
  const [from, setFrom] = useState(today);
  const [to, setTo] = useState(today);
  const {
    dashboardMetrics,
    products,
    sales,
    stockMovements,
    branches,
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
  const salesChartData = WEEK.map((day, i) => ({
    day,
    value: Math.round(baseWeek[i] * factor.sales),
  }));
  const maxSales = Math.max(...salesChartData.map((d) => d.value));

  const categoryDistribution = [
    { category: 'Sembako', value: 45 },
    { category: 'Minuman', value: 25 },
    { category: 'Snack', value: 15 },
    { category: 'Perawatan', value: 10 },
    { category: 'Elektronik', value: 5 },
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

      <div className="demo-metrics-grid demo-finance-metrics">
        <StatCard
          label={t('website.finance.revenue')}
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
          label={t('dashboard.todayProfit')}
          value={formatCurrency(dashboardMetrics.todayProfit * factor.profit)}
          tone="success"
        />
      </div>

      <div className="demo-charts-grid">
        <Card title={t('demo.salesChart')}>
          <div className="demo-chart-container">
            <div
              className="demo-bar-chart"
              role="img"
              aria-label={t('demo.salesChart')}
            >
              {salesChartData.map((item) => (
                <div key={item.day} className="demo-bar-group">
                  <div
                    className="demo-bar"
                    style={{ height: `${(item.value / maxSales) * 100}%` }}
                    title={formatCurrency(item.value)}
                  />
                  <span className="demo-bar-label">{item.day}</span>
                </div>
              ))}
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
                {t('demo.lastSync')}: <b>Hari ini, 09:15</b>
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
