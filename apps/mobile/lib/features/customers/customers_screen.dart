import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../app/localization.dart';
import '../../core/api/api_client.dart';
import '../../core/auth/app_controller.dart';
import '../../core/errors/failure.dart';
import '../../shared/components/paginated_list_view.dart';
import '../../shared/components/failure_message.dart';
import '../../shared/components/snack.dart';

/// Customers directory — GET /customers, POST /customers.
class CustomersScreen extends StatefulWidget {
  const CustomersScreen({super.key});

  @override
  State<CustomersScreen> createState() => _CustomersScreenState();
}

class _CustomersScreenState extends State<CustomersScreen> {
  final _search = TextEditingController();
  int _generation = 0;

  @override
  void dispose() {
    _search.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final s = l(context);
    final api = context.read<ApiClient>();
    final canCreate =
        context.watch<AppController>().ctx?.can('customer.create') ?? false;

    return Scaffold(
      appBar: AppBar(title: Text(s.customersTitle)),
      floatingActionButton: canCreate
          ? FloatingActionButton(
              backgroundColor: Theme.of(context).colorScheme.primary,
              onPressed: () => _addCustomer(context),
              child: const Icon(Icons.person_add_alt_rounded))
          : null,
      body: Column(
        key: ValueKey(_generation),
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(14, 10, 14, 4),
            child: TextField(
              controller: _search,
              decoration: InputDecoration(hintText: s.searchProducts),
              onChanged: (_) => setState(() {}),
            ),
          ),
          Expanded(
            child: PaginatedListView<Map<String, dynamic>>(
              fetchPage: (_) async {
                final rows = await api.get('/customers', query: {
                  if (_search.text.isNotEmpty) 'search': _search.text,
                  'limit': '50',
                }) as List<dynamic>;
                return rows.cast<Map<String, dynamic>>();
              },
              itemBuilder: (context, c) => ListTile(
                contentPadding:
                    const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                leading: CircleAvatar(
                  radius: 16,
                  backgroundColor:
                      Theme.of(context).colorScheme.primary.withValues(alpha: .1),
                  child: Text((c['name']?.toString() ?? '?').characters.first,
                      style: TextStyle(
                          fontSize: 13,
                          color: Theme.of(context).colorScheme.primary,
                          fontWeight: FontWeight.w800)),
                ),
                title: Text(c['name']?.toString() ?? '',
                    style: const TextStyle(fontSize: 12.5)),
                subtitle: Text(c['phone']?.toString() ?? '',
                    style: TextStyle(
                        fontSize: 10.5, color: Theme.of(context).hintColor)),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Future<void> _addCustomer(BuildContext context) async {
    final name = TextEditingController();
    final phone = TextEditingController();
    final ok = await showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      builder: (ctx) => Padding(
        padding:
            EdgeInsets.only(bottom: MediaQuery.viewInsetsOf(ctx).bottom + 18),
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 18),
          child: Column(mainAxisSize: MainAxisSize.min, children: [
            TextField(controller: name,
                decoration: InputDecoration(labelText: l(ctx).fullName)),
            const SizedBox(height: 10),
            TextField(controller: phone,
                keyboardType: TextInputType.phone,
                decoration: InputDecoration(labelText: l(ctx).phone)),
            const SizedBox(height: 16),
            SizedBox(
              width: double.infinity,
              child: FilledButton(
                onPressed: () => Navigator.pop(ctx, true),
                child: Text(l(ctx).confirmShort),
              ),
            ),
          ]),
        ),
      ),
    );
    if (ok != true || !context.mounted || name.text.trim().isEmpty) return;
    try {
      await context.read<ApiClient>().post('/customers',
          body: {'name': name.text.trim(), 'phone': phone.text.trim()});
      setState(() => _generation++);
    } on Failure catch (f) {
      if (!context.mounted) return;
      Snack.error(context, localizedFailure(context, f));
    }
  }
}
