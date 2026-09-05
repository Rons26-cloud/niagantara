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

/// Sale detail — GET /sales/:id with cancel (sale.cancel) and refunds
/// (sale.refund → POST /sales/:id/refunds).
class SalesDetailScreen extends StatelessWidget {
  const SalesDetailScreen({super.key, required this.saleId});

  final String saleId;

  @override
  Widget build(BuildContext context) {
    final api = context.read<ApiClient>();
    return Scaffold(
      appBar: AppBar(title: Text(l(context).salesDetailTitle)),
      body: AsyncGate<Map<String, dynamic>>(
        future: () => api.get('/sales/$saleId'),
        builder: (context, sale) => _Detail(sale: sale),
      ),
    );
  }
}

class _Detail extends StatelessWidget {
  const _Detail({required this.sale});

  final Map<String, dynamic> sale;

  @override
  Widget build(BuildContext context) {
    final s = l(context);
    final app = context.watch<AppController>();
    final items = sale['items'] as List<dynamic>? ?? [];
    final payment = sale['payment'] as Map?;
    final history = sale['history'] as List<dynamic>? ?? [];
    final status = sale['status']?.toString() ?? '';

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        Row(children: [
          Expanded(
            child: Text(sale['transaction_number']?.toString() ?? '',
                style:
                    const TextStyle(fontSize: 16, fontWeight: FontWeight.w900)),
          ),
          Text(Fmt.rp(Fmt.numOrZero(sale['grand_total'])),
              style: TextStyle(
                  fontSize: 17,
                  fontWeight: FontWeight.w900,
                  color: Theme.of(context).colorScheme.primary)),
        ]),
        const SizedBox(height: 4),
        Text(Fmt.dateTime(Fmt.parseDate(sale['completed_at'] ?? sale['created_at'])),
            style: TextStyle(
                fontSize: 11.5, color: Theme.of(context).hintColor)),
        const Divider(height: 24),
        for (final it in items)
          Padding(
            padding: const EdgeInsets.only(bottom: 10),
            child: Row(children: [
              Expanded(
                child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(it['product_name']?.toString() ?? '',
                          style: const TextStyle(
                              fontSize: 12.5, fontWeight: FontWeight.w700)),
                      Text(
                          '${Fmt.numOrZero(it['quantity'])} × ${Fmt.rp(Fmt.numOrZero(it['unit_price']))}',
                          style: TextStyle(
                              fontSize: 11,
                              color: Theme.of(context).hintColor)),
                    ]),
              ),
              Text(Fmt.rp(Fmt.numOrZero(it['line_total'])),
                  style:
                      const TextStyle(fontSize: 12.5, fontWeight: FontWeight.w800)),
            ]),
          ),
        if (payment != null)
          Card(
            child: ListTile(
              dense: true,
              leading: const Icon(Icons.payments_rounded),
              title: Text(payment['method']?.toString() ?? '',
                  style: const TextStyle(fontWeight: FontWeight.w800)),
              trailing: Text(Fmt.rp(Fmt.numOrZero(payment['amount']))),
            ),
          ),
        if (history.isNotEmpty && status != 'PAID')
          Padding(
            padding: const EdgeInsets.only(top: 8),
            child: Text('${s.statusLabel}: $status',
                style: const TextStyle(
                    color: NgColors.danger, fontWeight: FontWeight.w800)),
          ),
        const SizedBox(height: 18),
        if (status == 'PAID' && app.ctx?.can('sale.cancel') == true)
          OutlinedButton.icon(
            style: OutlinedButton.styleFrom(foregroundColor: NgColors.danger),
            onPressed: () => _cancel(context),
            icon: const Icon(Icons.block_rounded, size: 18),
            label: Text(s.cancelSale),
          ),
        if (status == 'PAID' && app.ctx?.can('sale.refund') == true)
          OutlinedButton.icon(
            style: OutlinedButton.styleFrom(foregroundColor: NgColors.warning),
            onPressed: () => _refund(context),
            icon: const Icon(Icons.undo_rounded, size: 18),
            label: Text(s.refundSale),
          ),
      ],
    );
  }

  Future<void> _cancel(BuildContext context) async {
    final s = l(context);
    final reason = TextEditingController();
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text(s.cancelSale),
        content: TextField(controller: reason,
            decoration: InputDecoration(labelText: s.reasonOptional)),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: Text(s.cancelShort)),
          FilledButton(
              style: FilledButton.styleFrom(backgroundColor: NgColors.danger),
              onPressed: () => Navigator.pop(ctx, true),
              child: Text(s.confirmShort)),
        ],
      ),
    );
    if (ok != true || !context.mounted) return;
    try {
      await context.read<ApiClient>().post('/sales/$saleId/cancel',
          body: {'reason': reason.text});
      if (!context.mounted) return;
      Snack.success(context, l(context).saved);
      Navigator.pop(context);
    } on Failure catch (f) {
      if (!context.mounted) return;
      Snack.error(context, localizedFailure(context, f));
    }
  }

  Future<void> _refund(BuildContext context) async {
    final s = l(context);
    final reason = TextEditingController();
    final items = (sale['items'] as List? ?? []);
    // Full-quantity refund of every line; partial refunds stay a web feature.
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text(s.refundSale),
        content: Column(mainAxisSize: MainAxisSize.min, children: [
          Text('${s.itemsCount(items.length)}',
              style: const TextStyle(fontSize: 13)),
          const SizedBox(height: 8),
          TextField(controller: reason,
              decoration: InputDecoration(labelText: s.reasonOptional)),
        ]),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: Text(s.cancelShort)),
          FilledButton(
              style: FilledButton.styleFrom(backgroundColor: NgColors.warning),
              onPressed: () => Navigator.pop(ctx, true),
              child: Text(s.confirmShort)),
        ],
      ),
    );
    if (ok != true || !context.mounted) return;
    try {
      await context.read<ApiClient>().post('/sales/$saleId/refunds', body: {
        'reason': reason.text,
        'items': [
          for (final it in items)
            {
              'saleItemId': it['id'],
              'quantity': Fmt.numOrZero(it['quantity']).toDouble(),
              'restock': true,
              'condition': 'SELLABLE',
            },
        ],
      });
      if (!context.mounted) return;
      Snack.success(context, l(context).saved);
      Navigator.pop(context);
    } on Failure catch (f) {
      if (!context.mounted) return;
      Snack.error(context, localizedFailure(context, f));
    }
  }
}
