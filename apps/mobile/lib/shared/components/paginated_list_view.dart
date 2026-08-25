import 'package:flutter/material.dart';

import '../../app/localization.dart';
import '../../core/api/error_mapper.dart';
import '../widgets/state_views.dart';

/// Infinite-scroll list with pull-to-refresh, built for array APIs.
///
/// [fetchPage] returns the next page; an empty list marks the end.
class PaginatedListView<T> extends StatefulWidget {
  const PaginatedListView({
    super.key,
    required this.fetchPage,
    required this.itemBuilder,
    this.separator,
    this.padding = const EdgeInsets.fromLTRB(16, 8, 16, 24),
    this.onLoaded,
  });

  /// Loads the next chunk. Receives the count already loaded.
  final Future<List<T>> Function(int loadedCount) fetchPage;
  final Widget Function(BuildContext context, T item) itemBuilder;
  final Widget? separator;
  final EdgeInsetsGeometry padding;

  /// Called after every page load with ALL items accumulated so far —
  /// lets screens derive cursors (e.g. `lt: last.created_at`).
  final void Function(List<T> allItems)? onLoaded;

  @override
  State<PaginatedListView<T>> createState() => _PaginatedListViewState<T>();
}

class _PaginatedListViewState<T> extends State<PaginatedListView<T>> {
  final List<T> _items = [];
  final ScrollController _controller = ScrollController();
  bool _loading = false;
  bool _done = false;
  Object? _error;

  @override
  void initState() {
    super.initState();
    _loadMore();
    _controller.addListener(() {
      if (!_done &&
          !_loading &&
          _controller.position.pixels >
              _controller.position.maxScrollExtent - 320) {
        _loadMore();
      }
    });
  }

  Future<void> _refresh() async {
    if (_loading) return;
    setState(() {
      _items.clear();
      _done = false;
      _error = null;
    });
    await _loadMore();
  }

  Future<void> _loadMore() async {
    if (_loading || _done || !mounted) return;
    setState(() => _loading = true);
    try {
      final page = await widget.fetchPage(_items.length);
      if (!mounted) return;
      setState(() {
        _items.addAll(page);
        if (page.isEmpty) _done = true;
        _loading = false;
      });
      widget.onLoaded?.call(List.unmodifiable(_items));
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _error = e;
        _loading = false;
      });
    }
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return RefreshIndicator(
      onRefresh: _refresh,
      child: _error != null
          ? ListView(
              physics: const AlwaysScrollableScrollPhysics(),
              children: [
                SizedBox(
                  height: MediaQuery.of(context).size.height * 0.6,
                  child: ErrorView(
                    failure: mapToFailure(_error!),
                    retryLabel: l(context).retry,
                    onRetry: () => _refresh(),
                  ),
                ),
              ],
            )
          : _items.isEmpty && !_loading && _done
              ? ListView(
                  physics: const AlwaysScrollableScrollPhysics(),
                  children: [
                    SizedBox(
                      height: MediaQuery.of(context).size.height * 0.6,
                      child: EmptyView(message: l(context).emptyGeneric),
                    ),
                  ],
                )
              : ListView.separated(
                  controller: _controller,
                  physics: const AlwaysScrollableScrollPhysics(),
                  padding: widget.padding,
                  itemCount: _items.length + (_done ? 0 : 1),
                  separatorBuilder: (_, __) =>
                      widget.separator ?? const SizedBox(height: 10),
                  itemBuilder: (context, index) {
                    if (index >= _items.length) {
                      return const Padding(
                        padding: EdgeInsets.symmetric(vertical: 18),
                        child: Center(
                          child: SizedBox(
                            width: 22,
                            height: 22,
                            child: CircularProgressIndicator(strokeWidth: 2.2),
                          ),
                        ),
                      );
                    }
                    return widget.itemBuilder(context, _items[index]);
                  },
                ),
    );
  }
}
