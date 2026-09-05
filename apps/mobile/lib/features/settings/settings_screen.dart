import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../app/localization.dart';
import '../../core/auth/app_controller.dart';
import '../../core/errors/failure.dart';
import '../../shared/components/snack.dart' show confirmDialog;
import '../../shared/constants/design.dart';

/// Settings — app preferences that persist on-device.
class SettingsScreen extends StatelessWidget {
  const SettingsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final s = l(context);
    final app = context.watch<AppController>();

    return Scaffold(
      appBar: AppBar(title: Text(s.settingsTitle)),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(16, 12, 16, 24),
        children: [
          SwitchListTile(
            contentPadding: EdgeInsets.zero,
            title: Text(s.darkModeLabel, style: const TextStyle(fontSize: 13)),
            value: app.themeMode == ThemeMode.dark,
            onChanged: (v) => app
                .setTheme(v ? ThemeModePref.blueDark : ThemeModePref.light),
          ),
          const Divider(),
          for (final lang in LanguagePref.values)
            ListTile(
              contentPadding: EdgeInsets.zero,
              dense: true,
              leading: Icon(app.localePref == lang
                  ? Icons.check_circle_rounded
                  : Icons.circle_outlined,
                  size: 18, color: Theme.of(context).colorScheme.primary),
              title: Text(
                  lang == LanguagePref.id
                      ? s.languageIndonesian
                      : s.languageEnglish,
                  style: const TextStyle(fontSize: 13)),
              onTap: () => app.setLocale(lang),
            ),
          const Divider(),
          SwitchListTile(
            contentPadding: EdgeInsets.zero,
            dense: true,
            title: Text(s.notifLowStock, style: const TextStyle(fontSize: 12.5)),
            value: app.prefs.notifyLowStock,
            onChanged: (v) async {
              await context.read<AppController>().prefs.setNotifyLowStock(v);
            },
          ),
          SwitchListTile(
            contentPadding: EdgeInsets.zero,
            dense: true,
            title:
                Text(s.notifDailySummary, style: const TextStyle(fontSize: 12.5)),
            value: app.prefs.notifySales,
            onChanged: (v) async {
              await context.read<AppController>().prefs.setNotifySales(v);
            },
          ),
          const SizedBox(height: 10),
          Text(s.pushNotAvailable,
              style: TextStyle(fontSize: 10.5, color: Theme.of(context).hintColor)),
          const Divider(height: 30),
          OutlinedButton.icon(
            style: OutlinedButton.styleFrom(foregroundColor: NgColors.danger),
            onPressed: () async {
              final confirmed = await confirmDialog(
                context,
                title: l(context).logoutConfirmTitle,
                confirmLabel: l(context).logout,
                cancelLabel: l(context).cancelShort,
              );
              if (!confirmed || !context.mounted) return;
              try {
                await context.read<AppController>().logout();
              } on Failure {
                // Session cleared locally regardless; silent.
              }
            },
            icon: const Icon(Icons.logout_rounded, size: 18),
            label: Text(l(context).logout),
          ),
          const SizedBox(height: 14),
          Center(
            child: Image.asset('assets/branding/niagantara-logo.png', width: 120),
          ),
        ],
      ),
    );
  }
}
