import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';

import '../../app/localization.dart';
import '../../core/api/api_client.dart';
import '../../core/auth/app_controller.dart';
import '../../core/errors/failure.dart';
import '../../core/utils/formatters.dart';
import '../../shared/components/failure_message.dart';
import '../../shared/components/snack.dart';
import '../../shared/constants/design.dart';
import '../../shared/widgets/ng_cards.dart';
import '../../shared/widgets/state_views.dart';
import 'cart_totals.dart';

class PosScreen extends StatefulWidget {
  const PosScreen({super.key});

  @override
  State<PosScreen> createState() => _PosScreenState();
}

class _PosScreenState extends State<PosScreen> {
  final _math = PosCartMath();
  final _search = TextEditingController();
  List<dynamic> _products = [];
  bool _loadingProducts = true;
  Failure? _productError;

  Map<String, dynamic>? _shift;
  Map<String, dynamic>? _warehouse;
  bool _contextLoading = true;

  @override
  void initState() {
    super.initState();
    _loadContext();
    _loadProducts();
  }

  @override
  void dispose() {
    _search.dispose();
    super.dispose();
  }

  ApiClient get _api => context.read<ApiClient>();
  AppController get _app => context.read<AppController>();

  Future<void> _loadContext() async {
    setState(() => _contextLoading = true);
    try {
      final warehouses =
          await _api.get('/warehouses') as List<dynamic>;
      final whs = warehouses
          .where((w) =>
              w['status'] == 'active' &&
              w['branch_id'] == _app.activeBranch?.id)
          .toList();
      final shifts = await _api.get('/shifts') as List<dynamic>;
      final open = shifts.where((s) =>
          s['status'] == 'OPEN' &&
          s['branch_id'] == _app.activeBranch?.id &&
          s['cashier_id'] == _app.ctx?.userId).toList();
      setState(() {
        _warehouse = whs.isEmpty ? null : whs.first as Map<String, dynamic>;
        _shift = open.isEmpty ? null : open.first as Map<String, dynamic>;
        _contextLoading = false;
      });
    } on Failure catch (f) {
      if (!mounted) return;
      setState(() {
        _contextLoading = false;
      });
      Snack.error(context, localizedFailure(context, f));
    }
  }

  Future<void> _loadProducts([String? search]) async {
    setState(() {
      _loadingProducts = true;
      _productError = null;
    });
    try {
      final list = await _api.get('/pos/products', query: {
        if (search != null && search.isNotEmpty) 'search': search,
        'limit': '50',
      }) as List<dynamic>;
      setState(() {
        _products = list;
        _loadingProducts = false;
      });
    } on Failure catch (f) {
      if (!mounted) return;
      setState(() {
        _productError = f;
        _loadingProducts = false;
      });
    }
  }

