---
title: Coverage Requirements
impact: HIGH
tags: [coverage, ci, quality-gate, testing]
---

# Coverage Requirements

80% line coverage minimum on new code. 100% required on payment, auth, authorisation, and data export paths. Coverage is a floor — not a target.

## Why

- **Risk calibration**: Payment and auth code has a disproportionate impact when it fails. 100% coverage there catches regressions in every branch.
- **Floor vs target**: Teams that treat coverage as a target write trivial tests to hit 80% — tests that pass but prove nothing. The metric is useful only when the tests have meaningful assertions.
- **New code only**: Enforcing 80% on a legacy codebase with zero tests forces bad tests. Apply the requirement to new code in each PR.

## Pattern

```bash
# Run coverage locally before pushing
php artisan test --coverage --min=80

# Coverage report for a specific directory (payment paths)
php artisan test --coverage-html coverage/ --filter="Payment"

# View in browser
open coverage/index.html
```

```php
// Bad — 100% line coverage, zero assertion value
it('processes payment', function () {
    app(PaymentService::class)->charge(Order::factory()->create());
    expect(true)->toBeTrue(); // coverage: yes, confidence: zero
});

// Good — 100% coverage AND meaningful assertions
it('creates a charge and marks the order as paid', function () {
    Http::fake(['api.stripe.com/*' => Http::response([
        'id'     => 'ch_test_123',
        'status' => 'succeeded',
    ], 200)]);

    $order = Order::factory()->pending()->create(['amount' => 50000]);
    $result = app(PaymentService::class)->charge($order);

    expect($result->status)->toBe(OrderStatus::Paid)
        ->and($result->stripe_charge_id)->toBe('ch_test_123')
        ->and($result->paid_at)->not->toBeNull();

    assertDatabaseHas('orders', [
        'id'               => $order->id,
        'status'           => 'paid',
        'stripe_charge_id' => 'ch_test_123',
    ]);
});

it('throws PaymentFailedException when Stripe returns an error', function () {
    Http::fake(['api.stripe.com/*' => Http::response(['error' => 'card_declined'], 402)]);

    $order = Order::factory()->pending()->create();

    expect(fn () => app(PaymentService::class)->charge($order))
        ->toThrow(PaymentFailedException::class, 'card_declined');

    assertDatabaseHas('orders', ['id' => $order->id, 'status' => 'pending']); // not changed
});
```

```yaml
# .github/workflows/test.yml — coverage gate in CI
- name: Run tests with coverage
  run: php artisan test --coverage --min=80

# For payment/auth paths — fail if below 100%
- name: Coverage gate — payment paths
  run: php artisan test --coverage --min=100 --filter="Payment|Auth|Authoris"
```

## Rules

1. Minimum 80% line coverage on all new code — enforce in CI with `--min=80`.
2. Payment, authentication, authorisation, and data export paths require 100% branch coverage.
3. Coverage is a floor — never sacrifice assertion quality to hit the percentage. A test with no meaningful assertions is worse than no test.
4. Every branch in conditional logic must have a corresponding test: happy path + at least one failing path.
5. Don't count `it('does X', fn () => expect(true)->toBeTrue())` — code review must reject tests with no meaningful assertions even if they improve coverage.
6. Run `php artisan test --coverage` locally before every PR — don't discover coverage failures in CI.
7. Review coverage reports by file, not just aggregate — a single heavily-exercised file can mask uncovered files.
