import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:flutter/widgets.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:intl/intl.dart' as intl;

import 'app_localizations_en.dart';
import 'app_localizations_id.dart';

// ignore_for_file: type=lint

/// Callers can lookup localized strings with an instance of AppLocalizations
/// returned by `AppLocalizations.of(context)`.
///
/// Applications need to include `AppLocalizations.delegate()` in their app's
/// `localizationDelegates` list, and the locales they support in the app's
/// `supportedLocales` list. For example:
///
/// ```dart
/// import 'l10n/app_localizations.dart';
///
/// return MaterialApp(
///   localizationsDelegates: AppLocalizations.localizationsDelegates,
///   supportedLocales: AppLocalizations.supportedLocales,
///   home: MyApplicationHome(),
/// );
/// ```
///
/// ## Update pubspec.yaml
///
/// Please make sure to update your pubspec.yaml to include the following
/// packages:
///
/// ```yaml
/// dependencies:
///   # Internationalization support.
///   flutter_localizations:
///     sdk: flutter
///   intl: any # Use the pinned version from flutter_localizations
///
///   # Rest of dependencies
/// ```
///
/// ## iOS Applications
///
/// iOS applications define key application metadata, including supported
/// locales, in an Info.plist file that is built into the application bundle.
/// To configure the locales supported by your app, you’ll need to edit this
/// file.
///
/// First, open your project’s ios/Runner.xcworkspace Xcode workspace file.
/// Then, in the Project Navigator, open the Info.plist file under the Runner
/// project’s Runner folder.
///
/// Next, select the Information Property List item, select Add Item from the
/// Editor menu, then select Localizations from the pop-up menu.
///
/// Select and expand the newly-created Localizations item then, for each
/// locale your application supports, add a new item and select the locale
/// you wish to add from the pop-up menu in the Value field. This list should
/// be consistent with the languages listed in the AppLocalizations.supportedLocales
/// property.
abstract class AppLocalizations {
  AppLocalizations(String locale)
      : localeName = intl.Intl.canonicalizedLocale(locale.toString());

  final String localeName;

  static AppLocalizations of(BuildContext context) {
    return Localizations.of<AppLocalizations>(context, AppLocalizations)!;
  }

  static const LocalizationsDelegate<AppLocalizations> delegate =
      _AppLocalizationsDelegate();

  /// A list of this localizations delegate along with the default localizations
  /// delegates.
  ///
  /// Returns a list of localizations delegates containing this delegate along with
  /// GlobalMaterialLocalizations.delegate, GlobalCupertinoLocalizations.delegate,
  /// and GlobalWidgetsLocalizations.delegate.
  ///
  /// Additional delegates can be added by appending to this list in
  /// MaterialApp. This list does not have to be used at all if a custom list
  /// of delegates is preferred or required.
  static const List<LocalizationsDelegate<dynamic>> localizationsDelegates =
      <LocalizationsDelegate<dynamic>>[
    delegate,
    GlobalMaterialLocalizations.delegate,
    GlobalCupertinoLocalizations.delegate,
    GlobalWidgetsLocalizations.delegate,
  ];

  /// A list of this localizations delegate's supported locales.
  static const List<Locale> supportedLocales = <Locale>[
    Locale('en'),
    Locale('id')
  ];

  /// No description provided for @appName.
  ///
  /// In en, this message translates to:
  /// **'NIAGANTARA'**
  String get appName;

  /// No description provided for @ok.
  ///
  /// In en, this message translates to:
  /// **'OK'**
  String get ok;

  /// No description provided for @cancel.
  ///
  /// In en, this message translates to:
  /// **'Cancel'**
  String get cancel;

  /// No description provided for @save.
  ///
  /// In en, this message translates to:
  /// **'Save'**
  String get save;

  /// No description provided for @delete.
  ///
  /// In en, this message translates to:
  /// **'Delete'**
  String get delete;

  /// No description provided for @edit.
  ///
  /// In en, this message translates to:
  /// **'Edit'**
  String get edit;

  /// No description provided for @retry.
  ///
  /// In en, this message translates to:
  /// **'Retry'**
  String get retry;

  /// No description provided for @loading.
  ///
  /// In en, this message translates to:
  /// **'Loading…'**
  String get loading;

  /// No description provided for @search.
  ///
  /// In en, this message translates to:
  /// **'Search'**
  String get search;

  /// No description provided for @close.
  ///
  /// In en, this message translates to:
  /// **'Close'**
  String get close;

  /// No description provided for @back.
  ///
  /// In en, this message translates to:
  /// **'Back'**
  String get back;

  /// No description provided for @next.
  ///
  /// In en, this message translates to:
  /// **'Next'**
  String get next;

  /// No description provided for @done.
  ///
  /// In en, this message translates to:
  /// **'Done'**
  String get done;

  /// No description provided for @confirm.
  ///
  /// In en, this message translates to:
  /// **'Confirm'**
  String get confirm;

  /// No description provided for @add.
  ///
  /// In en, this message translates to:
  /// **'Add'**
  String get add;

  /// No description provided for @remove.
  ///
  /// In en, this message translates to:
  /// **'Remove'**
  String get remove;

  /// No description provided for @clear.
  ///
  /// In en, this message translates to:
  /// **'Clear'**
  String get clear;

  /// No description provided for @total.
  ///
  /// In en, this message translates to:
  /// **'Total'**
  String get total;

  /// No description provided for @subtotal.
  ///
  /// In en, this message translates to:
  /// **'Subtotal'**
  String get subtotal;

  /// No description provided for @discount.
  ///
  /// In en, this message translates to:
  /// **'Discount'**
  String get discount;

  /// No description provided for @tax.
  ///
  /// In en, this message translates to:
  /// **'Tax'**
  String get tax;

  /// No description provided for @quantity.
  ///
  /// In en, this message translates to:
  /// **'Qty'**
  String get quantity;

  /// No description provided for @stock.
  ///
  /// In en, this message translates to:
  /// **'Stock'**
  String get stock;

  /// No description provided for @price.
  ///
  /// In en, this message translates to:
  /// **'Price'**
  String get price;

  /// No description provided for @name.
  ///
  /// In en, this message translates to:
  /// **'Name'**
  String get name;

  /// No description provided for @code.
  ///
  /// In en, this message translates to:
  /// **'Code'**
  String get code;

  /// No description provided for @phone.
  ///
  /// In en, this message translates to:
  /// **'Phone'**
  String get phone;

  /// No description provided for @email.
  ///
  /// In en, this message translates to:
  /// **'Email'**
  String get email;

  /// No description provided for @address.
  ///
  /// In en, this message translates to:
  /// **'Address'**
  String get address;

  /// No description provided for @status.
  ///
  /// In en, this message translates to:
  /// **'Status'**
  String get status;

  /// No description provided for @date.
  ///
  /// In en, this message translates to:
  /// **'Date'**
  String get date;

  /// No description provided for @from.
  ///
  /// In en, this message translates to:
  /// **'From'**
  String get from;

  /// No description provided for @to.
  ///
  /// In en, this message translates to:
  /// **'To'**
  String get to;

  /// No description provided for @notes.
  ///
  /// In en, this message translates to:
  /// **'Notes'**
  String get notes;

