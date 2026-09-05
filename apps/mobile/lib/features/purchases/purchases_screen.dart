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

/// Purchase orders — GET /purchases, POST /purchases, POST /purchases/:id/receive.
class PurchasesScreen extends StatefulWidget {
  const PurchasesScreen({super.key});

  @override
  State<PurchasesScreen> createState() => _PurchasesScreenState();
}

class _PurchasesScreenState extends State<PurchasesScreen> {
  int _generation = 0;

  @override
  Widget build(BuildContext context) {
    final s = l(context);
    final api = context.read<ApiClient>();
    final app = context.watch<AppController>();
    final canCreate =
        app.ctx?.can('purchase.create') ?? false;
    final canReceive =
        app.ctx?.can('purchase.receive') ?? false;

    return Scaffold(
      appBar: AppBar(title: Text(s.purchasesTitle)),
      floatingActionButton: canCreate
          ? FloatingActionButton.extended(
              backgroundColor: Theme.of(context).colorScheme.primary,
              onPressed: () => _createPurchase(context),
              icon: const Icon(Icons.add_rounded),
              label: Text(s.add))
          : null,
      body: AsyncGate<List<dynamic>>(
        key: ValueKey(_generation),
        future: () => api.get('/purchases'),
        builder: (context, rows) => rows.isEmpty
            ? EmptyCentered(message: l(context).emptyGeneric)
            : RefreshIndicator(
                onRefresh: () async {},
                child: ListView.builder(
                  padding: const EdgeInsets.fromLTRB(14, 10, 14, 24),
                  itemCount: rows.length.clamp(0, 100),
                  itemBuilder: (context, i) {
                    final p = rows[i] as Map;
                    final status = p['status']?.toString() ?? '';
                    return ListTile(
                      contentPadding: EdgeInsets.zero,
                      dense: true,
                      leading: Icon(
                        status == 'RECEIVED'
                            ? Icons.check_circle_rounded
                            : Icons.schedule_rounded,
                        size: 20,
                        color: status == 'RECEIVED'
                            ? NgColors.success
                            : NgColors.warning,
                      ),
                      title: Text(p['supplier'] is Map
                          ? (p['supplier'] as Map)['name']?.toString() ?? ''
                          : p['reference']?.toString() ?? '',
                          style: const TextStyle(
                              fontSize: 12.5, fontWeight: FontWeight.w700)),
                      subtitle:
                          Text(Fmt.dateTime(Fmt.parseDate(p['purchase_date'] ?? p['created_at'])),
                              style: TextStyle(
                                  fontSize: 10.5,
                                  color: Theme.of(context).hintColor)),
                      trailing: Row(mainAxisSize: MainAxisSize.min, children: [
                        Text(status, style: TextStyle(fontSize: 10.5, color: Theme.of(context).hintColor)),
                        const SizedBox(width: 8),
                        Text(Fmt.rp(Fmt.numOrZero(p['total'])),
                            style: TextStyle(
                                fontSize: 12,
                                fontWeight: FontWeight.w800,
                                color: Theme.of(context).colorScheme.primary)),
                        if (canReceive && status != 'RECEIVED')
                          IconButton(
                            visualDensity: VisualDensity.compact,
                            icon: const Icon(Icons.download_done_rounded, size: 20),
                            onPressed: () => _receive(context, p['id'].toString()),
                          ),
                      ]),
                    );
                  },
                ),
              ),
      ),
    );
  }

  Future<void> _receive(BuildContext context, String id) async {
    final confirmed = await confirmDialog(
      context,
      title: l(context).receiveGoods,
      confirmLabel: l(context).confirmShort,
      cancelLabel: l(context).cancelShort,
    );
    if (!confirmed || !context.mounted) return;
    try {
      await context.read<ApiClient>().post('/purchases/$id/receive', body: {
        'idempotencyKey': 'recv-$id-${DateTime.now().millisecondsSinceEpoch}',
        'items': [], // server receives all pending lines when omitted
      });
      if (!context.mounted) return;
      Snack.success(context, l(context).saved);
      setState(() => _generation++);
    } on Failure catch (f) {
      if (!context.mounted) return;
      Snack.error(context, localizedFailure(context, f));
    }
  }

  Future<void> _createPurchase(BuildContext context) async {
    final s = l(context);
    final api = context.read<ApiClient>();
    final suppliers = await api.get('/suppliers') as List<dynamic>;
    final products = await api
        .get('/products', query: {'limit': '100'}) as List<dynamic>;

    if (!context.mounted) return;
    if (suppliers.isEmpty || products.isEmpty) {
      Snack.error(context, s.emptyGeneric);
      return;
    }
    String? supplierId = suppliers.first['id'].toString();
    String? productId = products.first['id'].toString();
    final qty = TextEditingController(text: '1');
    final cost = TextEditingController();

    final ok = await showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      builder: (ctx) => Padding(
        padding:
            EdgeInsets.only(bottom: MediaQuery.viewInsetsOf(ctx).bottom + 18),
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 18),
          child: Column(mainAxisSize: MainAxisSize.min, children: [
            DropdownButtonFormField<String>(
              value: supplierId,
              isExpanded: true,
              decoration: InputDecoration(labelText: l(ctx).suppliersTitle),
              items: [
                for (final sup in suppliers)
                  DropdownMenuItem(
                      value: sup['id'].toString(),
                      child: Text(sup['name'].toString(),
                          overflow: TextOverflow.ellipsis))
              ],
              onChanged: (v) => supplierId = v,
            ),
            const SizedBox(height: 10),
            DropdownButtonFormField<String>(
              value: productId,
              isExpanded: true,
              decoration: InputDecoration(labelText: l(ctx).productName),
              items: [
                for (final p in products)
                  DropdownMenuItem(
                      value: p['id'].toString(),
                      child: Text(p['name'].toString(),
                          overflow: TextOverflow.ellipsis))
              ],
              onChanged: (v) => productId = v,
            ),
            const SizedBox(height: 10),
            Row(children: [
              Expanded(
                  child: TextField(controller: qty,
                      keyboardType: TextInputType.number,
                      decoration: InputDecoration(labelText: l(ctx).quantityLabel))),
              const SizedBox(width: 10),
              Expanded(
                  child: TextField(controller: cost,
                      keyboardType: TextInputType.number,
                      decoration: InputDecoration(labelText: '${l(ctx).costPrice} (Rp)'))),
            ]),
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

    final quantity = double.tryParse(qty.text) ?? 0;
    final unitCost = double.tryParse(cost.text.replaceAll(',', '')) ?? 0;
    if (ok != true ||
        !context.mounted ||
        supplierId == null ||
        productId == null ||
        quantity <= 0) {
      return;
    }
    try {
      await context.read<ApiClient>().post('/purchases', body: {
        'supplierId': supplierId,
        'items': [
          {'productId': productId, 'quantity': quantity, 'unitCost': unitCost}
        ],
        'purchaseDate': Fmt.isoDay(DateTime.now()),
      });
      if (!context.mounted) return;
      Snack.success(context, l(context).saved);
      setState(() => _generation++);
    } on Failure catch (f) {
      if (!context.mounted) return;
      Snack.error(context, localizedFailure(context, f));
    }
  }
}
