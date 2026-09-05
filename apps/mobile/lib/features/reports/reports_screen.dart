import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../app/localization.dart';
import '../../core/api/api_client.dart';
import '../../core/utils/formatters.dart';
import '../../shared/components/async_gate.dart';
import '../../shared/constants/design.dart';

/// Reports — mobile view over GET /finance/reports with quick periods.
/// File exports (PDF/XLSX) remain web-only; noted honestly below.
class ReportsScreen extends StatefulWidget {
  const ReportsScreen({super.key});

  @override
  State<ReportsScreen> createState() => _ReportsScreenState();
}

class _ReportsScreenState extends State<ReportsScreen> {
  int _days = 30;
  final int _generation = 0;

  @override
  Widget build(BuildContext context) {
    final s = l(context);
    final api = context.read<ApiClient>();
    final now = DateTime.now();
    final from = now.subtract(Duration(days: _days));

    return Scaffold(
      appBar: AppBar(title: Text(s.reportsTitle)),
      body: Column(
        key: ValueKey('$_generation-$_days'),
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(14, 10, 14, 0),
            child: Wrap(spacing: 8, children: [
              for (final d in const [7, 30, 90])
                ChoiceChip(
                  label: Text('$d ${s.daysSuffix}'),
                  selected: _days == d,
                  onSelected: (_) => setState(() => _days = d),
                ),
            ]),
          ),
          Expanded(
            child: AsyncGate<Map<String, dynamic>>(
              future: () async {
                final report = await api.get('/finance/reports', query: {
                  'from': Fmt.isoDay(from),
                  'to': Fmt.isoDay(now),
                });
                final sales = await api.get('/sales', query: {
                  'from': Fmt.isoDay(from),
                  'to': Fmt.isoDay(now),
                }) as List<dynamic>;
                final paidCount = sales
                    .where((x) =>
                        ['PAID', 'PARTIALLY_REFUNDED'].contains(x['status']))
                    .length;
                return {
                  ...report as Map<String, dynamic>,
                  'transactions': paidCount,
                };
              },
              builder: (context, r) => ListView(
                padding: const EdgeInsets.fromLTRB(16, 14, 16, 24),
                children: [
                  Text('${Fmt.dayMonth(from)} – ${Fmt.dayMonth(now)}',
                      style: TextStyle(
                          fontSize: 11.5, color: Theme.of(context).hintColor)),
                  const SizedBox(height: 10),
                  _card(l(context).todayTransactions,
                      '${Fmt.numOrZero(r['transactions'])}'.split('.').first),
                  _card(l(context).revenue, Fmt.rp(Fmt.numOrZero(r['revenue'])),
                      tone: NgColors.success),
                  _card(l(context).expensesTitle,
                      '− ${Fmt.rp(Fmt.numOrZero(r['expenses']))}',
                      tone: NgColors.danger),
                  _card(l(context).purchasesTitle,
                      '− ${Fmt.rp(Fmt.numOrZero(r['purchases']))}',
                      tone: NgColors.danger),
                  _card(l(context).operatingResult,
                      Fmt.rp(Fmt.numOrZero(r['operatingCashResult'])),
                      tone: Fmt.numOrZero(r['operatingCashResult']) >= 0
                          ? NgColors.success
                          : NgColors.danger),
                  const SizedBox(height: 6),
                  Text(s.reportExportWebOnly,
                      style: TextStyle(
                          fontSize: 10.5, color: Theme.of(context).hintColor)),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _card(String label, String value, {Color? tone}) => Container(
        margin: const EdgeInsets.only(bottom: 8),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
        decoration: BoxDecoration(
          color: Theme.of(context).cardColor,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: Theme.of(context).dividerColor),
        ),
        child: Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
          Text(label, style: const TextStyle(fontSize: 12.5)),
          Text(value,
              style: TextStyle(
                  fontSize: 13.5,
                  fontWeight: FontWeight.w900,
                  color: tone ?? Theme.of(context).textTheme.bodyLarge?.color)),
        ]),
      );
}