  /// No description provided for @submit.
  ///
  /// In en, this message translates to:
  /// **'Submit'**
  String get submit;

  /// No description provided for @optional.
  ///
  /// In en, this message translates to:
  /// **'optional'**
  String get optional;

  /// No description provided for @requiredField.
  ///
  /// In en, this message translates to:
  /// **'This field is required'**
  String get requiredField;

  /// No description provided for @invalidNumber.
  ///
  /// In en, this message translates to:
  /// **'Enter a valid number'**
  String get invalidNumber;

  /// No description provided for @invalidEmail.
  ///
  /// In en, this message translates to:
  /// **'Enter a valid email'**
  String get invalidEmail;

  /// No description provided for @passwordTooShort.
  ///
  /// In en, this message translates to:
  /// **'Minimum 12 characters'**
  String get passwordTooShort;

  /// No description provided for @unknownError.
  ///
  /// In en, this message translates to:
  /// **'Something went wrong. Please try again.'**
  String get unknownError;

  /// No description provided for @noInternet.
  ///
  /// In en, this message translates to:
  /// **'No internet connection. Check your network.'**
  String get noInternet;

  /// No description provided for @timeoutError.
  ///
  /// In en, this message translates to:
  /// **'The server took too long to respond.'**
  String get timeoutError;

  /// No description provided for @serverError.
  ///
  /// In en, this message translates to:
  /// **'Server error. Please try again later.'**
  String get serverError;

  /// No description provided for @unauthorized.
  ///
  /// In en, this message translates to:
  /// **'Your session has expired. Please sign in again.'**
  String get unauthorized;

  /// No description provided for @forbidden.
  ///
  /// In en, this message translates to:
  /// **'You do not have permission for this action.'**
  String get forbidden;

  /// No description provided for @maintenance.
  ///
  /// In en, this message translates to:
  /// **'System maintenance in progress.'**
  String get maintenance;

  /// No description provided for @notFound.
  ///
  /// In en, this message translates to:
  /// **'Data not found.'**
  String get notFound;

  /// No description provided for @emptyGeneric.
  ///
  /// In en, this message translates to:
  /// **'No data yet'**
  String get emptyGeneric;

  /// No description provided for @all.
  ///
  /// In en, this message translates to:
  /// **'All'**
  String get all;

  /// No description provided for @navHome.
  ///
  /// In en, this message translates to:
  /// **'Home'**
  String get navHome;

  /// No description provided for @navTransactions.
  ///
  /// In en, this message translates to:
  /// **'Sales'**
  String get navTransactions;

  /// No description provided for @navNotifications.
  ///
  /// In en, this message translates to:
  /// **'Inbox'**
  String get navNotifications;

  /// No description provided for @navAccount.
  ///
  /// In en, this message translates to:
  /// **'Account'**
  String get navAccount;

  /// No description provided for @menuPos.
  ///
  /// In en, this message translates to:
  /// **'POS / Cashier'**
  String get menuPos;

  /// No description provided for @menuProducts.
  ///
  /// In en, this message translates to:
  /// **'Products'**
  String get menuProducts;

  /// No description provided for @menuCategories.
  ///
  /// In en, this message translates to:
  /// **'Categories'**
  String get menuCategories;

  /// No description provided for @menuInventory.
  ///
  /// In en, this message translates to:
  /// **'Inventory'**
  String get menuInventory;

  /// No description provided for @menuWarehouses.
  ///
  /// In en, this message translates to:
  /// **'Warehouses'**
  String get menuWarehouses;

  /// No description provided for @menuTransfers.
  ///
  /// In en, this message translates to:
  /// **'Stock Transfer'**
  String get menuTransfers;

  /// No description provided for @menuSales.
  ///
  /// In en, this message translates to:
  /// **'Sales'**
  String get menuSales;

  /// No description provided for @menuShifts.
  ///
  /// In en, this message translates to:
  /// **'Cashier Shifts'**
  String get menuShifts;

  /// No description provided for @menuReports.
  ///
  /// In en, this message translates to:
  /// **'Reports'**
  String get menuReports;

  /// No description provided for @menuCustomers.
  ///
  /// In en, this message translates to:
  /// **'Customers'**
  String get menuCustomers;

  /// No description provided for @menuSuppliers.
  ///
  /// In en, this message translates to:
  /// **'Suppliers'**
  String get menuSuppliers;

  /// No description provided for @menuPurchases.
  ///
  /// In en, this message translates to:
  /// **'Purchases'**
  String get menuPurchases;

  /// No description provided for @menuEmployees.
  ///
  /// In en, this message translates to:
  /// **'Employees'**
  String get menuEmployees;

  /// No description provided for @menuAttendance.
  ///
  /// In en, this message translates to:
  /// **'Attendance'**
  String get menuAttendance;

  /// No description provided for @menuExpenses.
  ///
  /// In en, this message translates to:
  /// **'Expenses'**
  String get menuExpenses;

  /// No description provided for @menuFinance.
  ///
  /// In en, this message translates to:
  /// **'Finance'**
  String get menuFinance;

  /// No description provided for @menuSheets.
  ///
  /// In en, this message translates to:
  /// **'Google Sheets'**
  String get menuSheets;

  /// No description provided for @menuSettings.
  ///
  /// In en, this message translates to:
  /// **'Settings'**
  String get menuSettings;

  /// No description provided for @menuHelp.
  ///
  /// In en, this message translates to:
  /// **'Help'**
  String get menuHelp;

  /// No description provided for @menuAbout.
  ///
  /// In en, this message translates to:
  /// **'About'**
  String get menuAbout;

  /// No description provided for @logout.
  ///
  /// In en, this message translates to:
  /// **'Log out'**
  String get logout;

  /// No description provided for @logoutConfirm.
  ///
  /// In en, this message translates to:
  /// **'Log out from NIAGANTARA?'**
  String get logoutConfirm;

  /// No description provided for @operations.
  ///
  /// In en, this message translates to:
  /// **'Operations'**
  String get operations;

  /// No description provided for @management.
  ///
  /// In en, this message translates to:
  /// **'Management'**
  String get management;

  /// No description provided for @people.
  ///
  /// In en, this message translates to:
  /// **'People'**
  String get people;

  /// No description provided for @money.
  ///
  /// In en, this message translates to:
  /// **'Money'**
  String get money;

  /// No description provided for @system.
  ///
  /// In en, this message translates to:
  /// **'System'**
  String get system;

  /// No description provided for @loginTitle.
  ///
  /// In en, this message translates to:
  /// **'Welcome back'**
  String get loginTitle;

  /// No description provided for @loginSubtitle.
  ///
  /// In en, this message translates to:
  /// **'Sign in to manage your business'**
  String get loginSubtitle;

  /// No description provided for @password.
  ///
  /// In en, this message translates to:
  /// **'Password'**
  String get password;

  /// No description provided for @signIn.
  ///
  /// In en, this message translates to:
  /// **'Sign in'**
  String get signIn;

  /// No description provided for @signingIn.
  ///
  /// In en, this message translates to:
  /// **'Signing in…'**
  String get signingIn;

