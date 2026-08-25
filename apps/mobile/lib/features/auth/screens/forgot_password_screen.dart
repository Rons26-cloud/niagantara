import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../../app/localization.dart';
import '../../../core/auth/app_controller.dart';
import '../../../core/errors/failure.dart';
import '../../../core/utils/validators.dart';
import '../../../shared/components/failure_message.dart';
import '../../../shared/components/snack.dart';

/// Step 1 of recovery: POST /auth/forgot-password sends the one-time code.
class ForgotPasswordScreen extends StatefulWidget {
  const ForgotPasswordScreen({super.key});

  @override
  State<ForgotPasswordScreen> createState() => _ForgotPasswordScreenState();
}

class _ForgotPasswordScreenState extends State<ForgotPasswordScreen> {
  final _email = TextEditingController();
  final _formKey = GlobalKey<FormState>();
  bool _busy = false;

  @override
  void dispose() {
    _email.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _busy = true);
    try {
      await context.read<AppController>().auth.forgotPassword(_email.text);
      if (!mounted) return;
      Navigator.pushReplacementNamed(context, '/verify-recovery',
          arguments: _email.text.trim());
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
      appBar: AppBar(title: Text(l.forgotTitle)),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 20),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Icon(Icons.lock_reset_rounded,
                    size: 46, color: Theme.of(context).colorScheme.primary),
                const SizedBox(height: 14),
                Text(l.forgotSubtitle,
                    textAlign: TextAlign.center,
                    style: TextStyle(
                        fontSize: 13, color: Theme.of(context).hintColor)),
                const SizedBox(height: 22),
                TextFormField(
                  controller: _email,
                  keyboardType: TextInputType.emailAddress,
                  validator: (v) =>
                      v != null && Validators.isValidEmail(v) ? null : l.invalidEmail,
                  decoration: InputDecoration(labelText: l.email),
                ),
                const SizedBox(height: 20),
                FilledButton(
                  onPressed: _busy ? null : _submit,
                  child: _busy
                      ? const SizedBox(
                          width: 20, height: 20,
                          child: CircularProgressIndicator(strokeWidth: 2))
                      : Text(l.sendCode),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
