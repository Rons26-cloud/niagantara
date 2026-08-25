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

/// Google Sheets integration — status, OAuth connect, sync history and
/// recovery. Workbook/column management stays on web (complex schema UI).
class SheetsScreen extends StatefulWidget {
  const SheetsScreen({super.key});

  @override
  State<SheetsScreen> createState() => _SheetsScreenState();
}

class _SheetsScreenState extends State<SheetsScreen> {
  int _generation = 0;

  @override
  Widget build(BuildContext context) {
    final s = l(context);
    final api = context.read<ApiClient>();
    final canManage =
        context.watch<AppController>().ctx?.can('sheet.manage') ?? false;

    return Scaffold(
      appBar: AppBar(title: Text(s.sheetsTitle)),
      body: AsyncGate<Map<String, dynamic>>(
        key: ValueKey(_generation),
        future: () => api.get('/google-sheets'),
        builder: (context, status) {
          final connection = status['connection'] as Map?;
          final connected = connection?['status'] == 'connected';
          final email = connection?['google_email']?.toString();

          return RefreshIndicator(
            onRefresh: () async {},
            child: ListView(
              padding: const EdgeInsets.fromLTRB(16, 14, 16, 24),
              children: [
                Card(
                  child: Padding(
                    padding: const EdgeInsets.all(14),
                    child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                      Row(children: [
                        Icon(
                          connected
                              ? Icons.check_circle_rounded
                              : Icons.link_off_rounded,
                          size: 20,
                          color: connected ? NgColors.success : Theme.of(context).hintColor,
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            connected
                                ? s.connectedTo(email ?? '')
                                : s.notConnected,
                            style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 13),
                          ),
                        ),
                      ]),
                      if (!connected && canManage) ...[
                        const SizedBox(height: 12),
                        FilledButton.icon(
                          style:
                              FilledButton.styleFrom(backgroundColor: NgColors.blue),
                          onPressed: () => _connect(context),
                          icon: const Icon(Icons.open_in_new_rounded, size: 18),
                          label: Text(s.sheetsConnectNote),
                        ),
                      ],
                    ]),
                  ),
                ),
                if (canManage && connected) ...[
                  const SizedBox(height: 8),
                  OutlinedButton.icon(
                    onPressed: () => _rebuild(context),
                    icon: const Icon(Icons.build_circle_outlined, size: 18),
                    label: Text(l(context).sheetsRebuild),
                  ),
                ],
                SectionHeader(title: l(context).sheetsHistoryTitle),
                AsyncGate<List<dynamic>>(
                  future: () => api.get('/google-sheets/history'),
                  builder: (context, history) {
                    if (history.isEmpty) {
                      return EmptyCentered(message: s.emptyGeneric);
                    }
                    return Column(
                      children: [
                        for (final h in history.take(20))
                          ListTile(
                            contentPadding: EdgeInsets.zero,
                            dense: true,
                            leading: Icon(
                              Icons.sync_rounded,
                              size: 18,
                              color: Theme.of(context).colorScheme.primary,
                            ),
                            title: Text(h['definition'] is Map
                                ? ((h['definition'] as Map)['name'] ?? '').toString()
                                : 'Sync',
                                style: const TextStyle(fontSize: 12.5)),
                            subtitle: Text(Fmt.dateTime(Fmt.parseDate(h['created_at'])) +
                                (h['rows_synced'] != null
                                    ? ' · ${h['rows_synced']} rows'
                                    : ''),
                                style: TextStyle(
                                    fontSize: 10.5,
                                    color: Theme.of(context).hintColor)),
                            trailing: Text((h['status'] ?? '').toString().toUpperCase(),
                                style: TextStyle(
                                    fontSize: 10,
                                    fontWeight: FontWeight.w800,
                                    color: h['status'] == 'success'
                                        ? NgColors.success
                                        : NgColors.warning)),
                          ),
                      ],
                    );
                  },
                ),
                if (canManage)
                  AsyncGate<List<dynamic>>(
                    future: () => api.get('/google-sheets/recovery'),
                    builder: (context, recovery) {
                      final pending = recovery
                          .where((x) => x['status'] == 'failed' || x['status'] == 'pending')
                          .toList();
                      if (pending.isEmpty) return const SizedBox.shrink();
                      return Column(children: [
                        SectionHeader(title: l(context).sheetsRecoveryTitle),
                        for (final r in pending.take(5))
                          ListTile(
                            contentPadding: EdgeInsets.zero,
                            dense: true,
                            leading:
                                const Icon(Icons.error_outline_rounded,
                                    size: 18, color: NgColors.warning),
                            title: Text(r['reason']?.toString() ?? 'Failed',
                                style: const TextStyle(fontSize: 12)),
                            trailing: TextButton(
                              onPressed: () => _retry(context, r['id'].toString()),
                              child: Text(l(context).retry),
                            ),
                          ),
                      ]);
                    },
                  ),
              ],
            ),
          );
        },
      ),
    );
  }

  Future<void> _connect(BuildContext context) async {
    try {
      final res = await context.read<ApiClient>().post('/google-sheets/oauth/start',
          body: {'replace': false});
      // res carries {authUrl} — open externally; the callback lands server-side.
      final url = res is Map ? res['authUrl']?.toString() : null;
      if (!context.mounted) return;
      if (url == null || url.isEmpty) throw const Failure(FailureKind.server);
      Snack.info(context, l(context).backendGap);
    } on Failure catch (f) {
      if (!context.mounted) return;
      Snack.error(context, localizedFailure(context, f));
    }
  }

  Future<void> _rebuild(BuildContext context) async {
    try {
      await context.read<ApiClient>().post('/google-sheets/rebuild', body: {});
      if (!context.mounted) return;
      Snack.success(context, l(context).saved);
      setState(() => _generation++);
    } on Failure catch (f) {
      if (!context.mounted) return;
      Snack.error(context, localizedFailure(context, f));
    }
  }

  Future<void> _retry(BuildContext context, String id) async {
    try {
      await context.read<ApiClient>().post('/google-sheets/recovery/$id/retry',
          body: {});
      if (!context.mounted) return;
      setState(() => _generation++);
    } on Failure catch (f) {
      if (!context.mounted) return;
      Snack.error(context, localizedFailure(context, f));
    }
  }
}
