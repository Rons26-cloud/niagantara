import 'package:flutter/material.dart';

/// Small feedback helpers so snackbars/dialogs stay consistent.
class Snack {
  Snack._();

  static void success(BuildContext context, String message) {
    _show(context, message, Icons.check_circle_rounded);
  }

  static void error(BuildContext context, String message) {
    _show(context, message, Icons.error_outline_rounded);
  }

  static void info(BuildContext context, String message) {
    _show(context, message, Icons.info_outline_rounded);
  }

  static void _show(BuildContext context, String message, IconData icon) {
    ScaffoldMessenger.of(context)
      ..hideCurrentSnackBar()
      ..showSnackBar(
        SnackBar(
          content: Row(
            children: [
              Icon(icon, size: 18, color: Theme.of(context).colorScheme.onSurface),
              const SizedBox(width: 10),
              Expanded(child: Text(message)),
            ],
          ),
        ),
      );
  }
}

Future<bool> confirmDialog(
  BuildContext context, {
  required String title,
  required String confirmLabel,
  required String cancelLabel,
}) async {
  final result = await showDialog<bool>(
    context: context,
    builder: (ctx) => AlertDialog(
      title: Text(title),
      actions: [
        TextButton(onPressed: () => Navigator.pop(ctx, false), child: Text(cancelLabel)),
        FilledButton(onPressed: () => Navigator.pop(ctx, true), child: Text(confirmLabel)),
      ],
    ),
  );
  return result ?? false;
}
