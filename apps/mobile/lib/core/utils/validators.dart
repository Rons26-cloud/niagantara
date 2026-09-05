class Validators {
  Validators._();

  static final _emailRe = RegExp(r'^[^@\s]+@[^@\s]+\.[^@\s]+$');

  static bool isValidEmail(String v) => _emailRe.hasMatch(v.trim());

  static bool isStrongPassword(String v, {int min = 12}) => v.length >= min;

  static bool isNotBlank(String? v) => v != null && v.trim().isNotEmpty;

  static bool isNumber(String? v, {num? min, num? max}) {
    final value = num.tryParse((v ?? '').replaceAll(',', ''));
    if (value == null) return false;
    if (min != null && value < min) return false;
    if (max != null && value > max) return false;
    return true;
  }

  static bool isValidOtp(String v) {
    final t = v.trim();
    return t.length >= 6 && t.length <= 8;
  }
}
