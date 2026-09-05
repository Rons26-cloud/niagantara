import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../core/api/api_client.dart';
import '../core/auth/app_controller.dart';
import '../core/auth/auth_repository.dart';
import '../core/config/app_config.dart';
import '../features/auth/screens/login_screen.dart';
import '../features/onboarding/onboarding_screen.dart';
import '../shell/home_shell.dart';
import 'localization.dart';
import 'router.dart';
import 'theme.dart';

class NgApp extends StatelessWidget {
  const NgApp({super.key, required this.controller});

  final AppController controller;

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        Provider<AppController>.value(value: controller),
        Provider<ApiClient>.value(value: controller.apiClient),
        Provider<AuthRepository>.value(value: controller.auth),
      ],
      child: AnimatedBuilder(
        animation: controller,
        builder: (context, _) {
          return MaterialApp(
            title: AppConfig.appName,
            debugShowCheckedModeBanner: false,
            onGenerateRoute: onGenerateRoute,
            theme: NgTheme.light(),
            darkTheme: NgTheme.blueDark(),
            themeMode: controller.theme == ThemeModePref.blueDark
                ? ThemeMode.dark
                : ThemeMode.light,
            locale: Locale(controller.localePref.name),
            supportedLocales: kSupportedLocales,
            localizationsDelegates: kLocalizationDelegates,
            home: const _RootSwitch(),
          );
        },
      ),
    );
  }
}

class _RootSwitch extends StatelessWidget {
  const _RootSwitch();

  @override
  Widget build(BuildContext context) {
    final app = context.watch<AppController>();
    if (!app.booted) {
      return const _Splash();
    }
    if (!app.loggedIn) return const LoginScreen();
    if (app.ctx == null || app.ctx!.activeCompanyId == null) {
      return const OnboardingScreen();
    }
    return const HomeShell();
  }
}

class _Splash extends StatelessWidget {
  const _Splash();

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0B1220),
      body: Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Image.asset('assets/branding/niagantara-logo.png', width: 240),
            const SizedBox(height: 28),
            const SizedBox(
              width: 22,
              height: 22,
              child:
                  CircularProgressIndicator(strokeWidth: 2.2, color: Color(0xFF60A5FA)),
            ),
          ],
        ),
      ),
    );
  }
}
