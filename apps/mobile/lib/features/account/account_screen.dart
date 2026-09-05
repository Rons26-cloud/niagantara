import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../app/localization.dart';
import '../../core/auth/app_controller.dart';
import '../../core/models/org_context.dart';
import '../../shared/constants/design.dart';
import '../../shared/widgets/ng_cards.dart';
import '../../shell/home_shell.dart' show openQuickActions;

class AccountScreen extends StatefulWidget {
  const AccountScreen({super.key});

  @override
  State<AccountScreen> createState() => _AccountScreenState();
}

class _AccountScreenState extends State<AccountScreen> {
  int _generation = 0;

  @override
  Widget build(BuildContext context) {
    final s = l(context);
    final app = context.watch<AppController>();
    final ctx = app.ctx;
    final branches = ctx?.branches ?? const <BranchRef>[];

    return Scaffold(
      appBar: AppBar(title: Text(s.accountTitle)),
      body: RefreshIndicator(
        onRefresh: () async {},
        child: ListView(
          key: ValueKey(_generation),
          padding: const EdgeInsets.fromLTRB(16, 14, 16, 24),
          children: [
            Row(children: [
              CircleAvatar(
                radius: 26,
                backgroundColor:
                    Theme.of(context).colorScheme.primary.withValues(alpha: .12),
                child: Text(
                  (ctx?.profileEmail ?? '?').characters.first.toUpperCase(),
                  style: TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.w900,
                      color: Theme.of(context).colorScheme.primary),
                ),
              ),
              const SizedBox(width: 14),
              Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text(ctx?.profileName ?? ctx?.profileEmail ?? '—',
                    style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 14)),
                Text(ctx?.profileEmail ?? '',
                    style: TextStyle(
                        fontSize: 11.5, color: Theme.of(context).hintColor)),
              ])),
            ]),
            if (ctx != null && ctx.permissions.isNotEmpty) ...[
              const SizedBox(height: 16),
              Wrap(spacing: 6, runSpacing: 6, children: [
                for (final role in {
                  for (final c in ctx.companies) c['role_key']?.toString() ?? ''
                })
                  if (role.isNotEmpty) StatusChip(label: role, color: NgColors.blue),
              ]),
            ],
            const SizedBox(height: 18),
            SectionHeader(title: l(context).chooseBranch),
            for (final b in branches)
              ListTile(
                contentPadding: EdgeInsets.zero,
                dense: true,
                leading: Icon(b.isActive
                    ? Icons.radio_button_checked_rounded
                    : Icons.radio_button_off_rounded,
                    size: 20, color: Theme.of(context).colorScheme.primary),
                title: Text(b.name,
                    style: const TextStyle(fontSize: 12.5)),
                onTap: () async {
                  await context.read<AppController>().selectBranch(b);
                  setState(() => _generation++);
                },
              ),
            SectionHeader(title: l(context).settingsLanguageTitle),
            SwitchListTile(
              contentPadding: EdgeInsets.zero,
              dense: true,
              title: Text(l(context).darkModeLabel,
                  style: const TextStyle(fontSize: 12.5)),
              value: context.watch<AppController>().themeMode == ThemeMode.dark,
              onChanged: (v) => context
                  .read<AppController>()
                  .setTheme(v ? ThemeModePref.blueDark : ThemeModePref.light),
            ),
            for (final lang in LanguagePref.values)
              ListTile(
                contentPadding: EdgeInsets.zero,
                dense: true,
                leading: Icon(app.localePref == lang
                    ? Icons.check_circle_rounded
                    : Icons.circle_outlined,
                    size: 18, color: Theme.of(context).colorScheme.primary),
                title: Text(lang == LanguagePref.id ? 'Bahasa Indonesia' : 'English',
                    style: const TextStyle(fontSize: 12.5)),
                onTap: () => context.read<AppController>().setLocale(lang),
              ),
            const Divider(height: 30),
            ListTile(
              contentPadding: EdgeInsets.zero,
              dense: true,
              leading: Icon(Icons.bolt_rounded,
                  size: 20, color: Theme.of(context).colorScheme.primary),
              title: Text(s.qaOpenPos, style: const TextStyle(fontSize: 12.5)),
              onTap: () => openQuickActions(context),
            ),
          ],
        ),
      ),
    );
  }
}
