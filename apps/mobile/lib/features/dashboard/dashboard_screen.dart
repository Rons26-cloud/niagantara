import 'package:fl_chart/fl_chart.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../app/localization.dart';
import '../../core/api/api_client.dart';
import '../../core/auth/app_controller.dart';
import '../../core/utils/formatters.dart';
import '../../shared/components/async_gate.dart';
import '../../shared/constants/design.dart';
import '../../shared/widgets/ng_cards.dart';
import '../../shell/app_drawer.dart';

const Set<String> _countedStatuses = {'PAID', 'PARTIALLY_REFUNDED', 'REFUNDED'};

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key, this.embedded = true});

  final bool embedded;

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  int _generation = 0;

  Future<void> _reload() async {
    setState(() => _generation++);
  }

  @override
  Widget build(BuildContext context) {
    final app = context.watch<AppController>();
    final api = context.read<ApiClient>();

    return Scaffold(
      appBar: AppBar(
        leading: Builder(
          builder: (ctx) => IconButton(
            icon: const Icon(Icons.menu_rounded),
            onPressed: () => Scaffold.of(ctx).openDrawer(),
            tooltip: MaterialLocalizations.of(ctx).openAppDrawerTooltip,
          ),
        ),
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(app.activeCompanyName, style: const TextStyle(fontSize: 13)),
            if (app.activeBranch != null)
              Text(
                '${app.activeStore?.name ?? ''} · ${app.activeBranch!.name}',
                style: TextStyle(
                    fontSize: 10.5,
                    fontWeight: FontWeight.w600,
                    color: Theme.of(context).hintColor),
              ),
          ],
        ),
      ),
      drawer: widget.embedded ? const AppDrawer() : null,
      body: AsyncGate<Map<String, dynamic>>(
        key: ValueKey(_generation),
        future: () async {
          final now = DateTime.now();
          final day = Fmt.isoDay(now);
          final results = await Future.wait<dynamic>([
            api.get('/sales', query: {'from': day, 'to': day}),
            api.get('/inventory/low-stock'),
            api.get('/finance/reports'),
            api.get('/google-sheets').catchError((_) => <String, dynamic>{}),
          ]);
          return {
            'sales': results[0] as List<dynamic>? ?? [],
            'lowStock': results[1] as List<dynamic>? ?? [],
            'finance': results[2],
            'sheets': results[3],
          };
        },
        builder: (context, data) => RefreshIndicator(
          onRefresh: _reload,
          child: _DashboardBody(data: data),
        ),
      ),
    );
  }
}

class _DashboardBody extends StatelessWidget {
  const _DashboardBody({required this.data});

  final Map<String, dynamic> data;

