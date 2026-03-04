---
title: Characterization Testing
impact: HIGH
tags: [testing, characterization, legacy, migration]
---

# Characterization Testing

Write characterization tests before touching any legacy code. These tests capture the current behaviour of the system — including bugs — and define the contract the new system must match.

## Why

- **Safety net**: Characterization tests catch regressions in the new implementation that would otherwise surface in production.
- **Documentation**: They capture implicit contracts the legacy system has accumulated — undocumented behaviours that clients depend on.
- **Confidence**: With a comprehensive characterization suite, refactoring or rewriting becomes verifiable instead of speculative.

## Pattern

```php
// Step 1 — write a characterization test against the legacy code AS-IS
// Don't fix the behaviour. Document it. Even if it's wrong.

it('calculates order total with null item prices as zero (legacy behaviour)', function () {
    $order = Order::factory()->create(['status' => 'pending']);
    $order->items()->createMany([
        ['product_id' => 1, 'price' => null, 'quantity' => 2],  // null price
        ['product_id' => 2, 'price' => 5000, 'quantity' => 1],
    ]);

    $result = app(LegacyOrderCalculator::class)->calculateTotal($order->id);

    // Bug: legacy returns 5000 instead of throwing — items with null prices are silently 0
    // This IS the contract the new system must match until explicitly changed with the client
    expect($result)->toBe(5000);
})->group('characterization');

it('returns negative balance when refund exceeds original amount (legacy bug)', function () {
    $account = Account::factory()->withBalance(10000)->create();
    $result = app(LegacyRefundService::class)->refund($account->id, 15000);

    // Legacy allows negative balances — new system must too, or clients break
    expect($result->balance)->toBe(-5000);
})->group('characterization');

// Step 2 — run against new implementation to verify parity
it('new invoice calculator matches legacy for null price items', function () {
    $order = Order::factory()->withNullPriceItem()->create();

    $legacy = app(LegacyOrderCalculator::class)->calculateTotal($order->id);
    $new    = app(OrderCalculator::class)->calculateTotal($order->id);

    expect($new)->toBe($legacy);
})->group('parity');
```

```php
// Approval testing — capture output as "golden file"
it('generates the same invoice PDF bytes as the legacy system', function () {
    $invoice = Invoice::factory()->state(['id' => 999])->create();

    $legacyPdf = app(LegacyPdfService::class)->generate($invoice);
    $newPdf    = app(PdfService::class)->generate($invoice);

    // Not byte-for-byte — compare normalised text content
    expect(extractText($newPdf))->toBe(extractText($legacyPdf));
})->group('parity');
```

## Rules

1. Write characterization tests before modifying any legacy code — even a single line change.
2. Document legacy bugs in the test name and comment — the test captures the bug as an intentional contract, not an accident.
3. Tag characterization tests with `->group('characterization')` and parity tests with `->group('parity')` — run both groups in CI.
4. Never delete a characterization test until after the corresponding vertical slice has been live in production for ≥4 weeks.
5. If the client explicitly requests a behaviour change (fixing a bug), document it in the migration map and update the test to the new expected behaviour.
6. Cover these categories for each legacy module: happy path, known edge cases, known bugs, boundary values, error states.
