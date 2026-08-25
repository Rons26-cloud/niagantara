import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart' show ThemeMode;

import '../api/api_client.dart';
import '../auth/auth_repository.dart';
import '../auth/session_store.dart';
import '../errors/failure.dart';
import '../models/org_context.dart';
import '../storage/app_preferences.dart';

export '../storage/app_preferences.dart'
    show AppPreferences, ThemeModePref, LanguagePref;

/// Root application state: session, business context, theme and language.
///
/// Single ChangeNotifier so the shell can react to login/logout/context
/// changes without a heavy state framework.
class AppController extends ChangeNotifier {
  AppController({
    required ApiClient api,
    required SessionStore session,
    required AuthRepository auth,
    required this.prefs,
  })  : _api = api,
        _session = session,
        _auth = auth {
    // 401 anywhere in the app → drop session and surface the login screen.
    _api.onUnauthorized = (_) {
      ctx = null;
      loggedIn = false;
      sessionExpired = true;
      notifyListeners();
    };
  }

  final ApiClient _api;
  final SessionStore _session;
  final AuthRepository _auth;
  final AppPreferences prefs;

  /// Exposed for Provider wiring of feature repositories.
  ApiClient get apiClient => _api;
  AuthRepository get auth => _auth;

  bool booted = false;
  bool loggedIn = false;
  bool sessionExpired = false;
  OrgContext? ctx;

  /// company_id → display name (from GET /companies).
  Map<String, String> companyNames = {};

  String get activeCompanyName {
    final id = ctx?.activeCompanyId;
    if (id == null) return '';
    return companyNames[id] ?? id;
  }

  ThemeModePref get theme => prefs.theme;
  LanguagePref get localePref => prefs.locale;

  /// Convenience for MaterialApp.themeMode.
  ThemeMode get themeMode =>
      prefs.theme == ThemeModePref.blueDark ? ThemeMode.dark : ThemeMode.light;

  /// The branch all operational calls are scoped to.
  BranchRef? get activeBranch => _activeBranch;
  BranchRef? _activeBranch;
  StoreRef? get activeStore => ctx?.stores
      .where((s) => s.id == (_activeBranch?.storeId ?? ''))
      .firstOrNull ?? (ctx != null && ctx!.stores.isNotEmpty ? ctx!.stores.first : null);

  /// Boot: restore persisted preferences + session, then /auth/me.
  Future<void> boot() async {
    final hasToken = await _session.hasSession();
    if (hasToken) {
      try {
        ctx = await _auth.me();
        loggedIn = true;
        await _applyPersistedContext();
      } on Failure {
        await _session.clear();
        loggedIn = false;
      } catch (_) {
        loggedIn = false;
      }
    }
    booted = true;
    notifyListeners();
  }

  Future<void> afterLogin() async {
    ctx = await _auth.me();
    loggedIn = true;
    sessionExpired = false;
    await _applyPersistedContext();
    await loadCompanyNames();
    notifyListeners();
  }

  /// Best-effort: names for the context switcher. Fails soft because
  /// company.read may be absent for some roles.
  Future<void> loadCompanyNames() async {
    try {
      final rows = await _api.get('/companies') as List<dynamic>;
      companyNames = {
        for (final r in rows.whereType<Map<String, dynamic>>())
          r['id'].toString(): (r['name'] ?? '').toString(),
      };
      notifyListeners();
    } on Failure catch (f) {
      if (f.isUnauthorized) rethrow;
    } catch (_) {/* keep ids as fallback */}
  }

  Future<void> _applyPersistedContext() async {
    final c = ctx;
    if (c == null) return;
    final companyId =
        c.activeCompanyId ?? (c.companies.isNotEmpty ? c.companies.first['company_id'] as String? : null);
    if (companyId != null && companyId.isNotEmpty) {
      await _session.setActiveCompany(companyId);
    }
    BranchRef? branch;
    final savedDefault = prefs.defaultBranchId;
    branch = c.branches.where((b) => b.id == savedDefault).firstOrNull ??
        c.branches.where((b) => b.isActive).firstOrNull;
    _activeBranch = branch;
    if (branch != null) await _session.setActiveBranch(branch.id);
    notifyListeners();
  }

  Future<void> selectBranch(BranchRef branch) async {
    _activeBranch = branch;
    await _session.setActiveBranch(branch.id);
    await prefs.setDefaultBranchId(branch.id);
    notifyListeners();
  }

  Future<void> refreshContext() async {
    ctx = await _auth.me();
    await _applyPersistedContext();
    await loadCompanyNames();
  }

  Future<void> logout() async {
    await _auth.logout();
    loggedIn = false;
    ctx = null;
    _activeBranch = null;
    sessionExpired = false;
    notifyListeners();
  }

  Future<void> setTheme(ThemeModePref value) async {
    await prefs.setTheme(value);
    notifyListeners();
  }

  Future<void> setLocale(LanguagePref value) async {
    await prefs.setLocale(value);
    notifyListeners();
  }
}

extension FirstOrNullX<E> on Iterable<E> {
  E? get firstOrNull => isEmpty ? null : first;
}
