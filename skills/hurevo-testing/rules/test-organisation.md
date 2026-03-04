---
title: Test Organisation
impact: HIGH
tags: [testing, structure, organisation, factories]
---

# Test Organisation

Unit tests in `tests/Unit/`, feature tests in `tests/Feature/`. Test file structure mirrors source structure. One factory state per common entity configuration.

## Why

- **Navigation**: When a test fails, you should be able to find the corresponding test file instantly. Mirroring the source structure makes this possible.
- **Appropriate isolation**: Unit tests must not touch external resources. Putting them in `Unit/` is a convention that enforces this — it's wrong if `Unit/` tests hit the database.
- **Factory clarity**: Named factory states (`->verified()`, `->withSubscription()`) make test setup readable and prevent duplication of complex fixture code.

## Pattern

```
# Bad — all tests in root tests/ directory, no structure
tests/
├── OrderTest.php          # unclear if unit or feature
├── UserTest.php
├── InvoiceTest.php
└── PaymentTest.php

# Good — mirrors source structure, separated by test type
tests/
├── Unit/
│   └── Services/
│       ├── OrderServiceTest.php       # mirrors app/Services/OrderService.php
│       ├── PaymentServiceTest.php     # mirrors app/Services/PaymentService.php
│       └── InvoiceService/
│           └── TotalCalculatorTest.php
└── Feature/
    └── Api/
        └── V1/
            ├── OrderControllerTest.php  # mirrors app/Http/Controllers/Api/V1/
            └── InvoiceControllerTest.php
```

```php
// Bad — fixture setup duplicated across tests
it('sends email on invoice created', function () {
    $user = User::factory()->create([
        'email_verified_at' => now(),
        'subscription_ends_at' => now()->addMonth(),
        'role' => 'client',
    ]);
    // repeated in 15 other tests
});

// Good — named factory state
// database/factories/UserFactory.php
public function verifiedClient(): static
{
    return $this->state([
        'email_verified_at'    => now(),
        'subscription_ends_at' => now()->addMonth(),
        'role'                 => 'client',
    ]);
}

// Test is now readable and DRY
it('sends email on invoice created', function () {
    $user = User::factory()->verifiedClient()->create();
    // ...
});

it('redirects unverified user to verification', function () {
    $user = User::factory()->unverified()->create();
    // ...
});
```

```php
// Pest groups for selective CI runs
it('calculates total correctly', function () {
    // ...
})->group('unit', 'order');

// Run only order unit tests
// ./vendor/bin/pest --group=order
```

## Rules

1. `tests/Unit/` must mirror `app/` — `app/Services/OrderService.php` → `tests/Unit/Services/OrderServiceTest.php`.
2. `tests/Feature/` mirrors the HTTP layer — `app/Http/Controllers/Api/V1/OrderController.php` → `tests/Feature/Api/V1/OrderControllerTest.php`.
3. Unit tests must not touch the database, filesystem, or real HTTP — use in-memory fakes and mock only infrastructure boundaries.
4. Feature tests use `RefreshDatabase` and `Http::fake()` — they test the HTTP layer through to the database.
5. Create named factory states for every common entity configuration — if you copy factory setup more than twice, extract it.
6. Tag test files with `->group()` for selective runs: at minimum `unit` and `feature`.
7. Test file names end in `Test.php`, test method names describe behaviour: `it('returns 422 when amount is negative')` not `it('store validation')`.
