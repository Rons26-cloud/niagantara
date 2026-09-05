import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../app/localization.dart';
import '../../core/api/api_client.dart';
import '../../core/auth/app_controller.dart';
import '../../core/errors/failure.dart';
import '../../shared/components/async_gate.dart';
import '../../shared/components/failure_message.dart';
import '../../shared/components/snack.dart';
import '../../shared/constants/design.dart';
import '../../core/utils/formatters.dart';

/// Expense tracking — GET /expenses, GET /expenses/categories,
/// POST /expenses (ExpenseInput incl. idempotencyKey).
class ExpensesScreen extends StatefulWidget {
  const ExpensesScreen({super.key});

  @override
  State<ExpensesScreen> createState() => _ExpensesScreenState();
}

class _ExpensesScreenState extends State<ExpensesScreen> {
  final int _generation = 0;

  @override
  Widget build(BuildContext context) {
    final s = l(context);
    final api = context.read<ApiClient>();
    final canCreate =
        context.watch<AppController>().ctx?.can('expense.create') ?? false;

    return Scaffold(
      appBar: AppBar(title: Text(s.expensesTitle)),
      floatingActionButton: canCreate
          ? FloatingActionButton.extended(
              backgroundColor: Theme.of(context).colorScheme.primary,
              onPressed: () => showExpenseEntrySheet(context),
              icon: const Icon(Icons.add_rounded),
              label: Text(s.add))
          : null,
      body: AsyncGate<List<dynamic>>(
        key: ValueKey(_generation),
        future: () => api.get('/expenses'),
        builder: (context, rows) => rows.isEmpty
            ? EmptyCentered(message: l(context).emptyGeneric)
            : RefreshIndicator(
                onRefresh: () async {},
                child: ListView.builder(
                  padding: const EdgeInsets.fromLTRB(14, 10, 14, 24),
                  itemCount: rows.length.clamp(0, 100),
                  itemBuilder: (context, i) {
                    final e = rows[i] as Map;
                    return ListTile(
                      contentPadding: EdgeInsets.zero,
                      dense: true,
                      leading: Icon(Icons.receipt_rounded,
                          size: 20,
                          color: Theme.of(context).colorScheme.primary),
                      title: Text(e['description']?.toString() ?? '',
                          style: const TextStyle(
                              fontSize: 12.5, fontWeight: FontWeight.w700)),
                      subtitle: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                        Text(e['category'] is Map
                            ? (e['category'] as Map)['name']?.toString() ?? ''
                            : e['category_id']?.toString() ?? '',
                            style: TextStyle(
                                fontSize: 10.5,
                                color: Theme.of(context).hintColor)),
                        Text(Fmt.dateTime(Fmt.parseDate(e['expense_date'] ?? e['created_at'])),
                            style: TextStyle(
                                fontSize: 10,
                                color: Theme.of(context).hintColor)),
                      ]),
                      trailing: Text(
                        '− ${Fmt.rp(Fmt.numOrZero(e['amount']))}',
                        style: const TextStyle(
                            fontSize: 12.5,
                            fontWeight: FontWeight.w800,
                            color: NgColors.danger),
                      ),
                    );
                  },
                ),
              ),
      ),
    );
  }
}

/// Shared entry sheet — also used by the home quick-action FAB.
Future<void> showExpenseEntrySheet(BuildContext context) async {
  final s = l(context);
  final api = context.read<ApiClient>();
  final app = context.read<AppController>();
  final amount = TextEditingController();
  final description = TextEditingController();
  String? categoryId;
  List<dynamic> categories = [];

  try {
    categories = await api.get('/expenses/categories') as List<dynamic>;
  } on Failure {
    // fallthrough — creation requires a category, so empty list surfaces below.
  }

  if (!context.mounted) return;
  if (categories.isEmpty) {
    Snack.error(context, s.backendGap);
    return;
  }
  categoryId = categories.first['id'].toString();

  final ok = await showModalBottomSheet<bool>(
    context: context,
    isScrollControlled: true,
    builder: (ctx) => StatefulBuilder(
      builder: (ctx, setSheet) => Padding(
        padding:
            EdgeInsets.only(bottom: MediaQuery.viewInsetsOf(ctx).bottom + 18),
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 18),
          child: Column(mainAxisSize: MainAxisSize.min, children: [
            DropdownButtonFormField<String>(
              initialValue: categoryId,
              decoration: InputDecoration(labelText: s.categoryOptional),
              items: [
                for (final c in categories)
                  DropdownMenuItem(
                      value: c['id'].toString(),
                      child: Text(c['name'].toString()))
              ],
              onChanged: (v) => setSheet(() => categoryId = v),
            ),
            const SizedBox(height: 10),
            TextField(controller: amount,
                keyboardType:
                    const TextInputType.numberWithOptions(decimal: true),
                decoration:
                    InputDecoration(labelText: '${s.amountReceived} (Rp)')),
            const SizedBox(height: 10),
            TextField(controller: description,
                textCapitalization: TextCapitalization.sentences,
                decoration: InputDecoration(labelText: s.descriptionOptional)),
            const SizedBox(height: 16),
            SizedBox(
              width: double.infinity,
              child: FilledButton(
                  onPressed: () => Navigator.pop(ctx, true),
                  child: Text(s.confirmShort)),
            ),
          ]),
        ),
      ),
    ),
  );

  final value =
      double.tryParse(amount.text.replaceAll(',', '')) ?? 0;
  if (ok != true || !context.mounted || value <= 0 || categoryId == null) return;
  try {
    await api.post('/expenses', body: {
      'categoryId': categoryId,
      'amount': value,
      'expenseDate': Fmt.isoDay(DateTime.now()),
      'description': description.text.trim().isEmpty
          ? '-'
          : description.text.trim(),
      'paymentMethod': 'CASH',
      'idempotencyKey':
          'exp-${DateTime.now().microsecondsSinceEpoch.toRadixString(36)}-${value.round()}',
      if (app.activeBranch?.id != null) 'branchId': app.activeBranch!.id,
      if (app.activeStore?.id != null) 'storeId': app.activeStore!.id,
    });
    if (!context.mounted) return;
    Snack.success(context, s.saved);
  } on Failure catch (f) {
    if (!context.mounted) return;
    Snack.error(context, localizedFailure(context, f));
  }
}
