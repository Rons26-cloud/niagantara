import 'package:flutter_test/flutter_test.dart';
import 'package:niagantara_mobile/core/storage/app_preferences.dart';

void main() {
  group('resolveStartRoute (pure route guard)', () {
    test('no session → /login', () {
      expect(
        resolveStartRoute(
            hasSession: false, hasCompanyContext: false, onboarded: true),
        '/login',
      );
    });

    test('session without company context → /onboarding', () {
      expect(
        resolveStartRoute(
            hasSession: true, hasCompanyContext: false, onboarded: false),
        '/onboarding',
      );
    });

    test('session + context + not onboarded → /onboarding', () {
      expect(
        resolveStartRoute(
            hasSession: true, hasCompanyContext: true, onboarded: false),
        '/onboarding',
      );
    });

    test('session + context + onboarded → /home', () {
      expect(
        resolveStartRoute(
            hasSession: true, hasCompanyContext: true, onboarded: true),
        '/home',
      );
    });
  });

  group('preference enums', () {
    test('locale enum covers en + id (getter defaults to id index)', () {
      expect(LanguagePref.values, [LanguagePref.en, LanguagePref.id]);
    });

    test('theme enum covers light and blue dark', () {
      expect(ThemeModePref.values, [ThemeModePref.light, ThemeModePref.blueDark]);
    });
  });
}
