/// Central configuration for the NIAGANTARA mobile app.
///
/// The production API base URL is the default; it can be overridden per build
/// with --dart-define so no environment-specific URL is ever hardcoded across
/// the codebase. Only public, mobile-safe configuration lives here — server
/// secrets must never be bundled into the app.
class AppConfig {
  AppConfig._();

  static const String _defaultApiBaseUrl =
      'https://niagantara-production.up.railway.app/api/v1';

  /// Base URL of the NIAGANTARA API. Override with:
  /// flutter run --dart-define=API_BASE_URL=http://10.0.2.2:3000/api/v1
  static const String apiBaseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: _defaultApiBaseUrl,
  );

  static const String appName = 'NIAGANTARA';

  /// Request timeouts.
  static const Duration connectTimeout = Duration(seconds: 15);
  static const Duration receiveTimeout = Duration(seconds: 30);

  /// Default page size used by cursor/list endpoints.
  static const int defaultPageSize = 50;
}