  Future<void> _openShiftDialog() async {
    final s = l(context);
    final controller = TextEditingController(text: '0');
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text(s.shiftOpen),
        content: TextField(
          controller: controller,
          keyboardType:
              const TextInputType.numberWithOptions(decimal: true),
          decoration: InputDecoration(labelText: s.openingCash),
        ),
        actions: [
          TextButton(
              onPressed: () => Navigator.pop(ctx, false),
              child: Text(s.cancel)),
          FilledButton(
              onPressed: () => Navigator.pop(ctx, true),
              child: Text(s.confirm)),
        ],
      ),
    );
    if (confirmed != true) return;
    try {
      await _api.post('/shifts/open', body: {
        'storeId': _app.activeStore?.id,
        'branchId': _app.activeBranch?.id,
        'openingCash':
            double.tryParse(controller.text.replaceAll(',', '')) ?? 0,
      });
      await _loadContext();
    } on Failure catch (f) {
      if (!mounted) return;
      Snack.error(context, localizedFailure(context, f));
    }
  }

  Future<void> _scanBarcode() async {
    final code = await Navigator.pushNamed<String>(context, '/scanner');
    if (code == null || code.isEmpty) return;
    final match = _products.firstWhere(
      (p) =>
          (p['barcode']?.toString() ?? '') == code ||
          p['sku'].toString().toUpperCase() == code.toUpperCase(),
      orElse: () => null,
    );
    if (match != null) {
      _addToCart(match);
    } else {
      try {
        final rows = await _api.get('/barcodes/lookup',
            query: {'code': code}) as List<dynamic>;
        if (rows.isEmpty) throw const Failure(FailureKind.notFound);
        final product = rows.first['product'] ?? rows.first;
        _addToCart(product);
      } on Failure catch (f) {
        if (!mounted) return;
        Snack.error(context, localizedFailure(context, f));
      }
    }
  }

  void _addToCart(dynamic product) {
    setState(() {
      _math.add(CartLine(
        productId: product['id'].toString(),
        name: product['name']?.toString() ?? '—',
        unitPrice: Fmt.numOrZero(product['selling_price']),
      ));
    });
  }

  Future<void> _openCheckoutSheet() async {
    if (_math.isEmpty) return;
    if (_shift == null) {
      Snack.error(context, l(context).shiftRequiredFirst);
      return;
    }
    if (_warehouse == null) {
      Snack.error(context, l(context).warehouseMissing);
      return;
    }
    await showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      builder: (_) => _CheckoutSheet(
        math: _math,
        warehouseId: _warehouse!['id'].toString(),
        shiftId: _shift!['id'].toString(),
      ),
    );
    setState(() {});
  }

  @override
  Widget build(BuildContext context) {
    final s = l(context);
    final canDiscount = _app.ctx?.can('pos.discount') ?? false;
    final totals = _math.totals();

    return Scaffold(
      appBar: AppBar(
        leading: const BackButton(),
        title: Text(s.posTitle),
        actions: [
          IconButton(
            icon: const Icon(Icons.qr_code_scanner_rounded),
            onPressed: _scanBarcode,
            tooltip: s.scan,
          ),
        ],
      ),
      body: _buildBody(s),
      bottomNavigationBar: _buildCartBar(s, totals, canDiscount),
    );
  }

  Widget _buildBody(AppLocalizations s) {
    if (_contextLoading) return const Center(child: CircularProgressIndicator());
    return Column(
      children: [
        if (_shift == null)
          Material(
            color: NgColors.warning.withValues(alpha: .14),
            child: ListTile(
              dense: true,
              leading:
                  const Icon(Icons.schedule_rounded, color: NgColors.warning),
              title: Text(s.shiftClosedBanner,
                  style: const TextStyle(fontSize: 12)),
              trailing: TextButton(
                  onPressed: _openShiftDialog, child: Text(s.shiftOpen)),
            ),
          ),
        Padding(
          padding: const EdgeInsets.fromLTRB(14, 10, 14, 4),
          child: SearchField(
            controller: _search,
            hint: s.searchProducts,
            onSubmit: (_) => _loadProducts(_search.text),
          ),
        ),
        Expanded(child: _productGrid()),
      ],
    );
  }

  Widget _productGrid() {
    if (_loadingProducts && _products.isEmpty) {
      return const Center(child: CircularProgressIndicator());
    }
    if (_productError != null) {
      return ErrorView(
        failure: _productError!,
        retryLabel: l(context).retry,
        onRetry: _loadProducts,
      );
    }
    if (_products.isEmpty) {
      return EmptyView(message: l(context).emptyProducts);
    }
    return GridView.builder(
      padding: const EdgeInsets.fromLTRB(14, 6, 14, 12),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 3,
        mainAxisSpacing: 8,
        crossAxisSpacing: 8,
        childAspectRatio: 0.82,
      ),
      itemCount: _products.length,
      itemBuilder: (context, i) {
        final p = _products[i];
        return InkWell(
          borderRadius: BorderRadius.circular(12),
          onTap: () => _addToCart(p),
          child: Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: Theme.of(context).cardColor,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: Theme.of(context).dividerColor),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Expanded(
                  child: Center(
                    child: Icon(Icons.inventory_2_outlined,
                        size: 26,
                        color: Theme.of(context).colorScheme.primary
                            .withValues(alpha: .55)),
                  ),
                ),
                Text(p['name']?.toString() ?? '',
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                        fontSize: 11, fontWeight: FontWeight.w700)),
                const SizedBox(height: 2),
                Text(Fmt.rp(Fmt.numOrZero(p['selling_price'])),
                    style: TextStyle(
                        fontSize: 10.5,
                        fontWeight: FontWeight.w800,
                        color: Theme.of(context).colorScheme.primary)),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _buildCartBar(AppLocalizations s, CartTotals totals, bool canDiscount) {
    return SafeArea(
      top: false,
      child: Container(
        decoration: BoxDecoration(
          color: Theme.of(context).cardColor,
          border:
              Border(top: BorderSide(color: Theme.of(context).dividerColor)),
        ),
        padding: const EdgeInsets.fromLTRB(14, 10, 14, 10),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            if (_math.isNotEmpty)
              ConstrainedBox(
                constraints: const BoxConstraints(maxHeight: 168),
                child: ListView(
                  shrinkWrap: true,
                  children: [
                    for (final line in _math.lines)
                      _CartRow(
                        line: line,
                        canDiscount: canDiscount,
                        math: _math,
                        onChanged: () => setState(() {}),
                      ),
                  ],
                ),
              ),
            const SizedBox(height: 8),
            Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('${totals.itemCount} ${s.itemsSuffix}',
                          style: TextStyle(
                              fontSize: 11,
                              color: Theme.of(context).hintColor)),
                      Text(Fmt.rp(totals.grandTotal),
                          style: const TextStyle(
                              fontSize: 17, fontWeight: FontWeight.w900)),
                    ],
                  ),
                ),
                FilledButton.icon(
                  style: FilledButton.styleFrom(
                    minimumSize: const Size(140, kMinTouchTarget),
                    backgroundColor: NgColors.blue,
                    disabledBackgroundColor: Theme.of(context).hintColor,
                  ),
                  onPressed:
                      _math.isEmpty ? null : () => _openCheckoutSheet(),
                  icon: const Icon(Icons.payments_rounded, size: 18),
                  label: Text(s.pay),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _CartRow extends StatelessWidget {
  const _CartRow({
    required this.line,
    required this.math,
    required this.canDiscount,
    required this.onChanged,
  });

  final CartLine line;
  final PosCartMath math;
  final bool canDiscount;
  final VoidCallback onChanged;

  @override
  Widget build(BuildContext context) {
    final breakdown = math.lineBreakdown(line);
    return Row(
      children: [
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(line.name,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                      fontSize: 11.5, fontWeight: FontWeight.w700)),
              if (line.discountValue > 0)
                Text('− ${Fmt.rp(breakdown.discount)}',
                    style: const TextStyle(
                        fontSize: 10, color: NgColors.danger)),
            ],
          ),
        ),
        IconButton(
          visualDensity: VisualDensity.compact,
          icon: const Icon(Icons.remove_circle_outline_rounded, size: 20),
          onPressed: () {
            math.updateQuantity(line.productId, line.quantity - 1);
            onChanged();
          },
        ),
        SizedBox(
          width: 34,
          child: Text('${line.quantity % 1 == 0 ? line.quantity.round() : line.quantity}',
              textAlign: TextAlign.center,
              style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 13)),
        ),
        IconButton(
          visualDensity: VisualDensity.compact,
          icon: const Icon(Icons.add_circle_outline_rounded, size: 20),
          onPressed: () {
            math.updateQuantity(line.productId, line.quantity + 1);
            onChanged();
          },
        ),
        SizedBox(
          width: 74,
          child: Text(Fmt.rp(breakdown.total),
              textAlign: TextAlign.right,
              style: const TextStyle(fontSize: 11.5, fontWeight: FontWeight.w800)),
        ),
      ],
    );
  }
}