  /// No description provided for @noAccountYet.
  ///
  /// In en, this message translates to:
  /// **'No account yet?'**
  String get noAccountYet;

  /// No description provided for @createAccount.
  ///
  /// In en, this message translates to:
  /// **'Create account'**
  String get createAccount;

  /// No description provided for @registerTitle.
  ///
  /// In en, this message translates to:
  /// **'Create your company'**
  String get registerTitle;

  /// No description provided for @registerSubtitle.
  ///
  /// In en, this message translates to:
  /// **'One platform for all your operations'**
  String get registerSubtitle;

  /// No description provided for @fullName.
  ///
  /// In en, this message translates to:
  /// **'Full name'**
  String get fullName;

  /// No description provided for @companyName.
  ///
  /// In en, this message translates to:
  /// **'Company name'**
  String get companyName;

  /// No description provided for @register.
  ///
  /// In en, this message translates to:
  /// **'Register'**
  String get register;

  /// No description provided for @haveAccount.
  ///
  /// In en, this message translates to:
  /// **'Already have an account?'**
  String get haveAccount;

  /// No description provided for @forgotPassword.
  ///
  /// In en, this message translates to:
  /// **'Forgot password?'**
  String get forgotPassword;

  /// No description provided for @forgotTitle.
  ///
  /// In en, this message translates to:
  /// **'Reset your password'**
  String get forgotTitle;

  /// No description provided for @forgotSubtitle.
  ///
  /// In en, this message translates to:
  /// **'We will send a one-time code to your email'**
  String get forgotSubtitle;

  /// No description provided for @sendCode.
  ///
  /// In en, this message translates to:
  /// **'Send code'**
  String get sendCode;

  /// No description provided for @verifyTitle.
  ///
  /// In en, this message translates to:
  /// **'Verify recovery code'**
  String get verifyTitle;

  /// No description provided for @verifySubtitle.
  ///
  /// In en, this message translates to:
  /// **'Enter the code we emailed you'**
  String get verifySubtitle;

  /// No description provided for @otpLabel.
  ///
  /// In en, this message translates to:
  /// **'Recovery code'**
  String get otpLabel;

  /// No description provided for @verify.
  ///
  /// In en, this message translates to:
  /// **'Verify'**
  String get verify;

  /// No description provided for @resetTitle.
  ///
  /// In en, this message translates to:
  /// **'Set a new password'**
  String get resetTitle;

  /// No description provided for @newPassword.
  ///
  /// In en, this message translates to:
  /// **'New password'**
  String get newPassword;

  /// No description provided for @confirmPassword.
  ///
  /// In en, this message translates to:
  /// **'Confirm password'**
  String get confirmPassword;

  /// No description provided for @resetPassword.
  ///
  /// In en, this message translates to:
  /// **'Save new password'**
  String get resetPassword;

  /// No description provided for @passwordMismatch.
  ///
  /// In en, this message translates to:
  /// **'Passwords do not match'**
  String get passwordMismatch;

  /// No description provided for @sessionExpired.
  ///
  /// In en, this message translates to:
  /// **'Session expired — please sign in again.'**
  String get sessionExpired;

  /// No description provided for @onboardingWelcome.
  ///
  /// In en, this message translates to:
  /// **'Run your whole business from one app'**
  String get onboardingWelcome;

  /// No description provided for @onboardingBody.
  ///
  /// In en, this message translates to:
  /// **'POS, inventory, purchases, finance and reporting — realtime and multi-branch.'**
  String get onboardingBody;

  /// No description provided for @stepCompany.
  ///
  /// In en, this message translates to:
  /// **'Company'**
  String get stepCompany;

  /// No description provided for @stepStore.
  ///
  /// In en, this message translates to:
  /// **'Store'**
  String get stepStore;

  /// No description provided for @stepBranch.
  ///
  /// In en, this message translates to:
  /// **'Branch'**
  String get stepBranch;

  /// No description provided for @stepProduct.
  ///
  /// In en, this message translates to:
  /// **'First product'**
  String get stepProduct;

  /// No description provided for @stepPos.
  ///
  /// In en, this message translates to:
  /// **'Open POS'**
  String get stepPos;

  /// No description provided for @stepSheets.
  ///
  /// In en, this message translates to:
  /// **'Google Sheets (optional)'**
  String get stepSheets;

  /// No description provided for @createNew.
  ///
  /// In en, this message translates to:
  /// **'Create new'**
  String get createNew;

  /// No description provided for @chooseExisting.
  ///
  /// In en, this message translates to:
  /// **'Choose existing'**
  String get chooseExisting;

  /// No description provided for @skipForNow.
  ///
  /// In en, this message translates to:
  /// **'Skip for now'**
  String get skipForNow;

  /// No description provided for @finishSetup.
  ///
  /// In en, this message translates to:
  /// **'Finish setup'**
  String get finishSetup;

  /// No description provided for @setupComplete.
  ///
  /// In en, this message translates to:
  /// **'Setup complete!'**
  String get setupComplete;

  /// No description provided for @backendGap.
  ///
  /// In en, this message translates to:
  /// **'BACKEND_GAP — this capability is not available on the API yet.'**
  String get backendGap;

  /// No description provided for @sheetsConnectNote.
  ///
  /// In en, this message translates to:
  /// **'Connecting opens Google OAuth in a browser. Tokens stay on the server.'**
  String get sheetsConnectNote;

  /// No description provided for @contextStore.
  ///
  /// In en, this message translates to:
  /// **'Store'**
  String get contextStore;

  /// No description provided for @contextBranch.
  ///
  /// In en, this message translates to:
  /// **'Branch'**
  String get contextBranch;

  /// No description provided for @switchContext.
  ///
  /// In en, this message translates to:
  /// **'Switch store / branch'**
  String get switchContext;

  /// No description provided for @owner.
  ///
  /// In en, this message translates to:
  /// **'Owner'**
  String get owner;

  /// No description provided for @greeting.
  ///
  /// In en, this message translates to:
  /// **'Overview'**
  String get greeting;

  /// No description provided for @todaySales.
  ///
  /// In en, this message translates to:
  /// **'Today\'s Sales'**
  String get todaySales;

  /// No description provided for @todayProfit.
  ///
  /// In en, this message translates to:
  /// **'Today\'s Profit'**
  String get todayProfit;

  /// No description provided for @todayTransactions.
  ///
  /// In en, this message translates to:
  /// **'Transactions'**
  String get todayTransactions;

  /// No description provided for @productsSold.
  ///
  /// In en, this message translates to:
  /// **'Products Sold'**
  String get productsSold;

  /// No description provided for @lowStockItems.
  ///
  /// In en, this message translates to:
  /// **'Low Stock Items'**
  String get lowStockItems;

  /// No description provided for @salesTrend14d.
  ///
  /// In en, this message translates to:
  /// **'Sales trend (14 days)'**
  String get salesTrend14d;

  /// No description provided for @quickActions.
  ///
  /// In en, this message translates to:
  /// **'Quick actions'**
  String get quickActions;

  /// No description provided for @recentActivity.
  ///
  /// In en, this message translates to:
  /// **'Recent activity'**
  String get recentActivity;

