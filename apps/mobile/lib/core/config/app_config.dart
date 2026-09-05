class AppConfig {
  AppConfig._();

  static const String _defaultApiBaseUrl =
      'https://niagantara-production.up.railway.app/api/v1';

  static const String apiBaseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: _defaultApiBaseUrl,
  );

  static const String appName = 'NIAGANTARA';

  static const Duration connectTimeout = Duration(seconds: 15);
  static const Duration receiveTimeout = Duration(seconds: 30);

  static const int defaultPageSize = 50;

  static void assertSecureUrl() {
    assert(
      () {
        if (!apiBaseUrl.startsWith('https://') &&
            !apiBaseUrl.contains('localhost') &&
            !apiBaseUrl.contains('10.0.2.2')) {
          throw AssertionError(
            'API_BASE_URL must use HTTPS in release builds. '
            'Got: $apiBaseUrl',
          );
        }
        return true;
      }(),
    );
  }
}
