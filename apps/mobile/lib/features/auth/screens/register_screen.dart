import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../../app/localization.dart';
import '../../../core/auth/app_controller.dart';
import '../../../core/errors/failure.dart';
import '../../../core/utils/validators.dart';
import '../../../shared/components/failure_message.dart';
import '../../../shared/components/snack.dart';

/// Registration — POST /auth/register creates the user AND the first company.
class RegisterScreen extends StatefulWidget {
  const RegisterScreen({super.key});

  @override
  State<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends State<RegisterScreen> {
  final _formKey = GlobalKey<FormState>();
  final _fullName = TextEditingController();
  final _company = TextEditingController();
  final _email = TextEditingController();
  final _password = TextEditingController();
  bool _busy = false;
  bool _obscure = true;

  @override
  void dispose() {
    _fullName.dispose();
    _company.dispose();
    _email.dispose();
    _password.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _busy = true);
    try {
      await context.read<AppController>().auth.register(
            email: _email.text,
            password: _password.text,
            companyName: _company.text,
            fullName: _fullName.text,
          );
      if (!mounted) return;
      Snack.info(context, l(context).setupComplete);
      Navigator.of(context).popUntil((r) => r.isFirst);
      await context.read<AppController>().afterLogin();
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
      appBar: AppBar(title: Text(l.createAccount)),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 420),
            child: Form(
              key: _formKey,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Text(l.registerTitle,
                      style: const TextStyle(
                          fontSize: 19, fontWeight: FontWeight.w900)),
                  const SizedBox(height: 4),
                  Text(l.registerSubtitle,
                      style:
                          TextStyle(fontSize: 12.5, color: Theme.of(context).hintColor)),
                  const SizedBox(height: 22),
                  TextFormField(
                    controller: _fullName,
                    textCapitalization: TextCapitalization.words,
                    decoration: InputDecoration(labelText: l.fullName),
                  ),
                  const SizedBox(height: 14),
                  TextFormField(
                    controller: _company,
                    textCapitalization: TextCapitalization.words,
                    validator: (v) =>
                        Validators.isNotBlank(v) ? null : l.requiredField,
                    decoration: InputDecoration(labelText: l.companyName),
                  ),
                  const SizedBox(height: 14),
                  TextFormField(
                    controller: _email,
                    keyboardType: TextInputType.emailAddress,
                    validator: (v) =>
                        v != null && Validators.isValidEmail(v) ? null : l.invalidEmail,
                    decoration: InputDecoration(labelText: l.email),
                  ),
                  const SizedBox(height: 14),
                  TextFormField(
                    controller: _password,
                    obscureText: _obscure,
                    validator: (v) =>
                        v != null && Validators.isStrongPassword(v)
                            ? null
                            : l.passwordTooShort,
                    decoration: InputDecoration(
                      labelText: l.newPassword,
                      helperText: '${l.passwordTooShort} · Aa1!xxxx',
                      suffixIcon: IconButton(
                        icon: Icon(_obscure
                            ? Icons.visibility_outlined
                            : Icons.visibility_off_outlined),
                        onPressed: () => setState(() => _obscure = !_obscure),
                      ),
                    ),
                  ),
                  const SizedBox(height: 22),
                  FilledButton(
                    onPressed: _busy ? null : _submit,
                    child: _busy
                        ? const SizedBox(
                            width: 20, height: 20,
                            child: CircularProgressIndicator(strokeWidth: 2))
                        : Text(l.register),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
