import 'package:flutter/material.dart';

import '../../app/localization.dart';
import '../../core/errors/failure.dart';

/// Maps a [Failure] to the localized user-facing message.
String localizedFailure(BuildContext context, Failure failure) {
  final l = AppLocalizations.of(context)!;
  switch (failure.kind) {
    case FailureKind.network:
      return l.noInternet;
    case FailureKind.timeout:
      return l.timeoutError;
    case FailureKind.unauthorized:
      return l.unauthorized;
    case FailureKind.forbidden:
      return l.forbidden;
    case FailureKind.notFound:
      return l.notFound;
    case FailureKind.maintenance:
      return l.maintenance;
    case FailureKind.server:
      return l.serverError;
    case FailureKind.validation:
      return failure.message ?? l.unknownError;
    case FailureKind.unknown:
      return l.unknownError;
  }
}