  @override
  Widget build(BuildContext context) {
    final s = l(context);
    final app = context.watch<AppController>();
    final can = app.ctx?.can ?? (_) => false;
    final sales = data['sales'] as List<dynamic>;
    final lowStock = data['lowStock'] as List<dynamic>;
    final finance = data['finance'];
    final sheets = data['sheets'] as Map<String, dynamic>? ?? {};

    final paid = sales
        .where((x) => _countedStatuses.contains(x['status']))
        .toList(growable: false);
    final revenue = paid.fold<num>(
        0,
        (n, x) =>
            n +
            Fmt.numOrZero(x['grand_total']) -
            Fmt.numOrZero(x['refunded_total']));
    final itemsSold = paid.fold<num>(
        0,
        (n, x) => n + ((x['items'] as List?) ?? []).fold<num>(
            0, (m, it) => m + Fmt.numOrZero(it['quantity'])));
    final operating =
        finance is Map ? Fmt.numOrZero(finance['operatingCashResult']) : null;
    final connection = sheets['connection'] as Map?;
    final connected = connection?['status'] == 'connected';

    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 28),
      children: [
        Row(
          children: [
            Expanded(
                child: KpiCard(
                    label: s.todaySales,
                    value: Fmt.rp(revenue),
                    icon: Icons.trending_up_rounded)),
            const SizedBox(width: 10),
            Expanded(
                child: KpiCard(
                    label: s.todayTransactions,
                    value: '${paid.length}',
                    icon: Icons.receipt_long_rounded,
                    tone: NgColors.cyan)),
          ],
        ),
        const SizedBox(height: 10),
        Row(
          children: [
            Expanded(
                child: KpiCard(
                    label: s.productsSold,
                    value: '$itemsSold',
                    icon: Icons.shopping_bag_outlined,
                    tone: NgColors.success)),
            const SizedBox(width: 10),
            Expanded(
                child: KpiCard(
                    label: s.operatingResult,
                    value: operating != null ? Fmt.rp(operating) : '—',
                    icon: Icons.account_balance_wallet_outlined,
                    tone: (operating ?? 0) >= 0
                        ? NgColors.success
                        : NgColors.danger)),
          ],
        ),
        SectionHeader(title: s.salesTrend14d),
        _TrendCard(sales: sales),
        SectionHeader(title: s.quickActions),
        _QuickGrid(can: can),
        SectionHeader(
            title: s.lowStockItems,
            actionLabel: can('inventory.read') ? s.viewAll : null,
            onAction: () => Navigator.pushNamed(context, '/inventory')),
        if (lowStock.isEmpty)
          const EmptyCentered()
        else
          ...lowStock.take(4).map((row) => _LowStockTile(row: row)),
        SectionHeader(title: s.recentActivity),
        if (sales.isEmpty)
          const EmptyCentered()
        else
          ...sales.take(5).map((sale) => _RecentSaleTile(sale: sale)),
        SectionHeader(title: s.sheetsStatus),
        ListTile(
          contentPadding: EdgeInsets.zero,
          dense: true,
          onTap: can('sheet.read')
              ? () => Navigator.pushNamed(context, '/sheets')
              : null,
          leading: Icon(
            connected ? Icons.check_circle_rounded : Icons.link_off_rounded,
            color: connected ? NgColors.success : Theme.of(context).hintColor,
          ),
          title: Text(
            connected
                ? s.connectedTo((connection?['google_email'] ?? '').toString())
                : s.notConnected,
            style: const TextStyle(fontSize: 12.5, fontWeight: FontWeight.w700),
          ),
          trailing: const Icon(Icons.chevron_right_rounded, size: 18),
        ),
      ],
    );
  }
}

class _TrendCard extends StatelessWidget {
  const _TrendCard({required this.sales});

  final List<dynamic> sales;

  @override
  Widget build(BuildContext context) {
    final days = List.generate(14, (i) {
      final d = DateTime.now().subtract(Duration(days: 13 - i));
      final key = Fmt.isoDay(d);
      final total = sales
          .where((x) =>
              ['PAID', 'PARTIALLY_REFUNDED'].contains(x['status']) &&
              x['created_at'].toString().startsWith(key))
          .fold<num>(0, (n, x) => n + Fmt.numOrZero(x['grand_total']));
      return MapEntry(d, total.toDouble());
    });
    final maxV = days.map((e) => e.value).fold(1.0, (a, b) => b > a ? b : a);

    return Container(
      height: 150,
      padding: const EdgeInsets.fromLTRB(14, 14, 14, 8),
      decoration: BoxDecoration(
        color: Theme.of(context).cardColor,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: Theme.of(context).dividerColor),
      ),
      child: BarChart(
        BarChartData(
          maxY: maxV * 1.15,
          gridData: const FlGridData(show: false),
          borderData: FlBorderData(show: false),
          titlesData: const FlTitlesData(show: false),
          barTouchData: BarTouchData(
            touchTooltipData: BarTouchTooltipData(
              getTooltipItem: (_, __, bar, ___) => BarTooltipItem(
                Fmt.rp(bar.toY.round()),
                const TextStyle(fontWeight: FontWeight.w700),
              ),
            ),
          ),
          barGroups: [
            for (var i = 0; i < days.length; i++)
              BarChartGroupData(x: i, barRods: [
                BarChartRodData(
                  toY: days[i].value,
                  width: 9,
                  borderRadius: BorderRadius.circular(4),
                  color: Theme.of(context)
                      .colorScheme
                      .primary
                      .withValues(alpha: .85),
                )
              ]),
          ],
        ),
      ),
    );
  }
}

