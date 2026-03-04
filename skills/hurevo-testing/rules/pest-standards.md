---
title: Pest Standards
impact: HIGH
tags: [pest, phpunit, datasets, assertions, laravel]
---

# Pest Standards

Use Pest on new projects. Use datasets for multi-input branches. `assertDatabaseHas` for DB assertions — not raw queries. Always `actingAs($user)` before auth-required endpoint tests.

## Why

- **Readability**: Pest's `it()` and `expect()` DSL produces test descriptions that read like plain English, making failures easier to understand without opening the file.
- **Datasets**: Pest datasets run a single test body with multiple inputs — they eliminate duplicated test methods for boundary condition testing.
- **Correct assertions**: `assertDatabaseHas` uses Eloquent's casting system. Raw `DB::table()->count()` queries bypass it — you can have a record in the DB and still get a false failure.

## Pattern

```php
// Bad — no dataset, raw DB assertion, no actingAs, PHPUnit style
class OrderControllerTest extends TestCase
{
    public function testStoreValidatesAmount(): void
    {
        $this->post('/api/v1/orders', ['amount' => -1]);
        $this->assertEquals(0, DB::table('orders')->count()); // bypasses casting
    }

    public function testStoreValidatesZeroAmount(): void
    {
        $this->post('/api/v1/orders', ['amount' => 0]); // duplicated test
        $this->assertEquals(0, DB::table('orders')->count());
    }
}

// Good — Pest dataset, proper assertion, actingAs
it('rejects invalid order amounts', function (int|float $amount) {
    $user = User::factory()->verifiedClient()->create();

    actingAs($user)
        ->postJson('/api/v1/orders', ['amount' => $amount])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['amount']);

    assertDatabaseMissing('orders', ['user_id' => $user->id]);
})->with([
    'negative'     => [-1],
    'zero'         => [0],
    'over limit'   => [1_000_000_001],
    'float'        => [9.99],
]);

it('creates an order for valid amounts', function (int $amount) {
    $user = User::factory()->verifiedClient()->create();

    actingAs($user)
        ->postJson('/api/v1/orders', ['amount' => $amount])
        ->assertCreated()
        ->assertJsonStructure(['data' => ['id', 'status', 'amount_idr']]);

    assertDatabaseHas('orders', [
        'user_id' => $user->id,
        'amount'  => $amount,
        'status'  => 'pending',
    ]);
})->with([
    'minimum'  => [1],
    'standard' => [50_000],
    'maximum'  => [1_000_000_000],
]);
```

```php
// Pest helper functions — define in tests/Helpers.php and autoload in pest.php
function actingAsAdmin(): TestResponse
{
    return actingAs(User::factory()->admin()->create());
}

// tests/Pest.php
uses(Tests\TestCase::class, Illuminate\Foundation\Testing\RefreshDatabase::class)
    ->in('Feature');

uses(Tests\TestCase::class)
    ->in('Unit');
```

## Rules

1. Use Pest on all new Laravel projects — PHPUnit is only for legacy projects where migration cost is not justified.
2. Use datasets (`->with([])`) for any test that covers multiple inputs of the same type — no duplicated test methods.
3. Use `actingAs($user)` for every test that hits an authenticated endpoint — never test auth endpoints without authenticating.
4. Use `assertDatabaseHas` and `assertDatabaseMissing` for DB state assertions, not raw `DB::table()` queries.
5. Use `Http::fake()` for external HTTP calls — never make real HTTP calls in tests.
6. Chain assertions: `->assertOk()->assertJsonStructure([...])->assertJson(['key' => 'value'])` — each assertion adds precision.
7. Use `assertUnprocessable()` (HTTP 422) for validation failures, `assertForbidden()` (403) for auth failures, `assertNotFound()` (404) for missing resources — avoid `assertStatus(xxx)` with magic numbers.
