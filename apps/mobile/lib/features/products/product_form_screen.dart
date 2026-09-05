import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../app/localization.dart';
import '../../core/api/api_client.dart';
import '../../core/errors/failure.dart';
import '../../shared/components/failure_message.dart';
import '../../shared/components/snack.dart';
import '../../shared/constants/design.dart';

/// Create / edit a product.
/// POST /products {name,sku,costPrice?,sellingPrice?,barcode?,description?}
/// PATCH /products/:id (same shape, partial)
class ProductFormScreen extends StatefulWidget {
  const ProductFormScreen({super.key, this.existing});

  final Map<String, dynamic>? existing;

  @override
  State<ProductFormScreen> createState() => _ProductFormScreenState();
}

class _ProductFormScreenState extends State<ProductFormScreen> {
  late final TextEditingController _name =
      TextEditingController(text: widget.existing?['name']?.toString() ?? '');
  late final TextEditingController _sku =
      TextEditingController(text: widget.existing?['sku']?.toString() ?? '');
  late final TextEditingController _barcode = TextEditingController(
      text: widget.existing?['barcode']?.toString() ?? '');
  late final TextEditingController _cost = TextEditingController(
      text: widget.existing?['cost_price']?.toString() ?? '');
  late final TextEditingController _price = TextEditingController(
      text: widget.existing?['selling_price']?.toString() ?? '');
  late String? _categoryId = widget.existing?['category_id']?.toString();
  List<dynamic> _categories = [];
  bool _busy = false;

  @override
  void initState() {
    super.initState();
    _loadCategories();
  }

  @override
  void dispose() {
    _name.dispose();
    _sku.dispose();
    _barcode.dispose();
    _cost.dispose();
    _price.dispose();
    super.dispose();
  }

  Future<void> _loadCategories() async {
    try {
      final rows = await context.read<ApiClient>().get('/categories') as List<dynamic>;
      if (!mounted) return;
      setState(() => _categories = rows);
    } on Failure {
      // Category picker stays empty — not fatal for product creation.
    }
  }

  bool get _editing => widget.existing != null;

  Future<void> _submit() async {
    if (_name.text.trim().isEmpty || _sku.text.trim().isEmpty) {
      Snack.error(context, l(context).requiredField);
      return;
    }
    setState(() => _busy = true);
    try {
      final body = <String, dynamic>{
        'name': _name.text.trim(),
        'sku': _sku.text.trim().toUpperCase(),
        if (_barcode.text.trim().isNotEmpty) 'barcode': _barcode.text.trim(),
        if (_cost.text.isNotEmpty) 'costPrice': double.tryParse(_cost.text.replaceAll(',', '')),
        if (_price.text.isNotEmpty)
          'sellingPrice': double.tryParse(_price.text.replaceAll(',', '')) ?? 0,
        if (_categoryId != null) 'categoryId': _categoryId,
      };
      final api = context.read<ApiClient>();
      if (_editing) {
        await api.patch('/products/${widget.existing!['id']}', body: body);
      } else {
        await api.post('/products', body: body);
      }
      if (!mounted) return;
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
      appBar: AppBar(title: Text(_editing ? s.editProduct : s.addProduct)),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(18),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              TextFormField(
                controller: _name,
                textCapitalization: TextCapitalization.words,
                decoration: InputDecoration(labelText: s.productName),
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: _sku,
                textCapitalization: TextCapitalization.characters,
                decoration: InputDecoration(labelText: s.sku),
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: _barcode,
                keyboardType: TextInputType.text,
                decoration: InputDecoration(labelText: s.barcodeOptional),
              ),
              const SizedBox(height: 12),
              Row(children: [
                Expanded(
                  child: TextFormField(
                    controller: _cost,
                    keyboardType:
                        const TextInputType.numberWithOptions(decimal: true),
                    decoration:
                        InputDecoration(labelText: '${s.costPrice} (Rp)'),
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: TextFormField(
                    controller: _price,
                    keyboardType:
                        const TextInputType.numberWithOptions(decimal: true),
                    decoration:
                        InputDecoration(labelText: '${s.sellingPrice} (Rp)'),
                  ),
                ),
              ]),
              const SizedBox(height: 12),
              DropdownButtonFormField<String?>(
                initialValue: _categoryId,
                decoration: InputDecoration(labelText: s.categoryOptional),
                items: [
                  DropdownMenuItem<String?>(
                      value: null, child: Text(s.none)),
                  for (final c in _categories)
                    DropdownMenuItem<String?>(
                        value: c['id'].toString(), child: Text(c['name'].toString())),
                ],
                onChanged: (v) => setState(() => _categoryId = v),
              ),
              const SizedBox(height: 22),
              FilledButton(
                style: FilledButton.styleFrom(backgroundColor: NgColors.blue),
                onPressed: _busy ? null : _submit,
                child: _busy
                    ? const SizedBox(
                        width: 20, height: 20,
                        child: CircularProgressIndicator(strokeWidth: 2))
                    : Text(_editing ? s.saveChanges : s.add),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
