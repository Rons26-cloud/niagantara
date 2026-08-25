import 'dart:ui';

/// Brand palette — mirrors packages/ui design tokens. Never invent new blues.
class NgColors {
  NgColors._();

  static const Color blue = Color(0xFF2563EB);
  static const Color blueDark = Color(0xFF1D4ED8);
  static const Color blueSoft = Color(0xFF60A5FA);
  static const Color cyan = Color(0xFF06B6D4);
  static const Color navy = Color(0xFF0F172A);
  static const Color navyDeep = Color(0xFF0B1220);
  static const Color slate = Color(0xFF64748B);
  static const Color line = Color(0xFFE2E8F0);
  static const Color bg = Color(0xFFF8FAFC);
  static const Color success = Color(0xFF16A34A);
  static const Color warning = Color(0xFFD97706);
  static const Color danger = Color(0xFFDC2626);
}

/// Spacing scale used by all screens (4pt grid).
class Spacing {
  Spacing._();

  static const double xs = 4;
  static const double sm = 8;
  static const double md = 12;
  static const double lg = 16;
  static const double xl = 24;
  static const double xxl = 32;
}

/// Minimum touch target per accessibility guidance.
const double kMinTouchTarget = 48;
