---
title: What to Block
impact: high
tags: [code-review, security, blocking, standards]
---

## Why

- Approving a PR with hardcoded credentials exposes production secrets in git history permanently — rotation is the only fix, and it is painful
- Silent catch blocks that swallow exceptions turn production errors into invisible failures — engineers get no signal when something breaks
- Tests that always pass (no assertions, always-true conditions) create false confidence and will never catch a real regression

## Pattern

**Bad** — each of these must be blocked immediately:

```php
// ❌ Hardcoded credential — block and request changes
$client = new GuzzleHttp\Client([
    'headers' => ['Authorization' => 'Bearer sk-prod-abc123xyz']
]);

// ❌ SQL string concatenation — injection risk
$users = DB::select("SELECT * FROM users WHERE email = '$email'");

// ❌ Unprotected endpoint — missing auth middleware
Route::get('/admin/users', [AdminController::class, 'index']);
// No auth middleware — any unauthenticated request can access admin data

// ❌ Silent catch block
try {
    $payment->capture();
} catch (Exception $e) {
    // something went wrong
}

// ❌ PII in log
Log::info('User login', ['email' => $user->email, 'phone' => $user->phone]);

// ❌ Test that always passes
public function test_user_can_be_created(): void
{
    $user = User::factory()->create();
    $this->assertTrue(true);  // always passes — tests nothing
}
```

**Good** — what each fix looks like:

```php
// ✅ Credential from environment
'Authorization' => 'Bearer ' . config('services.payment.secret')

// ✅ Parameterised query
DB::select('SELECT * FROM users WHERE email = ?', [$email]);

// ✅ Protected with middleware
Route::middleware(['auth:sanctum', 'role:admin'])->group(function () {
    Route::get('/admin/users', [AdminController::class, 'index']);
});

// ✅ Catch with log and rethrow
} catch (PaymentException $e) {
    Log::error('Payment capture failed', ['order_id' => $order->id, 'error' => $e->getMessage()]);
    throw $e;
}

// ✅ Log without PII
Log::info('User login', ['user_id' => $user->id]);

// ✅ Test that asserts behaviour
$this->assertDatabaseHas('users', ['email' => 'test@example.com']);
$this->assertSame('active', $user->fresh()->status);
```

## Rules

1. Block any PR with hardcoded credentials, tokens, passwords, or API keys — no exceptions.
2. Block SQL string concatenation — always use parameterised queries or query builder bindings.
3. Block new routes or endpoints missing authentication/authorisation middleware.
4. Block empty or logging-only catch blocks that do not rethrow or handle the error.
5. Block tests with no assertions or always-true assertions — they provide no regression protection.
