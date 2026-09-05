library;
import 'package:shared_preferences/shared_preferences.dart';

enum ThemeModePref { light, blueDark }

enum LanguagePref { en, id }

class AppPreferences {
  AppPreferences(this._prefs);

  static const _kTheme = 'niagantara.pref.theme';
  static const _kLocale = 'niagantara.pref.locale';
  static const _kOnboarded = 'niagantara.pref.onboarded';
  static const _kDefaultBranch = 'niagantara.pref.default_branch';
  static const _kPrefLowStock = 'niagantara.pref.notif.low_stock';
  static const _kPrefSales = 'niagantara.pref.notif.sales';
  static const _kPrefSyncErrors = 'niagantara.pref.notif.sync_errors';

  final SharedPreferences _prefs;

  ThemeModePref get theme =>
      ThemeModePref.values.asMap()[_prefs.getInt(_kTheme) ?? 0] ?? ThemeModePref.light;
  Future<void> setTheme(ThemeModePref value) => _prefs.setInt(_kTheme, value.index);

  LanguagePref get locale =>
      LanguagePref.values.asMap()[_prefs.getInt(_kLocale) ?? 1] ?? LanguagePref.id;
  Future<void> setLocale(LanguagePref value) => _prefs.setInt(_kLocale, value.index);

  bool get onboarded => _prefs.getBool(_kOnboarded) ?? false;
  Future<void> setOnboarded(bool value) => _prefs.setBool(_kOnboarded, value);

  String? get defaultBranchId => _prefs.getString(_kDefaultBranch);
  Future<void> setDefaultBranchId(String? value) async {
    if (value == null || value.isEmpty) {
      await _prefs.remove(_kDefaultBranch);
    } else {
      await _prefs.setString(_kDefaultBranch, value);
    }
  }

  bool get notifyLowStock => _prefs.getBool(_kPrefLowStock) ?? true;
  bool get notifySales => _prefs.getBool(_kPrefSales) ?? true;
  bool get notifySyncErrors => _prefs.getBool(_kPrefSyncErrors) ?? true;

  Future<void> setNotifyLowStock(bool v) => _prefs.setBool(_kPrefLowStock, v);
  Future<void> setNotifySales(bool v) => _prefs.setBool(_kPrefSales, v);
  Future<void> setNotifySyncErrors(bool v) => _prefs.setBool(_kPrefSyncErrors, v);
}

String resolveStartRoute({
  required bool hasSession,
  required bool hasCompanyContext,
  required bool onboarded,
}) {
  if (!hasSession) return '/login';
  if (!hasCompanyContext) return '/onboarding';
  return onboarded ? '/home' : '/onboarding';
}
