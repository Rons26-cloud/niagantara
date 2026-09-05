import 'package:flutter/material.dart';

import '../features/account/account_screen.dart';
import '../features/attendance/attendance_screen.dart';
import '../features/auth/screens/forgot_password_screen.dart';
import '../features/auth/screens/login_screen.dart';
import '../features/auth/screens/register_screen.dart';
import '../features/auth/screens/reset_password_screen.dart';
import '../features/auth/screens/verify_recovery_screen.dart';
import '../features/categories/categories_screen.dart';
import '../features/customers/customers_screen.dart';
import '../features/dashboard/dashboard_screen.dart';
import '../features/employees/employees_screen.dart';
import '../features/expenses/expenses_screen.dart';
import '../features/finance/finance_screen.dart';
import '../features/help/help_screen.dart';
import '../features/sheets/sheets_screen.dart';
import '../features/inventory/inventory_screen.dart';
import '../features/inventory/transfers_screen.dart' show TransfersScreen, TransferFormScreen;
import '../features/notifications/notifications_screen.dart';
import '../features/onboarding/onboarding_screen.dart';
import '../features/pos/barcode_scanner_screen.dart';
import '../features/pos/pos_screen.dart';
import '../features/products/product_form_screen.dart';
import '../features/products/products_screen.dart';
import '../features/purchases/purchases_screen.dart';
import '../features/reports/reports_screen.dart';
import '../features/sales/sales_detail_screen.dart';
import '../features/sales/sales_screen.dart';
import '../features/settings/settings_screen.dart';
import '../features/shifts/shifts_screen.dart';
import '../features/suppliers/suppliers_screen.dart';

class Routes {
  Routes._();

  static const login = '/login';
  static const register = '/register';
  static const forgot = '/forgot-password';
  static const verifyRecovery = '/verify-recovery';
  static const resetPassword = '/reset-password';
  static const onboarding = '/onboarding';
  static const home = '/home';
  static const pos = '/pos';
  static const barcodeScanner = '/pos/scanner';
  static const products = '/products';
  static const productForm = '/products/form';
  static const categories = '/categories';
  static const inventory = '/inventory';
  static const warehouses = '/warehouses';
  static const transfers = '/transfers';
  static const transferForm = '/transfers/new';
  static const sales = '/sales';
  static const saleDetail = '/sales/detail';
  static const shifts = '/shifts';
  static const reports = '/reports';
  static const customers = '/customers';
  static const suppliers = '/suppliers';
  static const purchases = '/purchases';
  static const purchaseForm = '/purchases/new';
  static const employees = '/employees';
  static const attendance = '/attendance';
  static const expenses = '/expenses';
  static const finance = '/finance';
  static const sheets = '/sheets';
  static const notifications = '/notifications';
  static const settings = '/settings';
  static const help = '/help';
  static const account = '/account';
}

Route<dynamic> onGenerateRoute(RouteSettings settings) {
  final Widget page;
  switch (settings.name) {
    case Routes.login:
      page = const LoginScreen();
      break;
    case Routes.register:
      page = const RegisterScreen();
      break;
    case Routes.forgot:
      page = const ForgotPasswordScreen();
      break;
    case Routes.verifyRecovery:
      page = VerifyRecoveryScreen(email: settings.arguments as String? ?? '');
      break;
    case Routes.resetPassword:
      final args = settings.arguments;
      page = ResetPasswordScreen(
        email: args is Map && args['email'] is String ? args['email'] as String : '',
        accessToken: args is Map ? args['accessToken']?.toString() : null,
        refreshToken: args is Map ? args['refreshToken']?.toString() : null,
      );
      break;
    case Routes.onboarding:
      page = const OnboardingScreen();
      break;
    case Routes.home:
      page = const DashboardScreen();
      break;
    case Routes.pos:
      page = const PosScreen();
      break;
    case Routes.barcodeScanner:
      page = const BarcodeScannerScreen();
      break;
    case Routes.products:
      page = const ProductsScreen();
      break;
    case Routes.productForm:
      page = ProductFormScreen(
        existing: settings.arguments is Map
            ? (settings.arguments as Map)['product'] as Map<String, dynamic>?
            : null,
      );
      break;
    case Routes.categories:
      page = const CategoriesScreen();
      break;
    case Routes.inventory:
      page = const InventoryScreen();
      break;
    case Routes.warehouses:
      page = const InventoryScreen();
      break;
    case Routes.transfers:
      page = const TransfersScreen();
      break;
    case Routes.transferForm:
      page = const TransferFormScreen();
      break;
    case Routes.sales:
      page = const SalesScreen();
      break;
    case Routes.saleDetail:
      page = SalesDetailScreen(saleId: settings.arguments as String? ?? '');
      break;
    case Routes.shifts:
      page = const ShiftsScreen();
      break;
    case Routes.reports:
      page = const ReportsScreen();
      break;
    case Routes.customers:
      page = const CustomersScreen();
      break;
    case Routes.suppliers:
      page = const SuppliersScreen();
      break;
    case Routes.purchases:
      page = const PurchasesScreen();
      break;
    case Routes.purchaseForm:
      page = const PurchasesScreen();
      break;
    case Routes.employees:
      page = const EmployeesScreen();
      break;
    case Routes.attendance:
      page = const AttendanceScreen();
      break;
    case Routes.expenses:
      page = const ExpensesScreen();
      break;
    case Routes.finance:
      page = const FinanceScreen();
      break;
    case Routes.sheets:
      page = const SheetsScreen();
      break;
    case Routes.notifications:
      page = const NotificationsScreen();
      break;
    case Routes.settings:
      page = const SettingsScreen();
      break;
    case Routes.help:
      page = const HelpScreen();
      break;
    case Routes.account:
      page = const AccountScreen();
      break;
    default:
      page = const LoginScreen();
  }
  return PageRouteBuilder(
    settings: settings,
    transitionDuration: const Duration(milliseconds: 220),
    reverseTransitionDuration: const Duration(milliseconds: 180),
    pageBuilder: (_, animation, __) => page,
    transitionsBuilder: (_, animation, __, child) {
      final curved =
          CurvedAnimation(parent: animation, curve: Curves.easeOutCubic);
      return SlideTransition(
        position: Tween<Offset>(
          begin: const Offset(0.04, 0),
          end: Offset.zero,
        ).animate(curved),
        child: FadeTransition(opacity: curved, child: child),
      );
    },
  );
}
