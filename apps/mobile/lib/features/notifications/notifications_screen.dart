import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../app/localization.dart';
import '../../core/api/api_client.dart';
import '../../core/utils/formatters.dart';
import '../../shared/components/async_gate.dart';
import '../../shared/constants/design.dart';

class NotificationsScreen extends StatelessWidget {
  const NotificationsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final s = l(context);
    final api = context.read<ApiClient>();

    return Scaffold(
      appBar: AppBar(title: Text(s.notificationsTitle)),
      body: Column(
        children: [
          Material(
            color: Theme.of(context).colorScheme.primary.withValues(alpha: .08),
            child: ListTile(
              dense: true,
              leading: Icon(Icons.notifications_off_outlined,
                  size: 20, color: Theme.of(context).hintColor),
              title: Text(s.pushNotAvailable,
                  style: const TextStyle(fontSize: 11.5)),
            ),
          ),
          Expanded(
            child: AsyncGate<List<dynamic>>(
              future: () => api.get('/inventory/low-stock'),
              builder: (context, rows) {
                if (rows.isEmpty) return EmptyCentered(message: s.emptyGeneric);
                return RefreshIndicator(
                  onRefresh: () async {},
                  child: ListView.builder(
                    padding: const EdgeInsets.fromLTRB(14, 10, 14, 24),
                    itemCount: rows.length,
                    itemBuilder: (context, i) {
                      final row = rows[i];
                      final product = row['product'] as Map?;
                      final branch = row['branch'] as Map?;
                      final out = Fmt.numOrZero(row['quantity']) <= 0;
                      return ListTile(
                        contentPadding:
                            const EdgeInsets.symmetric(horizontal: 6),
                        leading: Icon(
                          Icons.warning_amber_rounded,
                          size: 22,
                          color: out ? NgColors.danger : NgColors.warning,
                        ),
                        title: Text(
                          '${product?['name'] ?? '—'} · ${branch?['name'] ?? ''}',
                          style: const TextStyle(
                              fontSize: 12.5, fontWeight: FontWeight.w700),
                        ),
                        subtitle: Text(
                          '${Fmt.numOrZero(row['quantity'])}/${Fmt.numOrZero(row['minimum_stock'])} · ${Fmt.time(Fmt.parseDate(row['updated_at']))}',
                          style: TextStyle(
                              fontSize: 10.5,
                              color: Theme.of(context).hintColor),
                        ),
                      );
                    },
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}
