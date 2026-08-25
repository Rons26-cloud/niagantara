import 'package:dio/dio.dart';

import '../errors/failure.dart';

/// Pure mapping from any thrown error to a [Failure].
///
/// Kept free of Flutter/network dependencies so it can be unit-tested
/// without mocks (see test/failure_mapping_test.dart).
Failure mapToFailure(Object error) {
  if (error is Failure) return error;
  if (error is DioException) {
    switch (error.type) {
      case DioExceptionType.connectionTimeout:
      case DioExceptionType.sendTimeout:
      case DioExceptionType.receiveTimeout:
        return const Failure(FailureKind.timeout);
      case DioExceptionType.connectionError:
        return const Failure(FailureKind.network);
      case DioExceptionType.badCertificate:
        return const Failure(FailureKind.network);
      case DioExceptionType.cancel:
        return const Failure(FailureKind.unknown, code: 'CANCELLED');
      case DioExceptionType.badResponse:
        return _fromResponse(error.response);
      default:
        break;
    }
    // Some platforms surface socket errors as `unknown`.
    final inner = error.error?.toString() ?? '';
    if (inner.contains('Failed host lookup') ||
        inner.contains('Network is unreachable') ||
        inner.contains('Connection refused')) {
      return const Failure(FailureKind.network);
    }
    return const Failure(FailureKind.unknown);
  }
  if (error is FormatException) {
    return const Failure(FailureKind.server, code: 'BAD_RESPONSE');
  }
  return Failure(FailureKind.unknown, message: error.toString());
}

Failure _fromResponse(Response<dynamic>? response) {
  final code = _errorCode(response);
  switch (response?.statusCode) {
    case 401:
      return Failure(FailureKind.unauthorized, code: code ?? 'UNAUTHORIZED');
    case 403:
      return Failure(
        FailureKind.forbidden,
        code: code ?? 'FORBIDDEN',
        message: _message(response),
      );
    case 404:
      return Failure(FailureKind.notFound, code: code ?? 'NOT_FOUND');
    case 422:
    case 400:
      return Failure(
        FailureKind.validation,
        code: code ?? 'VALIDATION',
        message: _message(response),
      );
    case 503:
      return const Failure(FailureKind.maintenance, code: 'MAINTENANCE');
    default:
      if (response != null && response.statusCode! >= 500) {
        return Failure(FailureKind.server, code: code);
      }
      return Failure(FailureKind.unknown, code: code, message: _message(response));
  }
}

String? _errorCode(Response<dynamic>? response) {
  final data = response?.data;
  if (data is Map && data['code'] is String) return data['code'] as String;
  return null;
}

String? _message(Response<dynamic>? response) {
  final data = response?.data;
  if (data is Map && data['message'] is String) return data['message'] as String;
  return null;
}
