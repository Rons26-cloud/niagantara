import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../app/localization.dart';
import '../../core/api/api_client.dart';
import '../../core/auth/app_controller.dart';
import '../../core/utils/formatters.dart';
import '../../shared/components/paginated_list_view.dart';
import '../../shared/constants/design.dart';
import '../../shared/widgets/ng_cards.dart';

class ProductsScreen extends StatefulWidget {
  const ProductsScreen({super.key});

  @override
  State<ProductsScreen> createState() => _ProductsScreenState();
}

class _ProductsScreenState extends State<ProductsScreen> {
  final _search = TextEditingController();
  String? _cursor;
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
        context.watch<AppController>().ctx?.can('product.create') ?? false;

    return Scaffold(
      appBar: AppBar(title: Text(s.productsTitle)),
      floatingActionButton: canCreate
          ? FloatingActionButton.extended(
              backgroundColor: NgColors.blue,
              onPressed: () async {
                await Navigator.pushNamed(context, '/products/form');
                if (!mounted) return;
                setState(() => _generation++);
              },
              icon: const Icon(Icons.add_rounded),
              label: Text(s.add),
            )
          : null,
      body: Column(
        key: ValueKey(_generation),
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(14, 10, 14, 4),
            child: SearchField(
              controller: _search,
              hint: s.searchProducts,
              onSubmit: (_) => setState(() => _generation++),
            ),
          ),
          Expanded(
            child: PaginatedListView<Map<String, dynamic>>(
              fetchPage: (loaded) async {
                final rows = await api.get('/products', query: {
                  'limit': '50',
                  if (_search.text.isNotEmpty) 'search': _search.text,
                  if (_cursor != null && loaded > 0) 'lt': _cursor!,
                }) as List<dynamic>;
                final casted = rows.cast<Map<String, dynamic>>();
                if (casted.isNotEmpty && loaded == 0) {
                }
                return casted;
              },
              onLoaded: (allRows) {
                _cursor = allRows.isEmpty
                    ? null
                    : allRows.last['created_at']?.toString();
              },
              itemBuilder: (context, p) {
                final status = p['status']?.toString() ?? 'active';
                return Card(
                  margin:
                      const EdgeInsets.symmetric(horizontal: 14, vertical: 4),
                  shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12)),
                  child: ListTile(
                    onTap: () async {
                      await Navigator.pushNamed(context, '/products/form',
                          arguments: {'product': p});
                      if (!mounted) return;
                      setState(() => _generation++);
                    },
                    leading: CircleAvatar(
                      radius: 18,
                      backgroundColor: Theme.of(context)
                          .colorScheme
                          .primary
                          .withValues(alpha: .1),
                      child: Icon(Icons.inventory_2_outlined,
                          size: 18, color: Theme.of(context).colorScheme.primary),
                    ),
                    title: Text(p['name']?.toString() ?? '',
                        maxLines: 1, overflow: TextOverflow.ellipsis),
                    subtitle: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('SKU ${p['sku'] ?? ''}',
                            style: TextStyle(
                                fontSize: 10.5,
                                color: Theme.of(context).hintColor)),
                        Text(Fmt.rp(Fmt.numOrZero(p['selling_price'])),
                            style: const TextStyle(
                                fontSize: 11.5,
                                fontWeight: FontWeight.w800,
                                color: NgColors.blue)),
                      ],
                    ),
                    isThreeLine: true,
                    trailing: StatusChip(
                      label: status.toUpperCase(),
                      color: status == 'active' ? NgColors.success : NgColors.warning,
                    ),
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
