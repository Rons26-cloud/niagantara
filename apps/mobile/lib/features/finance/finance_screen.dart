import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../app/localization.dart';
import '../../core/api/api_client.dart';
import '../../core/auth/app_controller.dart';
import '../../core/errors/failure.dart';
import '../../core/utils/formatters.dart';
import '../../shared/components/async_gate.dart';
import '../../shared/components/failure_message.dart';
import '../../shared/components/snack.dart';
import '../../shared/constants/design.dart';

/// Finance hub — payables, receivables and the period report.
///   GET  /finance/payables            (payable.read)
///   POST /finance/payables/:id/payments {amount,paymentMethod,idempotencyKey}
///   GET  /finance/receivables         (receivable.read)
///   POST /finance/receivables/:id/payments
class FinanceScreen extends StatefulWidget {
  const FinanceScreen({super.key});

  @override
  State<FinanceScreen> createState() => _FinanceScreenState();
}

class _FinanceScreenState extends State<FinanceScreen>
    with SingleTickerProviderStateMixin {
  late final TabController _tabs = TabController(length: 3, vsync: this);

  @override
  void dispose() {
    _tabs.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final s = l(context);
    return Scaffold(
      appBar: AppBar(
        title: Text(s.financeTitle),
        bottom: TabBar(controller: _tabs, tabs: [
          Tab(text: s.tabPayables),
          Tab(text: s.tabReceivables),
          Tab(text: s.tabReport),
        ]),
      ),
      body: TabBarView(controller: _tabs, children: const [
        _PartyTab(kind: _Kind.payable),
        _PartyTab(kind: _Kind.receivable),
        _ReportTab(),
      ]),
    );
  }
}

enum _Kind { payable, receivable }

class _PartyTab extends StatelessWidget {
  const _PartyTab({required this.kind});

  final _Kind kind;

  @override
  Widget build(BuildContext context) {
    final api = context.read<ApiClient>();
    final app = context.watch<AppController>();
    final canManage =
        kind == _Kind.payable
            ? app.ctx?.can('payable.manage') ?? false
            : app.ctx?.can('receivable.manage') ?? false;
    final path = kind == _Kind.payable ? 'payables' : 'receivables';

    return AsyncGate<List<dynamic>>(
      future: () => api.get('/finance/$path'),
      builder: (context, rows) {
        if (rows.isEmpty) return EmptyCentered(message: l(context).emptyGeneric);
        return RefreshIndicator(
          onRefresh: () async {},
          child: ListView.builder(
            padding: const EdgeInsets.fromLTRB(14, 10, 14, 24),
            itemCount: rows.length.clamp(0, 100),
            itemBuilder: (context, i) {
              final row = rows[i] as Map;
              final remaining = Fmt.numOrZero(row['remaining_amount']);
              final settled = remaining <= 0;
              return ListTile(
                contentPadding: EdgeInsets.zero,
                dense: true,
                leading: Icon(
                  kind == _Kind.payable
                      ? Icons.arrow_outward_rounded
                      : Icons.arrow_circle_down_rounded,
                  size: 20,
                  color: settled ? NgColors.success : NgColors.warning,
                ),
                title: Text(row[kind == _Kind.payable ? 'supplier_name' : 'customer_name']
                        ?.toString() ??
                    row['reference']?.toString() ??
                    '',
                    style: const TextStyle(
                        fontSize: 12.5, fontWeight: FontWeight.w700)),
                subtitle: Text(Fmt.dateTime(Fmt.parseDate(row['due_date'] ?? row['created_at'])),
                    style: TextStyle(
                        fontSize: 10.5, color: Theme.of(context).hintColor)),
                trailing: Row(mainAxisSize: MainAxisSize.min, children: [
                  Column(crossAxisAlignment: CrossAxisAlignment.end,
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Text(Fmt.rp(remaining),
                            style: TextStyle(
                                fontSize: 12,
                                fontWeight: FontWeight.w800,
                                color: Theme.of(context).colorScheme.primary)),
                        Text(settled ? l(context).statusSettled : l(context).statusOpen,
                            style: TextStyle(
                                fontSize: 9.5,
                                color: settled
                                    ? NgColors.success
                                    : Theme.of(context).hintColor)),
                      ]),
                  if (!settled && canManage)
                    IconButton(
                      visualDensity: VisualDensity.compact,
                      icon: const Icon(Icons.payment_rounded, size: 20),
                      onPressed: () => _pay(context, path, row['id'].toString(), remaining),
                    ),
                ]),
              );
            },
          ),
        );
      },
    );
  }

  Future<void> _pay(
      BuildContext context, String path, String id, num remaining) async {
    final amount = TextEditingController(text: remaining.toStringAsFixed(0));
    final ok = await showModalBottomSheet<bool>(
      context: context,
      builder: (ctx) => Padding(
        padding:
            EdgeInsets.only(bottom: MediaQuery.viewInsetsOf(ctx).bottom + 18),
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 18),
          child: Column(mainAxisSize: MainAxisSize.min, children: [
            TextField(controller: amount,
                keyboardType: TextInputType.number,
                decoration: InputDecoration(labelText: '${l(ctx).amountReceived} (Rp)')),
            const SizedBox(height: 16),
            SizedBox(
              width: double.infinity,
              child: FilledButton(
                  onPressed: () => Navigator.pop(ctx, true),
                  child: Text(l(ctx).confirmShort)),
            ),
          ]),
        ),
      ),
    );
    if (ok != true || !context.mounted) return;
    try {
      await context.read<ApiClient>().post('/finance/$path/$id/payments', body: {
        'amount': double.tryParse(amount.text.replaceAll(',', '')) ?? 0,
        'paymentMethod': 'CASH',
        'idempotencyKey':
            '$path-$id-${DateTime.now().microsecondsSinceEpoch.toRadixString(36)}',
      });
      if (!context.mounted) return;
      Snack.success(context, l(context).saved);
    } on Failure catch (f) {
      if (!context.mounted) return;
      Snack.error(context, localizedFailure(context, f));
    }
  }
}

