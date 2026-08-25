/// Typed failures surfaced to the UI layer.
///
/// Mapping from transport-level errors (Dio) and API error codes happens in
/// [mapToFailure] so widgets never deal with raw exceptions.
enum FailureKind {
  network,
  timeout,
  server,
  unauthorized,
  forbidden,
  notFound,
  validation,
  maintenance,
  unknown,
}

class Failure {
  const Failure(this.kind, {this.code, this.message});

  final FailureKind kind;
  final String? code;
  final String? message;

  bool get isUnauthorized => kind == FailureKind.unauthorized;

  @override
  bool operator ==(Object other) =>
      other is Failure &&
      other.kind == kind &&
      other.code == code &&
      other.message == message;

  @override
  int get hashCode => Object.hash(kind, code, message);

  @override
  String toString() => 'Failure($kind, code: $code, message: $message)';
}
