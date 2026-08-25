import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../app/localization.dart';
import '../../core/api/error_mapper.dart';
import '../../core/auth/app_controller.dart';
import '../../shared/components/snack.dart';
import '../../shared/constants/design.dart';
import '../../app/router.dart' as routes;

/// Guided setup for brand-new companies:
/// company → store → branch → first product → POS → (optional) Sheets.
///
/// Steps backed by real endpoints are executed live; anything the API cannot
/// support yet shows an explicit BACKEND_GAP banner instead of faking success.
class OnboardingScreen extends StatefulWidget {
  const OnboardingScreen({super.key});

  @override
  State<OnboardingScreen> createState() => _OnboardingScreenState();
}

enum _Step { intro, company, store, branch, product, pos, sheets, done }

class _OnboardingScreenState extends State<OnboardingScreen> {
  _Step _step = _Step.intro;
  bool _busy = false;

  final _companyName = TextEditingController();
  final _storeName = TextEditingController();
  final _branchName = TextEditingController();
  final _branchCode = TextEditingController();
  final _productName = TextEditingController();
  final _productSku = TextEditingController();
  final _productPrice = TextEditingController();

  @override
  void dispose() {
    _companyName.dispose();
    _storeName.dispose();
    _branchName.dispose();
    _branchCode.dispose();
    _productName.dispose();
    _productSku.dispose();
    _productPrice.dispose();
    super.dispose();
  }

  AppController get _app => context.read<AppController>();

  Future<void> _run(Future<void> Function() action, String successMsg) async {
    setState(() => _busy = true);
    try {
      await action();
      if (!mounted) return;
      Snack.success(context, successMsg);
    } catch (e) {
      final failure = mapToFailure(e);
      if (!mounted) return;
      Snack.error(
          context,
          failure.kind == FailureKind.forbidden
              ? l(context).backendGap
              : failure.message ?? l(context).unknownError);
      // Stay on the same step — no fake progression.
      return;
    } finally {
      if (mounted) setState(() => _busy = false);
    }
    setState(() => _step = _next());
  }

  _Step _next() {
    switch (_step) {
      case _Step.company:
        return _Step.store;
      case _Step.store:
        return _Step.branch;
      case _Step.branch:
        return _Step.product;
      case _Step.product:
        return _Step.pos;
      case _Step.pos:
        return _Step.sheets;
      default:
        return _Step.done;
    }
  }

  Future<void> _createCompany() => _run(() async {
        await _app.apiClient.post('/companies',
            body: {'name': _companyName.text.trim()});
        await _app.afterLogin();
      }, l(context).done);

  Future<void> _createStore() => _run(() async {
        final stores =
            await _app.apiClient.get('/stores') as List<dynamic>;
        if (stores.isEmpty) {
          await _app.apiClient.post('/stores',
              body: {'name': _storeName.text.trim()});
        }
      }, l(context).done);

  Future<void> _createBranch() => _run(() async {
        final stores =
            await _app.apiClient.get('/stores') as List<dynamic>;
        if (stores.isEmpty) throw const Failure(FailureKind.server);
        await _app.apiClient.post('/branches', body: {
          'storeId': stores.first['id'],
          'name': _branchName.text.trim(),
          'code': _branchCode.text.trim(),
        });
        await _app.refreshContext();
      }, l(context).done);

  Future<void> _createFirstProduct() => _run(() async {
        await _app.apiClient.post('/products', body: {
          'name': _productName.text.trim(),
          'sku': _productSku.text.trim().toUpperCase(),
          'sellingPrice':
              double.tryParse(_productPrice.text.replaceAll(',', '')) ?? 0,
        });
      }, l(context).done);

  Future<void> _finish() async {
    await _app.prefs.setOnboarded(true);
    if (!mounted) return;
    Navigator.of(context)
        .pushNamedAndRemoveUntil(routes.Routes.home, (r) => false);
  }

