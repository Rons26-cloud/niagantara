import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'app/app.dart';
import 'core/api/api_client.dart';
import 'core/auth/app_controller.dart';
import 'core/auth/auth_repository.dart';
import 'core/auth/session_store.dart';

/// NIAGANTARA mobile entry point.
///
/// Boot order: bindings → storage/session singletons → restore persisted
/// session & preferences (`boot()`) → runApp.
Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();

  final session = SessionStore();
  final api = ApiClient(sessionStore: session);
  final auth = AuthRepository(api, session);
  final prefs = AppPreferences(await SharedPreferences.getInstance());
  final controller =
      AppController(api: api, session: session, auth: auth, prefs: prefs);

  await controller.boot();

  runApp(NgApp(controller: controller));
}