  /// No description provided for @sheetsStatus.
  ///
  /// In en, this message translates to:
  /// **'Google Sheets'**
  String get sheetsStatus;

  /// No description provided for @connectedTo.
  ///
  /// In en, this message translates to:
  /// **'Connected to {email}'**
  String connectedTo(Object email);

  /// No description provided for @notConnected.
  ///
  /// In en, this message translates to:
  /// **'Not connected'**
  String get notConnected;

  /// No description provided for @viewAll.
  ///
  /// In en, this message translates to:
  /// **'View all'**
  String get viewAll;

  /// No description provided for @subscriptionPlan.
  ///
  /// In en, this message translates to:
  /// **'Plan'**
  String get subscriptionPlan;

  /// No description provided for @qaOpenPos.
  ///
  /// In en, this message translates to:
  /// **'Open POS'**
  String get qaOpenPos;

  /// No description provided for @qaAddProduct.
  ///
  /// In en, this message translates to:
  /// **'Add product'**
  String get qaAddProduct;

  /// No description provided for @qaStockIn.
  ///
  /// In en, this message translates to:
  /// **'Stock in'**
  String get qaStockIn;

  /// No description provided for @qaTransfer.
  ///
  /// In en, this message translates to:
  /// **'Transfer stock'**
  String get qaTransfer;

  /// No description provided for @qaAddExpense.
  ///
  /// In en, this message translates to:
  /// **'Add expense'**
  String get qaAddExpense;

  /// No description provided for @posTitle.
  ///
  /// In en, this message translates to:
  /// **'POS'**
  String get posTitle;

  /// No description provided for @scanBarcode.
  ///
  /// In en, this message translates to:
  /// **'Scan barcode'**
  String get scanBarcode;

  /// No description provided for @manualBarcode.
  ///
  /// In en, this message translates to:
  /// **'Or type barcode / SKU'**
  String get manualBarcode;

  /// No description provided for @cart.
  ///
  /// In en, this message translates to:
  /// **'Cart'**
  String get cart;

  /// No description provided for @cartEmpty.
  ///
  /// In en, this message translates to:
  /// **'Cart is empty — tap a product to add it'**
  String get cartEmpty;

  /// No description provided for @pay.
  ///
  /// In en, this message translates to:
  /// **'Pay'**
  String get pay;

  /// No description provided for @paymentMethod.
  ///
  /// In en, this message translates to:
  /// **'Payment method'**
  String get paymentMethod;

  /// No description provided for @cashReceived.
  ///
  /// In en, this message translates to:
  /// **'Cash received'**
  String get cashReceived;

  /// No description provided for @changeAmount.
  ///
  /// In en, this message translates to:
  /// **'Change'**
  String get changeAmount;

  /// No description provided for @checkoutSuccess.
  ///
  /// In en, this message translates to:
  /// **'Payment successful'**
  String get checkoutSuccess;

  /// No description provided for @activeShiftRequired.
  ///
  /// In en, this message translates to:
  /// **'Open a cashier shift before selling'**
  String get activeShiftRequired;

  /// No description provided for @outOfStock.
  ///
  /// In en, this message translates to:
  /// **'Out of stock'**
  String get outOfStock;

  /// No description provided for @cashier.
  ///
  /// In en, this message translates to:
  /// **'Cashier'**
  String get cashier;

  /// No description provided for @itemDiscount.
  ///
  /// In en, this message translates to:
  /// **'Item discount'**
  String get itemDiscount;

  /// No description provided for @percentShort.
  ///
  /// In en, this message translates to:
  /// **'%'**
  String get percentShort;

  /// No description provided for @transactionDiscount.
  ///
  /// In en, this message translates to:
  /// **'Transaction discount'**
  String get transactionDiscount;

  /// No description provided for @taxRate.
  ///
  /// In en, this message translates to:
  /// **'Tax %'**
  String get taxRate;

  /// No description provided for @printReceipt.
  ///
  /// In en, this message translates to:
  /// **'Print / Share'**
  String get printReceipt;

  /// No description provided for @newSale.
  ///
  /// In en, this message translates to:
  /// **'New sale'**
  String get newSale;

  /// No description provided for @insufficientStockCart.
  ///
  /// In en, this message translates to:
  /// **'Quantity exceeds available stock'**
  String get insufficientStockCart;

  /// No description provided for @productsTitle.
  ///
  /// In en, this message translates to:
  /// **'Products'**
  String get productsTitle;

  /// No description provided for @addProduct.
  ///
  /// In en, this message translates to:
  /// **'Add product'**
  String get addProduct;

  /// No description provided for @editProduct.
  ///
  /// In en, this message translates to:
  /// **'Edit product'**
  String get editProduct;

  /// No description provided for @sku.
  ///
  /// In en, this message translates to:
  /// **'SKU'**
  String get sku;

  /// No description provided for @category.
  ///
  /// In en, this message translates to:
  /// **'Category'**
  String get category;

  /// No description provided for @costPrice.
  ///
  /// In en, this message translates to:
  /// **'Cost price'**
  String get costPrice;

  /// No description provided for @sellingPrice.
  ///
  /// In en, this message translates to:
  /// **'Selling price'**
  String get sellingPrice;

  /// No description provided for @barcode.
  ///
  /// In en, this message translates to:
  /// **'Barcode'**
  String get barcode;

  /// No description provided for @description.
  ///
  /// In en, this message translates to:
  /// **'Description'**
  String get description;

  /// No description provided for @productSaved.
  ///
  /// In en, this message translates to:
  /// **'Product saved'**
  String get productSaved;

  /// No description provided for @archiveProduct.
  ///
  /// In en, this message translates to:
  /// **'Archive product'**
  String get archiveProduct;

  /// No description provided for @loadMore.
  ///
  /// In en, this message translates to:
  /// **'Load more'**
  String get loadMore;

  /// No description provided for @categoriesTitle.
  ///
  /// In en, this message translates to:
  /// **'Categories'**
  String get categoriesTitle;

  /// No description provided for @addCategory.
  ///
  /// In en, this message translates to:
  /// **'Add category'**
  String get addCategory;

  /// No description provided for @inventoryTitle.
  ///
  /// In en, this message translates to:
  /// **'Inventory'**
  String get inventoryTitle;

  /// No description provided for @tabLowStock.
  ///
  /// In en, this message translates to:
  /// **'Low stock'**
  String get tabLowStock;

  /// No description provided for @tabMovements.
  ///
  /// In en, this message translates to:
  /// **'Movements'**
  String get tabMovements;

  /// No description provided for @adjustStock.
  ///
  /// In en, this message translates to:
  /// **'Adjust stock'**
  String get adjustStock;

  /// No description provided for @movementType.
  ///
  /// In en, this message translates to:
  /// **'Movement type'**
  String get movementType;

  /// No description provided for @deltaQuantity.
  ///
  /// In en, this message translates to:
  /// **'Quantity change (+/-)'**
  String get deltaQuantity;

  /// No description provided for @minimumStock.
  ///
  /// In en, this message translates to:
  /// **'Minimum stock'**
  String get minimumStock;

  /// No description provided for @adjustSubmitted.
  ///
  /// In en, this message translates to:
  /// **'Stock adjusted'**
  String get adjustSubmitted;

