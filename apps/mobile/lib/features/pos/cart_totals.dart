/// Pure POS cart math — an exact Dart mirror of the server-side
/// `checkout_sale` SQL function (supabase/migrations/20260821135954,
/// lines 222-242). The client uses it to preview totals before checkout;
/// the backend remains the source of truth.
library;

const String discountPercent = 'PERCENT';
const String discountFixed = 'FIXED';

class CartLine {
  const CartLine({
    required this.productId,
    required this.name,
    required this.unitPrice,
    this.quantity = 1,
    this.discountType,
    this.discountValue = 0,
  });

  final String productId;
  final String name;
  final num unitPrice;
  final double quantity;
  final String? discountType;
  final num discountValue;
}

class CartTotals {
  const CartTotals({
    required this.subtotal,
    required this.itemDiscountTotal,
    required this.transactionDiscount,
    required this.taxTotal,
    required this.grandTotal,
    required this.itemCount,
  });

  final double subtotal;
  final double itemDiscountTotal;
  final double transactionDiscount;
  final double taxTotal;
  final double grandTotal;
  final int itemCount;
}

/// Rounds exactly like PostgreSQL `round(numeric, 2)` for the non-negative
/// values used here: half away from zero.
double round2(num v) {
  final scaled = v * 100;
  final floorV = scaled.floor();
  final frac = scaled - floorV;
  final rounded = frac > 0.5 ? floorV + 1 : (frac < 0.5 ? floorV : (scaled < 0 ? floorV : floorV + 1));
  return rounded / 100;
}

num _clamp0To100(num v) => v < 0 ? 0 : (v > 100 ? 100 : v);

class PosCartMath {
  PosCartMath({List<CartLine> lines = const []}) : _lines = List.of(lines);

  final List<CartLine> _lines;

  List<CartLine> get lines => List.unmodifiable(_lines);
  bool get isEmpty => _lines.isEmpty;
  int get itemCount =>
      _lines.fold(0, (n, l) => n + l.quantity.round());

  void add(CartLine line) {
    final i = _lines.indexWhere((l) => l.productId == line.productId);
    if (i == -1) {
      _lines.add(line);
    } else {
      _lines[i] = CartLine(
        productId: line.productId,
        name: line.name,
        unitPrice: line.unitPrice,
        quantity: (_lines[i].quantity + line.quantity),
        discountType: line.discountType ?? _lines[i].discountType,
        discountValue: line.discountValue != 0 ? line.discountValue : _lines[i].discountValue,
      );
    }
  }

  void updateQuantity(String productId, double quantity) {
    final i = _lines.indexWhere((l) => l.productId == productId);
    if (i == -1) return;
    if (quantity <= 0) {
      _lines.removeAt(i);
    } else {
      final l = _lines[i];
      _lines[i] = CartLine(
          productId: l.productId,
          name: l.name,
          unitPrice: l.unitPrice,
          quantity: quantity,
          discountType: l.discountType,
          discountValue: l.discountValue);
    }
  }

  void remove(String productId) => _lines.removeWhere((l) => l.productId == productId);
  void clear() => _lines.clear();

  /// Mirrors the SQL loop: gross → line discount → line total.
  ({double gross, double discount, double total}) lineBreakdown(CartLine l) {
    final qty = double.parse(l.quantity.toStringAsFixed(3));
    final gross = round2(l.unitPrice * qty);
    var discount = 0.0;
    final type = l.discountType ?? '';
    if (type == discountPercent) {
      discount =
          round2(gross * _clamp0To100(l.discountValue) / 100);
    } else if (type == discountFixed) {
      final v = l.discountValue < 0 ? 0 : l.discountValue;
      discount = v > gross ? gross : v.toDouble();
    }
    return (gross: gross, discount: discount, total: gross - discount);
  }

  CartTotals totals({
    String? transactionDiscountType,
    num transactionDiscountValue = 0,
    num taxRate = 0,
  }) {
    var subtotal = 0.0;
    var itemDiscounts = 0.0;
    for (final l in _lines) {
      final b = lineBreakdown(l);
      subtotal += b.gross;
      itemDiscounts += b.discount;
    }
    subtotal = round2(subtotal);
    itemDiscounts = round2(itemDiscounts);

    var txnDiscount = 0.0;
    final type = transactionDiscountType ?? '';
    final afterItems = subtotal - itemDiscounts;
    if (type == discountPercent) {
      txnDiscount =
          round2(afterItems * _clamp0To100(transactionDiscountValue) / 100);
    } else if (type == discountFixed) {
      final v = transactionDiscountValue < 0 ? 0 : transactionDiscountValue;
      txnDiscount = v > afterItems ? afterItems : v.toDouble();
    }

    final tax = round2(
        (afterItems - txnDiscount) * _clamp0To100(taxRate) / 100);
    final grand = afterItems - txnDiscount + tax;

    return CartTotals(
      subtotal: subtotal,
      itemDiscountTotal: itemDiscounts,
      transactionDiscount: txnDiscount,
      taxTotal: tax,
      grandTotal: grand < 0 ? 0 : grand,
      itemCount: itemCount,
    );
  }

  /// Cash change per the SQL rule: INSUFFICIENT_PAYMENT when below grand.
  ({bool sufficient, double change}) cashChange(double amountReceived, double grandTotal) {
    if (amountReceived < grandTotal) return (sufficient: false, change: 0);
    return (sufficient: true, change: amountReceived - grandTotal);
  }
}
