import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../app/localization.dart';
import '../../core/api/api_client.dart';
import '../../core/utils/formatters.dart';
import '../../shared/components/paginated_list_view.dart';
import '../../shared/constants/design.dart';
import '../../shared/widgets/ng_cards.dart';

class SalesScreen extends StatefulWidget {
  const SalesScreen({super.key});

  @override
  State<SalesScreen> createState() => _SalesScreenState();
}

class _SalesScreenState extends State<SalesScreen> {
  final _search = TextEditingController();
  String? _method;
  int _generation = 0;

  static const methods = ['CASH', 'QRIS', 'BANK_TRANSFER', 'E_WALLET', 'OTHER'];

  @override
  void dispose() {
    _search.dispose();
    super.dispose();
  }

  Color _statusColor(String? status) {
    switch (status) {
      case 'PAID':
        return NgColors.success;
      case 'PARTIALLY_REFUNDED':
        return NgColors.warning;
      case 'REFUNDED':
        return NgColors.danger;
      default:
        return Colors.grey;
    }
  }

  @override
  Widget build(BuildContext context) {
    final s = l(context);
    final api = context.read<ApiClient>();

    return Scaffold(
      appBar: AppBar(title: Text(s.salesTitle)),
      body: Column(
        key: ValueKey('$_generation-$_method'),
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(14, 10, 14, 4),
            child: Row(children: [
              Expanded(
                child: SearchField(
                  controller: _search,
                  hint: s.searchTransaction,
                  onSubmit: (_) => setState(() => _generation++),
                ),
              ),
              const SizedBox(width: 8),
              DropdownButton<String?>(
                value: _method,
                underline: const SizedBox.shrink(),
                hint: Text(s.allMethods, style: const TextStyle(fontSize: 12)),
                items: [
                  const DropdownMenuItem<String?>(
                      value: null, child: Text('-')),
                  for (final m in methods)
                    DropdownMenuItem<String?>(
                        value: m,
                        child:
                            Text(m == 'CASH' ? s.payCash : m, style: const TextStyle(fontSize: 12))),
                ],
                onChanged: (v) => setState(() {
                  _method = v;
                  _generation++;
                }),
              ),
            ]),
          ),
          Expanded(
            child: PaginatedListView<Map<String, dynamic>>(
              fetchPage: (_) async {
                final rows = await api.get('/sales', query: {
                  if (_search.text.isNotEmpty) 'search': _search.text,
                  if (_method != null) 'paymentMethod': _method!,
                }) as List<dynamic>;
                return rows.cast<Map<String, dynamic>>();
              },
              itemBuilder: (context, sale) {
                final status = sale['status']?.toString();
                return ListTile(
                  contentPadding:
                      const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                  onTap: () => Navigator.pushNamed(context, '/sales/detail',
                      arguments: sale['id']),
                  title: Row(children: [
                    Expanded(
                      child: Text(sale['transaction_number']?.toString() ?? '',
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(
                              fontSize: 12.5, fontWeight: FontWeight.w700)),
                    ),
                    StatusChip(label: status ?? '', color: _statusColor(status)),
                  ]),
                  subtitle: Text(
                    Fmt.dateTime(Fmt.parseDate(sale['created_at'])),
                    style: TextStyle(
                        fontSize: 10.5, color: Theme.of(context).hintColor),
                  ),
                  trailing: Text(
                    Fmt.rp(Fmt.numOrZero(sale['grand_total'])),
                    style: TextStyle(
                        fontSize: 12.5,
                        fontWeight: FontWeight.w800,
                        color: Theme.of(context).colorScheme.primary),
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
