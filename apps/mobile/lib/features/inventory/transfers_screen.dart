import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../app/localization.dart';
import '../../core/api/api_client.dart';
import '../../core/errors/failure.dart';
import '../../shared/components/async_gate.dart';
import '../../shared/components/failure_message.dart';
import '../../shared/components/snack.dart';
import '../../shared/constants/design.dart';

/// Stock transfer list + creation.
///   GET  /warehouses  (pick source & destination)
///   POST /inventory/transfer {sourceWarehouseId,destinationWarehouseId,productId,quantity}
class TransfersScreen extends StatelessWidget {
  const TransfersScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final api = context.read<ApiClient>();
    return Scaffold(
      appBar: AppBar(title: Text(l(context).transfersTitle)),
      body: AsyncGate<List<dynamic>>(
        future: () => api.get('/inventory/movements'),
        builder: (context, rows) {
          final transfers = rows
              .where((m) =>
                  m['movement_type'] == 'TRANSFER_IN' ||
                  m['movement_type'] == 'TRANSFER_OUT')
              .toList();
          if (transfers.isEmpty) {
            return EmptyCentered(message: l(context).emptyGeneric);
          }
          return ListView.builder(
            padding: const EdgeInsets.fromLTRB(14, 10, 14, 24),
            itemCount: transfers.length,
            itemBuilder: (context, i) {
              final m = transfers[i] as Map;
              final out = m['movement_type'] == 'TRANSFER_OUT';
              return ListTile(
                contentPadding: EdgeInsets.zero,
                dense: true,
                leading: Icon(out ? Icons.output_rounded : Icons.call_received_rounded,
                    size: 20,
                    color: Theme.of(context).colorScheme.primary),
                title: Text(m['reference_id']?.toString() ?? 'Transfer',
                    style: const TextStyle(
                        fontSize: 12.5, fontWeight: FontWeight.w700)),
                subtitle: Text(Fmt.dateTime(Fmt.parseDate(m['created_at'])),
                    style: TextStyle(
                        fontSize: 10.5, color: Theme.of(context).hintColor)),
                trailing: Text('${out ? '−' : '+'}${Fmt.numOrZero(m['quantity'])}',
                    style: TextStyle(
                        fontWeight: FontWeight.w800,
                        fontSize: 12.5,
                        color: out ? NgColors.danger : NgColors.success)),
              );
            },
          );
        },
      ),
    );
  }
}

/// Modal-style form pushed from quick actions (/transfers/new).
class TransferFormScreen extends StatefulWidget {
  const TransferFormScreen({super.key});

  @override
  State<TransferFormScreen> createState() => _TransferFormScreenState();
}

class _TransferFormScreenState extends State<TransferFormScreen> {
  List<dynamic> _warehouses = [];
  List<dynamic> _products = [];
  String? _source;
  String? _destination;
  String? _productId;
  final _qty = TextEditingController(text: '1');
  bool _loading = true;
  bool _busy = false;

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void dispose() => _qty.dispose();

  Future<void> _load() async {
    try {
      final api = context.read<ApiClient>();
      final whs = await api.get('/warehouses') as List<dynamic>;
      final prods = await api.get('/products', query: {'limit': '100'})
          as List<dynamic>;
      if (!mounted) return;
      setState(() {
        _warehouses =
            whs.where((w) => w['status'] == 'active').toList();
        _products = prods;
        _source = _warehouses.isNotEmpty ? _warehouses.first['id'].toString() : null;
        _destination =
            _warehouses.length > 1 ? _warehouses[1]['id'].toString() : null;
        _productId = _products.isNotEmpty ? _products.first['id'].toString() : null;
        _loading = false;
      });
    } on Failure catch (f) {
      if (!mounted) return;
      setState(() => _loading = false);
      Snack.error(context, localizedFailure(context, f));
    }
  }

  Future<void> _submit() async {
    if (_source == null || _destination == null || _productId == null) {
      Snack.error(context, l(context).requiredField);
      return;
    }
    if (_source == _destination) {
      Snack.error(context, l(context).transferSameWarehouse);
      return;
    }
    final qty = double.tryParse(_qty.text) ?? 0;
    if (qty <= 0) {
      Snack.error(context, l(context).requiredField);
      return;
    }
    setState(() => _busy = true);
    try {
      await context.read<ApiClient>().post('/inventory/transfer', body: {
        'sourceWarehouseId': _source,
        'destinationWarehouseId': _destination,
        'productId': _productId,
        'quantity': qty,
      });
      if (!mounted) return;
      Snack.success(context, l(context).saved);
      Navigator.pop(context);
    } on Failure catch (f) {
      if (!mounted) return;
      Snack.error(context, localizedFailure(context, f));
      setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final s = l(context);
    return Scaffold(
      appBar: AppBar(title: Text(s.transferStock)),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : SafeArea(
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(18),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    DropdownButtonFormField<String>(
                      value: _source,
                      decoration: InputDecoration(labelText: s.sourceWarehouse),
                      items: [
                        for (final w in _warehouses)
                          DropdownMenuItem(
                              value: w['id'].toString(),
                              child: Text(w['name'].toString())),
                      ],
                      onChanged: (v) => setState(() => _source = v),
                    ),
                    const SizedBox(height: 12),
                    DropdownButtonFormField<String>(
                      value: _destination,
                      decoration:
                          InputDecoration(labelText: s.destinationWarehouse),
                      items: [
                        for (final w in _warehouses)
                          DropdownMenuItem(
                              value: w['id'].toString(),
                              child: Text(w['name'].toString())),
                      ],
                      onChanged: (v) => setState(() => _destination = v),
                    ),
                    const SizedBox(height: 12),
                    DropdownButtonFormField<String>(
                      value: _productId,
                      isExpanded: true,
                      decoration: InputDecoration(labelText: s.productName),
                      items: [
                        for (final p in _products)
                          DropdownMenuItem(
                              value: p['id'].toString(),
                              child: Text(p['name'].toString(),
                                  overflow: TextOverflow.ellipsis)),
                      ],
                      onChanged: (v) => setState(() => _productId = v),
                    ),
                    const SizedBox(height: 12),
                    TextFormField(
                      controller: _qty,
                      keyboardType: TextInputType.number,
                      decoration: InputDecoration(labelText: s.quantityLabel),
                    ),
                    const SizedBox(height: 22),
                    FilledButton(
                      style: FilledButton.styleFrom(backgroundColor: NgColors.blue),
                      onPressed: _busy ? null : _submit,
                      child: _busy
                          ? const SizedBox(
                              width: 20, height: 20,
                              child: CircularProgressIndicator(strokeWidth: 2))
                          : Text(s.confirmShort),
                    ),
                  ],
                ),
              ),
            ),
    );
  }
}
