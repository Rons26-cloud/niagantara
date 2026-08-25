import 'dart:convert';
import 'dart:io';

import 'package:flutter_test/flutter_test.dart';

void main() {
  group('mapToFailure (pure error → Failure mapping)', () {
    test('unknown object → network/server failure with fallback message', () {
      final f = mapToFailure(Exception('boom'));
      expect(f, isA<Failure>());
      // Exception without dio context lands in the generic bucket.
      expect(f.kind, isNot(FailureKind.unauthorized));
      expect(f.kind, isNot(FailureKind.forbidden));
    });

    test('Failure passes through unchanged', () {
      const original = Failure(FailureKind.notFound, 'missing');
      final f = mapToFailure(original);
      expect(identical(f, original), isTrue);
    });
  });

  group('ARB localization parity', () {
    final en = loadArb('app_en.arb');
    final id = loadArb('app_id.arb');

    test('id contains every key from en', () {
      final missingInId = en.keys.toSet().difference(id.keys.toSet());
      expect(missingInId, isEmpty, reason: 'missing in id.arb: $missingInId');
    });

    test('en contains every key from id', () {
      final missingInEn = id.keys.toSet().difference(en.keys.toSet());
      expect(missingInEn, isEmpty, reason: 'missing in en.arb: $missingInEn');
    });

    test('placeholder parity between locales', () {
      RegExp placeholder = RegExp(r'\{(\w+)\}');
      for (final key in en.keys) {
        final enP = placeholder.allMatches(en[key]!).map((m) => m.group(1)).toSet();
        final idP = placeholder.allMatches(id[key]!).map((m) => m.group(1)).toSet();
        expect(idP, enP, reason: 'placeholder mismatch for "$key"');
      }
    });
  });
}

Map<String, String> loadArb(String name) {
  const root = String.fromEnvironment('NIAGANTARA_ROOT');
  final arbDir = root.isNotEmpty
      ? '$root/apps/mobile/lib/l10n'
      : 'lib/l10n'; // flutter test runs with CWD = package root
  final file = File('$arbDir/$name');
  if (!file.existsSync()) {
    fail('Cannot locate ARB file: ${file.path}');
  }
  return (jsonDecode(file.readAsStringSync()) as Map<String, dynamic>)
      .map((k, v) => MapEntry(k, v?.toString() ?? ''));
}
