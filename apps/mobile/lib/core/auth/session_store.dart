import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class SessionStore {
  SessionStore({FlutterSecureStorage? storage})
      : _storage = storage ??
            const FlutterSecureStorage(
              aOptions: AndroidOptions(encryptedSharedPreferences: true),
              iOptions: IOSOptions(accessibility: KeychainAccessibility.first_unlock),
            );

  static const _kAccess = 'niagantara.access_token';
  static const _kRefresh = 'niagantara.refresh_token';
  static const _kUserId = 'niagantara.user_id';
  static const _kUserEmail = 'niagantara.user_email';
  static const _kCompanyId = 'niagantara.active_company';
  static const _kBranchId = 'niagantara.active_branch';

  final FlutterSecureStorage _storage;

  Future<String?> readAccessToken() => _storage.read(key: _kAccess);
  Future<String?> readRefreshToken() => _storage.read(key: _kRefresh);
  Future<String?> readUserId() => _storage.read(key: _kUserId);
  Future<String?> readUserEmail() => _storage.read(key: _kUserEmail);
  Future<String?> readActiveCompanyId() => _storage.read(key: _kCompanyId);
  Future<String?> readActiveBranchId() => _storage.read(key: _kBranchId);

  Future<void> saveSession({
    required String accessToken,
    String? refreshToken,
    String? userId,
    String? email,
  }) async {
    await _storage.write(key: _kAccess, value: accessToken);
    if (refreshToken != null) await _storage.write(key: _kRefresh, value: refreshToken);
    if (userId != null) await _storage.write(key: _kUserId, value: userId);
    if (email != null) await _storage.write(key: _kUserEmail, value: email);
  }

  Future<void> setActiveCompany(String companyId) =>
      _storage.write(key: _kCompanyId, value: companyId);

  Future<void> setActiveBranch(String branchId) =>
      _storage.write(key: _kBranchId, value: branchId);

  Future<void> clear() async {
    for (final key in [_kAccess, _kRefresh, _kUserId, _kUserEmail, _kCompanyId, _kBranchId]) {
      await _storage.delete(key: key);
    }
  }

  Future<bool> hasSession() async {
    final token = await readAccessToken();
    return token != null && token.isNotEmpty;
  }
}
