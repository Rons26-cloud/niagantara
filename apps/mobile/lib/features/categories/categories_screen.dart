import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../app/localization.dart';
import '../../core/api/api_client.dart';
import '../../core/auth/app_controller.dart';
import '../../core/errors/failure.dart';
import '../../shared/components/async_gate.dart';
import '../../shared/components/failure_message.dart';
import '../../shared/components/snack.dart';

/// Product categories — GET /categories, POST /categories {name}
/// (category.manage required for creation).
class CategoriesScreen extends StatefulWidget {
  const CategoriesScreen({super.key});

  @override
  State<CategoriesScreen> createState() => _CategoriesScreenState();
}

class _CategoriesScreenState extends State<CategoriesScreen> {
  int _generation = 0;

  @override
  Widget build(BuildContext context) {
    final s = l(context);
    final api = context.read<ApiClient>();
    final canManage =
        context.watch<AppController>().ctx?.can('category.manage') ?? false;

    return Scaffold(
      appBar: AppBar(title: Text(s.categoriesTitle)),
      floatingActionButton: canManage
          ? FloatingActionButton(
              backgroundColor: Theme.of(context).colorScheme.primary,
              onPressed: () => _addCategory(context),
              child: const Icon(Icons.add_rounded),
            )
          : null,
      body: AsyncGate<List<dynamic>>(
        key: ValueKey(_generation),
        future: () => api.get('/categories'),
        builder: (context, rows) => rows.isEmpty
            ? EmptyCentered(message: l(context).emptyGeneric)
            : RefreshIndicator(
                onRefresh: () async {},
                child: ListView.builder(
                  padding: const EdgeInsets.fromLTRB(14, 10, 14, 24),
                  itemCount: rows.length,
                  itemBuilder: (context, i) => ListTile(
                    contentPadding: EdgeInsets.zero,
                    leading: Icon(Icons.label_outline_rounded,
                        size: 20, color: Theme.of(context).colorScheme.primary),
                    title: Text(rows[i]['name']?.toString() ?? '',
                        style: const TextStyle(
                            fontSize: 13, fontWeight: FontWeight.w600)),
                  ),
                ),
              ),
      ),
    );
  }

  Future<void> _addCategory(BuildContext context) async {
    final name = TextEditingController();
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text(l(ctx).categoriesTitle),
        content: TextField(controller: name,
            decoration:
                InputDecoration(labelText: l(ctx).categoryOptional)),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: Text(l(ctx).cancelShort)),
          FilledButton(onPressed: () => Navigator.pop(ctx, true), child: Text(l(ctx).confirmShort)),
        ],
      ),
    );
    if (ok != true || !context.mounted || name.text.trim().isEmpty) return;
    try {
      await context.read<ApiClient>().post('/categories',
          body: {'name': name.text.trim()});
      setState(() => _generation++);
    } on Failure catch (f) {
      if (!context.mounted) return;
      Snack.error(context, localizedFailure(context, f));
    }
  }
}