  /// No description provided for @warehouse.
  ///
  /// In en, this message translates to:
  /// **'Warehouse'**
  String get warehouse;

  /// No description provided for @transferTitle.
  ///
  /// In en, this message translates to:
  /// **'Stock Transfer'**
  String get transferTitle;

  /// No description provided for @newTransfer.
  ///
  /// In en, this message translates to:
  /// **'New transfer'**
  String get newTransfer;

  /// No description provided for @sourceWarehouse.
  ///
  /// In en, this message translates to:
  /// **'Source warehouse'**
  String get sourceWarehouse;

  /// No description provided for @destinationWarehouse.
  ///
  /// In en, this message translates to:
  /// **'Destination warehouse'**
  String get destinationWarehouse;

  /// No description provided for @product.
  ///
  /// In en, this message translates to:
  /// **'Product'**
  String get product;

  /// No description provided for @transferQty.
  ///
  /// In en, this message translates to:
  /// **'Quantity'**
  String get transferQty;

  /// No description provided for @transferSubmitted.
  ///
  /// In en, this message translates to:
  /// **'Transfer submitted'**
  String get transferSubmitted;

  /// No description provided for @salesListTitle.
  ///
  /// In en, this message translates to:
  /// **'Sales'**
  String get salesListTitle;

  /// No description provided for @saleDetail.
  ///
  /// In en, this message translates to:
  /// **'Sale detail'**
  String get saleDetail;

  /// No description provided for @branch.
  ///
  /// In en, this message translates to:
  /// **'Branch'**
  String get branch;

  /// No description provided for @allBranches.
  ///
  /// In en, this message translates to:
  /// **'All branches'**
  String get allBranches;

  /// No description provided for @cashierFilter.
  ///
  /// In en, this message translates to:
  /// **'Cashier'**
  String get cashierFilter;

  /// No description provided for @statusPaid.
  ///
  /// In en, this message translates to:
  /// **'Paid'**
  String get statusPaid;

  /// No description provided for @statusPending.
  ///
  /// In en, this message translates to:
  /// **'Pending'**
  String get statusPending;

  /// No description provided for @statusRefunded.
  ///
  /// In en, this message translates to:
  /// **'Refunded'**
  String get statusRefunded;

  /// No description provided for @refundAction.
  ///
  /// In en, this message translates to:
  /// **'Refund'**
  String get refundAction;

  /// No description provided for @cancelAction.
  ///
  /// In en, this message translates to:
  /// **'Cancel'**
  String get cancelAction;

  /// No description provided for @reasonLabel.
  ///
  /// In en, this message translates to:
  /// **'Reason'**
  String get reasonLabel;

  /// No description provided for @refundSubmitted.
  ///
  /// In en, this message translates to:
  /// **'Refund recorded'**
  String get refundSubmitted;

  /// No description provided for @saleCancelled.
  ///
  /// In en, this message translates to:
  /// **'Sale cancelled'**
  String get saleCancelled;

  /// No description provided for @restock.
  ///
  /// In en, this message translates to:
  /// **'Restock items'**
  String get restock;

  /// No description provided for @itemsCount.
  ///
  /// In en, this message translates to:
  /// **'{count} items'**
  String itemsCount(Object count);

  /// No description provided for @shiftsTitle.
  ///
  /// In en, this message translates to:
  /// **'Cashier Shifts'**
  String get shiftsTitle;

  /// No description provided for @currentShift.
  ///
  /// In en, this message translates to:
  /// **'Current shift'**
  String get currentShift;

  /// No description provided for @openShift.
  ///
  /// In en, this message translates to:
  /// **'Open shift'**
  String get openShift;

  /// No description provided for @closeShift.
  ///
  /// In en, this message translates to:
  /// **'Close shift'**
  String get closeShift;

  /// No description provided for @openingCash.
  ///
  /// In en, this message translates to:
  /// **'Opening cash'**
  String get openingCash;

  /// No description provided for @closingCash.
  ///
  /// In en, this message translates to:
  /// **'Closing cash'**
  String get closingCash;

  /// No description provided for @difference.
  ///
  /// In en, this message translates to:
  /// **'Difference'**
  String get difference;

  /// No description provided for @shiftHistory.
  ///
  /// In en, this message translates to:
  /// **'History'**
  String get shiftHistory;

  /// No description provided for @openedAt.
  ///
  /// In en, this message translates to:
  /// **'Opened'**
  String get openedAt;

  /// No description provided for @closedAt.
  ///
  /// In en, this message translates to:
  /// **'Closed'**
  String get closedAt;

  /// No description provided for @noOpenShift.
  ///
  /// In en, this message translates to:
  /// **'No shift is open for this branch'**
  String get noOpenShift;

  /// No description provided for @shiftOpened.
  ///
  /// In en, this message translates to:
  /// **'Shift opened'**
  String get shiftOpened;

  /// No description provided for @shiftClosed.
  ///
  /// In en, this message translates to:
  /// **'Shift closed'**
  String get shiftClosed;

  /// No description provided for @customersTitle.
  ///
  /// In en, this message translates to:
  /// **'Customers'**
  String get customersTitle;

  /// No description provided for @customerCode.
  ///
  /// In en, this message translates to:
  /// **'Customer code'**
  String get customerCode;

  /// No description provided for @addCustomer.
  ///
  /// In en, this message translates to:
  /// **'Add customer'**
  String get addCustomer;

  /// No description provided for @purchaseHistory.
  ///
  /// In en, this message translates to:
  /// **'Purchase history'**
  String get purchaseHistory;

  /// No description provided for @suppliersTitle.
  ///
  /// In en, this message translates to:
  /// **'Suppliers'**
  String get suppliersTitle;

  /// No description provided for @supplierCode.
  ///
  /// In en, this message translates to:
  /// **'Supplier code'**
  String get supplierCode;

  /// No description provided for @addSupplier.
  ///
  /// In en, this message translates to:
  /// **'Add supplier'**
  String get addSupplier;

  /// No description provided for @contactPerson.
  ///
  /// In en, this message translates to:
  /// **'Contact person'**
  String get contactPerson;

  /// No description provided for @purchasesTitle.
  ///
  /// In en, this message translates to:
  /// **'Purchases'**
  String get purchasesTitle;

  /// No description provided for @addPurchase.
  ///
  /// In en, this message translates to:
  /// **'New purchase'**
  String get addPurchase;

  /// No description provided for @unitCost.
  ///
  /// In en, this message translates to:
  /// **'Unit cost'**
  String get unitCost;

  /// No description provided for @receiveAction.
  ///
  /// In en, this message translates to:
  /// **'Receive'**
  String get receiveAction;

  /// No description provided for @purchaseReceived.
  ///
  /// In en, this message translates to:
  /// **'Purchase received'**
  String get purchaseReceived;

  /// No description provided for @supplier.
  ///
  /// In en, this message translates to:
  /// **'Supplier'**
  String get supplier;

  /// No description provided for @addItem.
  ///
  /// In en, this message translates to:
  /// **'Add item'**
  String get addItem;

  /// No description provided for @employeesTitle.
  ///
  /// In en, this message translates to:
  /// **'Employees'**
  String get employeesTitle;

