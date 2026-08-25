import 'package:intl/intl.dart';

/// Currency & date formatting helpers (id-ID business locale by default).
class Fmt {
  Fmt._();

  static String rp(num value) =>
      'Rp ${NumberFormat.decimalPattern('id_ID').format(value.round())}';

  static String compact(num value) {
    if (value >= 1000000000) return '${(value / 1000000000).toStringAsFixed(1)}M';
    if (value >= 1000000) return '${(value / 1000000).toStringAsFixed(1)}jt';
    if (value >= 1000) return '${(value / 1000).toStringAsFixed(0)}rb';
    return NumberFormat.decimalPattern('id_ID').format(value);
  }

  static String time(DateTime dt) => DateFormat('HH:mm', 'id_ID').format(dt);

  static String dateTime(DateTime dt) =>
      DateFormat('dd MMM yyyy, HH:mm', 'id_ID').format(dt.toLocal());

  static String dayMonth(DateTime dt) =>
      DateFormat('dd MMM', 'id_ID').format(dt);

  static String isoDay(DateTime dt) {
    final m = dt.month.toString().padLeft(2, '0');
    final d = dt.day.toString().padLeft(2, '0');
    return '${dt.year}-$m-$d';
  }

  static DateTime parseDate(dynamic raw) {
    if (raw is DateTime) return raw;
    return DateTime.tryParse(raw?.toString() ?? '') ?? DateTime.now();
  }

  static num numOrZero(dynamic raw) {
    if (raw is num) return raw;
    return num.tryParse(raw?.toString() ?? '') ?? 0;
  }
}