class _ReportTab extends StatelessWidget {
  const _ReportTab();

  @override
  Widget build(BuildContext context) {
    final api = context.read<ApiClient>();
    final now = DateTime.now();
    final from = DateTime(now.year, now.month, 1);
    return AsyncGate<Map<String, dynamic>>(
      future: () => api.get('/finance/reports', query: {
        'from': Fmt.isoDay(from),
        'to': Fmt.isoDay(now),
      }),
      builder: (context, r) {
        final revenue = Fmt.numOrZero(r['revenue']);
        final expenses = Fmt.numOrZero(r['expenses']);
        final purchases = Fmt.numOrZero(r['purchases']);
        final refunds = Fmt.numOrZero(r['refunds']);
        final cashReceived = Fmt.numOrZero(r['cashReceived']);
        final operating = Fmt.numOrZero(r['operatingCashResult']);

        return ListView(
          padding: const EdgeInsets.fromLTRB(16, 14, 16, 24),
          children: [
            Text('${Fmt.dayMonth(from)} – ${Fmt.dayMonth(now)}',
                style: TextStyle(
                    fontSize: 11.5, color: Theme.of(context).hintColor)),
            const SizedBox(height: 10),
            _row(l(context).revenue, Fmt.rp(revenue), NgColors.success),
            _row(l(context).cashReceivedLabel, Fmt.rp(cashReceived)),
            _row(l(context).expensesTitle, '− ${Fmt.rp(expenses)}', NgColors.danger),
            _row(l(context).purchasesTitle, '− ${Fmt.rp(purchases)}', NgColors.danger),
            if (refunds > 0)
              _row(l(context).refundsLabel, '− ${Fmt.rp(refunds)}', NgColors.danger),
            const Divider(height: 26),
            Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
              Text(l(context).operatingResult,
                  style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 13)),
              Text(Fmt.rp(operating),
                  style: TextStyle(
                      fontSize: 17,
                      fontWeight: FontWeight.w900,
                      color: operating >= 0 ? NgColors.success : NgColors.danger)),
            ]),
            const SizedBox(height: 8),
            Text(l(context).reportServerTruth,
                style: TextStyle(fontSize: 10.5, color: Theme.of(context).hintColor)),
          ],
        );
      },
    );
  }

  Widget _row(String label, String value, [Color? tone]) => Padding(
        padding: const EdgeInsets.only(bottom: 10),
        child: Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
          Text(label, style: const TextStyle(fontSize: 12.5)),
          Text(value,
              style: TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w800,
                  color: tone)),
        ]),
      );
}
