import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../../app/localization.dart';
import '../../../core/auth/app_controller.dart';
import '../../../core/errors/failure.dart';
import '../../../core/utils/validators.dart';
import '../../../shared/components/failure_message.dart';
import '../../../shared/components/snack.dart';

/// Sign-in screen using POST /auth/login.
class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _formKey = GlobalKey<FormState>();
  final _email = TextEditingController();
  final _password = TextEditingController();
  bool _busy = false;
  bool _obscure = true;

  @override
  void dispose() {
    _email.dispose();
    _password.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _busy = true);
    try {
      await context.read<AppController>().auth
          .login(_email.text.trim(), _password.text);
      if (!mounted) return;
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
    final strings = l(context);
    return Scaffold(
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 32),
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 420),
              child: Form(
                key: _formKey,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    Image.asset('assets/branding/niagantara-logo.png', width: 210),
                    const SizedBox(height: 36),
                    Text(strings.loginTitle,
                        style: const TextStyle(
                            fontSize: 22,
                            fontWeight: FontWeight.w900,
                            letterSpacing: -0.5)),
                    const SizedBox(height: 6),
                    Text(strings.loginSubtitle,
                        style: TextStyle(
                            fontSize: 13, color: Theme.of(context).hintColor)),
                    const SizedBox(height: 26),
                    TextFormField(
                      controller: _email,
                      keyboardType: TextInputType.emailAddress,
                      autofillHints: const [AutofillHints.email],
                      validator: (v) =>
                          v != null && Validators.isValidEmail(v) ? null : strings.invalidEmail,
                      decoration: InputDecoration(labelText: strings.email),
                    ),
                    const SizedBox(height: 14),
                    TextFormField(
                      controller: _password,
                      obscureText: _obscure,
                      autofillHints: const [AutofillHints.password],
                      validator: (v) =>
                          Validators.isNotBlank(v) ? null : strings.requiredField,
                      decoration: InputDecoration(
                        labelText: strings.password,
                        suffixIcon: IconButton(
                          icon: Icon(_obscure
                              ? Icons.visibility_outlined
                              : Icons.visibility_off_outlined),
                          onPressed: () => setState(() => _obscure = !_obscure),
                        ),
                      ),
                    ),
                    Align(
                      alignment: Alignment.centerRight,
                      child: TextButton(
                        onPressed: () => Navigator.pushNamed(context, '/forgot-password'),
                        child: Text(strings.forgotPassword),
                      ),
                    ),
                    const SizedBox(height: 4),
                    FilledButton(
                      onPressed: _busy ? null : _submit,
                      child: _busy
                          ? const SizedBox(
                              width: 20,
                              height: 20,
                              child: CircularProgressIndicator(strokeWidth: 2))
                          : Text(strings.signIn),
                    ),
                    const SizedBox(height: 18),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Text(strings.noAccountYet,
                            style: TextStyle(
                                fontSize: 12.5,
                                color: Theme.of(context).hintColor)),
                        TextButton(
                          onPressed: () => Navigator.pushNamed(context, '/register'),
                          child: Text(strings.createAccount),
                        ),
                      ],
                    ),
                    const SizedBox(height: 10),
                    Text('© ${DateTime.now().year} NIAGANTARA',
                        textAlign: TextAlign.center,
                        style:
                            TextStyle(fontSize: 10, color: Theme.of(context).hintColor)),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
