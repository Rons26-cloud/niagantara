import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../../app/localization.dart';
import '../../../core/auth/app_controller.dart';
import '../../../core/errors/failure.dart';
import '../../../core/utils/validators.dart';
import '../../../shared/components/failure_message.dart';
import '../../../shared/components/snack.dart';

/// Final recovery step: POST /auth/reset-password with the single-use
/// refresh token from verify-recovery.
class ResetPasswordScreen extends StatefulWidget {
  const ResetPasswordScreen({
    super.key,
    required this.email,
    this.accessToken,
    this.refreshToken,
  });

  final String email;
  final String? accessToken;
  final String? refreshToken;

  @override
  State<ResetPasswordScreen> createState() => _ResetPasswordScreenState();
}

class _ResetPasswordScreenState extends State<ResetPasswordScreen> {
  final _formKey = GlobalKey<FormState>();
  final _password = TextEditingController();
  final _confirm = TextEditingController();
  bool _busy = false;
  bool _obscure = true;

  @override
  void dispose() {
    _password.dispose();
    _confirm.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _busy = true);
    try {
      await context.read<AppController>().auth.resetPassword(
            accessToken: widget.accessToken ?? '',
            refreshToken: widget.refreshToken ?? '',
            password: _password.text,
            confirmPassword: _confirm.text,
          );
      if (!mounted) return;
      Snack.success(context, l(context).resetTitle);
      Navigator.of(context).popUntil((r) => r.isFirst);
    } on Failure catch (f) {
      if (!mounted) return;
      Snack.error(context, localizedFailure(context, f));
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final l = l(context);
    return Scaffold(
      appBar: AppBar(title: Text(l.resetTitle)),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 20),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                TextFormField(
                  controller: _password,
                  obscureText: _obscure,
                  validator: (v) => v != null && Validators.isStrongPassword(v)
                      ? null
                      : l.passwordTooShort,
                  decoration: InputDecoration(
                    labelText: l.newPassword,
                    suffixIcon: IconButton(
                      icon: Icon(_obscure
                          ? Icons.visibility_outlined
                          : Icons.visibility_off_outlined),
                      onPressed: () => setState(() => _obscure = !_obscure),
                    ),
                  ),
                ),
                const SizedBox(height: 14),
                TextFormField(
                  controller: _confirm,
                  obscureText: _obscure,
                  validator: (v) =>
                      v == _password.text ? null : l.passwordMismatch,
                  decoration: InputDecoration(labelText: l.confirmPassword),
                ),
                const SizedBox(height: 20),
                FilledButton(
                  onPressed: _busy ? null : _submit,
                  child: _busy
                      ? const SizedBox(
                          width: 20, height: 20,
                          child: CircularProgressIndicator(strokeWidth: 2))
                      : Text(l.resetPassword),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
