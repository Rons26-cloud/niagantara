import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';

import '../l10n/app_localizations.dart';

export '../l10n/app_localizations.dart';

/// Supported locales: Bahasa Indonesia (default) and English.
final List<Locale> kSupportedLocales = const [Locale('id'), Locale('en')];

const List<LocalizationsDelegate<dynamic>> kLocalizationDelegates = [
  AppLocalizations.delegate,
  GlobalMaterialLocalizations.delegate,
  GlobalWidgetsLocalizations.delegate,
  GlobalCupertinoLocalizations.delegate,
];

/// Convenience: `l(context).todaySales`.
AppLocalizations l(BuildContext context) => AppLocalizations.of(context);
