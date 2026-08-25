import 'package:dio/dio.dart';

import '../auth/session_store.dart';
import '../config/app_config.dart';
import 'error_mapper.dart';

/// Single HTTP entry point for every feature.
///
/// - Attaches `Authorization: Bearer` and tenant headers automatically.
/// - On 401, clears the stored session and notifies listeners so the app can
///   return to the login screen (expired session handling).
class ApiClient {
  ApiClient({Dio? dio, SessionStore? sessionStore})
      : _dio = dio ??
            Dio(BaseOptions(
              baseUrl: AppConfig.apiBaseUrl,
              connectTimeout: AppConfig.connectTimeout,
              receiveTimeout: AppConfig.receiveTimeout,
              headers: {'content-type': 'application/json'},
              validateStatus: (status) => status != null && status < 500,
            )),
        _sessionStore = sessionStore ?? SessionStore() {
    _dio.interceptors.add(InterceptorsWrapper(onRequest: (options, handler) async {
      final token = await _sessionStore.readAccessToken();
      if (token != null && token.isNotEmpty) {
        options.headers['authorization'] = 'Bearer $token';
      }
      final companyId = await _sessionStore.readActiveCompanyId();
      if (companyId != null && companyId.isNotEmpty) {
        options.headers['x-company-id'] = companyId;
      }
      final branchId = await _sessionStore.readActiveBranchId();
      if (branchId != null && branchId.isNotEmpty) {
        options.headers['x-branch-id'] = branchId;
      }
      handler.next(options);
    }));
  }

  final Dio _dio;
  final SessionStore _sessionStore;

  void Function(Failure failure)? onUnauthorized;

  /// Escape hatch for endpoints that must run without tenant context
  /// (e.g. /auth/login). Returns the raw response body decoded JSON.
  Future<dynamic> get(
    String path, {
    Map<String, dynamic>? query,
    bool withTenantHeaders = true,
  }) =>
      _request('GET', path, query: query);

  Future<dynamic> post(String path, {Object? body}) => _request('POST', path, body: body);

  Future<dynamic> patch(String path, {Object? body}) => _request('PATCH', path, body: body);

  Future<dynamic> delete(String path) => _request('DELETE', path);

  Future<dynamic> _request(
    String method,
    String path, {
    Map<String, dynamic>? query,
    Object? body,
  }) async {
    try {
      final response = await _dio.request<dynamic>(
        path,
        options: Options(method: method),
        queryParameters: query,
        data: body,
      );
      return response.data;
    } on DioException catch (e) {
      final failure = mapToFailure(e);
      if (failure.isUnauthorized && !path.startsWith('/auth/')) {
        await _sessionStore.clear();
        onUnauthorized?.call(failure);
      }
      throw failure;
    } catch (e) {
      throw mapToFailure(e);
    }
  }
}
