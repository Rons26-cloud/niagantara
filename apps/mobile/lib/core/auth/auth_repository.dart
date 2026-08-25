import '../api/api_client.dart';
import '../errors/failure.dart';
import '../models/org_context.dart';
import 'session_store.dart';

/// Talks to the existing NIAGANTARA auth endpoints. No parallel auth system —
/// the mobile app consumes exactly the same contracts as the web dashboard.
class AuthRepository {
  AuthRepository(this._api, this._session);

  final ApiClient _api;
  final SessionStore _session;

  Future<void> login(String email, String password) async {
    final res = await _api.post('/auth/login', body: {
      'email': email.trim().toLowerCase(),
      'password': password,
    }) as Map<String, dynamic>;
    final session = res['session'] as Map<String, dynamic>?;
    final token = session?['access_token']?.toString();
    if (token == null || token.isEmpty) {
      // Server reachable but no Supabase session in payload.
      throw const Failure(FailureKind.server, code: 'LOGIN_NO_SESSION');
    }
    final user = res['user'];
    await _session.saveSession(
      accessToken: token,
      refreshToken: session?['refresh_token']?.toString(),
      userId: user is Map ? user['id']?.toString() : null,
      email: email,
    );
  }

  /// Registration creates the first company in one call.
  /// Password policy: minimum 12 characters (server-enforced).
  Future<void> register({
    required String email,
    required String password,
    required String companyName,
    String? fullName,
  }) async {
    await _api.post('/auth/register', body: {
      'email': email.trim().toLowerCase(),
      'password': password,
      'companyName': companyName.trim(),
      if (fullName != null && fullName.trim().isNotEmpty)
        'fullName': fullName.trim(),
    });
  }

  Future<void> forgotPassword(String email) async {
    await _api.post('/auth/forgot-password', body: {
      'email': email.trim().toLowerCase(),
    });
  }

  /// Returns the recovery tokens issued after a valid OTP.
  Future<({String accessToken, String refreshToken})> verifyRecovery(
      String email, String otp) async {
    final res = await _api.post('/auth/verify-recovery', body: {
      'email': email.trim().toLowerCase(),
      'otp': otp.trim(),
    }) as Map<String, dynamic>;
    return (
      accessToken: res['accessToken']?.toString() ?? '',
      refreshToken: res['refreshToken']?.toString() ?? '',
    );
  }

  Future<void> resetPassword({
    required String accessToken,
    required String refreshToken,
    required String password,
    required String confirmPassword,
  }) async {
    await _api.post(
      '/auth/reset-password',
      body: {
        'password': password,
        'confirmPassword': confirmPassword,
        'refreshToken': refreshToken,
      },
    );
    // Recovery tokens are single-use; never persist them.
  }

  Future<void> logout() async {
    try {
      await _api.post('/auth/logout');
    } finally {
      await _session.clear();
    }
  }

  /// GET /auth/me → full org context (companies, permissions, stores, branches).
  Future<OrgContext> me() async {
    final res = await _api.get('/auth/me') as Map<String, dynamic>;
    return OrgContext.fromJson(res);
  }
}
