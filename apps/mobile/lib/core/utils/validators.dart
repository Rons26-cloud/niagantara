/// Pure validation predicates (no messages — screens localize the failures).
class Validators {
  Validators._();

  static final _emailRe = RegExp(r'^[^@\s]+@[^@\s]+\.[^@\s]+$');

  static bool isValidEmail(String v) => _emailRe.hasMatch(v.trim());

  /// Server enforces min 12 chars on register/reset payloads.
  static bool isStrongPassword(String v, {int min = 12}) => v.length >= min;

  static bool isNotBlank(String? v) => v != null && v.trim().isNotEmpty;

  static bool isNumber(String? v, {num? min, num? max}) {
    final value = num.tryParse((v ?? '').replaceAll(',', ''));
    if (value == null) return false;
    if (min != null && value < min) return false;
    if (max != null && value > max) return false;
    return true;
  }

  /// Recovery OTP length accepted by POST /auth/verify-recovery (6..8).
  static bool isValidOtp(String v) {
    final t = v.trim();
    return t.length >= 6 && t.length <= 8;
  }
}