class _CheckoutSheet extends StatefulWidget {
  const _CheckoutSheet({
    required this.math,
    required this.warehouseId,
    required this.shiftId,
  });

  final PosCartMath math;
  final String warehouseId;
  final String shiftId;

  @override
  State<_CheckoutSheet> createState() => _CheckoutSheetState();
}

class _CheckoutSheetState extends State<_CheckoutSheet> {
  String _method = 'CASH';
  final _received = TextEditingController();
  final _txnDiscount = TextEditingController();
  final _taxRate = TextEditingController();
  final _reference = TextEditingController();
  String? _txnType;
  bool _busy = false;

  static const methods = ['CASH', 'QRIS', 'BANK_TRANSFER', 'E_WALLET', 'OTHER'];

  @override
  void dispose() {
    _received.dispose();
    _txnDiscount.dispose();
    _taxRate.dispose();
    _reference.dispose();
    super.dispose();
  }

  String _idempotencyKey() {
    final ts = DateTime.now().microsecondsSinceEpoch.toRadixString(36);
    final rand = DateTime.now().millisecondsSinceEpoch.remainder(99991);
    return 'mob-$ts-$rand';
  }

  Future<void> _submit() async {
    final totals = widget.math.totals(
      transactionDiscountType: _txnType,
      transactionDiscountValue:
          double.tryParse(_txnDiscount.text.replaceAll(',', '')) ?? 0,
      taxRate: double.tryParse(_taxRate.text.replaceAll(',', '')) ?? 0,
    );
    final received =
        double.tryParse(_received.text.replaceAll(',', '')) ?? 0;
    if (_method == 'CASH' &&
        !widget.math.cashChange(received, totals.grandTotal).sufficient) {
      Snack.error(context, l(context).insufficientPayment);
      return;
    }
    setState(() => _busy = true);
    final app = context.read<AppController>();
    try {
      final res = await context.read<ApiClient>().post('/pos/checkout', body: {
        'storeId': app.activeStore?.id,
        'branchId': app.activeBranch?.id,
        'warehouseId': widget.warehouseId,
        'shiftId': widget.shiftId,
        'idempotencyKey': _idempotencyKey(),
        'items': [
          for (final line in widget.math.lines)
            {
              'productId': line.productId,
              'quantity': line.quantity,
              if (line.discountType != null && line.discountValue > 0) ...{
                'discountType': line.discountType,
                'discountValue': line.discountValue,
              },
            },
        ],
        if (_txnType != null && (_txnDiscount.text.isNotEmpty)) ...{
          'transactionDiscountType': _txnType,
          'transactionDiscountValue':
              double.tryParse(_txnDiscount.text.replaceAll(',', '')) ?? 0,
        },
        if (_taxRate.text.isNotEmpty) 'taxRate': double.tryParse(_taxRate.text.replaceAll(',', '')) ?? 0,
        'paymentMethod': _method,
        if (_method == 'CASH') 'amountReceived': received,
        if (_method != 'CASH' && _reference.text.isNotEmpty)
          'paymentReference': _reference.text,
      });
      widget.math.clear();
      if (!mounted) return;
      Navigator.pop(context);
      final saleId = res is Map ? res['saleId'] : null;
      await Navigator.pushNamed(context, '/receipt', arguments: saleId);
    } on Failure catch (f) {
      if (!mounted) return;
      Snack.error(context, localizedFailure(context, f));
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final s = l(context);
    final canDiscount = context.read<AppController>().ctx?.can('pos.discount') ?? false;
    final totals = widget.math.totals(
      transactionDiscountType: _txnType,
      transactionDiscountValue:
          double.tryParse(_txnDiscount.text.replaceAll(',', '')) ?? 0,
      taxRate: double.tryParse(_taxRate.text.replaceAll(',', '')) ?? 0,
    );

    return SafeArea(
      child: Padding(
        padding: EdgeInsets.only(
            bottom: MediaQuery.viewInsetsOf(context).bottom),
        child: SingleChildScrollView(
          padding: const EdgeInsets.fromLTRB(18, 18, 18, 22),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(s.checkoutTitle,
                      style: const TextStyle(
                          fontSize: 16, fontWeight: FontWeight.w900)),
                  Text(Fmt.rp(totals.grandTotal),
                      style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w900,
                          color: Theme.of(context).colorScheme.primary)),
                ],
              ),
              const SizedBox(height: 14),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: [
                  for (final m in methods)
                    ChoiceChip(
                      label: Text(m == 'CASH'
                          ? s.payCash
                          : m == 'QRIS'
                              ? s.payQris
                              : m == 'BANK_TRANSFER'
                                  ? s.payTransfer
                                  : m == 'E_WALLET'
                                      ? s.payEwallet
                                      : s.payOther),
                      selected: _method == m,
                      onSelected: (_) => setState(() => _method = m),
                    ),
                ],
              ),
              const SizedBox(height: 14),
              if (_method == 'CASH') ...[
                TextFormField(
                  controller: _received,
                  keyboardType:
                      const TextInputType.numberWithOptions(decimal: true),
                  inputFormatters: [
                    FilteringTextInputFormatter.allow(RegExp(r'[0-9.,]'))
                  ],
                  decoration: InputDecoration(
                      labelText: '${s.amountReceived} (Rp)'),
                ),
                const SizedBox(height: 8),
                Wrap(
                  spacing: 8,
                  children: [
                    ActionChip(
                        label: Text(s.exactAmount),
                        onPressed: () => setState(
                            () => _received.text = totals.grandTotal.toStringAsFixed(0))),
                    for (final v in const [50000, 100000, 200000])
                      ActionChip(
                          label: Text(Fmt.compact(v.toDouble())),
                          onPressed: () =>
                              setState(() => _received.text = '$v')),
                  ],
                ),
                if (totals.grandTotal > 0 &&
                    (double.tryParse(_received.text.replaceAll(',', '')) ?? 0) >=
                        totals.grandTotal) ...[
                  const SizedBox(height: 8),
                  Text(
                      '${s.changeDue}: ${Fmt.rp((double.tryParse(_received.text.replaceAll(',', '')) ?? 0) - totals.grandTotal)}',
                      style: const TextStyle(
                          fontWeight: FontWeight.w800, fontSize: 13)),
                ],
              ] else
                TextFormField(
                  controller: _reference,
                  decoration:
                      InputDecoration(labelText: s.paymentReferenceOptional),
                ),
              if (canDiscount) ...[
                const SizedBox(height: 14),
                Row(children: [
                  ChoiceChip(
                      label: const Text('%'),
                      selected: _txnType == discountPercent,
                      onSelected: (v) =>
                          setState(() => _txnType = v ? discountPercent : null)),
                  const SizedBox(width: 8),
                  ChoiceChip(
                      label: const Text('Rp'),
                      selected: _txnType == discountFixed,
                      onSelected: (v) =>
                          setState(() => _txnType = v ? discountFixed : null)),
                  const SizedBox(width: 10),
                  Expanded(
                    child: TextFormField(
                      controller: _txnDiscount,
                      keyboardType: const TextInputType.numberWithOptions(
                          decimal: true),
                      decoration: InputDecoration(labelText: s.txnDiscount),
                    ),
                  ),
                ]),
              ],
              const SizedBox(height: 10),
              TextFormField(
                controller: _taxRate,
                keyboardType:
                    const TextInputType.numberWithOptions(decimal: true),
                decoration: InputDecoration(labelText: '${s.taxRate} (%)'),
              ),
              const SizedBox(height: 18),
              FilledButton(
                style: FilledButton.styleFrom(
                    minimumSize: const Size.fromHeight(kMinTouchTarget),
                    backgroundColor: NgColors.blue),
                onPressed: _busy ? null : _submit,
                child: _busy
                    ? const SizedBox(
                        width: 20,
                        height: 20,
                        child: CircularProgressIndicator(strokeWidth: 2))
                    : Text('${s.payNow} · ${Fmt.rp(totals.grandTotal)}'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
