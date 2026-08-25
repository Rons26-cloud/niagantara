import 'package:flutter/material.dart';

import '../shared/constants/design.dart';

/// NIAGANTARA themes: LIGHT (white/navy/blue) and BLUE (dark navy/white/cyan),
/// mirroring the web `data-theme` system.
class NgTheme {
  NgTheme._();

  static const Color _darkText = Color(0xFFE2E8F0);
  static const Color _darkBorder = Color(0xFF26334D);
  static const Color _darkField = Color(0xFF16233B);

  static ThemeData light() => _build(Brightness.light);

  static ThemeData blueDark() => _build(Brightness.dark);

  static ThemeData _build(Brightness brightness) {
    final isDark = brightness == Brightness.dark;
    final scheme = ColorScheme.fromSeed(
      seedColor: NgColors.blue,
      brightness: brightness,
    ).copyWith(
      primary: isDark ? NgColors.blueSoft : NgColors.blue,
      onPrimary: isDark ? NgColors.navyDeep : Colors.white,
      secondary: NgColors.cyan,
      surface: isDark ? NgColors.navy : Colors.white,
      onSurface: isDark ? _darkText : NgColors.navy,
      error: isDark ? const Color(0xFFF87171) : NgColors.danger,
    );
    final fg = isDark ? _darkText : NgColors.navy;
    return ThemeData(
      useMaterial3: true,
      colorScheme: scheme,
      scaffoldBackgroundColor: isDark ? NgColors.navyDeep : NgColors.bg,
      cardColor: isDark ? NgColors.navy : Colors.white,
      dividerColor: isDark ? _darkBorder : NgColors.line,
      appBarTheme: AppBarTheme(
        backgroundColor: isDark ? NgColors.navyDeep : Colors.white,
        foregroundColor: fg,
        elevation: 0,
        scrolledUnderElevation: 1,
        centerTitle: false,
        titleTextStyle: TextStyle(
          fontSize: 16.5,
          fontWeight: FontWeight.w800,
          letterSpacing: -0.3,
          color: fg,
        ),
      ),
      navigationBarTheme: NavigationBarThemeData(
        backgroundColor: isDark ? NgColors.navy : Colors.white,
        indicatorColor: scheme.primary.withValues(alpha: 0.14),
        height: 64,
        labelTextStyle: WidgetStatePropertyAll<TextStyle>(
          TextStyle(
            fontSize: 11,
            fontWeight: FontWeight.w700,
            color: fg.withValues(alpha: 0.85),
          ),
        ),
        iconTheme: WidgetStateProperty.resolveWith(
          (states) => IconThemeData(
            size: 23,
            color: states.contains(WidgetState.selected)
                ? scheme.primary
                : fg.withValues(alpha: 0.7),
          ),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: isDark ? _darkField : Colors.white,
        contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 13),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(color: isDark ? _darkBorder : NgColors.line),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(color: isDark ? _darkBorder : NgColors.line),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: NgColors.blue, width: 1.6),
        ),
      ),
      filledButtonTheme: FilledButtonThemeData(
        style: FilledButton.styleFrom(
          minimumSize: const Size(kMinTouchTarget, kMinTouchTarget),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          textStyle: const TextStyle(fontWeight: FontWeight.w800, fontSize: 14),
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          minimumSize: const Size(kMinTouchTarget, kMinTouchTarget),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          textStyle: const TextStyle(fontWeight: FontWeight.w700, fontSize: 14),
        ),
      ),
      snackBarTheme: SnackBarThemeData(
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
      ),
      chipTheme: ChipThemeData(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
      ),
    );
  }
}
