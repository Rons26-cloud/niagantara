import 'package:flutter_test/flutter_test.dart';
import 'package:niagantara_mobile/features/pos/cart_totals.dart';

void main() {
  group('round2 (PostgreSQL numeric round semantics)', () {
    test('keeps two decimals', () {
      expect(round2(10.005), 10.01); // half away from zero
      expect(round2(10.004), 10.00);
      expect(round2(33.333), 33.33);
      expect(round2(100), 100.0);
    });
  });

  group('lineBreakdown', () {
    test('no discount', () {
      final math = PosCartMath(lines: [
        const CartLine(productId: 'p1', name: 'A', unitPrice: 15000, quantity: 2),
      ]);
      final b = math.lineBreakdown(math.lines.first);
      expect(b.gross, 30000);
      expect(b.discount, 0);
      expect(b.total, 30000);
    });

    test('PERCENT discount clamped and rounded like SQL', () {
      final math = PosCartMath(lines: [
        const CartLine(
            productId: 'p1',
            name: 'A',
            unitPrice: 9999,
            quantity: 3,
            discountType: discountPercent,
            discountValue: 12.5),
      ]);
      final b = math.lineBreakdown(math.lines.first);
      // gross = 29997 ; discount = round(29997*12.5/100)=3749.63 (SQL half-up)
      expect(b.gross, 29997);
      expect(b.discount, 3749.63);
      expect(b.total, 26247.37);
    });

    test('PERCENT above 100 clamps to 100', () {
      final math = PosCartMath(lines: [
        const CartLine(
            productId: 'p1',
            name: 'A',
            unitPrice: 100,
            quantity: 1,
            discountType: discountPercent,
            discountValue: 150),
      ]);
      expect(math.lineBreakdown(math.lines.first).discount, 100);
    });

    test('FIXED discount cannot exceed gross', () {
      final math = PosCartMath(lines: [
        const CartLine(
            productId: 'p1',
            name: 'A',
            unitPrice: 5000,
            quantity: 1,
            discountType: discountFixed,
            discountValue: 9000),
      ]);
      expect(math.lineBreakdown(math.lines.first).discount, 5000);
    });
  });

  group('totals (checkout_sale mirror)', () {
    test('subtotal → item discounts → txn PERCENT → tax → grand', () {
      final math = PosCartMath(lines: [
        const CartLine(productId: 'a', name: 'A', unitPrice: 20000, quantity: 2),
        const CartLine(
            productId: 'b', name: 'B', unitPrice: 10000, quantity: 1),
        const CartLine(
            productId: 'c',
            name: 'C',
            unitPrice: 8000,
            quantity: 1,
            discountType: discountFixed,
            discountValue: 800),
      ]);
      final t = math.totals(
          transactionDiscountType: discountPercent,
          transactionDiscountValue: 10,
          taxRate: 11);
      // subtotal = 58000 ; itemDisc = 800 ; afterItems = 57200
      // txn = 5720 ; tax = round((57200-5720)*11/100)=5662.80
      // grand = 57200 - 5720 + 5662.80 = 57142.80
      expect(t.subtotal, 58000);
      expect(t.itemDiscountTotal, 800);
      expect(t.transactionDiscount, 5720);
      expect(t.taxTotal, 5662.80);
      expect(t.grandTotal, 57142.80);
    });

    test('FIXED transaction discount capped at after-item amount', () {
      final math = PosCartMath(lines: [
        const CartLine(productId: 'a', name: 'A', unitPrice: 10000, quantity: 1),
      ]);
      final t = math.totals(
          transactionDiscountType: discountFixed,
          transactionDiscountValue: 99999);
      expect(t.transactionDiscount, 10000);
      expect(t.grandTotal, 0);
    });

    test('item count sums rounded quantities', () {
      final math = PosCartMath(lines: [
        const CartLine(productId: 'a', name: 'A', unitPrice: 1000, quantity: 2.5),
        const CartLine(productId: 'b', name: 'B', unitPrice: 1000, quantity: 1),
      ]);
      expect(math.totals().itemCount, 4);
    });
  });

  group('cashChange', () {
    test('insufficient below grand total', () {
      final math = PosCartMath();
      final r = math.cashChange(40000, 45500);
      expect(r.sufficient, false);
      expect(r.change, 0);
    });

    test('change equals received minus grand', () {
      final math = PosCartMath();
      final r = math.cashChange(100000, 45500);
      expect(r.sufficient, true);
      expect(r.change, 54500);
    });
  });

  group('cart mutation', () {
    test('same product merges quantities', () {
      final math = PosCartMath()
        ..add(const CartLine(productId: 'x', name: 'X', unitPrice: 1000))
        ..add(const CartLine(productId: 'x', name: 'X', unitPrice: 1000));
      expect(math.lines.length, 1);
      expect(math.lines.first.quantity, 2);
      math.updateQuantity('x', 1);
      expect(math.lines.first.quantity, 1);
      math.updateQuantity('x', 0);
      expect(math.isEmpty, true);
    });
  });
}
