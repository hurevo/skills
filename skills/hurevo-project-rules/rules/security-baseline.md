---
title: Security Baseline
impact: HIGH
tags: [security, logging, secrets, sql, authentication]
---

# Security Baseline

Non-negotiable security controls that apply to every Hurevo project regardless of stack or feature area.

## Why

- **Breach prevention**: The majority of application breaches exploit one of these baseline failures.
- **Compliance**: UU PDP, OJK, HIPAA, and PCI DSS all require these controls as a minimum.
- **Trust**: Hurevo's brand promise includes Secure — these rules are what that means in code.

## Pattern

```php
// Bad — PII in log
Log::debug("Login attempt", [
    'email' => $request->email,
    'password' => $request->password,
]);

// Good — identifier only
Log::info("Login attempt", ['user_id' => $user?->id, 'ip' => $request->ip()]);
```

```php
// Bad — SQL string concatenation (injection)
$results = DB::select("SELECT * FROM users WHERE email = '{$email}'");

// Good — parameterised
$results = DB::select('SELECT * FROM users WHERE email = ?', [$email]);
// or Eloquent
$user = User::where('email', $email)->first();
```

```php
// Bad — secret in code
$client = new StripeClient('sk-live-hardcoded-key');

// Bad — .env committed to git
// (check .gitignore — .env must be listed)

// Good — loaded from environment at runtime
$client = new StripeClient(config('services.stripe.secret'));
```

```php
// Bad — endpoint with no auth check
Route::post('/admin/users/delete', [AdminController::class, 'destroy']);

// Good — middleware + policy
Route::post('/admin/users/{user}', [AdminController::class, 'destroy'])
    ->middleware(['auth:sanctum', 'role:admin']);

// In controller:
$this->authorize('delete', $user);
```

## Rules

1. Never log PII — not emails, names, phone numbers, or any field that identifies a person.
2. All secrets in environment variables — no `.env` committed to version control.
3. SQL: parameterised queries or ORM only — no string concatenation into queries.
4. Every endpoint touching user data requires authentication and authorisation checks.
5. Dependencies: run `composer audit` / `npm audit` in CI — block on high/critical findings.
6. HTTPS only — enforce in middleware and HSTS headers; never allow mixed content.
