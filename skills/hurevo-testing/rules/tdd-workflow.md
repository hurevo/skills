---
title: TDD Workflow
impact: HIGH
tags: [tdd, testing, red-green-refactor, behaviour]
---

# TDD Workflow

Write the failing test before the implementation — no exceptions for "simple" features. Test observable behaviour, not implementation details. Fast unit tests run on every save; DB and HTTP tests run in CI.

## Why

- **Design feedback**: Writing the test first forces you to think about the API from the caller's perspective — this often reveals design problems before you've written any production code.
- **Regression safety**: A test written after the fact often mirrors the implementation so closely it can't catch regressions.
- **Speed**: Unit tests that don't hit the database run in milliseconds. Running them on save gives instant feedback.

## Pattern

```php
// Bad — test written after implementation, tests implementation details
it('calls Stripe charge once with correct amount', function () {
    $mock = Mockery::mock(StripeClient::class);
    $mock->shouldReceive('charges->create')->once()->with([
        'amount'   => 50000,
        'currency' => 'idr',
    ]);
    // Tests that we called Stripe — not that the order was charged correctly
    app()->instance(StripeClient::class, $mock);
    app(PaymentService::class)->charge(50000);
});

// Good — Red (test first), then Green (minimal implementation), then Refactor

// Step 1: RED — write test, confirm it fails
it('creates a paid order when payment succeeds', function () {
    Http::fake(['api.stripe.com/*' => Http::response(['id' => 'ch_test_123'], 200)]);

    $order = app(PaymentService::class)->charge(OrderFactory::pending()->make());

    expect($order->status)->toBe(OrderStatus::Paid)
        ->and($order->stripe_charge_id)->toBe('ch_test_123')
        ->and($order->paid_at)->not->toBeNull();
});
// Run test → FAIL (PaymentService doesn't exist yet) ✓

// Step 2: GREEN — write minimal implementation to make it pass
// Step 3: REFACTOR — clean up without breaking the test
```

```bash
# Watch mode for fast feedback during development
./vendor/bin/pest --watch --filter="Unit"

# CI — run all tests including DB/HTTP
php artisan test --parallel
```

## Rules

1. Write the test first, confirm it fails (Red), then write the minimal implementation to make it pass (Green), then refactor.
2. Test observable behaviour: what does the system do, not how does it do it. Avoid `shouldReceive('specificMethod')` except on true infrastructure boundaries (email, SMS, payment APIs).
3. Separate test speeds: `tests/Unit/` must not touch the database or HTTP — use in-memory fakes. `tests/Feature/` may use the DB (with `RefreshDatabase`) and Http::fake().
4. Run unit tests on every file save during development. Run feature tests before every commit.
5. Never write a test whose passing proves nothing — every test must have at least one assertion on a value produced by the system under test.
6. If you're retrofitting tests onto existing untested code, write characterization tests first (see `hurevo-modernization`) before refactoring.