  /// No description provided for @addEmployee.
  ///
  /// In en, this message translates to:
  /// **'Add employee'**
  String get addEmployee;

  /// No description provided for @jobTitle.
  ///
  /// In en, this message translates to:
  /// **'Job title'**
  String get jobTitle;

  /// No description provided for @hireDate.
  ///
  /// In en, this message translates to:
  /// **'Hire date'**
  String get hireDate;

  /// No description provided for @primaryBranch.
  ///
  /// In en, this message translates to:
  /// **'Primary branch'**
  String get primaryBranch;

  /// No description provided for @assignments.
  ///
  /// In en, this message translates to:
  /// **'Branch assignments'**
  String get assignments;

  /// No description provided for @attendanceTitle.
  ///
  /// In en, this message translates to:
  /// **'Attendance'**
  String get attendanceTitle;

  /// No description provided for @clockIn.
  ///
  /// In en, this message translates to:
  /// **'Clock in'**
  String get clockIn;

  /// No description provided for @clockOut.
  ///
  /// In en, this message translates to:
  /// **'Clock out'**
  String get clockOut;

  /// No description provided for @clockedIn.
  ///
  /// In en, this message translates to:
  /// **'Clocked in at {time}'**
  String clockedIn(Object time);

  /// No description provided for @clockedOut.
  ///
  /// In en, this message translates to:
  /// **'Clocked out at {time}'**
  String clockedOut(Object time);

  /// No description provided for @attendanceHistory.
  ///
  /// In en, this message translates to:
  /// **'Attendance history'**
  String get attendanceHistory;

  /// No description provided for @employee.
  ///
  /// In en, this message translates to:
  /// **'Employee'**
  String get employee;

  /// No description provided for @expensesTitle.
  ///
  /// In en, this message translates to:
  /// **'Expenses'**
  String get expensesTitle;

  /// No description provided for @addExpense.
  ///
  /// In en, this message translates to:
  /// **'Add expense'**
  String get addExpense;

  /// No description provided for @expenseCategory.
  ///
  /// In en, this message translates to:
  /// **'Category'**
  String get expenseCategory;

  /// No description provided for @amount.
  ///
  /// In en, this message translates to:
  /// **'Amount'**
  String get amount;

  /// No description provided for @paymentMethodLabel.
  ///
  /// In en, this message translates to:
  /// **'Payment method'**
  String get paymentMethodLabel;

  /// No description provided for @expenseSaved.
  ///
  /// In en, this message translates to:
  /// **'Expense saved'**
  String get expenseSaved;

  /// No description provided for @financeTitle.
  ///
  /// In en, this message translates to:
  /// **'Finance'**
  String get financeTitle;

  /// No description provided for @revenue.
  ///
  /// In en, this message translates to:
  /// **'Revenue'**
  String get revenue;

  /// No description provided for @operatingResult.
  ///
  /// In en, this message translates to:
  /// **'Operating cash result'**
  String get operatingResult;

  /// No description provided for @tabPayables.
  ///
  /// In en, this message translates to:
  /// **'Payables'**
  String get tabPayables;

  /// No description provided for @tabReceivables.
  ///
  /// In en, this message translates to:
  /// **'Receivables'**
  String get tabReceivables;

  /// No description provided for @recordPayment.
  ///
  /// In en, this message translates to:
  /// **'Record payment'**
  String get recordPayment;

  /// No description provided for @paymentSaved.
  ///
  /// In en, this message translates to:
  /// **'Payment recorded'**
  String get paymentSaved;

  /// No description provided for @profitLossNote.
  ///
  /// In en, this message translates to:
  /// **'Basic operating cash summary — not audited accounting profit.'**
  String get profitLossNote;

  /// No description provided for @reportsTitle.
  ///
  /// In en, this message translates to:
  /// **'Reports'**
  String get reportsTitle;

  /// No description provided for @reportSales.
  ///
  /// In en, this message translates to:
  /// **'Sales report'**
  String get reportSales;

  /// No description provided for @reportProducts.
  ///
  /// In en, this message translates to:
  /// **'Top products'**
  String get reportProducts;

  /// No description provided for @reportFinance.
  ///
  /// In en, this message translates to:
  /// **'Finance report'**
  String get reportFinance;

  /// No description provided for @last7days.
  ///
  /// In en, this message translates to:
  /// **'7 days'**
  String get last7days;

  /// No description provided for @last30days.
  ///
  /// In en, this message translates to:
  /// **'30 days'**
  String get last30days;

  /// No description provided for @thisMonth.
  ///
  /// In en, this message translates to:
  /// **'This month'**
  String get thisMonth;

  /// No description provided for @sheetsTitle.
  ///
  /// In en, this message translates to:
  /// **'Google Sheets Sync'**
  String get sheetsTitle;

  /// No description provided for @connectGoogle.
  ///
  /// In en, this message translates to:
  /// **'Connect Google account'**
  String get connectGoogle;

  /// No description provided for @workbook.
  ///
  /// In en, this message translates to:
  /// **'Workbook'**
  String get workbook;

  /// No description provided for @definitions.
  ///
  /// In en, this message translates to:
  /// **'Definitions'**
  String get definitions;

  /// No description provided for @syncHistory.
  ///
  /// In en, this message translates to:
  /// **'Sync history'**
  String get syncHistory;

  /// No description provided for @recoveryQueue.
  ///
  /// In en, this message translates to:
  /// **'Recovery queue'**
  String get recoveryQueue;

  /// No description provided for @retrySync.
  ///
  /// In en, this message translates to:
  /// **'Retry'**
  String get retrySync;

  /// No description provided for @rebuild.
  ///
  /// In en, this message translates to:
  /// **'Rebuild workbook'**
  String get rebuild;

  /// No description provided for @lastSynced.
  ///
  /// In en, this message translates to:
  /// **'Last synced'**
  String get lastSynced;

  /// No description provided for @openOAuthUrl.
  ///
  /// In en, this message translates to:
  /// **'Open link to connect'**
  String get openOAuthUrl;

  /// No description provided for @notificationsTitle.
  ///
  /// In en, this message translates to:
  /// **'Notifications'**
  String get notificationsTitle;

  /// No description provided for @notifEmpty.
  ///
  /// In en, this message translates to:
  /// **'No notifications yet'**
  String get notifEmpty;

  /// No description provided for @notifBackendGap.
  ///
  /// In en, this message translates to:
  /// **'Server push is not wired yet — this inbox shows low-stock alerts from live data.'**
  String get notifBackendGap;

  /// No description provided for @accountTitle.
  ///
  /// In en, this message translates to:
  /// **'Account'**
  String get accountTitle;

  /// No description provided for @profile.
  ///
  /// In en, this message translates to:
  /// **'Profile'**
  String get profile;

  /// No description provided for @role.
  ///
  /// In en, this message translates to:
  /// **'Role'**
  String get role;

  /// No description provided for @company.
  ///
  /// In en, this message translates to:
  /// **'Company'**
  String get company;

  /// No description provided for @plan.
  ///
  /// In en, this message translates to:
  /// **'Plan'**
  String get plan;

