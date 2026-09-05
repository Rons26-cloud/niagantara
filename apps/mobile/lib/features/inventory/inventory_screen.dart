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
import '../../shared/widgets/ng_cards.dart';

/// Inventory hub — three real tabs:
///   Stock    GET /inventory?branchId
///   Low      GET /inventory/low-stock
///   History  GET /inventory/movements
class InventoryScreen extends StatefulWidget {
  const InventoryScreen({super.key});

  @override
  State<InventoryScreen> createState() => _InventoryScreenState();
}

class _InventoryScreenState extends State<InventoryScreen>
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
    final canAdjust =
        context.watch<AppController>().ctx?.can('inventory.adjust') ?? false;

    return Scaffold(
      appBar: AppBar(
        title: Text(s.inventoryTitle),
        bottom: TabBar(
          controller: _tabs,
          tabs: [
            Tab(text: s.tabStock),
            Tab(text: s.tabLowStock),
            Tab(text: s.tabHistory),
          ],
        ),
      ),
      body: TabBarView(controller: _tabs, children: [
        _StockTab(canAdjust: canAdjust),
        _LowStockTab(),
        _MovementsTab(),
      ]),
    );
  }
}

class _StockTab extends StatelessWidget {
  const _StockTab({required this.canAdjust});

  final bool canAdjust;

  @override
  Widget build(BuildContext context) {
    final api = context.read<ApiClient>();
    final branchId = context.read<AppController>().activeBranch?.id;
    return AsyncGate<List<dynamic>>(
      future: () => api.get('/inventory',
          query: {if (branchId != null) 'branchId': branchId}),
      builder: (context, rows) => RefreshIndicator(
        onRefresh: () async {},
        child: ListView.builder(
          padding: const EdgeInsets.fromLTRB(14, 10, 14, 24),
          itemCount: rows.length,
          itemBuilder: (context, i) {
            final row = rows[i];
            final product = row['product'] as Map?;
            final qty = Fmt.numOrZero(row['quantity']);
            final min = Fmt.numOrZero(row['minimum_stock']);
            return ListTile(
              contentPadding: EdgeInsets.zero,
              title: Text(product?['name']?.toString() ?? '—',
                  style: const TextStyle(
                      fontSize: 13, fontWeight: FontWeight.w700)),
              subtitle: Text(
                  '${row['warehouse'] is Map ? (row['warehouse'] as Map)['name'] ?? '' : ''} · SKU ${product?['sku'] ?? '—'}',
                  style: TextStyle(
                      fontSize: 11, color: Theme.of(context).hintColor)),
              trailing: Row(mainAxisSize: MainAxisSize.min, children: [
                StatusChip(
                  label: '$qty',
                  color: qty <= min ? NgColors.warning : NgColors.success,
                ),
                if (canAdjust)
                  IconButton(
                    icon: const Icon(Icons.edit_note_rounded),
                    onPressed: () =>
                        _adjustDialog(context, row['id']?.toString() ?? '',
                            product?['name']?.toString() ?? ''),
                  ),
              ]),
            );
          },
        ),
      ),
    );
  }

