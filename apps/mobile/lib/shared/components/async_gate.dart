import 'package:flutter/material.dart';

import '../../app/localization.dart';
import '../../core/api/error_mapper.dart';
import '../../core/errors/failure.dart';
import 'failure_message.dart';

class AsyncGate<T> extends StatefulWidget {
  const AsyncGate({
    super.key,
    required this.future,
    required this.builder,
    this.isEmpty,
  });

  final Future<T> Function() future;
  final Widget Function(BuildContext context, T data) builder;

  final bool Function(T data)? isEmpty;

  @override
  State<AsyncGate<T>> createState() => _AsyncGateState<T>();
}

class _AsyncGateState<T> extends State<AsyncGate<T>> {
  late Future<T> _future;
  Object? _error;

  @override
  void initState() {
    super.initState();
    _future = widget.future();
  }

  @override
  void didUpdateWidget(covariant AsyncGate<T> oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.future != widget.future) _future = widget.future();
  }

  void _retry() => setState(() {
        _error = null;
        _future = widget.future();
      });

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<T>(
      future: _future,
      builder: (context, snap) {
        if (snap.connectionState != ConnectionState.done) {
          return Center(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                const CircularProgressIndicator(strokeWidth: 2.5),
                const SizedBox(height: 12),
                Text(l(context).loading, style: Theme.of(context).textTheme.bodySmall),
              ],
            ),
          );
        }
        if (snap.hasError || _error != null) {
          final failure = mapToFailure(snap.error ?? _error!);
          return Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(
                  failure.kind == FailureKind.network
                      ? Icons.wifi_off_rounded
                      : Icons.error_outline_rounded,
                  size: 40,
                  color: Theme.of(context).colorScheme.error,
                ),
                const SizedBox(height: 12),
                Text(
                  localizedFailure(context, failure),
                  textAlign: TextAlign.center,
                  style: Theme.of(context).textTheme.bodyMedium,
                ),
                const SizedBox(height: 16),
                FilledButton.tonal(onPressed: _retry, child: Text(l(context).retry)),
              ],
            ),
          );
        }
        final data = snap.data as T;
        if (widget.isEmpty?.call(data) ?? false) {
          return EmptyCentered(message: l(context).emptyGeneric);
        }
        return widget.builder(context, data);
      },
    );
  }
}

class EmptyCentered extends StatelessWidget {
  const EmptyCentered({super.key, this.message});

  final String? message;

  @override
  Widget build(BuildContext context) => Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(Icons.inbox_outlined, size: 40, color: Theme.of(context).hintColor),
              const SizedBox(height: 12),
              Text(message ?? '',
                  textAlign: TextAlign.center,
                  style: Theme.of(context)
                      .textTheme
                      .bodyMedium
                      ?.copyWith(color: Theme.of(context).hintColor)),
            ],
          ),
        ),
      );
}
