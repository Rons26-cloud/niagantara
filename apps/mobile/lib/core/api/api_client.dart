import 'package:dio/dio.dart';

import '../auth/session_store.dart';
import '../config/app_config.dart';
import '../errors/failure.dart';
import 'error_mapper.dart';

class ApiClient {
  ApiClient({Dio? dio, SessionStore? sessionStore})
      : _dio = dio ??
            Dio(BaseOptions(
              baseUrl: AppConfig.apiBaseUrl,
              connectTimeout: AppConfig.connectTimeout,
              receiveTimeout: AppConfig.receiveTimeout,
              headers: {'content-type': 'application/json'},
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

  Future<T> get<T>(
    String path, {
    Map<String, dynamic>? query,
    bool withTenantHeaders = true,
  }) =>
      _request<T>('GET', path, query: query, withTenantHeaders: withTenantHeaders);

  Future<T> post<T>(
    String path, {
    Object? body,
    bool withTenantHeaders = true,
  }) =>
      _request<T>('POST', path,
          body: body, withTenantHeaders: withTenantHeaders);

  Future<T> patch<T>(
    String path, {
    Object? body,
    bool withTenantHeaders = true,
  }) =>
      _request<T>('PATCH', path,
          body: body, withTenantHeaders: withTenantHeaders);

  Future<T> delete<T>(
    String path, {
    bool withTenantHeaders = true,
  }) =>
      _request<T>('DELETE', path, withTenantHeaders: withTenantHeaders);

  Future<T> _request<T>(
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
      return response.data as T;
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