  Future<void> _adjustDialog(
      BuildContext context, String _, String productName) async {
    final s = l(context);
    final delta = TextEditingController(text: '0');
    String type = 'STOCK_IN';
    final confirmed = await showModalBottomSheet<bool>(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setSheet) => SafeArea(
          child: Padding(
            padding: EdgeInsets.only(
                bottom: MediaQuery.viewInsetsOf(ctx).bottom + 18),
            child: Padding(
              padding: const EdgeInsets.all(18),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Text('${s.adjustStock} — $productName',
                      style: const TextStyle(fontWeight: FontWeight.w900)),
                  const SizedBox(height: 12),
                  SegmentedButton<String>(
                    segments: const [
                      ButtonSegment(value: 'STOCK_IN', label: Icon(Icons.add_rounded)),
                      ButtonSegment(value: 'STOCK_OUT', label: Icon(Icons.remove_rounded)),
                    ],
                    selected: {type},
                    onSelectionChanged: (v) => setSheet(() => type = v.first),
                  ),
                  const SizedBox(height: 12),
                  TextField(
                    controller: delta,
                    keyboardType: TextInputType.number,
                    decoration: InputDecoration(labelText: s.quantityLabel),
                  ),
                  const SizedBox(height: 14),
                  FilledButton(
                    onPressed: () => Navigator.pop(ctx, true),
                    child: Text(s.confirmShort),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
    if (confirmed != true) return;
    try {
      await context.read<ApiClient>().post('/inventory/adjust', body: {
        'productId': _,
        'quantityDelta': double.tryParse(delta.text) ?? 0,
        'movementType': type,
      });
      if (!context.mounted) return;
      Snack.success(context, l(context).saved);
    } on Failure catch (f) {
      if (!context.mounted) return;
      Snack.error(context, localizedFailure(context, f));
    }
  }
}

class _LowStockTab extends StatelessWidget {
  const _LowStockTab();

  @override
  Widget build(BuildContext context) {
    final api = context.read<ApiClient>();
    return AsyncGate<List<dynamic>>(
      future: () => api.get('/inventory/low-stock'),
      builder: (context, rows) => rows.isEmpty
          ? EmptyCentered(message: l(context).emptyGeneric)
          : RefreshIndicator(
              onRefresh: () async {},
              child: ListView.builder(
                padding: const EdgeInsets.fromLTRB(14, 10, 14, 24),
                itemCount: rows.length,
                itemBuilder: (context, i) {
                  final row = rows[i];
                  final product = row['product'] as Map?;
                  return ListTile(
                    contentPadding: EdgeInsets.zero,
                    leading: Icon(Icons.warning_amber_rounded,
                        color: Fmt.numOrZero(row['quantity']) <= 0
                            ? NgColors.danger
                            : NgColors.warning),
                    title: Text(product?['name']?.toString() ?? '—',
                        style: const TextStyle(
                            fontSize: 13, fontWeight: FontWeight.w700)),
                    subtitle: Text('SKU ${product?['sku'] ?? ''}',
                        style: TextStyle(
                            fontSize: 11,
                            color: Theme.of(context).hintColor)),
                    trailing: Text(
                      '${Fmt.numOrZero(row['quantity'])} / ${Fmt.numOrZero(row['minimum_stock'])}',
                      style: const TextStyle(
                          fontWeight: FontWeight.w900, fontSize: 12.5),
                    ),
                  );
                },
              ),
            ),
    );
  }
}

class _MovementsTab extends StatelessWidget {
  const _MovementsTab();

  static const icons = {
    'SALE': Icons.point_of_sale_rounded,
    'PURCHASE': Icons.local_shipping_rounded,
    'STOCK_IN': Icons.add_box_rounded,
    'STOCK_OUT': Icons.indeterminate_check_box_rounded,
    'ADJUSTMENT': Icons.tune_rounded,
    'TRANSFER_IN': Icons.call_received_rounded,
    'TRANSFER_OUT': Icons.output_rounded,
    'RETURN': Icons.undo_rounded,
    'DAMAGED': Icons.report_problem_rounded,
  };

  @override
  Widget build(BuildContext context) {
    final api = context.read<ApiClient>();
    return AsyncGate<List<dynamic>>(
      future: () => api.get('/inventory/movements'),
      builder: (context, rows) => rows.isEmpty
          ? EmptyCentered(message: l(context).emptyGeneric)
          : ListView.builder(
              padding: const EdgeInsets.fromLTRB(14, 10, 14, 24),
              itemCount: rows.length.clamp(0, 100),
              itemBuilder: (context, i) {
                final m = rows[i] as Map;
                final type = m['movement_type']?.toString() ?? '';
                final qty = Fmt.numOrZero(m['quantity']);
                return ListTile(
                  contentPadding: EdgeInsets.zero,
                  dense: true,
                  leading: Icon(icons[type] ?? Icons.swap_vert_rounded,
                      size: 20, color: Theme.of(context).colorScheme.primary),
                  title: Text(type,
                      style: const TextStyle(
                          fontSize: 12.5, fontWeight: FontWeight.w700)),
                  subtitle: Text(Fmt.dateTime(Fmt.parseDate(m['created_at'])),
                      style: TextStyle(
                          fontSize: 10.5,
                          color: Theme.of(context).hintColor)),
                  trailing: Text(
                    '${qty > 0 ? '+' : ''}$qty',
                    style: TextStyle(
                        fontSize: 12.5,
                        fontWeight: FontWeight.w800,
                        color: qty >= 0 ? NgColors.success : NgColors.danger),
                  ),
                );
              },
            ),
    );
  }
}
