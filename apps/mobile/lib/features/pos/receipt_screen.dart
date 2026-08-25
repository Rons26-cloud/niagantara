import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';

import '../../app/localization.dart';
import '../../core/api/api_client.dart';
import '../../core/utils/formatters.dart';
import '../../shared/components/async_gate.dart';
import '../../shared/components/snack.dart';
import '../../shared/constants/design.dart';

/// Receipt view for a completed sale — GET /sales/:id
/// (items, payment, history, refunds, branch/store/cashier).
class ReceiptScreen extends StatelessWidget {
  const ReceiptScreen({super.key, required this.saleId});

  final String saleId;

  @override
  Widget build(BuildContext context) {
    final api = context.read<ApiClient>();
    return Scaffold(
      appBar: AppBar(title: Text(l(context).receiptTitle)),
      body: AsyncGate<Map<String, dynamic>>(
        future: () => api.get('/sales/$saleId'),
        builder: (context, sale) => _ReceiptBody(sale: sale),
      ),
    );
  }
}

class _ReceiptBody extends StatelessWidget {
  const _ReceiptBody({required this.sale});

  final Map<String, dynamic> sale;

  @override
  Widget build(BuildContext context) {
    final s = l(context);
    final items = sale['items'] as List<dynamic>? ?? [];
    final payment = sale['payment'] as Map?;
    final branch = sale['branch'] as Map?;

    return ListView(
      padding: const EdgeInsets.all(18),
      children: [
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: Theme.of(context).cardColor,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: Theme.of(context).dividerColor),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Center(
                child: Image.asset('assets/branding/niagantara-logo.png',
                    width: 130),
              ),
              const SizedBox(height: 6),
              Text(branch?['name']?.toString() ?? '',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                      fontSize: 11, color: Theme.of(context).hintColor)),
              const Divider(height: 22),
              _kv(s.receiptNo, sale['transaction_number']?.toString()),
              _kv(s.dateLabel,
                  Fmt.dateTime(Fmt.parseDate(sale['completed_at'] ?? sale['created_at']))),
              _kv(s.cashier,
                  (sale['cashier'] as Map?)?['full_name']?.toString()),
              const Divider(height: 22),
              for (final it in items) ...[
                Text(it['product_name']?.toString() ?? '',
                    style: const TextStyle(
                        fontSize: 12.5, fontWeight: FontWeight.w700)),
                Padding(
                  padding: const EdgeInsets.only(left: 8, bottom: 8),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                          '${Fmt.numOrZero(it['quantity'])} × ${Fmt.rp(Fmt.numOrZero(it['unit_price']))}',
                          style: TextStyle(
                              fontSize: 11,
                              color: Theme.of(context).hintColor)),
                      Text(Fmt.rp(Fmt.numOrZero(it['line_total'])),
                          style: const TextStyle(fontSize: 11.5)),
                    ],
                  ),
                ),
              ],
              const Divider(height: 10),
              _kv(s.subtotal, Fmt.rp(Fmt.numOrZero(sale['subtotal']))),
              if (Fmt.numOrZero(sale['item_discount_total']) > 0)
                _kv(s.itemDiscounts,
                    '− ${Fmt.rp(Fmt.numOrZero(sale['item_discount_total']))}',
                    color: NgColors.danger),
              if (Fmt.numOrZero(sale['transaction_discount']) > 0)
                _kv(s.txnDiscount,
                    '− ${Fmt.rp(Fmt.numOrZero(sale['transaction_discount']))}',
                    color: NgColors.danger),
              if (Fmt.numOrZero(sale['tax_total']) > 0)
                _kv(s.taxRate, Fmt.rp(Fmt.numOrZero(sale['tax_total']))),
              const SizedBox(height: 6),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(s.total,
                      style:
                          const TextStyle(fontSize: 14, fontWeight: FontWeight.w900)),
                  Text(Fmt.rp(Fmt.numOrZero(sale['grand_total'])),
                      style: TextStyle(
                          fontSize: 17,
                          fontWeight: FontWeight.w900,
                          color: Theme.of(context).colorScheme.primary)),
                ],
              ),
              if (payment != null) ...[
                const Divider(height: 22),
                _kv(s.paymentMethodLabel,
                    payment['method']?.toString() ?? ''),
                if (payment['amount_received'] != null)
                  _kv(s.amountReceived,
                      Fmt.rp(Fmt.numOrZero(payment['amount_received']))),
                if (Fmt.numOrZero(payment['change_amount']) > 0)
                  _kv(s.changeDue, Fmt.rp(Fmt.numOrZero(payment['change_amount']))),
              ],
            ],
          ),
        ),
        const SizedBox(height: 14),
        OutlinedButton.icon(
          onPressed: () {
            Clipboard.setData(ClipboardData(text: _plainText()));
            Snack.success(context, l(context).copied);
          },
          icon: const Icon(Icons.copy_rounded, size: 18),
          label: Text(s.copyReceipt),
        ),
        const SizedBox(height: 8),
        FilledButton(
          style: FilledButton.styleFrom(backgroundColor: NgColors.blue),
          onPressed: () => Navigator.of(context)
              .popUntil((r) => r.settings.name == '/pos' || r.isFirst),
          child: Text(s.backToPos),
        ),
      ],
    );
  }

  Widget _kv(String k, String? v, {Color? color}) => Padding(
        padding: const EdgeInsets.symmetric(vertical: 2),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(k, style: TextStyle(fontSize: 11.5, color: Colors.grey.shade600)),
            Text(v ?? '—',
                style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w700,
                    color: color)),
          ],
        ),
      );

  String _plainText() {
    final buf = StringBuffer()
      ..writeln(sale['transaction_number'])
      ..writeln(Fmt.rp(Fmt.numOrZero(sale['grand_total'])));
    for (final it in (sale['items'] as List? ?? [])) {
      buf.writeln('${it['product_name']} x${it['quantity']} = ${it['line_total']}');
    }
    return buf.toString();
  }
}
