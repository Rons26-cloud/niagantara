import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../app/localization.dart';
import '../../core/api/api_client.dart';
import '../../shared/components/paginated_list_view.dart';

class EmployeesScreen extends StatelessWidget {
  const EmployeesScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final s = l(context);
    final api = context.read<ApiClient>();
    return Scaffold(
      appBar: AppBar(title: Text(s.employeesTitle)),
      body: PaginatedListView<Map<String, dynamic>>(
        fetchPage: (_) async {
          final rows = await api.get('/employees', query: {'limit': '50'})
              as List<dynamic>;
          return rows.cast<Map<String, dynamic>>();
        },
        itemBuilder: (context, e) => ListTile(
          contentPadding:
              const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
          leading: CircleAvatar(
            radius: 16,
            backgroundColor:
                Theme.of(context).colorScheme.primary.withValues(alpha: .1),
            child: Text((e['full_name']?.toString() ?? '?').characters.first,
                style: TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w800,
                    color: Theme.of(context).colorScheme.primary)),
          ),
          title: Text(e['full_name']?.toString() ?? '',
              style: const TextStyle(fontSize: 12.5)),
          subtitle: Text(e['email']?.toString() ?? '',
              style: TextStyle(
                  fontSize: 10.5, color: Theme.of(context).hintColor)),
        ),
      ),
    );
  }
}
