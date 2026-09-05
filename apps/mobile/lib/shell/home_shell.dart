import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../app/localization.dart';
import '../core/auth/app_controller.dart';
import '../features/account/account_screen.dart';
import '../features/dashboard/dashboard_screen.dart';
import '../features/expenses/expenses_screen.dart';
import '../features/notifications/notifications_screen.dart';
import '../features/products/product_form_screen.dart';
import '../features/inventory/transfers_screen.dart' show TransferFormScreen;
import '../features/sales/sales_screen.dart';
import '../app/router.dart';

/// App chrome: Beranda · Penjualan · [+] · Inbox · Akun.
///
/// The center button opens the quick-action sheet; secondary modules live in
/// the drawer reachable from every tab's app bar.
class HomeShell extends StatefulWidget {
  const HomeShell({super.key});

  @override
  State<HomeShell> createState() => _HomeShellState();
}

class _HomeShellState extends State<HomeShell> {
  int _index = 0;

  @override
  Widget build(BuildContext context) {
    final s = l(context);
    final destinations = [
      NavigationDestination(
        icon: const Icon(Icons.home_outlined),
        selectedIcon: const Icon(Icons.home_rounded),
        label: s.navHome,
      ),
      NavigationDestination(
        icon: const Icon(Icons.receipt_long_outlined),
        selectedIcon: const Icon(Icons.receipt_long_rounded),
        label: s.navTransactions,
      ),
      const NavigationDestination(
        icon: SizedBox.shrink(),
        label: '',
      ),
      NavigationDestination(
        icon: const Icon(Icons.notifications_none_rounded),
        selectedIcon: const Icon(Icons.notifications_rounded),
        label: s.navNotifications,
      ),
      NavigationDestination(
        icon: const Icon(Icons.person_outline_rounded),
        selectedIcon: const Icon(Icons.person_rounded),
        label: s.navAccount,
      ),
    ];

    final pages = [
      const DashboardScreen(embedded: true),
      const SalesScreen(),
      null, // occupied by the + button
      const NotificationsScreen(),
      const AccountScreen(),
    ];

    return Scaffold(
      body: Stack(
        children: [
          Offstage(offstage: _index != 0, child: pages[0]!),
          Offstage(offstage: _index != 1, child: pages[1]!),
          if (_index == 2) const SizedBox.shrink(),
          Offstage(offstage: _index != 3, child: pages[3]!),
          Offstage(offstage: _index != 4, child: pages[4]!),
        ],
      ),
      floatingActionButton: FloatingActionButton(
        elevation: 2,
        backgroundColor: Theme.of(context).colorScheme.primary,
        foregroundColor: Colors.white,
        shape: const CircleBorder(),
        onPressed: () => openQuickActions(context),
        child: const Icon(Icons.add_rounded, size: 28),
      ),
      floatingActionButtonLocation: FloatingActionButtonLocation.centerDocked,
      bottomNavigationBar: BottomAppBar(
        elevation: 1,
        height: 64,
        padding: EdgeInsets.zero,
        color: Theme.of(context).navigationBarTheme.backgroundColor,
        shape: const CircularNotchedRectangle(),
        notchMargin: 6,
        child: Row(
          children: [
            for (var i = 0; i < 5; i++)
              if (i == 2)
                const Spacer()
              else
                Expanded(
                  child: InkWell(
                    onTap: () => setState(() => _index = i),
                    customBorder: const StadiumBorder(),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        IconTheme.merge(
                          data: IconThemeData(
                            size: 22,
                            color: i == _index
                                ? Theme.of(context).colorScheme.primary
                                : Theme.of(context).hintColor,
                          ),
                          child: destinations[i].icon,
                        ),
                        const SizedBox(height: 2),
                        Text(
                          destinations[i].label,
                          style: TextStyle(
                            fontSize: 10.5,
                            fontWeight: FontWeight.w700,
                            color: i == _index
                                ? Theme.of(context).colorScheme.primary
                                : Theme.of(context).hintColor,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
          ],
        ),
      ),
    );
  }
}

/// Quick-action sheet behind the center [+].
void openQuickActions(BuildContext context) {
  final app = context.read<AppController>();
  final can = app.ctx?.can ?? (_) => false;
  final s = l(context);

  showModalBottomSheet<void>(
    context: context,
    showDragHandle: true,
    shape: const RoundedRectangleBorder(
      borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
    ),
    builder: (sheetCtx) => SafeArea(
      minimum: const EdgeInsets.fromLTRB(16, 0, 16, 16),
      child: Wrap(
        runSpacing: 6,
        children: [
          Padding(
            padding: const EdgeInsets.only(left: 6, bottom: 6),
            child: Text(s.quickActions,
                style:
                    const TextStyle(fontSize: 13, fontWeight: FontWeight.w800)),
          ),
          _QuickTile(
            icon: Icons.point_of_sale_rounded,
            label: s.qaOpenPos,
            enabled: can('pos.access'),
            route: Routes.pos,
          ),
          _QuickTile(
            icon: Icons.add_box_outlined,
            label: s.qaAddProduct,
            enabled: can('product.create'),
            builder: (_) => const ProductFormScreen(),
          ),
          _QuickTile(
            icon: Icons.inventory_2_outlined,
            label: s.qaStockIn,
            enabled: can('inventory.adjust'),
            route: Routes.inventory,
          ),
          _QuickTile(
            icon: Icons.swap_horiz_rounded,
            label: s.qaTransfer,
            enabled: can('inventory.transfer'),
            builder: (_) => const TransferFormScreen(),
          ),
          _QuickTile(
            icon: Icons.money_off_csred_outlined,
            label: s.qaAddExpense,
            enabled: can('expense.create'),
            onTap: () => showExpenseEntrySheet(context),
          ),
        ],
      ),
    ),
  );
}

class _QuickTile extends StatelessWidget {
  const _QuickTile({
    required this.icon,
    required this.label,
    required this.enabled,
    this.route,
    this.builder,
    this.onTap,
  });

  final IconData icon;
  final String label;
  final bool enabled;
  final String? route;
  final WidgetBuilder? builder;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    return ListTile(
      dense: true,
      enabled: enabled,
      leading: Container(
        width: 38,
        height: 38,
        decoration: BoxDecoration(
          color: enabled
              ? Theme.of(context).colorScheme.primary.withValues(alpha: 0.1)
              : Theme.of(context).dividerColor,
          borderRadius: BorderRadius.circular(11),
        ),
        child: Icon(icon,
            size: 20,
            color: enabled
                ? Theme.of(context).colorScheme.primary
                : Theme.of(context).hintColor),
      ),
      title: Text(label,
          style: const TextStyle(fontSize: 13.5, fontWeight: FontWeight.w700)),
      onTap: enabled
          ? () {
              Navigator.pop(context);
              if (route != null) Navigator.pushNamed(context, route!);
              if (builder != null) {
                Navigator.push(
                    context,
                    MaterialPageRoute<void>(
                        builder: builder!, fullscreenDialog: true));
              }
              onTap?.call();
            }
          : null,
    );
  }
}