  @override
  Widget build(BuildContext context) {
    final s = l(context);
    final app = context.watch<AppController>();
    final hasCompany = app.ctx?.activeCompanyId != null;

    return Scaffold(
      backgroundColor: NgColors.navyDeep,
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.symmetric(horizontal: 26, vertical: 28),
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 420),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Image.asset('assets/branding/niagantara-logo.png', width: 180),
                  const SizedBox(height: 34),
                  _progress(s, hasCompany),
                  const SizedBox(height: 22),
                  AnimatedSwitcher(
                    duration: const Duration(milliseconds: 240),
                    child: _body(s, hasCompany),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _progress(AppLocalizations s, bool hasCompany) {
    final steps = [
      s.stepCompany,
      s.stepStore,
      s.stepBranch,
      s.stepProduct,
      s.stepPos,
    ];
    return Row(
      children: [
        for (var i = 0; i < steps.length; i++) ...[
          Expanded(
            child: Column(
              children: [
                Container(
                  height: 3.5,
                  decoration: BoxDecoration(
                    color: _dotColor(i, hasCompany),
                    borderRadius: BorderRadius.circular(4),
                  ),
                ),
                const SizedBox(height: 5),
                Text(steps[i],
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: TextStyle(fontSize: 8.5, color: _dotColor(i, hasCompany))),
              ],
            ),
          ),
          if (i != steps.length - 1) const SizedBox(width: 6),
        ],
      ],
    );
  }

  Color _dotColor(int index, bool hasCompany) {
    const order = [_Step.company, _Step.store, _Step.branch, _Step.product, _Step.pos];
    final current = order.indexOf(_step);
    return (hasCompany && index == 0) || index <= current
        ? NgColors.cyan
        : Colors.white24;
  }

  Widget _field(TextEditingController c, String label, {String? hint}) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: TextField(
        controller: c,
        style: const TextStyle(color: Colors.white),
        decoration: InputDecoration(
          labelText: label,
          labelStyle: const TextStyle(color: Colors.white60),
          hintStyle: const TextStyle(color: Colors.white38),
          hintText: hint,
          fillColor: Colors.white.withValues(alpha: 0.06),
          enabledBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(12),
            borderSide: BorderSide(color: Colors.white24),
          ),
        ),
      ),
    );
  }

  Widget _button(String label, VoidCallback? onPressed) {
    return FilledButton(
      onPressed: _busy ? null : onPressed,
      child: _busy
          ? const SizedBox(
              width: 18, height: 18,
              child: CircularProgressIndicator(strokeWidth: 2))
          : Text(label),
    );
  }

  Widget _ghost(String label, VoidCallback onTap) => TextButton(
        onPressed: _busy ? null : onTap,
        style: TextButton.styleFrom(foregroundColor: Colors.white54),
        child: Text(label),
      );

  Widget _body(AppLocalizations s, bool hasCompany) {
    switch (_step) {
      case _Step.intro:
        return _card(Column(
          children: [
            Text(s.onboardingWelcome,
                textAlign: TextAlign.center,
                style: const TextStyle(
                    color: Colors.white,
                    fontSize: 20,
                    fontWeight: FontWeight.w900)),
            const SizedBox(height: 10),
            Text(s.onboardingBody,
                textAlign: TextAlign.center,
                style: const TextStyle(color: Colors.white70, fontSize: 13)),
            const SizedBox(height: 24),
            _button(s.next, () => setState(() => _step = _Step.company)),
          ],
        ));
      case _Step.company:
        return _card(hasCompany
            ? _existingColumn(s.stepCompany, () => setState(() => _step = _Step.store))
            : Column(children: [
                _title(s.stepCompany),
                _field(_companyName, s.companyName),
                _button(s.createNew, _createCompany),
                _ghost(s.skipForNow, () => setState(() => _step = _Step.store)),
              ]));
      case _Step.store:
        return _card(Column(children: [
          _title(s.stepStore),
          _field(_storeName, s.name, hint: 'NIAGANTARA Store'),
          _button(s.createNew, _createStore),
          _ghost(s.skipForNow, () => setState(() => _step = _Step.branch)),
        ]));
      case _Step.branch:
        return _card(Column(children: [
          _title(s.stepBranch),
          _field(_branchName, s.branch, hint: 'Cabang Pusat'),
          _field(_branchCode, s.code, hint: 'PST-01'),
          _button(s.createNew, _createBranch),
          _ghost(s.skipForNow, () => setState(() => _step = _Step.product)),
        ]));
      case _Step.product:
        return _card(Column(children: [
          _title(s.stepProduct),
          _field(_productName, s.productName),
          _field(_productSku, s.sku),
          _field(_productPrice, '${s.sellingPrice} (Rp)'),
          _button(s.next, _createFirstProduct),
          _ghost(s.skipForNow, () => setState(() => _step = _Step.pos)),
        ]));
      case _Step.pos:
        return _card(Column(children: [
          _title(s.stepPos),
          const SizedBox(height: 6),
          Icon(Icons.point_of_sale_rounded, color: NgColors.cyan, size: 44),
          const SizedBox(height: 14),
          _button(l(context).qaOpenPos, () async {
            await _app.prefs.setOnboarded(true);
            if (!mounted) return;
            await Navigator.of(context)
                .pushNamedAndRemoveUntil(routes.Routes.pos, (r) => false);
          }),
          _ghost(s.stepSheets, () => setState(() => _step = _Step.sheets)),
        ]));
      case _Step.sheets:
        return _card(Column(children: [
          _title(s.stepSheets),
          const SizedBox(height: 6),
          Icon(Icons.table_view_rounded, color: NgColors.cyan, size: 40),
          const SizedBox(height: 10),
          Text(s.sheetsConnectNote,
              textAlign: TextAlign.center,
              style: const TextStyle(color: Colors.white60, fontSize: 12)),
          const SizedBox(height: 16),
          _button(l(context).finishSetup, _finish),
        ]));
      case _Step.done:
        return _card(Column(children: [
          const Icon(Icons.check_circle_rounded, color: NgColors.success, size: 46),
          const SizedBox(height: 10),
          _title(s.setupComplete),
          const SizedBox(height: 8),
          _button(l(context).finishSetup, _finish),
        ]));
    }
  }

  Widget _title(String text) => Padding(
        padding: const EdgeInsets.only(bottom: 14),
        child: Text(text,
            textAlign: TextAlign.center,
            style: const TextStyle(
                color: Colors.white,
                fontSize: 17,
                fontWeight: FontWeight.w800)),
      );

  Widget _existingColumn(String stepLabel, VoidCallback onNext) => Column(children: [
        _title(stepLabel),
        Text(l(context).chooseExisting,
            style: const TextStyle(color: Colors.white70, fontSize: 12.5)),
        const SizedBox(height: 12),
        _button(l(context).next, onNext),
      ]);

  Widget _card(Widget child) => Container(
        key: ValueKey(_step),
        padding: const EdgeInsets.all(22),
        decoration: BoxDecoration(
          color: Colors.white.withValues(alpha: 0.045),
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: Colors.white12),
        ),
        child: child,
      );
}
