---
name: hurevo-testing
description: Load when writing tests or reviewing test coverage. TDD workflow, PHPUnit/Pest standards, and coverage requirements for Hurevo projects.
---

# Hurevo Testing

TDD workflow and test quality standards for Hurevo projects. Contains 4 rules covering philosophy, test organisation, Pest/PHPUnit standards, and coverage requirements.

## When to Apply

- Writing any new feature (write the failing test first)
- Reviewing a PR for test coverage and quality
- Setting up a test suite on a new project

## Rules Summary

### Philosophy (HIGH)

#### tdd-workflow - @rules/tdd-workflow.md

Write the failing test before the implementation — no exceptions for "simple" features. Test behaviour, not implementation. Fast unit tests run on every save; DB/HTTP tests run in CI.

```php
// Bad — test written after, tests implementation detail
it('calls stripe->charge once', function () {
    $mock = Mockery::mock(Stripe::class);
    $mock->shouldReceive('charge')->once();
    // tests the mock, not the behaviour
});

// Good — tests observable behaviour
it('creates a paid order when payment succeeds', function () {
    $order = app(OrderService::class)->create(validOrderData());
    expect($order->status)->toBe(OrderStatus::Paid)
        ->and($order->paid_at)->not->toBeNull();
});
```

### Test Organisation (HIGH)

#### test-organisation - @rules/test-organisation.md

Unit tests in `tests/Unit/`, feature tests in `tests/Feature/`. File structure mirrors source. One factory state per common entity configuration.

```
# Bad — tests dumped at root, no structure
tests/
├── OrderTest.php
├── UserTest.php

# Good — mirrors source structure
tests/
├── Unit/
│   └── Services/
│       └── OrderServiceTest.php
└── Feature/
    └── Api/
        └── OrderControllerTest.php
```

### Pest/PHPUnit Standards (HIGH)

#### pest-standards - @rules/pest-standards.md

Use Pest on new projects. Datasets for multi-input branches. `assertDatabaseHas` for DB assertions — not raw queries. Always `actingAs($user)` before auth-required tests.

```php
// Bad — no dataset, raw DB query assertion
it('validates amount', function () {
    $this->post('/orders', ['amount' => -1]);
    $this->assertEquals(0, DB::table('orders')->count());
});

// Good — dataset covers branches, proper assertion
it('rejects invalid amounts', function (int $amount) {
    actingAs(User::factory()->create())
        ->postJson('/api/orders', ['amount' => $amount])
        ->assertUnprocessable();
})->with([-1, 0, 999999999]);
```

### Coverage (HIGH)

#### coverage-requirements - @rules/coverage-requirements.md

80% line coverage minimum on new code. 100% required on payment, auth, authorisation, and data export paths. Coverage is a floor, not a target.

```bash
# Run before every PR
php artisan test --coverage --min=80

# Coverage that passes but is meaningless
it('processes payment', function () {
    expect(true)->toBeTrue(); // 100% coverage, zero assertions
});

# Coverage that actually validates the contract
it('creates a charge and returns the order', function () {
    Http::fake(['stripe.com/*' => Http::response(['id' => 'ch_123'], 200)]);
    $order = app(PaymentService::class)->charge(orderFixture());
    expect($order->stripe_charge_id)->toBe('ch_123')
        ->and($order->status)->toBe(OrderStatus::Paid);
});
```
