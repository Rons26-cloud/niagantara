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
              // Make 4xx responses enter the error path so a 401 clears the
              // invalid local session instead of being returned as success.
              validateStatus: (status) =>
                  status != null && status >= 200 && status < 300,
            )),
        _sessionStore = sessionStore ?? SessionStore() {
    _dio.interceptors.add(InterceptorsWrapper(onRequest: (options, handler) async {
      final token = await _sessionStore.readAccessToken();
      if (token != null && token.isNotEmpty) {
        options.headers['authorization'] = 'Bearer $token';
      }
      if (options.extra['withTenantHeaders'] != false) {
        final companyId = await _sessionStore.readActiveCompanyId();
        if (companyId != null && companyId.isNotEmpty) {
          options.headers['x-company-id'] = companyId;
        }
        final branchId = await _sessionStore.readActiveBranchId();
        if (branchId != null && branchId.isNotEmpty) {
          options.headers['x-branch-id'] = branchId;
        }
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
      _request('GET', path, query: query, withTenantHeaders: withTenantHeaders);

  Future<dynamic> post(
    String path, {
    Object? body,
    bool withTenantHeaders = true,
  }) =>
      _request('POST', path,
          body: body, withTenantHeaders: withTenantHeaders);

  Future<dynamic> patch(
    String path, {
    Object? body,
    bool withTenantHeaders = true,
  }) =>
      _request('PATCH', path,
          body: body, withTenantHeaders: withTenantHeaders);

  Future<dynamic> delete(
    String path, {
    bool withTenantHeaders = true,
  }) =>
      _request('DELETE', path, withTenantHeaders: withTenantHeaders);

  Future<dynamic> _request(
    String method,
    String path, {
    Map<String, dynamic>? query,
    Object? body,
    bool withTenantHeaders = true,
  }) async {
    try {
      final response = await _dio.request<dynamic>(
        path,
        options: Options(
          method: method,
          extra: {'withTenantHeaders': withTenantHeaders},
        ),
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
