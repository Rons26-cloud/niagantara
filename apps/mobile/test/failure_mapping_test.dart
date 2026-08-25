import 'package:dio/dio.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:niagantara_mobile/core/api/error_mapper.dart';
import 'package:niagantara_mobile/core/errors/failure.dart';

DioException dioErr({
  int? status,
  String? code,
  String message = 'x',
}) {
  final response = status == null
      ? null
      : Response<dynamic>(
          requestOptions: RequestOptions(path: '/'),
          statusCode: status,
          data: {'code': code, 'message': message},
        );
  return DioException(
    requestOptions: RequestOptions(path: '/'),
    response: response,
    message: message,
  );
}

void main() {
  group('mapToFailure over DioException statuses', () {
    Failure map(DioException e) => mapToFailure(e);

    test('401 → unauthorized', () {
      expect(map(dioErr(status: 401)).kind, FailureKind.unauthorized);
    });

    test('403 → forbidden', () {
      expect(map(dioErr(status: 403)).kind, FailureKind.forbidden);
    });

    test('404 → notFound', () {
      expect(map(dioErr(status: 404)).kind, FailureKind.notFound);
    });

    test('400 → validation', () {
      expect(map(dioErr(status: 400)).kind, FailureKind.validation);
    });

    test('422 → validation', () {
      expect(map(dioErr(status: 422)).kind, FailureKind.validation);
    });

    test('503 → maintenance', () {
      expect(map(dioErr(status: 503)).kind, FailureKind.maintenance);
    });

    test('500 → server', () {
      expect(map(dioErr(status: 500)).kind, FailureKind.server);
    });

    test('connection timeout → timeout', () {
      expect(
        mapToFailure(const DioException(
          requestOptions: RequestOptions(path: '/'),
          type: DioExceptionType.connectionTimeout,
        )).kind,
        FailureKind.timeout,
      );
    });

    test('connection error → network', () {
      expect(
        mapToFailure(const DioException(
          requestOptions: RequestOptions(path: '/'),
          type: DioExceptionType.connectionError,
        )).kind,
        FailureKind.network,
      );
    });

    test('API code is surfaced on the failure', () {
      final f = mapToFailure(dioErr(status: 400, code: 'INSUFFICIENT_STOCK'));
      expect(f.code, 'INSUFFICIENT_STOCK');
    });
  });
}