class _QuickGrid extends StatelessWidget {
  const _QuickGrid({required this.can});

  final bool Function(String) can;

  @override
  Widget build(BuildContext context) {
    final s = l(context);
    final tiles = [
      _QuickDef(Icons.point_of_sale_rounded, s.qaOpenPos, '/pos', can('pos.access')),
      _QuickDef(Icons.add_box_outlined, s.qaAddProduct, '/products/form', can('product.create')),
      _QuickDef(Icons.inventory_2_outlined, s.qaStockIn, '/inventory', can('inventory.adjust')),
      _QuickDef(Icons.swap_horiz_rounded, s.qaTransfer, '/transfers/new', can('inventory.transfer')),
      _QuickDef(Icons.money_off_csred_outlined, s.qaAddExpense, '/expenses', can('expense.create')),
    ];
    return GridView.count(
      crossAxisCount: 3,
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      mainAxisSpacing: 10,
      crossAxisSpacing: 10,
      childAspectRatio: 1.25,
      children: [
        for (final t in tiles)
          InkWell(
            borderRadius: BorderRadius.circular(14),
            onTap: t.enabled ? () => Navigator.pushNamed(context, t.route) : null,
            child: Container(
              decoration: BoxDecoration(
                color: Theme.of(context).cardColor,
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: Theme.of(context).dividerColor),
              ),
              padding: const EdgeInsets.all(8),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(t.icon,
                      size: 22,
                      color: t.enabled
                          ? Theme.of(context).colorScheme.primary
                          : Theme.of(context).hintColor),
                  const SizedBox(height: 6),
                  Text(t.label,
                      textAlign: TextAlign.center,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: TextStyle(
                          fontSize: 9.5,
                          fontWeight: FontWeight.w700,
                          color: t.enabled
                              ? Theme.of(context).textTheme.bodyMedium?.color
                              : Theme.of(context).hintColor)),
                ],
              ),
            ),
          ),
      ],
    );
  }
}

class _QuickDef {
  const _QuickDef(this.icon, this.label, this.route, this.enabled);

  final IconData icon;
  final String label;
  final String route;
  final bool enabled;
}

class _LowStockTile extends StatelessWidget {
  const _LowStockTile({required this.row});

  final dynamic row;

  @override
  Widget build(BuildContext context) {
    final product = row['product'] as Map?;
    final branch = row['branch'] as Map?;
    return ListTile(
      contentPadding: EdgeInsets.zero,
      dense: true,
      title: Text(product?['name']?.toString() ?? '—',
          style: const TextStyle(fontSize: 12.5, fontWeight: FontWeight.w700)),
      subtitle: Text(branch?['name']?.toString() ?? '',
          style: TextStyle(fontSize: 10.5, color: Theme.of(context).hintColor)),
      trailing: StatusChip(
        label:
            '${Fmt.numOrZero(row['quantity'])}/${Fmt.numOrZero(row['minimum_stock'])}',
        color:
            Fmt.numOrZero(row['quantity']) <= 0 ? NgColors.danger : NgColors.warning,
      ),
    );
  }
}

class _RecentSaleTile extends StatelessWidget {
  const _RecentSaleTile({required this.sale});

  final dynamic sale;

  @override
  Widget build(BuildContext context) {
    return ListTile(
      contentPadding: EdgeInsets.zero,
      dense: true,
      onTap: () =>
          Navigator.pushNamed(context, '/sales/detail', arguments: sale['id']),
      title: Text(sale['transaction_number']?.toString() ?? '—',
          style: const TextStyle(fontSize: 12.5, fontWeight: FontWeight.w700)),
      subtitle: Text(Fmt.dateTime(Fmt.parseDate(sale['created_at'])),
          style: TextStyle(fontSize: 10.5, color: Theme.of(context).hintColor)),
      trailing: Text(
        Fmt.rp(Fmt.numOrZero(sale['grand_total'])),
        style: TextStyle(
            fontSize: 12.5,
            fontWeight: FontWeight.w800,
            color: Theme.of(context).colorScheme.primary),
      ),
    );
  }
}