  /// No description provided for @securitySection.
  ///
  /// In en, this message translates to:
  /// **'Security'**
  String get securitySection;

  /// No description provided for @changePassword.
  ///
  /// In en, this message translates to:
  /// **'Change password'**
  String get changePassword;

  /// No description provided for @helpTitle.
  ///
  /// In en, this message translates to:
  /// **'Help center'**
  String get helpTitle;

  /// No description provided for @aboutTitle.
  ///
  /// In en, this message translates to:
  /// **'About NIAGANTARA'**
  String get aboutTitle;

  /// No description provided for @versionLabel.
  ///
  /// In en, this message translates to:
  /// **'App version'**
  String get versionLabel;

  /// No description provided for @terms.
  ///
  /// In en, this message translates to:
  /// **'Terms of service'**
  String get terms;

  /// No description provided for @privacy.
  ///
  /// In en, this message translates to:
  /// **'Privacy policy'**
  String get privacy;

  /// No description provided for @settingsTitle.
  ///
  /// In en, this message translates to:
  /// **'Settings'**
  String get settingsTitle;

  /// No description provided for @theme.
  ///
  /// In en, this message translates to:
  /// **'Theme'**
  String get theme;

  /// No description provided for @themeLight.
  ///
  /// In en, this message translates to:
  /// **'Light'**
  String get themeLight;

  /// No description provided for @themeBlue.
  ///
  /// In en, this message translates to:
  /// **'Blue dark'**
  String get themeBlue;

  /// No description provided for @language.
  ///
  /// In en, this message translates to:
  /// **'Language'**
  String get language;

  /// No description provided for @defaultBranchPref.
  ///
  /// In en, this message translates to:
  /// **'Default branch'**
  String get defaultBranchPref;

  /// No description provided for @notifPrefs.
  ///
  /// In en, this message translates to:
  /// **'Notification preferences'**
  String get notifPrefs;

  /// No description provided for @prefLowStock.
  ///
  /// In en, this message translates to:
  /// **'Low stock alerts'**
  String get prefLowStock;

  /// No description provided for @prefSalesActivity.
  ///
  /// In en, this message translates to:
  /// **'Sales activity'**
  String get prefSalesActivity;

  /// No description provided for @prefSyncErrors.
  ///
  /// In en, this message translates to:
  /// **'Sync errors'**
  String get prefSyncErrors;

  /// No description provided for @langEn.
  ///
  /// In en, this message translates to:
  /// **'English'**
  String get langEn;

  /// No description provided for @langId.
  ///
  /// In en, this message translates to:
  /// **'Bahasa Indonesia'**
  String get langId;

  /// No description provided for @allMethods.
  ///
  /// In en, this message translates to:
  /// **'All methods'**
  String get allMethods;

  /// No description provided for @amountReceived.
  ///
  /// In en, this message translates to:
  /// **'Amount received'**
  String get amountReceived;

  /// No description provided for @backToPos.
  ///
  /// In en, this message translates to:
  /// **'Back to POS'**
  String get backToPos;

  /// No description provided for @barcodeOptional.
  ///
  /// In en, this message translates to:
  /// **'Barcode (optional)'**
  String get barcodeOptional;

  /// No description provided for @cancelSale.
  ///
  /// In en, this message translates to:
  /// **'Cancel sale'**
  String get cancelSale;

  /// No description provided for @cancelShort.
  ///
  /// In en, this message translates to:
  /// **'Cancel'**
  String get cancelShort;

  /// No description provided for @cashReceivedLabel.
  ///
  /// In en, this message translates to:
  /// **'Cash received'**
  String get cashReceivedLabel;

  /// No description provided for @categoryOptional.
  ///
  /// In en, this message translates to:
  /// **'Category (optional)'**
  String get categoryOptional;

  /// No description provided for @changeDue.
  ///
  /// In en, this message translates to:
  /// **'Change'**
  String get changeDue;

  /// No description provided for @checkoutTitle.
  ///
  /// In en, this message translates to:
  /// **'Checkout'**
  String get checkoutTitle;

  /// No description provided for @chooseBranch.
  ///
  /// In en, this message translates to:
  /// **'Active branch'**
  String get chooseBranch;

  /// No description provided for @confirmShort.
  ///
  /// In en, this message translates to:
  /// **'Confirm'**
  String get confirmShort;

  /// No description provided for @copied.
  ///
  /// In en, this message translates to:
  /// **'Copied to clipboard'**
  String get copied;

  /// No description provided for @copyReceipt.
  ///
  /// In en, this message translates to:
  /// **'Copy receipt text'**
  String get copyReceipt;

  /// No description provided for @darkModeLabel.
  ///
  /// In en, this message translates to:
  /// **'Dark mode (blue)'**
  String get darkModeLabel;

  /// No description provided for @dateLabel.
  ///
  /// In en, this message translates to:
  /// **'Date'**
  String get dateLabel;

  /// No description provided for @daysSuffix.
  ///
  /// In en, this message translates to:
  /// **'days'**
  String get daysSuffix;

  /// No description provided for @descriptionOptional.
  ///
  /// In en, this message translates to:
  /// **'Description (optional)'**
  String get descriptionOptional;

  /// No description provided for @emptyProducts.
  ///
  /// In en, this message translates to:
  /// **'No products found'**
  String get emptyProducts;

  /// No description provided for @exactAmount.
  ///
  /// In en, this message translates to:
  /// **'Exact'**
  String get exactAmount;

  /// No description provided for @insufficientPayment.
  ///
  /// In en, this message translates to:
  /// **'Cash received is less than the total'**
  String get insufficientPayment;

  /// No description provided for @itemDiscounts.
  ///
  /// In en, this message translates to:
  /// **'Item discounts'**
  String get itemDiscounts;

  /// No description provided for @itemsSuffix.
  ///
  /// In en, this message translates to:
  /// **'items'**
  String get itemsSuffix;

  /// No description provided for @languageEnglish.
  ///
  /// In en, this message translates to:
  /// **'English'**
  String get languageEnglish;

  /// No description provided for @languageIndonesian.
  ///
  /// In en, this message translates to:
  /// **'Bahasa Indonesia'**
  String get languageIndonesian;

  /// No description provided for @logoutConfirmTitle.
  ///
  /// In en, this message translates to:
  /// **'Sign out of NIAGANTARA?'**
  String get logoutConfirmTitle;

  /// No description provided for @manualBarcodeHint.
  ///
  /// In en, this message translates to:
  /// **'Type barcode / SKU'**
  String get manualBarcodeHint;

  /// No description provided for @none.
  ///
  /// In en, this message translates to:
  /// **'None'**
  String get none;

  /// No description provided for @notifDailySummary.
  ///
  /// In en, this message translates to:
  /// **'Daily summary notification'**
  String get notifDailySummary;

  /// No description provided for @notifLowStock.
  ///
  /// In en, this message translates to:
  /// **'Low stock alert'**
  String get notifLowStock;

  /// No description provided for @payCash.
  ///
  /// In en, this message translates to:
  /// **'Cash'**
  String get payCash;

  /// No description provided for @payEwallet.
  ///
  /// In en, this message translates to:
  /// **'E-Wallet'**
  String get payEwallet;

