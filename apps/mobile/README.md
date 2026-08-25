# NIAGANTARA — Mobile App (Flutter)

Android-first Flutter client for the NIAGANTARA POS/ERP platform. iOS-ready by
design; the `ios/` folder is intentionally not committed and can be generated
with one command (see below). Every screen talks to the real API — there are
no mocked KPI numbers and no fake success states.

## Stack

| Concern    | Choice                                              |
|------------|-----------------------------------------------------|
| State      | `provider` (single `AppController` ChangeNotifier)  |
| HTTP       | `dio` with auth/company/branch header interceptor   |
| Tokens     | `flutter_secure_storage` (EncryptedSharedPreferences on Android) |
| Prefs      | `shared_preferences` (theme, language, default branch) |
| Charts     | `fl_chart` (14-day sales trend)                     |
| Scanning   | `mobile_scanner` (+ manual barcode/SKU fallback)    |
| i18n       | Flutter gen-l10n (`id` default, `en` secondary)     |

## Run

```bash
cd apps/mobile
flutter pub get
flutter gen-l10n            # regenerates lib/l10n/app_localizations.dart

# API base URL (defaults to the production Railway deployment)
flutter run --dart-define=API_BASE_URL=https://niagantara-production.up.railway.app/api/v1
```

### Tests & build

```bash
flutter test                 # unit tests: POS math, error mapping, route guard, ARB parity
flutter analyze
flutter build apk --debug    # Android
```

### iOS

The Xcode project is not checked in (it contains machine-specific files).
Generate it once from this folder:

```bash
flutter create . --platforms=ios --org com.niagantara --project-name niagantara_mobile
open ios/Runner.xcworkspace
```

## Branding

Launcher icons, the adaptive-icon foreground and the splash image are generated
**only** from the official assets in `assets/branding/`
(`niagantara-logo.png`, canonical mark crop `niagantara-mark.png`). Dark
surfaces carry a white plate behind the symbol because parts of the official
mark are navy. Never redraw or recolor these assets.

## API surface used

Auth (login/register/logout/me/forgot→OTP verify→reset), companies, stores,
branches, warehouses, products, categories, customers, suppliers, employees,
attendance clock, expenses(+categories), purchases(+receive), shifts(open/close),
sales(detail/cancel/refunds), finance(payables/receivables/reports),
google-sheets(status/oauth/history/recovery), inventory(low-stock/movements/
adjust/transfer), barcodes lookup, pos(products/barcode/checkout).

Known gaps (surfaced in-app as honest banners, never faked):
- Push notifications (FCM) — not yet delivered by backend; inbox shows live
  low-stock alerts instead.
- Google Sheets OAuth needs an external browser round-trip — mobile shows
  connection status/history/recovery and defers first connect to web.
- PDF/XLSX report export stays on the web dashboard.

## Security notes

- No secrets or service keys ship with the app.
- Session tokens live only in secure storage; a global 401 handler drops the
  session and returns to login.
- The checkout totals preview mirrors the server's SQL exactly, but the
  **backend remains the source of truth** for money math.
