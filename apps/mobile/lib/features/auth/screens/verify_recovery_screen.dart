import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../../app/localization.dart';
import '../../../core/auth/app_controller.dart';
import '../../../core/errors/failure.dart';
import '../../../core/utils/validators.dart';
import '../../../shared/components/failure_message.dart';
import '../../../shared/components/snack.dart';

/// Step 2 of recovery: POST /auth/verify-recovery exchanges the emailed OTP
/// for single-use recovery tokens, then routes to the reset form.
class VerifyRecoveryScreen extends StatefulWidget {
  const VerifyRecoveryScreen({super.key, required this.email});

  final String email;

  @override
  State<VerifyRecoveryScreen> createState() => _VerifyRecoveryScreenState();
}

class _VerifyRecoveryScreenState extends State<VerifyRecoveryScreen> {
  final _otp = TextEditingController();
  bool _busy = false;

  @override
  void dispose() {
    _otp.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!Validators.isValidOtp(_otp.text)) {
      Snack.error(context, l(context).requiredField);
      return;
    }
    setState(() => _busy = true);
    try {
      final tokens = await context
          .read<AppController>()
          .auth
          .verifyRecovery(widget.email, _otp.text);
      if (!mounted) return;
      Navigator.pushReplacementNamed(context, '/reset-password', arguments: {
        'email': widget.email,
        'accessToken': tokens.accessToken,
        'refreshToken': tokens.refreshToken,
      });
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
      appBar: AppBar(title: Text(l.verifyTitle)),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Icon(Icons.mark_email_read_outlined,
                  size: 46, color: Theme.of(context).colorScheme.primary),
              const SizedBox(height: 14),
              Text(l.verifySubtitle,
                  textAlign: TextAlign.center,
                  style:
                      TextStyle(fontSize: 13, color: Theme.of(context).hintColor)),
              const SizedBox(height: 8),
              Text(widget.email,
                  textAlign: TextAlign.center,
                  style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 13)),
              const SizedBox(height: 22),
              TextField(
                controller: _otp,
                autofocus: true,
                keyboardType: TextInputType.number,
                textAlign: TextAlign.center,
                maxLength: 8,
                style: const TextStyle(
                    fontSize: 22, letterSpacing: 10, fontWeight: FontWeight.w800),
                decoration: InputDecoration(
                  labelText: l.otpLabel,
                  counterText: '',
                ),
              ),
              const SizedBox(height: 20),
              FilledButton(
                onPressed: _busy ? null : _submit,
                child: _busy
                    ? const SizedBox(
                        width: 20, height: 20,
                        child: CircularProgressIndicator(strokeWidth: 2))
                    : Text(l.verify),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
