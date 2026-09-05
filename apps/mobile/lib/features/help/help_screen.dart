import 'package:flutter/material.dart';

import '../../app/localization.dart';

class HelpScreen extends StatelessWidget {
  const HelpScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final s = l(context);

    final tips = <(IconData, String, String)>[
      (Icons.dashboard_outlined, 'Dashboard', 'Monitor daily sales, stock alerts, and branch activity.'),
      (Icons.point_of_sale_rounded, 'POS / Cashier', 'Open a shift, search or scan products to check out customers.'),
      (Icons.receipt_long_rounded, 'Sales', 'Review transactions, print receipts, cancel or refund when permitted.'),
      (Icons.timelapse_rounded, 'Shifts', 'Track opening/closing cash per cashier shift per branch.'),
      (Icons.inventory_outlined, 'Products', 'Maintain your catalog: names, SKU, cost and selling prices.'),
      (Icons.category_outlined, 'Categories', 'Group products so POS and reports stay organized.'),
      (Icons.qr_code_scanner_rounded, 'Barcode', 'Look up products instantly by scanned code.'),
      (Icons.inventory_2_outlined, 'Inventory', 'Watch stock levels per warehouse and record adjustments.'),
      (Icons.shopping_bag_outlined, 'Purchases', 'Record supplier orders; receiving updates stock automatically.'),
      (Icons.local_shipping_outlined, 'Suppliers', 'Manage vendor partners and their contacts.'),
      (Icons.people_alt_outlined, 'Customers', 'Keep customer records for faster checkout and reporting.'),
      (Icons.badge_outlined, 'Employees', 'Manage staff records and branch assignments.'),
      (Icons.fact_check_outlined, 'Attendance', 'Clock-in/out history for every branch employee.'),
      (Icons.savings_outlined, 'Expenses', 'Record operating costs; they feed finance reports.'),
      (Icons.account_balance_wallet_outlined, 'Finance', 'Track payables, receivables, and operating cash.'),
      (Icons.assessment_outlined, 'Reports', 'Cash-basis finance summary across the selected period.'),
      (Icons.table_view_rounded, 'Google Sheets', 'Connect Google Sheets to mirror sales/inventory data.'),
      (Icons.warehouse_outlined, 'Warehouses', 'Define storage locations per branch.'),
      (Icons.settings_outlined, 'Settings', 'Profile, appearance, language, and workspace context.'),
    ];

    return Scaffold(
      appBar: AppBar(title: Text(s.helpTitle)),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(16, 12, 16, 24),
        children: [
          for (final entry in tips)
            Card(
              margin: const EdgeInsets.only(bottom: 4),
              child: ListTile(
                leading: Icon(entry.$1, size: 20),
                title: Text(entry.$2, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
                subtitle: Text(entry.$3, style: const TextStyle(fontSize: 11.5)),
                dense: true,
              ),
            ),
        ],
      ),
    );
  }
}
