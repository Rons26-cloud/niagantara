import 'package:flutter/material.dart';

import '../constants/design.dart';

/// Card-based KPI tile used on the dashboard and finance screens.
class KpiCard extends StatelessWidget {
  const KpiCard({
    super.key,
    required this.label,
    required this.value,
    this.icon,
    this.tone = NgColors.blue,
    this.hint,
  });

  final String label;
  final String value;
  final IconData? icon;
  final Color tone;
  final String? hint;

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: cs.surface,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: Theme.of(context).dividerColor, width: 1),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisSize: MainAxisSize.min,
        children: [
          Row(
            children: [
              if (icon != null) ...[
                Container(
                  width: 26,
                  height: 26,
                  decoration: BoxDecoration(
                    color: tone.withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Icon(icon, size: 15, color: tone),
                ),
                const SizedBox(width: 8),
              ],
              Expanded(
                child: Text(
                  label,
                  overflow: TextOverflow.ellipsis,
                  style: TextStyle(
                    fontSize: 10.5,
                    fontWeight: FontWeight.w700,
                    letterSpacing: 0.2,
                    color: Theme.of(context).hintColor,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            value,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: const TextStyle(fontSize: 16.5, fontWeight: FontWeight.w800, letterSpacing: -0.4),
          ),
          if (hint != null) ...[
            const SizedBox(height: 3),
            Text(hint!, style: TextStyle(fontSize: 10, color: Theme.of(context).hintColor)),
          ],
        ],
      ),
    );
  }
}

/// Section header with optional trailing action.
class SectionHeader extends StatelessWidget {
  const SectionHeader({super.key, required this.title, this.actionLabel, this.onAction});

  final String title;
  final String? actionLabel;
  final VoidCallback? onAction;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(top: 20, bottom: 10),
      child: Row(
        children: [
          Expanded(
            child: Text(title,
                style: const TextStyle(fontSize: 13.5, fontWeight: FontWeight.w800)),
          ),
          if (actionLabel != null && onAction != null)
            GestureDetector(
              onTap: onAction,
              child: Text(actionLabel!,
                  style: TextStyle(
                      fontSize: 11.5,
                      fontWeight: FontWeight.w800,
                      color: Theme.of(context).colorScheme.primary)),
            ),
        ],
      ),
    );
  }
}

/// Rounded status chip (PAID / PENDING / …).
class StatusChip extends StatelessWidget {
  const StatusChip({super.key, required this.label, this.color});

  final String label;
  final Color? color;

  @override
  Widget build(BuildContext context) {
    final c = color ?? _tone(label);
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: c.withValues(alpha: 0.13),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Text(label,
          style: TextStyle(
              fontSize: 9.5, fontWeight: FontWeight.w800, letterSpacing: 0.3, color: c)),
    );
  }

  static Color _tone(String s) {
    switch (s.toUpperCase()) {
      case 'PAID':
      case 'OPEN':
      case 'ACTIVE':
      case 'COMPLETED':
      case 'RECEIVED':
      case 'CONNECTED':
        return NgColors.success;
      case 'PENDING':
      case 'PARTIALLY_REFUNDED':
      case 'LOW':
      case 'LOW_STOCK':
      case 'REBUILDING':
        return NgColors.warning;
      case 'REFUNDED':
      case 'CANCELLED':
      case 'FAILED':
      case 'OUT_OF_STOCK':
        return NgColors.danger;
      default:
        return NgColors.blue;
    }
  }
}

/// Compact search field with leading icon.
class SearchField extends StatelessWidget {
  const SearchField({
    super.key,
    required this.controller,
    required this.hint,
    this.onSubmit,
    this.trailing,
  });

  final TextEditingController controller;
  final String hint;
  final ValueChanged<String>? onSubmit;
  final Widget? trailing;

  @override
  Widget build(BuildContext context) {
    return TextField(
      controller: controller,
      textInputAction: TextInputAction.search,
      onSubmitted: onSubmit,
      decoration: InputDecoration(
        hintText: hint,
        prefixIcon: const Icon(Icons.search_rounded, size: 20),
        suffixIcon: trailing,
        isDense: true,
      ),
    );
  }
}
