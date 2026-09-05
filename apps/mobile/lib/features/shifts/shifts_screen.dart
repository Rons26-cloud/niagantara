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

class ShiftsScreen extends StatefulWidget {
  const ShiftsScreen({super.key});

  @override
  State<ShiftsScreen> createState() => _ShiftsScreenState();
}

class _ShiftsScreenState extends State<ShiftsScreen> {
  int _generation = 0;

  Future<void> _reload() async {
    setState(() => _generation++);
  }

  @override
  Widget build(BuildContext context) {
    final s = l(context);
    final api = context.read<ApiClient>();
    final app = context.watch<AppController>();
    final canOpen = app.ctx?.can('shift.open') ?? false;
    final canClose = app.ctx?.can('shift.close') ?? false;

    return Scaffold(
      appBar: AppBar(title: Text(s.shiftsTitle)),
      body: AsyncGate<List<dynamic>>(
        key: ValueKey(_generation),
        future: () => api.get('/shifts'),
        builder: (context, shifts) {
          final mine = shifts
              .where((x) =>
                  x['branch_id'] == app.activeBranch?.id &&
                  x['cashier_id'] == app.ctx?.userId)
              .toList();
          final openMine = mine.where((x) => x['status'] == 'OPEN').toList();

          return RefreshIndicator(
            onRefresh: _reload,
            child: ListView(
              padding: const EdgeInsets.fromLTRB(14, 12, 14, 24),
              children: [
                if (openMine.isEmpty && canOpen)
                  FilledButton.icon(
                    style:
                        FilledButton.styleFrom(backgroundColor: NgColors.blue),
                    onPressed: () => _openShift(context),
                    icon: const Icon(Icons.play_circle_fill_rounded),
                    label: Text(s.shiftOpen),
                  )
                else if (openMine.isNotEmpty && canClose)
                  OutlinedButton.icon(
                    style: OutlinedButton.styleFrom(
                        foregroundColor: NgColors.danger),
                    onPressed: () => _closeShift(context, openMine.first['id'].toString()),
                    icon: const Icon(Icons.stop_circle_rounded),
                    label: Text(s.shiftClose),
                  ),
                const SizedBox(height: 10),
                for (final shift in mine.take(20)) _shiftTile(context, shift),
              ],
            ),
          );
        },
      ),
    );
  }

  Widget _shiftTile(BuildContext context, dynamic shift) {
    final s = l(context);
    final open = shift['status'] == 'OPEN';
    return ListTile(
      contentPadding: EdgeInsets.zero,
      dense: true,
      leading: Icon(
        open ? Icons.circle : Icons.check_circle_outline_rounded,
        size: 16,
        color: open ? NgColors.success : Theme.of(context).hintColor,
      ),
      title: Text(
        Fmt.dateTime(Fmt.parseDate(shift['opened_at'])),
        style: const TextStyle(fontSize: 12.5, fontWeight: FontWeight.w700),
      ),
      subtitle: open
          ? null
          : Text(Fmt.dateTime(Fmt.parseDate(shift['closed_at'])),
              style: TextStyle(
                  fontSize: 10.5, color: Theme.of(context).hintColor)),
      trailing: Column(
        crossAxisAlignment: CrossAxisAlignment.end,
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Text('${s.openingCash}: ${Fmt.rp(Fmt.numOrZero(shift['opening_cash']))}',
              style: const TextStyle(fontSize: 10)),
          if (shift['closing_cash'] != null)
            Text('${s.closingCash}: ${Fmt.rp(Fmt.numOrZero(shift['closing_cash']))}',
                style: const TextStyle(fontSize: 10)),
        ],
      ),
    );
  }

  Future<void> _openShift(BuildContext context) async {
    final s = l(context);
    final cash = TextEditingController(text: '0');
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text(s.shiftOpen),
        content: TextField(controller: cash,
            keyboardType: TextInputType.number,
            decoration: InputDecoration(labelText: s.openingCash)),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: Text(s.cancelShort)),
          FilledButton(onPressed: () => Navigator.pop(ctx, true), child: Text(s.confirmShort)),
        ],
      ),
    );
    if (ok != true || !context.mounted) return;
    try {
      await context.read<ApiClient>().post('/shifts/open', body: {
        'storeId': context.read<AppController>().activeStore?.id,
        'branchId': context.read<AppController>().activeBranch?.id,
        'openingCash': double.tryParse(cash.text.replaceAll(',', '')) ?? 0,
      });
      await _reload();
    } on Failure catch (f) {
      if (!context.mounted) return;
      Snack.error(context, localizedFailure(context, f));
    }
  }

  Future<void> _closeShift(BuildContext context, String id) async {
    final s = l(context);
    final cash = TextEditingController();
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text(s.shiftClose),
        content: TextField(controller: cash,
            keyboardType: TextInputType.number,
            decoration: InputDecoration(labelText: s.closingCash)),
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
      await context.read<ApiClient>().post('/shifts/$id/close',
          body: {'closingCash': double.tryParse(cash.text.replaceAll(',', '')) ?? 0});
      await _reload();
    } on Failure catch (f) {
      if (!context.mounted) return;
      Snack.error(context, localizedFailure(context, f));
    }
  }
}
