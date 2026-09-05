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

class AttendanceScreen extends StatefulWidget {
  const AttendanceScreen({super.key});

  @override
  State<AttendanceScreen> createState() => _AttendanceScreenState();
}

class _AttendanceScreenState extends State<AttendanceScreen> {
  final int _generation = 0;
  String? _employeeId;

  @override
  Widget build(BuildContext context) {
    final s = l(context);
    final api = context.read<ApiClient>();
    final app = context.watch<AppController>();
    final canClock = app.ctx?.can('attendance.clock') ?? false;

    return Scaffold(
      appBar: AppBar(title: Text(s.attendanceTitle)),
      body: AsyncGate<List<dynamic>>(
        key: ValueKey(_generation),
        future: () async {
          final rows =
              await api.get('/employees', query: {'limit': '100'}) as List<dynamic>;
          if (rows.isNotEmpty && _employeeId == null) {
            _employeeId = rows.first['id'].toString();
          }
          return rows;
        },
        builder: (context, employees) {
          if (_employeeId == null) {
            return EmptyCentered(message: s.emptyGeneric);
          }
          return RefreshIndicator(
            onRefresh: () async {},
            child: ListView(
              padding: const EdgeInsets.fromLTRB(14, 12, 14, 24),
              children: [
                DropdownButtonFormField<String>(
                  initialValue: _employeeId,
                  isExpanded: true,
                  decoration: InputDecoration(labelText: s.employeesTitle),
                  items: [
                    for (final e in employees)
                      DropdownMenuItem(
                          value: e['id'].toString(),
                          child: Text(e['full_name']?.toString() ?? '',
                              overflow: TextOverflow.ellipsis))
                  ],
                  onChanged: (v) => setState(() => _employeeId = v),
                ),
                const SizedBox(height: 12),
                if (canClock)
                  Row(children: [
                    Expanded(
                      child: FilledButton.icon(
                        style:
                            FilledButton.styleFrom(backgroundColor: NgColors.success),
                        onPressed: () => _clock(context, 'CLOCK_IN'),
                        icon: const Icon(Icons.login_rounded),
                        label: Text(s.clockedIn('')),
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: FilledButton.icon(
                        style: FilledButton.styleFrom(backgroundColor: NgColors.danger),
                        onPressed: () => _clock(context, 'CLOCK_OUT'),
                        icon: const Icon(Icons.logout_rounded),
                        label: Text(s.clockedOut('')),
                      ),
                    ),
                  ]),
                const SizedBox(height: 16),
              ],
            ),
          );
        },
      ),
    );
  }

  Future<void> _clock(BuildContext context, String action) async {
    try {
      final app = context.read<AppController>();
      await context.read<ApiClient>().post('/attendance/clock', body: {
        'employeeId': _employeeId,
        'branchId': app.activeBranch?.id,
        'action': action,
      });
      if (!context.mounted) return;
      Snack.success(context, l(context).saved);
    } on Failure catch (f) {
      if (!context.mounted) return;
      Snack.error(context, localizedFailure(context, f));
    }
  }
}
