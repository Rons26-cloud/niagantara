import 'package:flutter/material.dart';
import 'package:mobile_scanner/mobile_scanner.dart';

import '../../app/localization.dart';
import '../../shared/constants/design.dart';

/// Barcode scanner returning the decoded string to the caller via
/// Navigator.pop(context, code). Includes a manual-entry fallback so the
/// flow never dead-ends on damaged barcodes or emulator builds.
class BarcodeScannerScreen extends StatefulWidget {
  const BarcodeScannerScreen({super.key});

  @override
  State<BarcodeScannerScreen> createState() => _BarcodeScannerScreenState();
}

class _BarcodeScannerScreenState extends State<BarcodeScannerScreen> {
  final _controller = MobileScannerController(
    formats: const [BarcodeFormat.ean13, BarcodeFormat.ean8, BarcodeFormat.code128, BarcodeFormat.qrCode],
  );
  final _manual = TextEditingController();
  bool _handled = false;

  @override
  void dispose() {
    _controller.dispose();
    _manual.dispose();
    super.dispose();
  }

  void _complete(String code) {
    if (_handled) return;
    setState(() => _handled = true);
    Navigator.of(context).pop(code);
  }

  @override
  Widget build(BuildContext context) {
    final s = l(context);
    return Scaffold(
      backgroundColor: NgColors.navyDeep,
      appBar: AppBar(
        backgroundColor: NgColors.navyDeep,
        foregroundColor: Colors.white,
        title: Text(s.scan),
        actions: [
          IconButton(
            icon: const Icon(Icons.flash_on_rounded),
            onPressed: () => _controller.toggleTorch(),
          ),
        ],
      ),
      body: Column(
        children: [
          Expanded(
            child: Stack(
              alignment: Alignment.center,
              children: [
                MobileScanner(
                  controller: _controller,
                  onDetect: (capture) {
                    for (final barcode in capture.barcodes) {
                      final value = barcode.rawValue;
                      if (value != null && value.isNotEmpty) {
                        _complete(value);
                        break;
                      }
                    }
                  },
                ),
                IgnorePointer(
                  child: Container(
                    width: 240,
                    height: 140,
                    decoration: BoxDecoration(
                      border: Border.all(color: NgColors.cyan, width: 2.5),
                      borderRadius: BorderRadius.circular(14),
                    ),
                  ),
                ),
              ],
            ),
          ),
          SafeArea(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Row(
                children: [
                  Expanded(
                    child: TextField(
                      controller: _manual,
                      keyboardType: TextInputType.text,
                      style: const TextStyle(color: Colors.white),
                      decoration: InputDecoration(
                        hintText: s.manualBarcodeHint,
                        hintStyle: const TextStyle(color: Colors.white38),
                        fillColor: Colors.white.withValues(alpha: .07),
                        enabledBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12),
                          borderSide: const BorderSide(color: Colors.white24),
                        ),
                      ),
                      onSubmitted: (v) {
                        if (v.trim().isNotEmpty) _complete(v.trim());
                      },
                    ),
                  ),
                  const SizedBox(width: 10),
                  FilledButton(
                    style: FilledButton.styleFrom(backgroundColor: NgColors.blue),
                    onPressed: () {
                      if (_manual.text.trim().isNotEmpty) {
                        _complete(_manual.text.trim());
                      }
                    },
                    child: Text(s.confirmShort),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
