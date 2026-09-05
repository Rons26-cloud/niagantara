import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../app/localization.dart' as gen;
import '../core/auth/app_controller.dart';
import '../shared/constants/design.dart';
import '../app/router.dart';

class _Group {
  const _Group(this.title, this.items);

  final String Function(gen.AppLocalizations l) title;
  final List<_Item> items;
}

class _Item {
  const _Item(this.icon, this.label, this.route, [this.permission]);

  final IconData icon;
  final String Function(gen.AppLocalizations l) label;
  final String route;
  final String? permission;
}

const _assetsLogo = 'assets/branding/niagantara-logo.png';

class AppDrawer extends StatelessWidget {
  const AppDrawer({super.key});

  @override
  Widget build(BuildContext context) {
    final l = gen.l(context);
    final app = context.watch<AppController>();
    final ctx = app.ctx;

    final groups = [
      _Group((l) => l.operations, [
        _Item(Icons.point_of_sale_rounded, (l) => l.menuPos, Routes.pos, 'pos.access'),
        _Item(Icons.receipt_long_rounded, (l) => l.menuSales, Routes.sales, 'sale.read'),
        _Item(Icons.inventory_2_outlined, (l) => l.menuInventory, Routes.inventory, 'inventory.read'),
        _Item(Icons.warehouse_outlined, (l) => l.menuWarehouses, Routes.warehouses, 'warehouse.read'),
        _Item(Icons.swap_horiz_rounded, (l) => l.menuTransfers, Routes.transfers, 'inventory.transfer'),
        _Item(Icons.timelapse_rounded, (l) => l.menuShifts, Routes.shifts, 'shift.read'),
      ]),
      _Group((l) => l.management, [
        _Item(Icons.inventory_outlined, (l) => l.menuProducts, Routes.products, 'product.read'),
        _Item(Icons.category_outlined, (l) => l.menuCategories, Routes.categories, 'category.read'),
        _Item(Icons.local_shipping_outlined, (l) => l.menuPurchases, Routes.purchases, 'purchase.read'),
        _Item(Icons.factory_outlined, (l) => l.menuSuppliers, Routes.suppliers, 'supplier.read'),
        _Item(Icons.people_alt_outlined, (l) => l.menuCustomers, Routes.customers, 'customer.read'),
      ]),
      _Group((l) => l.people, [
        _Item(Icons.badge_outlined, (l) => l.menuEmployees, Routes.employees, 'employee.read'),
        _Item(Icons.fact_check_outlined, (l) => l.menuAttendance, Routes.attendance, 'attendance.read'),
      ]),
      _Group((l) => l.money, [
        _Item(Icons.savings_outlined, (l) => l.menuExpenses, Routes.expenses, 'expense.read'),
        _Item(Icons.account_balance_wallet_outlined, (l) => l.menuFinance, Routes.finance, 'finance.read'),
        _Item(Icons.assessment_outlined, (l) => l.menuReports, Routes.reports, 'finance.read'),
      ]),
      _Group((l) => l.system, [
        _Item(Icons.table_view_rounded, (l) => l.menuSheets, Routes.sheets, 'sheet.read'),
        _Item(Icons.settings_outlined, (l) => l.menuSettings, Routes.settings),
        _Item(Icons.help_outline_rounded, (l) => l.menuHelp, Routes.help),
      ]),
    ];

    return Drawer(
      backgroundColor: Theme.of(context).scaffoldBackgroundColor,
      child: SafeArea(
        child: Column(
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 18, 20, 6),
              child: Row(
                children: [
                  Image.asset(_assetsLogo, width: 132, fit: BoxFit.contain),
                ],
              ),
            ),
            if (ctx != null)
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
                child: Row(
                  children: [
                    Container(
                      width: 34,
                      height: 34,
                      alignment: Alignment.center,
                      decoration: BoxDecoration(
                        color: NgColors.blue.withValues(alpha: 0.12),
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: Text(
                        (app.activeBranch?.name ?? '?').characters.first.toUpperCase(),
                        style: TextStyle(
                            fontWeight: FontWeight.w900,
                            color: Theme.of(context).colorScheme.primary),
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(app.activeCompanyName,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: const TextStyle(
                                  fontSize: 12.5, fontWeight: FontWeight.w800)),
                          Text(
                            app.activeBranch?.name ?? ctx.primaryRoleKey ?? '—',
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: TextStyle(
                                fontSize: 10.5, color: Theme.of(context).hintColor),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            const Divider(height: 1),
            Expanded(
              child: ListView(
                padding: const EdgeInsets.only(top: 4),
                children: [
                  for (final g in groups) ...[
                    Padding(
                      padding: const EdgeInsets.fromLTRB(20, 14, 20, 4),
                      child: Text(g.title(l),
                          style: TextStyle(
                              fontSize: 9.5,
                              letterSpacing: 1.4,
                              fontWeight: FontWeight.w800,
                              color: Theme.of(context).hintColor)),
                    ),
                    for (final item in g.items)
                      if (item.permission == null || (ctx?.can(item.permission!) ?? false))
                        ListTile(
                          dense: true,
                          leading: Icon(item.icon, size: 21),
                          title: Text(item.label(l),
                              style: const TextStyle(
                                  fontSize: 13, fontWeight: FontWeight.w600)),
                          onTap: () {
                            Navigator.pop(context);
                            Navigator.pushNamed(context, item.route);
                          },
                        ),
                  ],
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