  /// No description provided for @payNow.
  ///
  /// In en, this message translates to:
  /// **'Pay now'**
  String get payNow;

  /// No description provided for @payOther.
  ///
  /// In en, this message translates to:
  /// **'Other'**
  String get payOther;

  /// No description provided for @payQris.
  ///
  /// In en, this message translates to:
  /// **'QRIS'**
  String get payQris;

  /// No description provided for @payTransfer.
  ///
  /// In en, this message translates to:
  /// **'Transfer'**
  String get payTransfer;

  /// No description provided for @paymentReferenceOptional.
  ///
  /// In en, this message translates to:
  /// **'Reference (optional)'**
  String get paymentReferenceOptional;

  /// No description provided for @productName.
  ///
  /// In en, this message translates to:
  /// **'Product name'**
  String get productName;

  /// No description provided for @pushNotAvailable.
  ///
  /// In en, this message translates to:
  /// **'Push notifications are not available yet — alerts below are pulled live.'**
  String get pushNotAvailable;

  /// No description provided for @quantityLabel.
  ///
  /// In en, this message translates to:
  /// **'Quantity'**
  String get quantityLabel;

  /// No description provided for @reasonOptional.
  ///
  /// In en, this message translates to:
  /// **'Reason (optional)'**
  String get reasonOptional;

  /// No description provided for @receiptNo.
  ///
  /// In en, this message translates to:
  /// **'Receipt no.'**
  String get receiptNo;

  /// No description provided for @receiptTitle.
  ///
  /// In en, this message translates to:
  /// **'Receipt'**
  String get receiptTitle;

  /// No description provided for @receiveGoods.
  ///
  /// In en, this message translates to:
  /// **'Receive goods'**
  String get receiveGoods;

  /// No description provided for @refundSale.
  ///
  /// In en, this message translates to:
  /// **'Refund sale'**
  String get refundSale;

  /// No description provided for @refundsLabel.
  ///
  /// In en, this message translates to:
  /// **'Refunds'**
  String get refundsLabel;

  /// No description provided for @reportExportWebOnly.
  ///
  /// In en, this message translates to:
  /// **'PDF/XLSX export is available on the web dashboard.'**
  String get reportExportWebOnly;

  /// No description provided for @reportServerTruth.
  ///
  /// In en, this message translates to:
  /// **'Figures come straight from the finance ledger; the backend remains the source of truth.'**
  String get reportServerTruth;

  /// No description provided for @salesDetailTitle.
  ///
  /// In en, this message translates to:
  /// **'Sale detail'**
  String get salesDetailTitle;

  /// No description provided for @salesTitle.
  ///
  /// In en, this message translates to:
  /// **'Sales'**
  String get salesTitle;

  /// No description provided for @saveChanges.
  ///
  /// In en, this message translates to:
  /// **'Save changes'**
  String get saveChanges;

  /// No description provided for @saved.
  ///
  /// In en, this message translates to:
  /// **'Saved'**
  String get saved;

  /// No description provided for @scan.
  ///
  /// In en, this message translates to:
  /// **'Scan'**
  String get scan;

  /// No description provided for @searchProducts.
  ///
  /// In en, this message translates to:
  /// **'Search products…'**
  String get searchProducts;

  /// No description provided for @searchTransaction.
  ///
  /// In en, this message translates to:
  /// **'Search transaction no…'**
  String get searchTransaction;

  /// No description provided for @settingsLanguageTitle.
  ///
  /// In en, this message translates to:
  /// **'Language'**
  String get settingsLanguageTitle;

  /// No description provided for @sheetsHistoryTitle.
  ///
  /// In en, this message translates to:
  /// **'Sync history'**
  String get sheetsHistoryTitle;

  /// No description provided for @sheetsRebuild.
  ///
  /// In en, this message translates to:
  /// **'Rebuild workbook'**
  String get sheetsRebuild;

  /// No description provided for @sheetsRecoveryTitle.
  ///
  /// In en, this message translates to:
  /// **'Recovery queue'**
  String get sheetsRecoveryTitle;

  /// No description provided for @shiftClose.
  ///
  /// In en, this message translates to:
  /// **'Close shift'**
  String get shiftClose;

  /// No description provided for @shiftClosedBanner.
  ///
  /// In en, this message translates to:
  /// **'No open shift for this branch — open one to sell.'**
  String get shiftClosedBanner;

  /// No description provided for @shiftOpen.
  ///
  /// In en, this message translates to:
  /// **'Open shift'**
  String get shiftOpen;

  /// No description provided for @shiftRequiredFirst.
  ///
  /// In en, this message translates to:
  /// **'Open a shift before checkout.'**
  String get shiftRequiredFirst;

  /// No description provided for @statusLabel.
  ///
  /// In en, this message translates to:
  /// **'Status'**
  String get statusLabel;

  /// No description provided for @statusOpen.
  ///
  /// In en, this message translates to:
  /// **'Open'**
  String get statusOpen;

  /// No description provided for @statusSettled.
  ///
  /// In en, this message translates to:
  /// **'Settled'**
  String get statusSettled;

  /// No description provided for @tabHistory.
  ///
  /// In en, this message translates to:
  /// **'History'**
  String get tabHistory;

  /// No description provided for @tabReport.
  ///
  /// In en, this message translates to:
  /// **'Report'**
  String get tabReport;

  /// No description provided for @tabStock.
  ///
  /// In en, this message translates to:
  /// **'Stock'**
  String get tabStock;

  /// No description provided for @transferSameWarehouse.
  ///
  /// In en, this message translates to:
  /// **'Source and destination must differ'**
  String get transferSameWarehouse;

  /// No description provided for @transferStock.
  ///
  /// In en, this message translates to:
  /// **'Transfer stock'**
  String get transferStock;

  /// No description provided for @transfersTitle.
  ///
  /// In en, this message translates to:
  /// **'Transfers'**
  String get transfersTitle;

  /// No description provided for @txnDiscount.
  ///
  /// In en, this message translates to:
  /// **'Discount'**
  String get txnDiscount;

  /// No description provided for @warehouseMissing.
  ///
  /// In en, this message translates to:
  /// **'No active warehouse found for this branch.'**
  String get warehouseMissing;
}

class _AppLocalizationsDelegate
    extends LocalizationsDelegate<AppLocalizations> {
  const _AppLocalizationsDelegate();

  @override
  Future<AppLocalizations> load(Locale locale) {
    return SynchronousFuture<AppLocalizations>(lookupAppLocalizations(locale));
  }

  @override
  bool isSupported(Locale locale) =>
      <String>['en', 'id'].contains(locale.languageCode);

  @override
  bool shouldReload(_AppLocalizationsDelegate old) => false;
}

AppLocalizations lookupAppLocalizations(Locale locale) {
  // Lookup logic when only language code is specified.
  switch (locale.languageCode) {
    case 'en':
      return AppLocalizationsEn();
    case 'id':
      return AppLocalizationsId();
  }

  throw FlutterError(
      'AppLocalizations.delegate failed to load unsupported locale "$locale". This is likely '
      'an issue with the localizations generation tool. Please file an issue '
      'on GitHub with a reproducible sample app and the gen-l10n configuration '
      'that was used.');
}
